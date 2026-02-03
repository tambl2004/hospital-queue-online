// backend/utils/jwt.js
const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token
 * @param {Object} payload - Payload chứa user_id và roles (KHÔNG được có 'exp' property)
 * @param {String|Number} expiresIn - Thời gian hết hạn (optional, mặc định 7d)
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = null) => {
  // Đảm bảo payload không có 'exp' property (sẽ gây conflict với expiresIn option)
  const cleanPayload = { ...payload };
  if (cleanPayload.exp) {
    delete cleanPayload.exp;
  }
  
  return jwt.sign(
    cleanPayload,
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    {
      expiresIn: expiresIn || process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here'
    );
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

