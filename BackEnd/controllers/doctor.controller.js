const { getPool } = require('../config/database');
const { getQueueStateInternal } = require('./queue.controller');

/**
 * DOCTOR CONTROLLER
 * Quản lý dashboard và lịch cho bác sĩ
 * 
 * Dữ liệu hôm nay (CURRENT_DATE):
 * - Thông tin cá nhân: Tên, Chuyên khoa, Phòng
 * - Queue hôm nay: Số hiện tại, Số tiếp theo, 5 bệnh nhân sắp tới
 * - Lịch hôm nay: Slot giờ, Số đã đặt/max, Trạng thái
 */

/**
 * Lấy dữ liệu dashboard cho Doctor
 * GET /api/doctor/dashboard
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userId = req.user.id;

    // ========== 1. LẤY THÔNG TIN BÁC SĨ TỪ USER_ID ==========
    const doctorQuery = `
      SELECT 
        d.id as doctor_id,
        d.user_id,
        u.full_name,
        d.department_id,
        dept.name as department_name,
        d.room_id,
        r.room_name,
        r.room_code,
        d.rating_avg,
        d.avatar_url
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      INNER JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.user_id = ? AND d.is_active = 1
    `;

    const [doctors] = await pool.execute(doctorQuery, [userId]);

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    const doctor = doctors[0];
    const doctorId = doctor.doctor_id;

    // ========== 2. LẤY QUEUE HÔM NAY CỦA BÁC SĨ ==========
    // Dùng hàm getQueueStateInternal để đảm bảo logic tính toán giống với Admin Queue Dashboard
    const queueState = await getQueueStateInternal(pool, doctorId, today);
    
    // Lấy thông tin từ queueState
    const current = queueState.current;
    const next = queueState.next;
    // upcoming = tất cả appointments đang chờ (WAITING, CALLED, IN_PROGRESS)
    const upcoming = queueState.appointments || [];

    // ========== 3. LẤY LỊCH HÔM NAY ==========
    const scheduleQuery = `
      SELECT 
        ds.id,
        ds.start_time,
        ds.end_time,
        ds.max_patients,
        ds.is_active,
        COUNT(CASE WHEN a.status != 'CANCELLED' THEN 1 END) as current_count
      FROM doctor_schedules ds
      LEFT JOIN appointments a ON ds.id = a.schedule_id 
        AND a.appointment_date = ?
        AND a.status != 'CANCELLED'
      WHERE ds.doctor_id = ?
        AND ds.work_date = ?
        AND ds.is_active = 1
      GROUP BY ds.id, ds.start_time, ds.end_time, ds.max_patients, ds.is_active
      ORDER BY ds.start_time ASC
    `;

    const [schedule] = await pool.execute(scheduleQuery, [today, doctorId, today]);

    // Format response
    res.json({
      success: true,
      data: {
        doctor_info: {
          doctor_id: doctor.doctor_id,
          full_name: doctor.full_name,
          department_name: doctor.department_name,
          room_name: doctor.room_name || null,
          room_code: doctor.room_code || null,
          rating_avg: doctor.rating_avg ? parseFloat(doctor.rating_avg) : 0,
          avatar_url: doctor.avatar_url || null,
        },
        queue_info: {
          current: current,
          next: next,
          upcoming: upcoming.slice(0, 10) // Lấy 10 bệnh nhân sắp tới
        },
        schedule: schedule.map(slot => ({
          id: slot.id,
          time_slot: slot.start_time ? slot.start_time.toString().slice(0, 5) : null,
          end_time: slot.end_time ? slot.end_time.toString().slice(0, 5) : null,
          max_patients: slot.max_patients,
          current_count: parseInt(slot.current_count) || 0,
          is_active: slot.is_active
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching doctor dashboard data:', error);
    next(error);
  }
};

/**
 * Lấy danh sách lịch khám của Doctor theo ngày
 * GET /api/doctor/schedules
 */
exports.getSchedules = async (req, res, next) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const { work_date } = req.query;

    // Validate required params
    if (!work_date) {
      return res.status(400).json({
        success: false,
        message: 'work_date là bắt buộc'
      });
    }

    // Lấy thông tin bác sĩ từ user_id
    const [doctors] = await pool.execute(
      `SELECT d.id as doctor_id, d.department_id, d.room_id, u.full_name as doctor_name, 
              dept.name as department_name, r.room_code, r.room_name
       FROM doctors d
       INNER JOIN users u ON d.user_id = u.id
       INNER JOIN departments dept ON d.department_id = dept.id
       LEFT JOIN rooms r ON d.room_id = r.id
       WHERE d.user_id = ? AND d.is_active = 1`,
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    const doctor = doctors[0];
    const doctorId = doctor.doctor_id;

    // Lấy danh sách slot với booked_count
    const [schedules] = await pool.execute(
      `SELECT 
        ds.id,
        ds.doctor_id,
        ds.work_date,
        ds.start_time,
        ds.end_time,
        ds.max_patients,
        ds.is_active,
        ds.created_at,
        COALESCE(COUNT(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'DONE') THEN 1 END), 0) as booked_count
      FROM doctor_schedules ds
      LEFT JOIN appointments a ON ds.id = a.schedule_id
      WHERE ds.doctor_id = ? AND ds.work_date = ?
      GROUP BY ds.id, ds.doctor_id, ds.work_date, ds.start_time, ds.end_time, ds.max_patients, ds.is_active, ds.created_at
      ORDER BY ds.start_time ASC`,
      [doctorId, work_date]
    );

    // Format dữ liệu trả về
    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      doctor_id: schedule.doctor_id,
      work_date: schedule.work_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_patients: schedule.max_patients,
      is_active: schedule.is_active,
      booked_count: parseInt(schedule.booked_count),
      created_at: schedule.created_at,
    }));

    res.json({
      success: true,
      data: formattedSchedules,
      doctor: {
        id: doctor.doctor_id,
        name: doctor.doctor_name,
        department: {
          id: doctor.department_id,
          name: doctor.department_name,
        },
        room: doctor.room_id
          ? {
              id: doctor.room_id,
              code: doctor.room_code,
              name: doctor.room_name,
            }
          : null,
      }
    });

  } catch (error) {
    console.error('Error fetching doctor schedules:', error);
    next(error);
  }
};

