const { getPool } = require('../config/database');

/**
 * REPORTS CONTROLLER
 * Báo cáo thống kê appointments theo khoảng thời gian
 * 
 * Trạng thái (Status):
 * - WAITING: Đã đặt lịch, đã cấp số, chưa gọi
 * - CALLED: Đã gọi số
 * - IN_PROGRESS: Đang khám
 * - DONE: Khám xong
 * - CANCELLED: Huỷ lịch
 * - SKIPPED: Bỏ qua lượt
 */

/**
 * Lấy báo cáo thống kê appointments
 * GET /api/admin/reports
 * 
 * Query params:
 * - from: YYYY-MM-DD (bắt buộc)
 * - to: YYYY-MM-DD (bắt buộc)
 * - department_id: optional
 * - doctor_id: optional
 * - status: optional
 */
exports.getReports = async (req, res, next) => {
  try {
    const pool = getPool();
    const { from, to, department_id, doctor_id, status } = req.query;

    // Validation: from và to là bắt buộc
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Tham số from và to là bắt buộc (định dạng: YYYY-MM-DD)'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
      });
    }

    // Validate from <= to
    if (new Date(from) > new Date(to)) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'
      });
    }

    // Build WHERE conditions
    const conditions = ['a.appointment_date BETWEEN ? AND ?'];
    const params = [from, to];

    // Optional filters
    if (department_id) {
      conditions.push('a.department_id = ?');
      params.push(parseInt(department_id));
    }

    if (doctor_id) {
      conditions.push('a.doctor_id = ?');
      params.push(parseInt(doctor_id));
    }

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // ========== 1. SUMMARY ==========
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN a.status = 'DONE' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count
      FROM appointments a
      ${whereClause}
    `;

    const [summaryResult] = await pool.execute(summaryQuery, params);
    const summary = summaryResult[0];
    
    const total = parseInt(summary.total) || 0;
    const doneCount = parseInt(summary.done_count) || 0;
    const cancelledCount = parseInt(summary.cancelled_count) || 0;
    const cancelRate = total > 0 ? ((cancelledCount / total) * 100).toFixed(2) : 0;

    // Tính số ngày trong khoảng
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 để bao gồm cả ngày cuối
    const avgPerDay = diffDays > 0 ? (total / diffDays).toFixed(2) : 0;

    // ========== 2. SERIES THEO NGÀY ==========
    const dailySeriesQuery = `
      SELECT 
        a.appointment_date as date,
        COUNT(*) as total
      FROM appointments a
      ${whereClause}
      GROUP BY a.appointment_date
      ORDER BY a.appointment_date ASC
    `;

    const [dailySeries] = await pool.execute(dailySeriesQuery, params);

    // ========== 3. TOP BÁC SĨ ==========
    const topDoctorsQuery = `
      SELECT 
        a.doctor_id,
        du.full_name as doctor_name,
        COUNT(*) as total,
        SUM(CASE WHEN a.status = 'DONE' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN a.status IN ('WAITING', 'CALLED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as waiting_count
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      ${whereClause}
      GROUP BY a.doctor_id, du.full_name
      ORDER BY total DESC
      LIMIT 20
    `;

    const [topDoctors] = await pool.execute(topDoctorsQuery, params);

    // ========== 4. TOP CHUYÊN KHOA ==========
    const topDepartmentsQuery = `
      SELECT 
        a.department_id,
        dept.name as department_name,
        COUNT(*) as total,
        SUM(CASE WHEN a.status = 'DONE' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count
      FROM appointments a
      JOIN departments dept ON a.department_id = dept.id
      ${whereClause}
      GROUP BY a.department_id, dept.name
      ORDER BY total DESC
      LIMIT 20
    `;

    const [topDepartments] = await pool.execute(topDepartmentsQuery, params);

    // ========== 5. BREAKDOWN THEO TRẠNG THÁI ==========
    const statusBreakdownQuery = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM appointments a
      ${whereClause}
      GROUP BY a.status
      ORDER BY count DESC
    `;

    const [statusBreakdown] = await pool.execute(statusBreakdownQuery, params);

    // Format response
    res.json({
      success: true,
      data: {
        summary: {
          total,
          done: doneCount,
          cancelled: cancelledCount,
          cancel_rate: parseFloat(cancelRate),
          avg_per_day: parseFloat(avgPerDay),
          date_range: {
            from,
            to,
            days: diffDays
          }
        },
        daily_series: dailySeries.map(item => ({
          date: item.date.toISOString().split('T')[0],
          total: parseInt(item.total)
        })),
        top_doctors: topDoctors.map(item => ({
          doctor_id: item.doctor_id,
          doctor_name: item.doctor_name,
          total: parseInt(item.total),
          done: parseInt(item.done_count),
          cancelled: parseInt(item.cancelled_count),
          waiting_count: parseInt(item.waiting_count)
        })),
        top_departments: topDepartments.map(item => ({
          department_id: item.department_id,
          department_name: item.department_name,
          total: parseInt(item.total),
          done: parseInt(item.done_count),
          cancelled: parseInt(item.cancelled_count)
        })),
        status_breakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    next(error);
  }
};

