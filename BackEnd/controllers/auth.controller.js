// backend/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const {
  isValidEmail,
  validatePassword,
  validateFullName,
  isValidPhone,
} = require('../utils/validation');

/**
 * Đăng ký tài khoản Patient
 */
const register = async (req, res, next) => {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();

    const { full_name, email, password, phone, gender, date_of_birth } = req.body;

    // Validation
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

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await connection.execute(
      `INSERT INTO users (full_name, email, password_hash, phone, gender, date_of_birth, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        normalizedEmail,
        passwordHash,
        phone || null,
        gender || null,
        date_of_birth || null,
        true,
      ]
    );

    const userId = result.insertId;

    // Lấy role PATIENT
    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE code = ?',
      ['PATIENT']
    );

    if (roles.length === 0) {
      throw new Error('Role PATIENT không tồn tại trong hệ thống');
    }

    const patientRoleId = roles[0].id;

    // Gán role PATIENT cho user
    await connection.execute(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, patientRoleId]
    );

    await connection.commit();

    // Lấy thông tin user vừa tạo (không có password_hash)
    const [newUsers] = await connection.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, is_active, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const newUser = newUsers[0];

    // Lấy roles
    const [userRoles] = await connection.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [userId]
    );

    // Tạo JWT token
    const token = generateToken({
      sub: userId,
      roles: userRoles.map((r) => r.code),
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        gender: newUser.gender,
        date_of_birth: newUser.date_of_birth,
        roles: userRoles.map((r) => r.code),
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
 * Đăng nhập
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu không được để trống',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

    const pool = getPool();
    const normalizedEmail = email.toLowerCase().trim();

    // Tìm user theo email
    const [users] = await pool.execute(
      `SELECT id, full_name, email, password_hash, phone, gender, date_of_birth, is_active
       FROM users WHERE email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    const user = users[0];

    // Kiểm tra tài khoản có bị khóa không
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa',
      });
    }

    // Kiểm tra nếu user đăng nhập bằng Google (không có password_hash)
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đăng nhập bằng Google. Vui lòng sử dụng "Đăng nhập bằng Google".',
      });
    }

    // So sánh password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Lấy roles của user
    const [roles] = await pool.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    // Tạo JWT token
    const token = generateToken({
      sub: user.id,
      roles: roles.map((r) => r.code),
    });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        roles: roles.map((r) => r.code),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin user hiện tại
 */
const getMe = async (req, res, next) => {
  try {
    const pool = getPool();

    // Lấy thông tin user
    const [users] = await pool.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    const user = users[0];

    // Lấy roles
    const [roles] = await pool.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        is_active: user.is_active,
        roles: roles.map((r) => r.code),
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật hồ sơ cá nhân (Patient tự cập nhật)
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const pool = getPool();
    const { full_name, phone, gender, date_of_birth } = req.body;
    const userId = req.user.id;

    // Validate full_name
    if (full_name !== undefined) {
      const nameValidation = validateFullName(full_name);
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          message: nameValidation.message,
        });
      }
    }

    // Validate phone
    if (phone !== undefined && phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ',
      });
    }

    // Validate gender
    if (gender !== undefined && gender !== '' && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Giới tính không hợp lệ',
      });
    }

    // Validate date_of_birth
    if (date_of_birth !== undefined && date_of_birth !== '') {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không hợp lệ',
        });
      }

      if (birthDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Ngày sinh không được vượt quá ngày hiện tại',
        });
      }
    }

    // Kiểm tra user có tồn tại không
    const [existing] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    // Build update fields
    const updateFields = [];
    const updateValues = [];

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name.trim());
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender || null);
    }

    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth || null);
    }

    // Cập nhật nếu có thay đổi
    if (updateFields.length > 0) {
      updateValues.push(userId);
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );
    }

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, is_active, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = updated[0];

    // Lấy roles
    const [roles] = await pool.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        is_active: user.is_active,
        roles: roles.map((r) => r.code),
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quên mật khẩu (placeholder - có thể implement sau)
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
    }

    const pool = getPool();
    const normalizedEmail = email.toLowerCase().trim();

    // Kiểm tra email có tồn tại không
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    // Trả về success dù email có tồn tại hay không (bảo mật)
    if (users.length > 0) {
      // TODO: Gửi email reset password
      // Tạo reset token và lưu vào database
      // Gửi email với link reset
    }

    res.json({
      success: true,
      message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đổi mật khẩu cho user đang đăng nhập
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới',
      });
    }

    // Validate mật khẩu mới
    const pwValidation = validatePassword(new_password);
    if (!pwValidation.valid) {
      return res.status(400).json({
        success: false,
        message: pwValidation.message,
      });
    }

    // Lấy user hiện tại
    const [users] = await pool.execute(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    const user = users[0];

    // Kiểm tra mật khẩu hiện tại
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, userId]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  changePassword,
};
