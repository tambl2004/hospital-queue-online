const { getPool } = require('../config/database');

/**
 * Lấy danh sách chuyên khoa
 * GET /admin/departments
 */
const getDepartments = async (req, res, next) => {
  try {
    const pool = getPool();
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM departments WHERE 1=1';
    let params = [];

    // Tìm kiếm theo tên
    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    // Đếm tổng số records
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Lấy dữ liệu với phân trang
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [departments] = await pool.execute(query, params);

    res.json({
      success: true,
      data: departments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin một chuyên khoa theo ID
 * GET /admin/departments/:id
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [departments] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chuyên khoa không tồn tại',
      });
    }

    res.json({
      success: true,
      data: departments[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo chuyên khoa mới
 * POST /admin/departments
 */
const createDepartment = async (req, res, next) => {
  try {
    const pool = getPool();
    const { name, description, is_active = true } = req.body;

    // Validate dữ liệu
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên chuyên khoa không được để trống',
      });
    }

    if (name.trim().length < 3 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tên chuyên khoa phải từ 3 đến 100 ký tự',
      });
    }

    // Kiểm tra trùng tên (case-insensitive)
    const [existing] = await pool.execute(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER(?)',
      [name.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên chuyên khoa đã tồn tại',
      });
    }

    // Insert vào database
    const [result] = await pool.execute(
      'INSERT INTO departments (name, description, is_active) VALUES (?, ?, ?)',
      [name.trim(), description || null, is_active]
    );

    // Lấy lại thông tin vừa tạo
    const [newDepartment] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo chuyên khoa thành công',
      data: newDepartment[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật chuyên khoa
 * PUT /admin/departments/:id
 */
const updateDepartment = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    // Kiểm tra chuyên khoa có tồn tại không
    const [existing] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chuyên khoa không tồn tại',
      });
    }

    // Validate nếu có name
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tên chuyên khoa không được để trống',
        });
      }

      if (name.trim().length < 3 || name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tên chuyên khoa phải từ 3 đến 100 ký tự',
        });
      }

      // Kiểm tra trùng tên (trừ chính nó)
      const [duplicate] = await pool.execute(
        'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND id != ?',
        [name.trim(), id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tên chuyên khoa đã tồn tại',
        });
      }
    }

    // Cập nhật dữ liệu
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name.trim());
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description || null);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE departments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Cập nhật chuyên khoa thành công',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật trạng thái chuyên khoa (ngừng/kích hoạt)
 * PATCH /admin/departments/:id/status
 */
const updateDepartmentStatus = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ',
      });
    }

    // Kiểm tra chuyên khoa có tồn tại không
    const [existing] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chuyên khoa không tồn tại',
      });
    }

    // Cập nhật trạng thái
    await pool.execute(
      'UPDATE departments SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active, id]
    );

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: is_active ? 'Kích hoạt chuyên khoa thành công' : 'Ngừng sử dụng chuyên khoa thành công',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
};

