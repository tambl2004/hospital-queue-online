// backend/controllers/googleAuth.controller.js
const { OAuth2Client } = require('google-auth-library');
const { getPool } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const fs = require('fs');
const path = require('path');

// Hàm tạo OAuth2Client (đảm bảo env variables đã được load)
const createOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT;

  // Validation
  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Missing Google OAuth environment variables:');
    console.error('GOOGLE_CLIENT_ID:', clientId ? '✓' : '✗ MISSING');
    console.error('GOOGLE_CLIENT_SECRET:', clientSecret ? '✓' : '✗ MISSING');
    console.error('GOOGLE_REDIRECT:', redirectUri ? '✓' : '✗ MISSING');
    throw new Error('Google OAuth configuration is missing. Please check your .env file.');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
};

/**
 * Redirect đến Google OAuth
 * GET /api/auth/google
 */
const googleAuth = async (req, res) => {
  try {
    // Tạo OAuth2Client mới để đảm bảo env variables đã được load
    const client = createOAuth2Client();
    
    // Tạo URL xác thực Google
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'select_account', // Yêu cầu chọn tài khoản mỗi lần
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xác thực Google. Vui lòng kiểm tra cấu hình.',
    });
  }
};

/**
 * Xử lý callback từ Google OAuth
 * GET /api/auth/google/callback
 */
const googleCallback = async (req, res) => {
  const connection = await getPool().getConnection();
  
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=no_code`);
    }

    // Tạo OAuth2Client mới để đảm bảo env variables đã được load
    const client = createOAuth2Client();

    // Đổi code lấy token
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Lấy thông tin user từ Google
    // Sử dụng id_token để verify và lấy thông tin user
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name: fullName,
      picture: avatarUrl,
    } = payload;

    if (!email) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=no_email`);
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connection.beginTransaction();

    // Kiểm tra user đã tồn tại chưa (theo email hoặc google_id)
    const [existingUsers] = await connection.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, is_active, google_id
       FROM users 
       WHERE email = ? OR google_id = ?`,
      [normalizedEmail, googleId]
    );

    let user;
    let userId;

    if (existingUsers.length > 0) {
      // User đã tồn tại
      user = existingUsers[0];
      userId = user.id;

      // Nếu user chưa có google_id, cập nhật
      if (!user.google_id) {
        await connection.execute(
          'UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [googleId, userId]
        );
      }

      // Kiểm tra tài khoản có bị khóa không
      if (!user.is_active) {
        await connection.rollback();
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=account_locked`);
      }
    } else {
      // Tạo user mới (user đăng nhập bằng Google không cần password_hash)
      const [result] = await connection.execute(
        `INSERT INTO users (full_name, email, password_hash, google_id, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [fullName || 'User', normalizedEmail, null, googleId, true]
      );

      userId = result.insertId;

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

      // Lấy lại thông tin user vừa tạo
      const [newUsers] = await connection.execute(
        `SELECT id, full_name, email, phone, gender, date_of_birth, is_active, created_at
         FROM users WHERE id = ?`,
        [userId]
      );
      user = newUsers[0];
    }

    await connection.commit();

    // Lấy roles của user
    const [userRoles] = await connection.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [userId]
    );

    // Tạo temporary token để đổi lấy JWT (tránh URL quá dài)
    // Temp token chỉ có hiệu lực 60 giây
    const tempToken = generateToken(
      {
        sub: userId,
        temp: true,
      },
      '60s' // 60 giây
    );

    // Redirect về frontend với temp token
    // Frontend sẽ gọi API để đổi lấy JWT token thực sự
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/callback?temp_token=${encodeURIComponent(tempToken)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    await connection.rollback();
    console.error('Google Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/login?error=callback_error`);
  } finally {
    connection.release();
  }
};

/**
 * Debug endpoint để kiểm tra cấu hình Google OAuth (chỉ dùng trong development)
 * GET /api/auth/google/debug
 */
const googleDebug = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT;
    const clientUrl = process.env.CLIENT_URL;

    res.json({
      success: true,
      config: {
        GOOGLE_CLIENT_ID: clientId ? `${clientId.substring(0, 20)}...` : 'MISSING',
        GOOGLE_CLIENT_SECRET: clientSecret ? 'SET (hidden)' : 'MISSING',
        GOOGLE_REDIRECT: redirectUri || 'MISSING',
        CLIENT_URL: clientUrl || 'MISSING',
        allSet: !!(clientId && clientSecret && redirectUri),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Đổi temporary token lấy JWT token thực sự và user info
 * POST /api/auth/google/exchange-token
 */
const exchangeTempToken = async (req, res, next) => {
  try {
    const { temp_token } = req.body;

    if (!temp_token) {
      return res.status(400).json({
        success: false,
        message: 'Temp token không được để trống',
      });
    }

    // Verify temp token
    const { verifyToken } = require('../utils/jwt');
    let decoded;
    try {
      decoded = verifyToken(temp_token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Temp token không hợp lệ hoặc đã hết hạn',
      });
    }

    if (!decoded.temp || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    const userId = decoded.sub;
    const pool = getPool();

    // Lấy thông tin user
    const [users] = await pool.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, is_active, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa',
      });
    }

    // Lấy roles
    const [userRoles] = await pool.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [userId]
    );

    // Tạo JWT token thực sự
    const token = generateToken({
      sub: userId,
      roles: userRoles.map((r) => r.code),
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        roles: userRoles.map((r) => r.code),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  googleDebug,
  exchangeTempToken,
};

