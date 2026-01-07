const { getPool } = require('../config/database');

/**
 * Lấy danh sách phòng khám
 * GET /admin/rooms
 */
const getRooms = async (req, res, next) => {
  try {
    const pool = getPool();
    const { department_id, is_active, limit = 1000 } = req.query;

    let query = `
      SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.department_id,
        d.name as department_name,
        r.is_active,
        r.created_at
      FROM rooms r
      INNER JOIN departments d ON r.department_id = d.id
      WHERE 1=1
    `;
    let params = [];

    // Filter theo department
    if (department_id) {
      query += ' AND r.department_id = ?';
      params.push(parseInt(department_id));
    }

    // Filter theo status
    if (is_active !== undefined && is_active !== '') {
      const isActive = is_active === 'true' || is_active === true;
      query += ' AND r.is_active = ?';
      params.push(isActive);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rooms] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
};