/**
 * Lấy danh sách lượt đăng ký hôm nay của Doctor
 * GET /api/doctor/appointments
 */
exports.getTodayAppointments = async (req, res, next) => {
  try {
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;

    // Lấy doctor_id từ user_id
    const [doctors] = await pool.execute(
      'SELECT id FROM doctors WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    const doctorId = doctors[0].id;

    let query = `
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at,
        p.full_name as patient_name,
        p.phone as patient_phone,
        du.full_name as doctor_name,
        dept.name as department_name,
        r.room_name,
        r.room_code,
        qn.queue_number
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
      WHERE a.appointment_date = ?
        AND a.doctor_id = ?
    `;

    const params = [today, doctorId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY qn.queue_number ASC, a.created_at DESC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [appointments] = await pool.execute(query, params);

    // Count total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE a.appointment_date = ?
        AND a.doctor_id = ?
    `;
    const countParams = [today, doctorId];

    if (status) {
      countQuery += ' AND a.status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        appointments: appointments.map(item => ({
          id: item.id,
          appointment_date: item.appointment_date.toISOString().split('T')[0],
          appointment_time: item.appointment_time ? item.appointment_time.toString().slice(0, 5) : null,
          status: item.status,
          created_at: item.created_at,
          patient_name: item.patient_name,
          patient_phone: item.patient_phone,
          doctor_name: item.doctor_name,
          department_name: item.department_name,
          room_name: item.room_name,
          room_code: item.room_code,
          queue_number: item.queue_number
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching today appointments:', error);
    next(error);
  }
};

/**
 * Lấy danh sách đánh giá của Doctor
 * GET /api/doctor/ratings
 */
exports.getRatings = async (req, res, next) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Lấy doctor_id từ user_id
    const [doctors] = await pool.execute(
      'SELECT id FROM doctors WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    const doctorId = doctors[0].id;

    // Count total ratings
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM ratings WHERE doctor_id = ?',
      [doctorId]
    );
    const total = countResult[0].total;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Query ratings với thông tin bệnh nhân và appointment
    const query = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        p.full_name as patient_name,
        a.appointment_date,
        a.appointment_time
      FROM ratings r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN users p ON r.patient_id = p.id
      WHERE r.doctor_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [ratings] = await pool.execute(query, [doctorId, parseInt(limit), offset]);

    // Tính điểm trung bình
    const [avgResult] = await pool.execute(
      'SELECT AVG(rating) as avg_rating FROM ratings WHERE doctor_id = ?',
      [doctorId]
    );
    const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating) : 0;

    res.json({
      success: true,
      data: {
        ratings: ratings.map(rating => ({
          id: rating.id,
          rating: rating.rating,
          comment: rating.comment,
          created_at: rating.created_at,
          patient_name: rating.patient_name,
          appointment_date: rating.appointment_date,
          appointment_time: rating.appointment_time ? rating.appointment_time.toString().slice(0, 5) : null
        })),
        avg_rating: avgRating,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching doctor ratings:', error);
    next(error);
  }
};

/**
 * Cập nhật ảnh hồ sơ bác sĩ
 * POST /api/doctor/profile/avatar
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh',
      });
    }

    const pool = getPool();
    const userId = req.user.id;
    const avatarUrl = `/uploads/doctors/${req.file.filename}`;

    // Lấy doctor_id từ user_id
    const [doctors] = await pool.execute(
      'SELECT id FROM doctors WHERE user_id = ? AND is_active = 1',
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ',
      });
    }

    const doctorId = doctors[0].id;

    await pool.execute('UPDATE doctors SET avatar_url = ? WHERE id = ?', [
      avatarUrl,
      doctorId,
    ]);

    res.json({
      success: true,
      message: 'Cập nhật ảnh hồ sơ thành công',
      data: { avatar_url: avatarUrl },
    });
  } catch (error) {
    console.error('Error updating doctor avatar:', error);
    next(error);
  }
};

