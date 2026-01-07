const { getPool } = require('../config/database');

/**
 * Lấy danh sách lịch khám theo bác sĩ và ngày
 * GET /admin/schedules?doctor_id=1&work_date=2026-01-15
 */
const getSchedules = async (req, res, next) => {
  try {
    const pool = getPool();
    const { doctor_id, work_date } = req.query;

    // Validate required params
    if (!doctor_id || !work_date) {
      return res.status(400).json({
        success: false,
        message: 'doctor_id và work_date là bắt buộc',
      });
    }

    // Kiểm tra doctor tồn tại
    const [doctors] = await pool.execute(
      `SELECT d.id, d.department_id, d.room_id, u.full_name as doctor_name, 
              dept.name as department_name, r.room_code, r.room_name
       FROM doctors d
       INNER JOIN users u ON d.user_id = u.id
       INNER JOIN departments dept ON d.department_id = dept.id
       LEFT JOIN rooms r ON d.room_id = r.id
       WHERE d.id = ? AND d.is_active = 1`,
      [doctor_id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại hoặc đã ngừng hoạt động',
      });
    }

    const doctor = doctors[0];

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
      [doctor_id, work_date]
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
      doctor: {
        id: doctor.id,
        name: doctor.doctor_name,
      },
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
    }));

    res.json({
      success: true,
      data: formattedSchedules,
      doctor: {
        id: doctor.id,
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
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo lịch tự động (Bulk create)
 * POST /admin/schedules/bulk
 * Body: { doctor_id, work_date, shift_type, slot_minutes, max_patients }
 */
const createBulkSchedules = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { doctor_id, work_date, shift_type, slot_minutes = 15, max_patients = 1 } = req.body;

    // Validate
    if (!doctor_id || !work_date || !shift_type) {
      return res.status(400).json({
        success: false,
        message: 'doctor_id, work_date và shift_type là bắt buộc',
      });
    }

    if (!['morning', 'afternoon', 'full'].includes(shift_type)) {
      return res.status(400).json({
        success: false,
        message: 'shift_type phải là: morning, afternoon, hoặc full',
      });
    }

    if (![10, 15, 20, 30].includes(parseInt(slot_minutes))) {
      return res.status(400).json({
        success: false,
        message: 'slot_minutes phải là: 10, 15, 20, hoặc 30',
      });
    }

    if (max_patients < 1) {
      return res.status(400).json({
        success: false,
        message: 'max_patients phải >= 1',
      });
    }

    // Kiểm tra doctor tồn tại và active
    const [doctors] = await connection.execute(
      'SELECT id, is_active FROM doctors WHERE id = ?',
      [doctor_id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại',
      });
    }

    if (!doctors[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo lịch cho bác sĩ đang ngừng hoạt động',
      });
    }

    // Định nghĩa ca làm việc
    const shifts = {
      morning: { start: '08:00:00', end: '12:00:00' },
      afternoon: { start: '13:30:00', end: '17:30:00' },
      full: { start: '08:00:00', end: '17:30:00' },
    };

    const shift = shifts[shift_type];
    const slotDuration = parseInt(slot_minutes);

    // Generate danh sách slot
    const slots = [];
    const startTime = new Date(`2000-01-01 ${shift.start}`);
    const endTime = new Date(`2000-01-01 ${shift.end}`);

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

      // Đảm bảo slot không vượt quá end time
      if (slotEnd > endTime) {
        break;
      }

      slots.push({
        start_time: slotStart.toTimeString().slice(0, 8),
        end_time: slotEnd.toTimeString().slice(0, 8),
      });

      currentTime = slotEnd;
    }

    if (slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo slot với cấu hình này',
      });
    }

    // Lấy danh sách slot đã tồn tại để tránh trùng lặp
    const [existingSlots] = await connection.execute(
      `SELECT start_time, end_time FROM doctor_schedules 
       WHERE doctor_id = ? AND work_date = ?`,
      [doctor_id, work_date]
    );

    const existingSet = new Set(
      existingSlots.map((s) => `${s.start_time}-${s.end_time}`)
    );

    // Lọc bỏ các slot đã tồn tại
    const newSlots = slots.filter(
      (slot) => !existingSet.has(`${slot.start_time}-${slot.end_time}`)
    );

    if (newSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả slot đã tồn tại',
      });
    }

    // Insert batch
    const insertQuery = `INSERT INTO doctor_schedules 
      (doctor_id, work_date, start_time, end_time, max_patients, is_active) 
      VALUES ?`;

    const values = newSlots.map((slot) => [
      doctor_id,
      work_date,
      slot.start_time,
      slot.end_time,
      max_patients,
      1,
    ]);

    await connection.query(insertQuery, [values]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Đã tạo ${newSlots.length} slot thành công`,
      data: {
        created_count: newSlots.length,
        skipped_count: slots.length - newSlots.length,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật slot (is_active hoặc max_patients)
 * PATCH /admin/schedules/:id
 */
const updateSchedule = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { is_active, max_patients } = req.body;

    // Validate: ít nhất một field phải được cập nhật
    if (is_active === undefined && max_patients === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp is_active hoặc max_patients để cập nhật',
      });
    }

    // Kiểm tra slot tồn tại
    const [schedules] = await pool.execute(
      `SELECT ds.*, 
        COALESCE(COUNT(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'DONE') THEN 1 END), 0) as booked_count
      FROM doctor_schedules ds
      LEFT JOIN appointments a ON ds.id = a.schedule_id
      WHERE ds.id = ?
      GROUP BY ds.id`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slot không tồn tại',
      });
    }

    const schedule = schedules[0];
    const bookedCount = parseInt(schedule.booked_count);

    // Validate max_patients
    if (max_patients !== undefined) {
      if (max_patients < 1) {
        return res.status(400).json({
          success: false,
          message: 'max_patients phải >= 1',
        });
      }

      // Không cho phép giảm max_patients nhỏ hơn booked_count
      if (max_patients < bookedCount) {
        return res.status(400).json({
          success: false,
          message: `Không thể giảm max_patients xuống ${max_patients} vì đã có ${bookedCount} lượt đặt`,
        });
      }
    }

    // Cập nhật
    const updateFields = [];
    const updateValues = [];

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (max_patients !== undefined) {
      updateFields.push('max_patients = ?');
      updateValues.push(max_patients);
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE doctor_schedules SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      `SELECT ds.*, 
        COALESCE(COUNT(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'DONE') THEN 1 END), 0) as booked_count
      FROM doctor_schedules ds
      LEFT JOIN appointments a ON ds.id = a.schedule_id
      WHERE ds.id = ?
      GROUP BY ds.id`,
      [id]
    );

    const updatedSchedule = updated[0];

    res.json({
      success: true,
      message: 'Cập nhật slot thành công',
      data: {
        id: updatedSchedule.id,
        doctor_id: updatedSchedule.doctor_id,
        work_date: updatedSchedule.work_date,
        start_time: updatedSchedule.start_time,
        end_time: updatedSchedule.end_time,
        max_patients: updatedSchedule.max_patients,
        is_active: updatedSchedule.is_active,
        booked_count: parseInt(updatedSchedule.booked_count),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa slot (chỉ khi booked_count = 0)
 * DELETE /admin/schedules/:id
 */
const deleteSchedule = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    // Kiểm tra slot tồn tại và booked_count
    const [schedules] = await pool.execute(
      `SELECT ds.*, 
        COALESCE(COUNT(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'DONE') THEN 1 END), 0) as booked_count
      FROM doctor_schedules ds
      LEFT JOIN appointments a ON ds.id = a.schedule_id
      WHERE ds.id = ?
      GROUP BY ds.id`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slot không tồn tại',
      });
    }

    const schedule = schedules[0];
    const bookedCount = parseInt(schedule.booked_count);

    if (bookedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa slot vì đã có ${bookedCount} lượt đặt`,
      });
    }

    // Xóa slot
    await pool.execute('DELETE FROM doctor_schedules WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa slot thành công',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  createBulkSchedules,
  updateSchedule,
  deleteSchedule,
};

