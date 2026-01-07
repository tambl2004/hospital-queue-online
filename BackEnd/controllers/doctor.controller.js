const { getPool } = require('../config/database');

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
        r.room_code
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
    const queueQuery = `
      SELECT 
        a.id as appointment_id,
        a.status,
        qn.queue_number,
        p.full_name as patient_name,
        p.phone as patient_phone,
        a.appointment_time
      FROM appointments a
      JOIN queue_numbers qn ON a.id = qn.appointment_id
      JOIN users p ON a.patient_id = p.id
      WHERE qn.doctor_id = ? 
        AND qn.queue_date = ?
        AND a.status != 'CANCELLED'
      ORDER BY qn.queue_number ASC
    `;

    const [appointments] = await pool.execute(queueQuery, [doctorId, today]);

    // Phân loại appointments
    let current = null;
    let next = null;
    const upcoming = [];

    for (const apt of appointments) {
      const item = {
        appointmentId: apt.appointment_id,
        queueNumber: apt.queue_number,
        patientName: apt.patient_name,
        patientPhone: apt.patient_phone,
        appointmentTime: apt.appointment_time,
        status: apt.status
      };

      if (apt.status === 'IN_PROGRESS') {
        current = item;
      } else if (apt.status === 'CALLED' && !current) {
        current = item;
      } else if (apt.status === 'WAITING' && !next) {
        next = item;
      }

      // Thêm vào danh sách sắp tới (WAITING, CALLED, IN_PROGRESS)
      if (['WAITING', 'CALLED', 'IN_PROGRESS'].includes(apt.status)) {
        upcoming.push(item);
      }
    }

    // Sắp xếp upcoming theo queue number
    upcoming.sort((a, b) => a.queueNumber - b.queueNumber);

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
          room_code: doctor.room_code || null
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

