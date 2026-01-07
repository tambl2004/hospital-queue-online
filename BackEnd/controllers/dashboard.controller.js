const { getPool } = require('../config/database');

/**
 * DASHBOARD CONTROLLER
 * Trang tổng quan vận hành theo thời gian gần thực (near realtime)
 * 
 * Dữ liệu hôm nay (CURRENT_DATE):
 * - KPI Cards: Tổng lượt, WAITING, CALLED, IN_PROGRESS, DONE, CANCELLED, SKIPPED
 * - Top bác sĩ đông nhất hôm nay
 * - Top chuyên khoa đông nhất hôm nay
 * - Live list current: appointments status IN (CALLED, IN_PROGRESS)
 * - Chart 7 ngày gần nhất
 * - Recent appointments (10 mới nhất)
 */

/**
 * Lấy dữ liệu dashboard tổng quan
 * GET /api/admin/dashboard
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
        SUM(CASE WHEN status = 'CALLED' THEN 1 ELSE 0 END) as called_count,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'SKIPPED' THEN 1 ELSE 0 END) as skipped_count
      FROM appointments
      WHERE appointment_date = ?
    `;

    const [kpiResult] = await pool.execute(kpiQuery, [today]);
    const kpi = kpiResult[0];

    // ========== 2. TOP BÁC SĨ HÔM NAY ==========
    const topDoctorsQuery = `
      SELECT 
        a.doctor_id,
        du.full_name as doctor_name,
        COUNT(*) as total_today,
        SUM(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as waiting_count
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.appointment_date = ?
      GROUP BY a.doctor_id, du.full_name
      ORDER BY total_today DESC
      LIMIT 10
    `;

    const [topDoctors] = await pool.execute(topDoctorsQuery, [today]);

    // ========== 3. TOP CHUYÊN KHOA HÔM NAY ==========
    const topDepartmentsQuery = `
      SELECT 
        a.department_id,
        dept.name as department_name,
        COUNT(*) as total_today,
        SUM(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as waiting_count
      FROM appointments a
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.appointment_date = ?
      GROUP BY a.department_id, dept.name
      ORDER BY total_today DESC
      LIMIT 10
    `;

    const [topDepartments] = await pool.execute(topDepartmentsQuery, [today]);

    // ========== 4. LIVE LIST CURRENT (IN_PROGRESS, CALLED) ==========
    const liveListQuery = `
      SELECT 
        a.id,
        a.doctor_id,
        du.full_name as doctor_name,
        r.room_name,
        r.room_code,
        qn.queue_number as current_number,
        a.status,
        p.full_name as patient_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
      JOIN users p ON a.patient_id = p.id
      WHERE a.appointment_date = ?
        AND a.status IN ('CALLED', 'IN_PROGRESS')
      ORDER BY 
        CASE WHEN a.status = 'IN_PROGRESS' THEN 0 ELSE 1 END,
        qn.queue_number ASC
      LIMIT 10
    `;

    const [liveList] = await pool.execute(liveListQuery, [today]);

    // ========== 5. CHART 7 NGÀY GẦN NHẤT ==========
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 ngày bao gồm hôm nay
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const chartQuery = `
      SELECT 
        appointment_date as date,
        COUNT(*) as total
      FROM appointments
      WHERE appointment_date >= ? AND appointment_date <= ?
      GROUP BY appointment_date
      ORDER BY appointment_date ASC
    `;

    const [chartData] = await pool.execute(chartQuery, [sevenDaysAgoStr, today]);

    // ========== 6. RECENT APPOINTMENTS (10 mới nhất) ==========
    const recentQuery = `
      SELECT 
        a.id,
        a.created_at,
        p.full_name as patient_name,
        du.full_name as doctor_name,
        qn.queue_number,
        a.status,
        a.appointment_date,
        a.appointment_time
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id
      ORDER BY a.created_at DESC
      LIMIT 10
    `;

    const [recentAppointments] = await pool.execute(recentQuery);

    // Format response
    res.json({
      success: true,
      data: {
        kpi: {
          total: parseInt(kpi.total) || 0,
          WAITING: parseInt(kpi.waiting_count) || 0,
          CALLED: parseInt(kpi.called_count) || 0,
          IN_PROGRESS: parseInt(kpi.in_progress_count) || 0,
          DONE: parseInt(kpi.done_count) || 0,
          CANCELLED: parseInt(kpi.cancelled_count) || 0,
          SKIPPED: parseInt(kpi.skipped_count) || 0,
          date: today
        },
        top_doctors: topDoctors.map(item => ({
          doctor_id: item.doctor_id,
          doctor_name: item.doctor_name,
          total_today: parseInt(item.total_today),
          waiting_count: parseInt(item.waiting_count)
        })),
        top_departments: topDepartments.map(item => ({
          department_id: item.department_id,
          department_name: item.department_name,
          total_today: parseInt(item.total_today),
          waiting_count: parseInt(item.waiting_count)
        })),
        live_list: liveList.map(item => ({
          id: item.id,
          doctor_id: item.doctor_id,
          doctor_name: item.doctor_name,
          room_name: item.room_name || 'Chưa xác định',
          room_code: item.room_code || '',
          current_number: item.current_number,
          status: item.status,
          patient_name: item.patient_name
        })),
        chart_7_days: chartData.map(item => ({
          date: item.date.toISOString().split('T')[0],
          total: parseInt(item.total)
        })),
        recent_appointments: recentAppointments.map(item => ({
          id: item.id,
          created_at: item.created_at,
          patient_name: item.patient_name,
          doctor_name: item.doctor_name,
          queue_number: item.queue_number,
          status: item.status,
          appointment_date: item.appointment_date.toISOString().split('T')[0],
          appointment_time: item.appointment_time ? item.appointment_time.toString().slice(0, 5) : null
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    next(error);
  }
};

