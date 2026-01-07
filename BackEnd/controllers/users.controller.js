const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const {
  isValidEmail,
  validatePassword,
  validateFullName,
  isValidPhone,
} = require('../utils/validation');

/**
 * Lấy danh sách người dùng với filter
 * GET /admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const pool = getPool();
    const {
      search = '',
      status,
      role,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        u.is_active,
        u.created_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') as roles,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ', ') as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE 1=1
    `;
    let params = [];

    // Filter theo status (is_active)
    if (status !== undefined && status !== '') {
      const isActive = status === 'active' || status === 'true' || status === true;
      query += ' AND u.is_active = ?';
      params.push(isActive);
    }

    // Filter theo role
    if (role) {
      query += ' AND r.code = ?';
      params.push(role);
    }

    // Search theo tên, email, phone
    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' GROUP BY u.id';

    // Đếm tổng số records
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(DISTINCT u.id) as total FROM'
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Lấy dữ liệu với phân trang
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.execute(query, params);

    // Format dữ liệu trả về
    const formattedUsers = users.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: user.is_active,
      roles: user.roles ? user.roles.split(', ') : [],
      role_names: user.role_names ? user.role_names.split(', ') : [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    res.json({
      success: true,
      data: formattedUsers,
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
 * Lấy thông tin một người dùng theo ID
 * GET /admin/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [users] = await pool.execute(
      `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        u.is_active,
        u.created_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') as roles,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ', ') as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    const user = users[0];
    const formattedUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: user.is_active,
      roles: user.roles ? user.roles.split(', ') : [],
      role_names: user.role_names ? user.role_names.split(', ') : [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo người dùng mới
 * POST /admin/users
 */
const createUser = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const {
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      is_active = true,
      roles = ['PATIENT'], // Mặc định là PATIENT
    } = req.body;

    // Validate thông tin
    const nameValidation = validateFullName(full_name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.message,
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ',
      });
    }

    // Chuẩn hóa email
    const normalizedEmail = email.toLowerCase().trim();

    // Kiểm tra email đã tồn tại chưa
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng',
      });
    }

    // Validate roles
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phải có ít nhất một role',
      });
    }

    // Kiểm tra roles tồn tại
    const placeholders = roles.map(() => '?').join(', ');
    const [validRoles] = await connection.execute(
      `SELECT id, code FROM roles WHERE code IN (${placeholders})`,
      roles
    );

    if (validRoles.length !== roles.length) {
      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều role không hợp lệ',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users (full_name, email, password_hash, phone, gender, date_of_birth, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        normalizedEmail,
        passwordHash,
        phone || null,
        gender || null,
        date_of_birth || null,
        is_active,
      ]
    );

    const userId = userResult.insertId;

    // Gán roles
    const roleInserts = validRoles.map((role) => [userId, role.id]);
    if (roleInserts.length > 0) {
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ?',
        [roleInserts]
      );
    }

    await connection.commit();

    // Lấy lại thông tin vừa tạo
    const [newUsers] = await connection.execute(
      `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        u.is_active,
        u.created_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') as roles,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ', ') as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [userId]
    );

    const user = newUsers[0];
    const formattedUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: user.is_active,
      roles: user.roles ? user.roles.split(', ') : [],
      role_names: user.role_names ? user.role_names.split(', ') : [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: formattedUser,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật thông tin người dùng
 * PUT /admin/users/:id
 */
const updateUser = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      is_active,
      roles,
    } = req.body;

    // Kiểm tra user có tồn tại không
    const [existing] = await connection.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    const updateFields = [];
    const updateValues = [];

    // Validate và cập nhật full_name
    if (full_name !== undefined) {
      const nameValidation = validateFullName(full_name);
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          message: nameValidation.message,
        });
      }
      updateFields.push('full_name = ?');
      updateValues.push(full_name.trim());
    }

    // Validate và cập nhật email
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Kiểm tra email đã được sử dụng bởi user khác chưa
      const [emailCheck] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [normalizedEmail, id]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng',
        });
      }

      updateFields.push('email = ?');
      updateValues.push(normalizedEmail);
    }

    // Cập nhật password nếu có
    if (password !== undefined && password !== '') {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updateFields.push('password_hash = ?');
      updateValues.push(passwordHash);
    }

    // Cập nhật phone
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ',
        });
      }
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    // Cập nhật gender
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender || null);
    }

    // Cập nhật date_of_birth
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth || null);
    }

    // Cập nhật is_active
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    // Cập nhật user
    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );
    }

    // Cập nhật roles nếu có
    if (roles !== undefined) {
      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Phải có ít nhất một role',
        });
      }

      // Kiểm tra roles tồn tại
      const placeholders = roles.map(() => '?').join(', ');
      const [validRoles] = await connection.execute(
        `SELECT id, code FROM roles WHERE code IN (${placeholders})`,
        roles
      );

      if (validRoles.length !== roles.length) {
        return res.status(400).json({
          success: false,
          message: 'Một hoặc nhiều role không hợp lệ',
        });
      }

      // Xóa roles cũ
      await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);

      // Thêm roles mới
      const roleInserts = validRoles.map((role) => [id, role.id]);
      if (roleInserts.length > 0) {
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ?',
          [roleInserts]
        );
      }
    }

    await connection.commit();

    // Lấy lại thông tin đã cập nhật
    const [updated] = await connection.execute(
      `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        u.is_active,
        u.created_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') as roles,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ', ') as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [id]
    );

    const user = updated[0];
    const formattedUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: user.is_active,
      roles: user.roles ? user.roles.split(', ') : [],
      role_names: user.role_names ? user.role_names.split(', ') : [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: formattedUser,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật trạng thái người dùng (ngừng/kích hoạt)
 * PATCH /admin/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
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

    // Kiểm tra user có tồn tại không
    const [existing] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    // Cập nhật trạng thái
    await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active, id]
    );

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        u.is_active,
        u.created_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') as roles,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.code SEPARATOR ', ') as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [id]
    );

    const user = updated[0];
    const formattedUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_active: user.is_active,
      roles: user.roles ? user.roles.split(', ') : [],
      role_names: user.role_names ? user.role_names.split(', ') : [],
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({
      success: true,
      message: is_active ? 'Kích hoạt người dùng thành công' : 'Ngừng hoạt động người dùng thành công',
      data: formattedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa người dùng
 * DELETE /admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Kiểm tra user có tồn tại không
    const [existing] = await connection.execute('SELECT id FROM users WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    // Kiểm tra user có phải là doctor không (có trong bảng doctors)
    const [doctors] = await connection.execute('SELECT id FROM doctors WHERE user_id = ?', [id]);
    if (doctors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa người dùng đang là bác sĩ. Vui lòng xóa bác sĩ trước.',
      });
    }

    // Xóa user_roles trước (foreign key constraint)
    await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);

    // Xóa user
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Xóa người dùng thành công',
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
