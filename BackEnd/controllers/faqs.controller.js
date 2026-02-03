const { getPool } = require('../config/database');

/**
 * Lấy danh sách FAQs (public - không cần auth)
 * GET /api/faqs
 */
const getFAQs = async (req, res, next) => {
  try {
    const pool = getPool();
    const { is_active } = req.query;

    let query = 'SELECT * FROM faqs WHERE 1=1';
    let params = [];

    // Nếu là public API, chỉ lấy FAQs đang active
    if (is_active === undefined || is_active === 'true' || is_active === '1') {
      query += ' AND is_active = 1';
    } else if (is_active === 'false' || is_active === '0') {
      query += ' AND is_active = 0';
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const [faqs] = await pool.execute(query, params);

    res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy FAQ theo ID
 * GET /api/admin/faqs/:id
 */
const getFAQById = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [faqs] = await pool.execute('SELECT * FROM faqs WHERE id = ?', [id]);

    if (faqs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ không tồn tại',
      });
    }

    res.json({
      success: true,
      data: faqs[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo FAQ mới
 * POST /api/admin/faqs
 */
const createFAQ = async (req, res, next) => {
  try {
    const pool = getPool();
    const { question, answer, display_order = 0, is_active = 1 } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi và câu trả lời là bắt buộc',
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO faqs (question, answer, display_order, is_active) VALUES (?, ?, ?, ?)',
      [question, answer, display_order, is_active ? 1 : 0]
    );

    const [newFAQ] = await pool.execute('SELECT * FROM faqs WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Tạo FAQ thành công',
      data: newFAQ[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật FAQ
 * PUT /api/admin/faqs/:id
 */
const updateFAQ = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { question, answer, display_order, is_active } = req.body;

    // Kiểm tra FAQ có tồn tại không
    const [existing] = await pool.execute('SELECT * FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ không tồn tại',
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (question !== undefined) {
      updateFields.push('question = ?');
      updateValues.push(question);
    }
    if (answer !== undefined) {
      updateFields.push('answer = ?');
      updateValues.push(answer);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    updateValues.push(id);
    await pool.execute(
      `UPDATE faqs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await pool.execute('SELECT * FROM faqs WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật FAQ thành công',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa FAQ
 * DELETE /api/admin/faqs/:id
 */
const deleteFAQ = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    // Kiểm tra FAQ có tồn tại không
    const [existing] = await pool.execute('SELECT * FROM faqs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ không tồn tại',
      });
    }

    await pool.execute('DELETE FROM faqs WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa FAQ thành công',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};

