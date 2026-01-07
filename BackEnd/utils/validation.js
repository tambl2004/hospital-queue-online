// backend/utils/validation.js

/**
 * Validate email format
 * @param {String} email
 * @returns {Boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {String} password
 * @returns {Object} { valid: Boolean, message: String }
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự',
    };
  }
  return { valid: true, message: '' };
};

/**
 * Validate full name
 * @param {String} fullName
 * @returns {Object} { valid: Boolean, message: String }
 */
const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length < 2) {
    return {
      valid: false,
      message: 'Họ và tên phải có ít nhất 2 ký tự',
    };
  }
  if (fullName.trim().length > 150) {
    return {
      valid: false,
      message: 'Họ và tên không được vượt quá 150 ký tự',
    };
  }
  return { valid: true, message: '' };
};

/**
 * Validate phone number (Vietnamese format)
 * @param {String} phone
 * @returns {Boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

module.exports = {
  isValidEmail,
  validatePassword,
  validateFullName,
  isValidPhone,
};

