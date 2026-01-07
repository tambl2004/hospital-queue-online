// backend/middlewares/auth.js
const { verifyToken } = require('../utils/jwt');
const { getPool } = require('../config/database');

/**
 * Middleware xác thực JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực',
      });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = verifyToken(token);

    // Lấy thông tin user từ database
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, full_name, email, phone, gender, date_of_birth, is_active FROM users WHERE id = ?',
      [decoded.sub]
    );

    if (users.length === 0) {
      return res.status(401).json({
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

    // Lấy roles của user
    const [roles] = await pool.execute(
      `SELECT r.code, r.name 
       FROM user_roles ur 
       INNER JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    // Gắn thông tin user vào request
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      roles: roles.map((r) => r.code),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token không hợp lệ',
    });
  }
};

/**
 * Middleware kiểm tra role
 * @param {Array} allowedRoles - Danh sách roles được phép
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
};

