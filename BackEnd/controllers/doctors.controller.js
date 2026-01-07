const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const {
  isValidEmail,
  validatePassword,
  validateFullName,
  isValidPhone,
} = require('../utils/validation');

/**
 * Lấy danh sách bác sĩ với filter
 * GET /admin/doctors
 */
const getDoctors = async (req, res, next) => {
  try {
    const pool = getPool();
    const {
      search = '',
      department_id,
      room_id,
      status,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        d.id as doctor_id,
        d.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        d.department_id,
        dept.name as department_name,
        d.room_id,
        r.room_code,
        r.room_name,
        d.experience_years,
        d.rating_avg,
        d.bio,
        d.is_active,
        d.created_at,
        d.updated_at
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      INNER JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE 1=1
    `;
    let params = [];

    // Filter theo department
    if (department_id) {
      query += ' AND d.department_id = ?';
      params.push(parseInt(department_id));
    }

    // Filter theo room
    if (room_id) {
      query += ' AND d.room_id = ?';
      params.push(parseInt(room_id));
    }

    // Filter theo status (is_active)
    if (status !== undefined && status !== '') {
      const isActive = status === 'active' || status === 'true' || status === true;
      query += ' AND d.is_active = ?';
      params.push(isActive);
    }

    // Search theo tên, email, phone
    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Đếm tổng số records
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Lấy dữ liệu với phân trang
    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [doctors] = await pool.execute(query, params);

    // Format dữ liệu trả về
    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.doctor_id,
      user_id: doctor.user_id,
      full_name: doctor.full_name,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      date_of_birth: doctor.date_of_birth,
      department: {
        id: doctor.department_id,
        name: doctor.department_name,
      },
      room: doctor.room_id
        ? {
            id: doctor.room_id,
            room_code: doctor.room_code,
            room_name: doctor.room_name,
          }
        : null,
      experience_years: doctor.experience_years,
      rating_avg: doctor.rating_avg ? parseFloat(doctor.rating_avg) : 0,
      bio: doctor.bio,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
    }));

    res.json({
      success: true,
      data: formattedDoctors,
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
 * Lấy thông tin một bác sĩ theo ID
 * GET /admin/doctors/:id
 */
const getDoctorById = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [doctors] = await pool.execute(
      `
      SELECT 
        d.id as doctor_id,
        d.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        d.department_id,
        dept.name as department_name,
        d.room_id,
        r.room_code,
        r.room_name,
        d.experience_years,
        d.rating_avg,
        d.bio,
        d.is_active,
        d.created_at,
        d.updated_at
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      INNER JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.id = ?
    `,
      [id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại',
      });
    }

    const doctor = doctors[0];
    const formattedDoctor = {
      id: doctor.doctor_id,
      user_id: doctor.user_id,
      full_name: doctor.full_name,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      date_of_birth: doctor.date_of_birth,
      department: {
        id: doctor.department_id,
        name: doctor.department_name,
      },
      room: doctor.room_id
        ? {
            id: doctor.room_id,
            room_code: doctor.room_code,
            room_name: doctor.room_name,
          }
        : null,
      experience_years: doctor.experience_years,
      rating_avg: doctor.rating_avg ? parseFloat(doctor.rating_avg) : 0,
      bio: doctor.bio,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
    };

    res.json({
      success: true,
      data: formattedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo bác sĩ mới
 * POST /admin/doctors
 */
const createDoctor = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const {
      // Thông tin user
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      // Thông tin doctor
      department_id,
      room_id,
      experience_years,
      bio,
      is_active = true,
    } = req.body;

    // Validate thông tin user
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

    // Validate thông tin doctor
    if (!department_id) {
      return res.status(400).json({
        success: false,
        message: 'Chuyên khoa không được để trống',
      });
    }

    if (experience_years !== undefined && experience_years < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số năm kinh nghiệm phải >= 0',
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

    // Kiểm tra department tồn tại và active
    const [departments] = await connection.execute(
      'SELECT id, is_active FROM departments WHERE id = ?',
      [department_id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chuyên khoa không tồn tại',
      });
    }

    if (!departments[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo bác sĩ vào chuyên khoa đang ngừng hoạt động',
      });
    }

    // Kiểm tra room nếu có
    if (room_id) {
      const [rooms] = await connection.execute(
        'SELECT id, department_id, is_active FROM rooms WHERE id = ?',
        [room_id]
      );

      if (rooms.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Phòng khám không tồn tại',
        });
      }

      if (!rooms[0].is_active) {
        return res.status(400).json({
          success: false,
          message: 'Không thể gán bác sĩ vào phòng khám đang ngừng hoạt động',
        });
      }

      // Kiểm tra room có thuộc department không
      if (rooms[0].department_id !== parseInt(department_id)) {
        return res.status(400).json({
          success: false,
          message: 'Phòng khám không thuộc chuyên khoa đã chọn',
        });
      }
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
        true,
      ]
    );

    const userId = userResult.insertId;

    // Lấy role DOCTOR và gán cho user
    const [doctorRoles] = await connection.execute(
      'SELECT id FROM roles WHERE code = ?',
      ['DOCTOR']
    );

    if (doctorRoles.length === 0) {
      throw new Error('Role DOCTOR không tồn tại trong hệ thống');
    }

    // Gán role DOCTOR cho user
    await connection.execute(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, doctorRoles[0].id]
    );

    // Insert doctor
    const [doctorResult] = await connection.execute(
      `INSERT INTO doctors (user_id, department_id, room_id, experience_years, bio, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        department_id,
        room_id || null,
        experience_years || 0,
        bio || null,
        is_active,
      ]
    );

    await connection.commit();

    // Lấy lại thông tin vừa tạo
    const [newDoctors] = await connection.execute(
      `
      SELECT 
        d.id as doctor_id,
        d.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        d.department_id,
        dept.name as department_name,
        d.room_id,
        r.room_code,
        r.room_name,
        d.experience_years,
        d.rating_avg,
        d.bio,
        d.is_active,
        d.created_at,
        d.updated_at
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      INNER JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.id = ?
    `,
      [doctorResult.insertId]
    );

    const doctor = newDoctors[0];
    const formattedDoctor = {
      id: doctor.doctor_id,
      user_id: doctor.user_id,
      full_name: doctor.full_name,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      date_of_birth: doctor.date_of_birth,
      department: {
        id: doctor.department_id,
        name: doctor.department_name,
      },
      room: doctor.room_id
        ? {
            id: doctor.room_id,
            room_code: doctor.room_code,
            room_name: doctor.room_name,
          }
        : null,
      experience_years: doctor.experience_years,
      rating_avg: doctor.rating_avg ? parseFloat(doctor.rating_avg) : 0,
      bio: doctor.bio,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
    };

    res.status(201).json({
      success: true,
      message: 'Tạo bác sĩ thành công',
      data: formattedDoctor,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật thông tin bác sĩ
 * PUT /admin/doctors/:id
 */
const updateDoctor = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { department_id, room_id, experience_years, bio, is_active } = req.body;

    // Kiểm tra bác sĩ có tồn tại không
    const [existing] = await pool.execute(
      'SELECT id, department_id, room_id FROM doctors WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại',
      });
    }

    // Validate
    if (experience_years !== undefined && experience_years < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số năm kinh nghiệm phải >= 0',
      });
    }

    // Kiểm tra department nếu có thay đổi
    if (department_id !== undefined) {
      const [departments] = await pool.execute(
        'SELECT id, is_active FROM departments WHERE id = ?',
        [department_id]
      );

      if (departments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chuyên khoa không tồn tại',
        });
      }

      if (!departments[0].is_active) {
        return res.status(400).json({
          success: false,
          message: 'Không thể chuyển bác sĩ sang chuyên khoa đang ngừng hoạt động',
        });
      }
    }

    // Kiểm tra room nếu có thay đổi
    if (room_id !== undefined) {
      const finalDepartmentId = department_id || existing[0].department_id;

      if (room_id) {
        const [rooms] = await pool.execute(
          'SELECT id, department_id, is_active FROM rooms WHERE id = ?',
          [room_id]
        );

        if (rooms.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Phòng khám không tồn tại',
          });
        }

        if (!rooms[0].is_active) {
          return res.status(400).json({
            success: false,
            message: 'Không thể gán bác sĩ vào phòng khám đang ngừng hoạt động',
          });
        }

        // Kiểm tra room có thuộc department không
        if (rooms[0].department_id !== parseInt(finalDepartmentId)) {
          return res.status(400).json({
            success: false,
            message: 'Phòng khám không thuộc chuyên khoa đã chọn',
          });
        }
      }
    }

    // Cập nhật dữ liệu
    const updateFields = [];
    const updateValues = [];

    if (department_id !== undefined) {
      updateFields.push('department_id = ?');
      updateValues.push(department_id);
    }
    if (room_id !== undefined) {
      updateFields.push('room_id = ?');
      updateValues.push(room_id || null);
    }
    if (experience_years !== undefined) {
      updateFields.push('experience_years = ?');
      updateValues.push(experience_years);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio || null);
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
      `UPDATE doctors SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      `
      SELECT 
        d.id as doctor_id,
        d.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        d.department_id,
        dept.name as department_name,
        d.room_id,
        r.room_code,
        r.room_name,
        d.experience_years,
        d.rating_avg,
        d.bio,
        d.is_active,
        d.created_at,
        d.updated_at
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      INNER JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.id = ?
    `,
      [id]
    );

    const doctor = updated[0];
    const formattedDoctor = {
      id: doctor.doctor_id,
      user_id: doctor.user_id,
      full_name: doctor.full_name,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      date_of_birth: doctor.date_of_birth,
      department: {
        id: doctor.department_id,
        name: doctor.department_name,
      },
      room: doctor.room_id
        ? {
            id: doctor.room_id,
            room_code: doctor.room_code,
            room_name: doctor.room_name,
          }
        : null,
      experience_years: doctor.experience_years,
      rating_avg: doctor.rating_avg ? parseFloat(doctor.rating_avg) : 0,
      bio: doctor.bio,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
    };

    res.json({
      success: true,
      message: 'Cập nhật bác sĩ thành công',
      data: formattedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật trạng thái bác sĩ (ngừng/kích hoạt)
 * PATCH /admin/doctors/:id/status
 */
const updateDoctorStatus = async (req, res, next) => {
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

    // Kiểm tra bác sĩ có tồn tại không
    const [existing] = await pool.execute('SELECT id FROM doctors WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bác sĩ không tồn tại',
      });
    }

    // Cập nhật trạng thái
    await pool.execute(
      'UPDATE doctors SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active, id]
    );

    // Lấy lại thông tin đã cập nhật
    const [updated] = await pool.execute(
      `
      SELECT 
        d.id as doctor_id,
        d.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.date_of_birth,
        d.department_id,
        dept.name as department_name,
        d.room_id,
        r.room_code,
        r.room_name,
        d.experience_years,
        d.rating_avg,
        d.bio,
        d.is_active,
        d.created_at,
        d.updated_at
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      INNER JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.id = ?
    `,
      [id]
    );

    const doctor = updated[0];
    const formattedDoctor = {
      id: doctor.doctor_id,
      user_id: doctor.user_id,
      full_name: doctor.full_name,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      date_of_birth: doctor.date_of_birth,
      department: {
        id: doctor.department_id,
        name: doctor.department_name,
      },
      room: doctor.room_id
        ? {
            id: doctor.room_id,
            room_code: doctor.room_code,
            room_name: doctor.room_name,
          }
        : null,
      experience_years: doctor.experience_years,
      rating_avg: doctor.rating_avg ? parseFloat(doctor.rating_avg) : 0,
      bio: doctor.bio,
      is_active: doctor.is_active,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
    };

    res.json({
      success: true,
      message: is_active ? 'Kích hoạt bác sĩ thành công' : 'Ngừng hoạt động bác sĩ thành công',
      data: formattedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
};

