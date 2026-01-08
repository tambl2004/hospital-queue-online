const { getPool } = require('../config/database');

/**
 * APPOINTMENTS CONTROLLER
 * Quản lý lượt đăng ký khám bệnh (Appointments)
 * 
 * Trạng thái (Status):
 * - WAITING: Đã đặt lịch, đã cấp số, chưa gọi
 * - CALLED: Đã gọi số
 * - IN_PROGRESS: Đang khám
 * - DONE: Khám xong
 * - CANCELLED: Huỷ lịch
 * - SKIPPED: Bỏ qua lượt
 */

const VALID_STATUSES = ['WAITING', 'CALLED', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'SKIPPED'];

// State Machine - Quy tắc chuyển trạng thái hợp lệ
const VALID_TRANSITIONS = {
  WAITING: ['CALLED', 'CANCELLED'],
  CALLED: ['IN_PROGRESS', 'SKIPPED'],
  IN_PROGRESS: ['DONE'],
  SKIPPED: ['CALLED'], // Cho phép gọi lại
  DONE: [], // Không cho chuyển sang trạng thái khác
  CANCELLED: [] // Không cho chuyển sang trạng thái khác
};

/**
 * Lấy danh sách appointments với filter và pagination
 * GET /api/appointments
 */
exports.getAppointments = async (req, res, next) => {
  try {
    const pool = getPool();
    const {
      date, // YYYY-MM-DD
      doctor_id,
      department_id,
      room_id,
      status,
      search, // tìm theo tên/phone/email bệnh nhân
      patient_id, // query param
      page = 1,
      limit = 20,
      sort_by = 'queue_number', // queue_number, appointment_time, created_at
      sort_order = 'ASC'
    } = req.query;

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    // Nếu user là PATIENT, chỉ cho xem appointments của chính họ
    const userRoles = req.user.roles || [];
    if (userRoles.includes('PATIENT') && !userRoles.includes('ADMIN') && !userRoles.includes('STAFF')) {
      conditions.push('a.patient_id = ?');
      params.push(req.user.id);
    } else if (patient_id) {
      // ADMIN/STAFF có thể filter theo patient_id
      conditions.push('a.patient_id = ?');
      params.push(patient_id);
    }

    // Filter theo ngày (mặc định hôm nay)
    if (date) {
      conditions.push('a.appointment_date = ?');
      params.push(date);
    }

    // Filter theo doctor
    if (doctor_id) {
      conditions.push('a.doctor_id = ?');
      params.push(doctor_id);
    }

    // Filter theo department
    if (department_id) {
      conditions.push('a.department_id = ?');
      params.push(department_id);
    }

    // Filter theo room
    if (room_id) {
      conditions.push('a.room_id = ?');
      params.push(room_id);
    }

    // Filter theo status
    if (status && VALID_STATUSES.includes(status)) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    // Search theo tên/phone/email bệnh nhân (chỉ ADMIN/STAFF)
    if (search && search.trim() && !userRoles.includes('PATIENT')) {
      conditions.push(
        '(p.full_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)'
      );
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Count total records
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Sorting
    let orderBy = 'a.created_at DESC';
    if (sort_by === 'queue_number') {
      orderBy = 'qn.queue_number ASC';
    } else if (sort_by === 'appointment_time') {
      orderBy = `a.appointment_time ${sort_order}`;
    } else if (sort_by === 'created_at') {
      orderBy = `a.created_at ${sort_order}`;
    }

    // Query appointments with full details
    const query = `
      SELECT 
        a.id,
        a.patient_id,
        p.full_name as patient_name,
        p.phone as patient_phone,
        p.email as patient_email,
        a.doctor_id,
        d.user_id as doctor_user_id,
        du.full_name as doctor_name,
        a.department_id,
        dept.name as department_name,
        a.room_id,
        r.room_code,
        r.room_name,
        a.schedule_id,
        ds.work_date,
        ds.start_time,
        ds.end_time,
        a.appointment_date,
        a.appointment_time,
        a.status,
        qn.queue_number,
        a.created_at,
        a.updated_at
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN doctor_schedules ds ON a.schedule_id = ds.id
      LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [appointments] = await pool.execute(query, [...params, limitNum, offset]);

    // Format response data
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      status: apt.status,
      queue_number: apt.queue_number,
      doctor: {
        id: apt.doctor_id,
        full_name: apt.doctor_name,
        department: {
          id: apt.department_id,
          name: apt.department_name,
        },
        room: apt.room_id
          ? {
              id: apt.room_id,
              room_code: apt.room_code,
              room_name: apt.room_name,
            }
          : null,
      },
      department: {
        id: apt.department_id,
        name: apt.department_name,
      },
      room: apt.room_id
        ? {
            id: apt.room_id,
            room_code: apt.room_code,
            room_name: apt.room_name,
          }
        : null,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
    }));

    res.json({
      success: true,
      data: formattedAppointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    next(error);
  }
};

/**
 * Lấy chi tiết một appointment
 * GET /api/appointments/:id
 */
exports.getAppointmentById = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const query = `
      SELECT 
        a.id,
        a.patient_id,
        p.full_name as patient_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.gender as patient_gender,
        p.date_of_birth as patient_dob,
        a.doctor_id,
        d.user_id as doctor_user_id,
        du.full_name as doctor_name,
        du.email as doctor_email,
        du.phone as doctor_phone,
        d.experience_years,
        d.rating_avg,
        a.department_id,
        dept.name as department_name,
        a.room_id,
        r.room_code,
        r.room_name,
        a.schedule_id,
        ds.work_date,
        ds.start_time,
        ds.end_time,
        ds.max_patients,
        a.appointment_date,
        a.appointment_time,
        a.status,
        qn.queue_number,
        qn.queue_date,
        a.created_at,
        a.updated_at
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN departments dept ON a.department_id = dept.id
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN doctor_schedules ds ON a.schedule_id = ds.id
      LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
      WHERE a.id = ?
    `;

    const [appointments] = await pool.execute(query, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lượt đăng ký khám'
      });
    }

    const appointment = appointments[0];

    // Validate: PATIENT chỉ xem được appointments của chính họ
    const userRoles = req.user.roles || [];
    if (userRoles.includes('PATIENT') && !userRoles.includes('ADMIN') && !userRoles.includes('STAFF')) {
      if (appointment.patient_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem lịch khám này'
        });
      }
    }

    // Format response
    const formattedAppointment = {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      queue_number: appointment.queue_number,
      doctor: {
        id: appointment.doctor_id,
        full_name: appointment.doctor_name,
        email: appointment.doctor_email,
        phone: appointment.doctor_phone,
        experience_years: appointment.experience_years,
        rating_avg: appointment.rating_avg,
        department: {
          id: appointment.department_id,
          name: appointment.department_name,
        },
        room: appointment.room_id
          ? {
              id: appointment.room_id,
              room_code: appointment.room_code,
              room_name: appointment.room_name,
            }
          : null,
      },
      department: {
        id: appointment.department_id,
        name: appointment.department_name,
      },
      room: appointment.room_id
        ? {
            id: appointment.room_id,
            room_code: appointment.room_code,
            room_name: appointment.room_name,
          }
        : null,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
    };

    res.json({
      success: true,
      data: formattedAppointment
    });

  } catch (error) {
    console.error('Error fetching appointment detail:', error);
    next(error);
  }
};

/**
 * Tạo appointment mới (dành cho Admin/Staff tạo thủ công)
 * POST /api/appointments
 */
exports.createAppointment = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      patient_id,
      doctor_id,
      schedule_id,
      appointment_date,
      appointment_time
    } = req.body;

    // Xác định patient_id: PATIENT tự đặt lịch cho mình, ADMIN/STAFF có thể đặt cho người khác
    const userRoles = req.user.roles || [];
    const isPatient = userRoles.includes('PATIENT') && !userRoles.includes('ADMIN') && !userRoles.includes('STAFF');
    
    let finalPatientId;
    if (isPatient) {
      // PATIENT tự động lấy patient_id từ token
      finalPatientId = req.user.id;
    } else {
      // ADMIN/STAFF phải cung cấp patient_id
      finalPatientId = patient_id;
    }

    // Validation
    if (!finalPatientId || !doctor_id || !schedule_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Kiểm tra patient tồn tại
    const [patients] = await connection.query(
      'SELECT id FROM users WHERE id = ? AND is_active = 1',
      [finalPatientId]
    );
    if (patients.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bệnh nhân không tồn tại hoặc đã bị khóa'
      });
    }

    // Kiểm tra doctor và lấy thông tin
    const [doctors] = await connection.query(
      `SELECT d.id, d.department_id, d.room_id 
       FROM doctors d 
       WHERE d.id = ? AND d.is_active = 1`,
      [doctor_id]
    );
    if (doctors.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại hoặc đã bị khóa'
      });
    }
    const doctor = doctors[0];

    // Kiểm tra schedule tồn tại và còn slot trống
    const [schedules] = await connection.query(
      `SELECT id, work_date, max_patients,
        (SELECT COUNT(*) FROM appointments 
         WHERE schedule_id = ? AND status != 'CANCELLED') as booked_count
       FROM doctor_schedules 
       WHERE id = ? AND doctor_id = ? AND is_active = 1`,
      [schedule_id, schedule_id, doctor_id]
    );

    if (schedules.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Lịch làm việc không tồn tại'
      });
    }

    const schedule = schedules[0];
    if (schedule.booked_count >= schedule.max_patients) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Lịch khám đã đầy, vui lòng chọn thời gian khác'
      });
    }

    // Tạo appointment
    const [appointmentResult] = await connection.query(
      `INSERT INTO appointments 
       (patient_id, doctor_id, department_id, room_id, schedule_id, 
        appointment_date, appointment_time, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING')`,
      [finalPatientId, doctor_id, doctor.department_id, doctor.room_id, 
       schedule_id, appointment_date, appointment_time]
    );

    const appointmentId = appointmentResult.insertId;

    // Tạo số thứ tự (queue_number)
    // Lấy số thứ tự lớn nhất trong ngày của bác sĩ
    const [maxQueue] = await connection.query(
      `SELECT COALESCE(MAX(queue_number), 0) as max_queue 
       FROM queue_numbers 
       WHERE doctor_id = ? AND queue_date = ?`,
      [doctor_id, appointment_date]
    );

    const nextQueueNumber = maxQueue[0].max_queue + 1;

    await connection.query(
      `INSERT INTO queue_numbers (appointment_id, doctor_id, queue_date, queue_number) 
       VALUES (?, ?, ?, ?)`,
      [appointmentId, doctor_id, appointment_date, nextQueueNumber]
    );

    await connection.commit();

    // Lấy thông tin appointment vừa tạo
    const [newAppointment] = await connection.query(
      `SELECT a.*, qn.queue_number 
       FROM appointments a 
       LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id 
       WHERE a.id = ?`,
      [appointmentId]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo lượt đăng ký khám thành công',
      data: newAppointment[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating appointment:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật trạng thái appointment
 * PATCH /api/appointments/:id/status
 */
exports.updateAppointmentStatus = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, reason } = req.body; // reason dùng cho CANCELLED/SKIPPED

    // Validation status
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Lấy trạng thái hiện tại
    const [appointments] = await connection.query(
      'SELECT id, status FROM appointments WHERE id = ?',
      [id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lượt đăng ký khám'
      });
    }

    const currentStatus = appointments[0].status;

    // Kiểm tra state transition hợp lệ
    if (!VALID_TRANSITIONS[currentStatus]) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể thay đổi trạng thái từ ${currentStatus}`
      });
    }

    if (!VALID_TRANSITIONS[currentStatus].includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`
      });
    }

    // Cập nhật trạng thái
    await connection.query(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Nếu cần lưu lý do (tùy chọn - có thể tạo bảng appointment_logs)
    // TODO: Lưu log lịch sử thay đổi trạng thái nếu cần

    await connection.commit();

    // Lấy thông tin appointment sau khi update
    const [updatedAppointment] = await connection.query(
      `SELECT a.*, 
        p.full_name as patient_name,
        d.user_id as doctor_user_id,
        du.full_name as doctor_name,
        qn.queue_number
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updatedAppointment[0]
    });

    // TODO: Emit Socket.IO event để cập nhật realtime
    // io.emit('appointment:status-changed', updatedAppointment[0]);

  } catch (error) {
    await connection.rollback();
    console.error('Error updating appointment status:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Hủy appointment
 * PATCH /api/appointments/:id/cancel
 */
exports.cancelAppointment = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { reason } = req.body;

    // Lấy trạng thái hiện tại và patient_id
    const [appointments] = await connection.query(
      'SELECT id, status, patient_id FROM appointments WHERE id = ?',
      [id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lượt đăng ký khám'
      });
    }

    const appointment = appointments[0];
    const currentStatus = appointment.status;

    // Validate: PATIENT chỉ hủy được appointments của chính họ
    const userRoles = req.user.roles || [];
    if (userRoles.includes('PATIENT') && !userRoles.includes('ADMIN') && !userRoles.includes('STAFF')) {
      if (appointment.patient_id !== req.user.id) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền hủy lịch khám này'
        });
      }
    }

    // Chỉ cho phép hủy khi status = WAITING
    if (currentStatus !== 'WAITING') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy lượt đăng ký đang chờ (WAITING)'
      });
    }

    // Cập nhật trạng thái
    await connection.query(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CANCELLED', id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Hủy lượt đăng ký khám thành công'
    });

    // TODO: Emit Socket.IO event
    // io.emit('appointment:cancelled', { id });

  } catch (error) {
    await connection.rollback();
    console.error('Error cancelling appointment:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Lấy thống kê appointments theo ngày
 * GET /api/appointments/stats/daily
 */
exports.getDailyStats = async (req, res, next) => {
  try {
    const pool = getPool();
    const { date } = req.query; // YYYY-MM-DD

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số date'
      });
    }

    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments
      WHERE appointment_date = ?
      GROUP BY status
    `;

    const [stats] = await pool.execute(query, [date]);

    // Format kết quả
    const result = {
      WAITING: 0,
      CALLED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      CANCELLED: 0,
      SKIPPED: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat.status] = stat.count;
      result.total += stat.count;
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching daily stats:', error);
    next(error);
  }
};

