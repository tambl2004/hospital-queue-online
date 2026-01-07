const { getPool } = require('../config/database');

/**
 * STAFF CONTROLLER
 * Quản lý vận hành cho nhân viên
 * 
 * Dữ liệu hôm nay (CURRENT_DATE):
 * - KPI Cards: Tổng lượt, WAITING, IN_PROGRESS, DONE
 * - Danh sách đang chờ: Bác sĩ, Phòng, Số hiện tại, Số tiếp theo
 */

/**
 * Lấy dữ liệu dashboard cho Staff
 * GET /api/staff/dashboard
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ========== 1. KPI CARDS (Hôm nay) ==========
    const kpiQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) as waiting_count,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count
      FROM appointments
      WHERE appointment_date = ?
    `;

    const [kpiResult] = await pool.execute(kpiQuery, [today]);
    const kpi = kpiResult[0];

    // ========== 2. DANH SÁCH ĐANG CHỜ (Bác sĩ có WAITING, CALLED, hoặc IN_PROGRESS) ==========
    // Lấy danh sách bác sĩ có appointments đang chờ hôm nay
    const waitingListQuery = `
      SELECT DISTINCT
        a.doctor_id,
        du.full_name as doctor_name,
        r.room_name,
        r.room_code,
        a.status
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN rooms r ON a.room_id = r.id
      WHERE a.appointment_date = ?
        AND a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS')
      ORDER BY 
        CASE WHEN a.status = 'IN_PROGRESS' THEN 0 
             WHEN a.status = 'CALLED' THEN 1 
             ELSE 2 END,
        du.full_name ASC
    `;

    const [waitingDoctors] = await pool.execute(waitingListQuery, [today]);

    // Với mỗi bác sĩ, lấy số hiện tại và số tiếp theo
    const waitingList = await Promise.all(
      waitingDoctors.map(async (doctor) => {
        // Lấy số hiện tại (IN_PROGRESS hoặc CALLED nhỏ nhất)
        const currentQuery = `
          SELECT 
            qn.queue_number as current_number,
            p.full_name as current_patient_name
          FROM appointments a
          JOIN queue_numbers qn ON a.id = qn.appointment_id
          JOIN users p ON a.patient_id = p.id
          WHERE qn.doctor_id = ?
            AND qn.queue_date = ?
            AND a.status IN ('IN_PROGRESS', 'CALLED')
            AND a.status != 'CANCELLED'
          ORDER BY 
            CASE WHEN a.status = 'IN_PROGRESS' THEN 0 ELSE 1 END,
            qn.queue_number ASC
          LIMIT 1
        `;

        const [currentResult] = await pool.execute(currentQuery, [doctor.doctor_id, today]);
        const current = currentResult[0];

        // Lấy số tiếp theo (WAITING nhỏ nhất)
        const nextQuery = `
          SELECT 
            qn.queue_number as next_number
          FROM appointments a
          JOIN queue_numbers qn ON a.id = qn.appointment_id
          WHERE qn.doctor_id = ?
            AND qn.queue_date = ?
            AND a.status = 'WAITING'
          ORDER BY qn.queue_number ASC
          LIMIT 1
        `;

        const [nextResult] = await pool.execute(nextQuery, [doctor.doctor_id, today]);
        const next = nextResult[0];

        // Xác định status hiện tại (ưu tiên IN_PROGRESS > CALLED > WAITING)
        const statusQuery = `
          SELECT status
          FROM appointments a
          JOIN queue_numbers qn ON a.id = qn.appointment_id
          WHERE qn.doctor_id = ?
            AND qn.queue_date = ?
            AND a.status IN ('IN_PROGRESS', 'CALLED', 'WAITING')
            AND a.status != 'CANCELLED'
          ORDER BY 
            CASE WHEN a.status = 'IN_PROGRESS' THEN 0 
                 WHEN a.status = 'CALLED' THEN 1 
                 ELSE 2 END
          LIMIT 1
        `;

        const [statusResult] = await pool.execute(statusQuery, [doctor.doctor_id, today]);
        const currentStatus = statusResult[0]?.status || doctor.status;

        return {
          doctor_id: doctor.doctor_id,
          doctor_name: doctor.doctor_name,
          room_name: doctor.room_name || 'Chưa xác định',
          room_code: doctor.room_code || '',
          status: currentStatus,
          current_number: current?.current_number || null,
          current_patient_name: current?.current_patient_name || null,
          next_number: next?.next_number || null,
        };
      })
    );

    // Format response
    res.json({
      success: true,
      data: {
        kpi: {
          total: parseInt(kpi.total) || 0,
          WAITING: parseInt(kpi.waiting_count) || 0,
          IN_PROGRESS: parseInt(kpi.in_progress_count) || 0,
          DONE: parseInt(kpi.done_count) || 0,
          date: today
        },
        waiting_list: waitingList
      }
    });

  } catch (error) {
    console.error('Error fetching staff dashboard data:', error);
    next(error);
  }
};

/**
 * Lấy danh sách lượt đăng ký hôm nay
 * GET /api/staff/appointments
 */
exports.getTodayAppointments = async (req, res, next) => {
  try {
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0];
    const { doctor_id, status, page = 1, limit = 50 } = req.query;

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
    `;

    const params = [today];

    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }

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
    `;
    const countParams = [today];

    if (doctor_id) {
      countQuery += ' AND a.doctor_id = ?';
      countParams.push(doctor_id);
    }

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

