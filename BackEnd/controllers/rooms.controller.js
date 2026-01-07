const { getPool } = require('../config/database');

/**
 * Lấy danh sách phòng khám
 * GET /admin/rooms
 */
const getRooms = async (req, res, next) => {
  try {
    const pool = getPool();
    const { department_id, is_active, search, limit = 1000 } = req.query;

    let query = `
      SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.department_id,
        d.name as department_name,
        r.is_active,
        r.created_at
      FROM rooms r
      INNER JOIN departments d ON r.department_id = d.id
      WHERE 1=1
    `;
    let params = [];

    // Filter theo department
    if (department_id) {
      query += ' AND r.department_id = ?';
      params.push(parseInt(department_id));
    }

    // Filter theo status
    if (is_active !== undefined && is_active !== '') {
      const isActive = is_active === 'true' || is_active === true;
      query += ' AND r.is_active = ?';
      params.push(isActive);
    }

    // Search theo room_code hoặc room_name
    if (search) {
      query += ' AND (r.room_code LIKE ? OR r.room_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY r.room_code ASC LIMIT ?';
    params.push(parseInt(limit));

    const [rooms] = await pool.execute(query, params);

    // Format dữ liệu trả về
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      room_code: room.room_code,
      room_name: room.room_name,
      department: {
        id: room.department_id,
        name: room.department_name,
      },
      is_active: room.is_active,
      created_at: room.created_at,
    }));

    res.json({
      success: true,
      data: formattedRooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin một phòng khám
 * GET /admin/rooms/:id
 */
const getRoomById = async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [rooms] = await pool.execute(
      `
      SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.department_id,
        d.name as department_name,
        r.is_active,
        r.created_at
      FROM rooms r
      INNER JOIN departments d ON r.department_id = d.id
      WHERE r.id = ?
    `,
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phòng khám không tồn tại',
      });
    }

    const room = rooms[0];
    const formattedRoom = {
      id: room.id,
      room_code: room.room_code,
      room_name: room.room_name,
      department: {
        id: room.department_id,
        name: room.department_name,
      },
      is_active: room.is_active,
      created_at: room.created_at,
    };

    res.json({
      success: true,
      data: formattedRoom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo phòng khám mới
 * POST /admin/rooms
 */
const createRoom = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { room_code, room_name, department_id, is_active = true } = req.body;

    // Validate room_code
    if (!room_code || !room_code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng không được để trống',
      });
    }

    const normalizedRoomCode = room_code.trim().toUpperCase();

    if (normalizedRoomCode.length < 2 || normalizedRoomCode.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng phải từ 2 đến 50 ký tự',
      });
    }

    // Validate department_id
    if (!department_id) {
      return res.status(400).json({
        success: false,
        message: 'Chuyên khoa không được để trống',
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
        message: 'Không thể tạo phòng khám thuộc chuyên khoa đang ngừng hoạt động',
      });
    }

    // Kiểm tra room_code đã tồn tại chưa (case-insensitive)
    const [existingRooms] = await connection.execute(
      'SELECT id FROM rooms WHERE UPPER(room_code) = ?',
      [normalizedRoomCode]
    );

    if (existingRooms.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Mã phòng đã tồn tại',
      });
    }

    // Tạo phòng khám mới
    const [result] = await connection.execute(
      'INSERT INTO rooms (room_code, room_name, department_id, is_active) VALUES (?, ?, ?, ?)',
      [normalizedRoomCode, room_name?.trim() || null, department_id, is_active]
    );

    await connection.commit();

    // Lấy thông tin phòng vừa tạo
    const [newRooms] = await connection.execute(
      `
      SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.department_id,
        d.name as department_name,
        r.is_active,
        r.created_at
      FROM rooms r
      INNER JOIN departments d ON r.department_id = d.id
      WHERE r.id = ?
    `,
      [result.insertId]
    );

    const newRoom = newRooms[0];
    const formattedRoom = {
      id: newRoom.id,
      room_code: newRoom.room_code,
      room_name: newRoom.room_name,
      department: {
        id: newRoom.department_id,
        name: newRoom.department_name,
      },
      is_active: newRoom.is_active,
      created_at: newRoom.created_at,
    };

    res.status(201).json({
      success: true,
      message: 'Tạo phòng khám thành công',
      data: formattedRoom,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật phòng khám
 * PUT /admin/rooms/:id
 */
const updateRoom = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { room_name, department_id, is_active } = req.body;

    // Kiểm tra phòng tồn tại
    const [existingRooms] = await connection.execute(
      'SELECT id, room_code, department_id FROM rooms WHERE id = ?',
      [id]
    );

    if (existingRooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phòng khám không tồn tại',
      });
    }

    const existingRoom = existingRooms[0];

    // Kiểm tra nếu đổi department và phòng đã có bác sĩ
    if (department_id && department_id !== existingRoom.department_id) {
      const [doctors] = await connection.execute(
        'SELECT id FROM doctors WHERE room_id = ?',
        [id]
      );

      if (doctors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đổi chuyên khoa vì phòng đã có bác sĩ được gán',
        });
      }

      // Kiểm tra department mới tồn tại và active
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
          message: 'Không thể đổi sang chuyên khoa đang ngừng hoạt động',
        });
      }
    }

    // Cập nhật thông tin
    const updateFields = [];
    const updateValues = [];

    if (room_name !== undefined) {
      updateFields.push('room_name = ?');
      updateValues.push(room_name?.trim() || null);
    }

    if (department_id !== undefined) {
      updateFields.push('department_id = ?');
      updateValues.push(department_id);
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

    await connection.execute(
      `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    await connection.commit();

    // Lấy thông tin phòng đã cập nhật
    const [updatedRooms] = await connection.execute(
      `
      SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.department_id,
        d.name as department_name,
        r.is_active,
        r.created_at
      FROM rooms r
      INNER JOIN departments d ON r.department_id = d.id
      WHERE r.id = ?
    `,
      [id]
    );

    const updatedRoom = updatedRooms[0];
    const formattedRoom = {
      id: updatedRoom.id,
      room_code: updatedRoom.room_code,
      room_name: updatedRoom.room_name,
      department: {
        id: updatedRoom.department_id,
        name: updatedRoom.department_name,
      },
      is_active: updatedRoom.is_active,
      created_at: updatedRoom.created_at,
    };

    res.json({
      success: true,
      message: 'Cập nhật phòng khám thành công',
      data: formattedRoom,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Cập nhật trạng thái phòng khám
 * PATCH /admin/rooms/:id/status
 */
const toggleRoomStatus = async (req, res, next) => {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không được để trống',
      });
    }

    // Kiểm tra phòng tồn tại
    const [existingRooms] = await connection.execute(
      'SELECT id FROM rooms WHERE id = ?',
      [id]
    );

    if (existingRooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phòng khám không tồn tại',
      });
    }

    // Cập nhật trạng thái
    await connection.execute('UPDATE rooms SET is_active = ? WHERE id = ?', [
      is_active,
      id,
    ]);

    await connection.commit();

    // Lấy thông tin phòng đã cập nhật
    const [updatedRooms] = await connection.execute(
      `
      SELECT 
        r.id,
        r.room_code,
        r.room_name,
        r.department_id,
        d.name as department_name,
        r.is_active,
        r.created_at
      FROM rooms r
      INNER JOIN departments d ON r.department_id = d.id
      WHERE r.id = ?
    `,
      [id]
    );

    const updatedRoom = updatedRooms[0];
    const formattedRoom = {
      id: updatedRoom.id,
      room_code: updatedRoom.room_code,
      room_name: updatedRoom.room_name,
      department: {
        id: updatedRoom.department_id,
        name: updatedRoom.department_name,
      },
      is_active: updatedRoom.is_active,
      created_at: updatedRoom.created_at,
    };

    res.json({
      success: true,
      message: is_active
        ? 'Kích hoạt phòng khám thành công'
        : 'Ngừng sử dụng phòng khám thành công',
      data: formattedRoom,
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  toggleRoomStatus,
};

