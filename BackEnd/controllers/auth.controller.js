// backend/controllers/auth.controller.js
const login = async (req, res, next) => {
  try {
    // TODO: Implement login logic
    res.json({ message: 'Login endpoint' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login
};