/**
 * Lấy danh sách appointments theo doctor và ngày (dùng cho Queue)
 * GET /api/appointments/doctor/:doctor_id/date/:date
 */
exports.getAppointmentsByDoctorAndDate = async (req, res, next) => {
  try {
    const pool = getPool();
    const { doctor_id, date } = req.params;

    const query = `
      SELECT 
        a.id,
        a.patient_id,
        p.full_name as patient_name,
        p.phone as patient_phone,
        a.appointment_time,
        a.status,
        qn.queue_number
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
      WHERE a.doctor_id = ? AND a.appointment_date = ?
      ORDER BY qn.queue_number ASC
    `;

    const [appointments] = await pool.execute(query, [doctor_id, date]);

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Error fetching appointments by doctor and date:', error);
    next(error);
  }
};

/**
 * Lấy đánh giá của appointment (nếu có)
 * GET /api/appointments/:id/rating
 */
exports.getAppointmentRating = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Kiểm tra appointment có tồn tại không
    const [appointments] = await pool.execute(
      `SELECT id, patient_id, doctor_id, status FROM appointments WHERE id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lịch khám không tồn tại',
      });
    }

    const appointment = appointments[0];

    // Kiểm tra quyền: PATIENT chỉ xem rating của chính mình
    if (userRoles.includes('PATIENT') && !userRoles.includes('ADMIN') && !userRoles.includes('STAFF')) {
      if (appointment.patient_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem đánh giá này',
        });
      }
    }

    // Lấy rating nếu có
    const [ratings] = await pool.execute(
      `SELECT id, rating, comment, created_at 
       FROM ratings 
       WHERE appointment_id = ?`,
      [id]
    );

    if (ratings.length === 0) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: ratings[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đánh giá bác sĩ sau khi khám xong
 * POST /api/appointments/:id/review
 */
exports.reviewDoctor = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || !Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải là số từ 1 đến 5',
      });
    }

    // Kiểm tra appointment có tồn tại không
    const [appointments] = await connection.execute(
      `SELECT id, patient_id, doctor_id, status FROM appointments WHERE id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lịch khám không tồn tại',
      });
    }

    const appointment = appointments[0];

    // Kiểm tra appointment thuộc về patient hiện tại
    if (appointment.patient_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh giá lịch khám này',
      });
    }

    // Kiểm tra status phải là DONE
    if (appointment.status !== 'DONE') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh giá sau khi khám xong (trạng thái DONE)',
      });
    }

    // Kiểm tra đã có rating chưa
    const [existingRatings] = await connection.execute(
      `SELECT id FROM ratings WHERE appointment_id = ?`,
      [id]
    );

    if (existingRatings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Bạn đã đánh giá lịch khám này rồi',
      });
    }

    // Insert rating
    const [result] = await connection.execute(
      `INSERT INTO ratings (appointment_id, doctor_id, patient_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [id, appointment.doctor_id, userId, rating, comment || null]
    );

    // Trigger sẽ tự động cập nhật doctors.rating_avg
    // Nhưng để đảm bảo, ta cũng có thể tính lại thủ công
    const [avgResult] = await connection.execute(
      `SELECT AVG(rating) as avg_rating 
       FROM ratings 
       WHERE doctor_id = ?`,
      [appointment.doctor_id]
    );

    const avgRating = avgResult[0].avg_rating || 0;

    await connection.execute(
      `UPDATE doctors SET rating_avg = ? WHERE id = ?`,
      [avgRating, appointment.doctor_id]
    );

    await connection.commit();

    // Lấy lại rating vừa tạo
    const [newRatings] = await connection.execute(
      `SELECT id, rating, comment, created_at 
       FROM ratings 
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      data: newRatings[0],
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = exports;

