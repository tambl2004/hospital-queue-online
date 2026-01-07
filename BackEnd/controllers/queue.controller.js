const { getPool } = require('../config/database');

/**
 * QUEUE CONTROLLER
 * Quản lý hàng đợi & gọi số realtime
 * 
 * Status trong queue:
 * - WAITING: chờ gọi
 * - CALLED: đã gọi nhưng chưa khám
 * - IN_PROGRESS: đang khám
 * - DONE: xong
 * - SKIPPED: bỏ qua
 * - CANCELLED: huỷ (loại khỏi queue)
 */

/**
 * Lấy trạng thái queue theo doctor + date
 * GET /api/queue/state
 */
exports.getQueueState = async (req, res, next) => {
  try {
    const pool = getPool();
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'doctor_id và date là bắt buộc'
      });
    }

    // Kiểm tra quyền: DOCTOR chỉ được xem queue của chính mình
    const userRoles = req.user.roles || [];
    const isDoctor = userRoles.includes('DOCTOR');
    const isAdminOrStaff = userRoles.some(role => ['ADMIN', 'STAFF'].includes(role));

    if (isDoctor && !isAdminOrStaff) {
      // DOCTOR chỉ được xem queue của chính mình
      const [doctors] = await pool.execute(
        'SELECT id FROM doctors WHERE user_id = ? AND id = ?',
        [req.user.id, doctor_id]
      );

      if (doctors.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập queue này'
        });
      }
    }

    // Query tất cả appointments của doctor + date có queue_number
    const query = `
      SELECT 
        a.id as appointment_id,
        a.status,
        qn.queue_number,
        p.full_name as patient_name,
        p.phone as patient_phone,
        a.appointment_time,
        a.created_at
      FROM appointments a
      JOIN queue_numbers qn ON a.id = qn.appointment_id
      JOIN users p ON a.patient_id = p.id
      WHERE qn.doctor_id = ? 
        AND qn.queue_date = ?
        AND a.status != 'CANCELLED'
      ORDER BY qn.queue_number ASC
    `;

    const [appointments] = await pool.execute(query, [doctor_id, date]);

    // Phân loại appointments theo status
    const waitingList = [];
    const calledList = [];
    let inProgress = null;
    let current = null;
    let next = null;
    let doneCount = 0;

    for (const apt of appointments) {
      const item = {
        appointmentId: apt.appointment_id,
        queueNumber: apt.queue_number,
        patientName: apt.patient_name,
        patientPhone: apt.patient_phone,
        appointmentTime: apt.appointment_time,
        status: apt.status
      };

      switch (apt.status) {
        case 'WAITING':
          waitingList.push(item);
          if (!next) {
            next = item;
          }
          break;
        case 'CALLED':
          calledList.push(item);
          if (!current && !inProgress) {
            // Nếu chưa có IN_PROGRESS, lấy CALLED nhỏ nhất làm current
            if (!current || apt.queue_number < current.queueNumber) {
              current = item;
            }
          }
          break;
        case 'IN_PROGRESS':
          inProgress = item;
          current = item; // IN_PROGRESS luôn là current
          break;
        case 'DONE':
          doneCount++;
          break;
        case 'SKIPPED':
          // SKIPPED không vào danh sách chờ, nhưng có thể gọi lại
          calledList.push(item);
          break;
      }
    }

    // Nếu có IN_PROGRESS thì current = IN_PROGRESS
    // Nếu không, current = CALLED nhỏ nhất
    if (!current && calledList.length > 0) {
      calledList.sort((a, b) => a.queueNumber - b.queueNumber);
      current = calledList[0];
    }

    // next = WAITING nhỏ nhất
    if (waitingList.length > 0) {
      waitingList.sort((a, b) => a.queueNumber - b.queueNumber);
      next = waitingList[0];
    }

    const queueState = {
      context: {
        doctorId: parseInt(doctor_id),
        date: date
      },
      current: current,
      next: next,
      waitingList: waitingList,
      calledList: calledList,
      inProgress: inProgress,
      doneCount: doneCount,
      waitingCount: waitingList.length
    };

    res.json({
      success: true,
      data: queueState
    });

  } catch (error) {
    console.error('Error getting queue state:', error);
    next(error);
  }
};

/**
 * Gọi số tiếp theo (WAITING → CALLED)
 * POST /api/queue/call-next
 */
exports.callNext = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { doctor_id, date } = req.body;

    if (!doctor_id || !date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'doctor_id và date là bắt buộc'
      });
    }

    // Tìm appointment WAITING có queue_number nhỏ nhất (atomic với lock)
    const [nextApts] = await connection.execute(
      `SELECT a.id, a.status, qn.queue_number
       FROM appointments a
       JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE qn.doctor_id = ?
         AND qn.queue_date = ?
         AND a.status = 'WAITING'
       ORDER BY qn.queue_number ASC
       LIMIT 1
       FOR UPDATE`,
      [doctor_id, date]
    );

    if (nextApts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không còn số nào để gọi'
      });
    }

    const appointmentId = nextApts[0].id;

    // Update status: WAITING → CALLED
    await connection.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CALLED', appointmentId]
    );

    await connection.commit();

    // Lấy lại queue state để emit
    const io = req.app.get('io');
    const queueState = await getQueueStateInternal(pool, doctor_id, date);

    // Emit realtime update
    if (io) {
      const roomKey = `queue:${doctor_id}:${date}`;
      io.to(roomKey).emit('queue:updated', queueState);
    }

    res.json({
      success: true,
      message: 'Đã gọi số tiếp theo',
      data: queueState
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error calling next:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Bắt đầu khám (CALLED → IN_PROGRESS)
 * POST /api/queue/start
 */
exports.startAppointment = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { appointment_id, doctor_id, date } = req.body;

    if (!appointment_id || !doctor_id || !date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'appointment_id, doctor_id và date là bắt buộc'
      });
    }

    // Kiểm tra appointment có tồn tại và status = CALLED
    const [apts] = await connection.execute(
      `SELECT a.id, a.status, qn.doctor_id, qn.queue_date
       FROM appointments a
       JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE a.id = ? AND qn.doctor_id = ? AND qn.queue_date = ?
       FOR UPDATE`,
      [appointment_id, doctor_id, date]
    );

    if (apts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy appointment'
      });
    }

    const apt = apts[0];
    if (apt.status !== 'CALLED' && apt.status !== 'SKIPPED') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể bắt đầu khám. Trạng thái hiện tại: ${apt.status}`
      });
    }

    // Kiểm tra xem đã có appointment IN_PROGRESS chưa
    const [inProgressApts] = await connection.execute(
      `SELECT a.id
       FROM appointments a
       JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE qn.doctor_id = ? 
         AND qn.queue_date = ?
         AND a.status = 'IN_PROGRESS'`,
      [doctor_id, date]
    );

    if (inProgressApts.length > 0 && inProgressApts[0].id !== appointment_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đã có một cuộc khám đang diễn ra. Vui lòng kết thúc trước khi bắt đầu khám mới.'
      });
    }

    // Update status: CALLED/SKIPPED → IN_PROGRESS
    await connection.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['IN_PROGRESS', appointment_id]
    );

    await connection.commit();

    // Lấy lại queue state
    const queueState = await getQueueStateInternal(pool, doctor_id, date);

    // Emit realtime update
    const io = req.app.get('io');
    if (io) {
      const roomKey = `queue:${doctor_id}:${date}`;
      io.to(roomKey).emit('queue:updated', queueState);
    }

    res.json({
      success: true,
      message: 'Đã bắt đầu khám',
      data: queueState
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error starting appointment:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Kết thúc khám (IN_PROGRESS → DONE)
 * POST /api/queue/finish
 */
exports.finishAppointment = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { appointment_id, doctor_id, date } = req.body;

    if (!appointment_id || !doctor_id || !date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'appointment_id, doctor_id và date là bắt buộc'
      });
    }

    // Kiểm tra appointment có status = IN_PROGRESS
    const [apts] = await connection.execute(
      `SELECT a.id, a.status
       FROM appointments a
       JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE a.id = ? AND qn.doctor_id = ? AND qn.queue_date = ?
       FOR UPDATE`,
      [appointment_id, doctor_id, date]
    );

    if (apts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy appointment'
      });
    }

    if (apts[0].status !== 'IN_PROGRESS') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể kết thúc khám. Trạng thái hiện tại: ${apts[0].status}`
      });
    }

    // Update status: IN_PROGRESS → DONE
    await connection.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['DONE', appointment_id]
    );

    await connection.commit();

    // Lấy lại queue state
    const queueState = await getQueueStateInternal(pool, doctor_id, date);

    // Emit realtime update
    const io = req.app.get('io');
    if (io) {
      const roomKey = `queue:${doctor_id}:${date}`;
      io.to(roomKey).emit('queue:updated', queueState);
    }

    res.json({
      success: true,
      message: 'Đã kết thúc khám',
      data: queueState
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error finishing appointment:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Bỏ qua số (CALLED → SKIPPED)
 * POST /api/queue/skip
 */
exports.skipAppointment = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { appointment_id, doctor_id, date, reason } = req.body;

    if (!appointment_id || !doctor_id || !date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'appointment_id, doctor_id và date là bắt buộc'
      });
    }

    // Kiểm tra appointment có status = CALLED
    const [apts] = await connection.execute(
      `SELECT a.id, a.status
       FROM appointments a
       JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE a.id = ? AND qn.doctor_id = ? AND qn.queue_date = ?
       FOR UPDATE`,
      [appointment_id, doctor_id, date]
    );

    if (apts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy appointment'
      });
    }

    if (apts[0].status !== 'CALLED') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể bỏ qua. Trạng thái hiện tại: ${apts[0].status}`
      });
    }

    // Update status: CALLED → SKIPPED
    await connection.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['SKIPPED', appointment_id]
    );

    await connection.commit();

    // Lấy lại queue state
    const queueState = await getQueueStateInternal(pool, doctor_id, date);

    // Emit realtime update
    const io = req.app.get('io');
    if (io) {
      const roomKey = `queue:${doctor_id}:${date}`;
      io.to(roomKey).emit('queue:updated', queueState);
    }

    res.json({
      success: true,
      message: 'Đã bỏ qua số',
      data: queueState
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error skipping appointment:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Gọi lại số (SKIPPED → CALLED)
 * POST /api/queue/recall
 */
exports.recallAppointment = async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { appointment_id, doctor_id, date } = req.body;

    if (!appointment_id || !doctor_id || !date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'appointment_id, doctor_id và date là bắt buộc'
      });
    }

    // Kiểm tra appointment có status = SKIPPED
    const [apts] = await connection.execute(
      `SELECT a.id, a.status
       FROM appointments a
       JOIN queue_numbers qn ON a.id = qn.appointment_id
       WHERE a.id = ? AND qn.doctor_id = ? AND qn.queue_date = ?
       FOR UPDATE`,
      [appointment_id, doctor_id, date]
    );

    if (apts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy appointment'
      });
    }

    if (apts[0].status !== 'SKIPPED') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể gọi lại. Trạng thái hiện tại: ${apts[0].status}`
      });
    }

    // Update status: SKIPPED → CALLED
    await connection.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CALLED', appointment_id]
    );

    await connection.commit();

    // Lấy lại queue state
    const queueState = await getQueueStateInternal(pool, doctor_id, date);

    // Emit realtime update
    const io = req.app.get('io');
    if (io) {
      const roomKey = `queue:${doctor_id}:${date}`;
      io.to(roomKey).emit('queue:updated', queueState);
    }

    res.json({
      success: true,
      message: 'Đã gọi lại số',
      data: queueState
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error recalling appointment:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Helper function: Lấy queue state (dùng chung cho controller và socket)
 */
async function getQueueStateInternal(pool, doctor_id, date) {
  const query = `
    SELECT 
      a.id as appointment_id,
      a.status,
      qn.queue_number,
      p.full_name as patient_name,
      p.phone as patient_phone,
      a.appointment_time,
      a.created_at
    FROM appointments a
    JOIN queue_numbers qn ON a.id = qn.appointment_id
    JOIN users p ON a.patient_id = p.id
    WHERE qn.doctor_id = ? 
      AND qn.queue_date = ?
      AND a.status != 'CANCELLED'
    ORDER BY qn.queue_number ASC
  `;

  const [appointments] = await pool.execute(query, [doctor_id, date]);

  const waitingList = [];
  const calledList = [];
  let inProgress = null;
  let current = null;
  let next = null;
  let doneCount = 0;

  for (const apt of appointments) {
    const item = {
      appointmentId: apt.appointment_id,
      queueNumber: apt.queue_number,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
      appointmentTime: apt.appointment_time,
      status: apt.status
    };

    switch (apt.status) {
      case 'WAITING':
        waitingList.push(item);
        if (!next) {
          next = item;
        }
        break;
      case 'CALLED':
        calledList.push(item);
        if (!current && !inProgress) {
          if (!current || apt.queue_number < current.queueNumber) {
            current = item;
          }
        }
        break;
      case 'IN_PROGRESS':
        inProgress = item;
        current = item;
        break;
      case 'DONE':
        doneCount++;
        break;
      case 'SKIPPED':
        calledList.push(item);
        break;
    }
  }

  if (!current && calledList.length > 0) {
    calledList.sort((a, b) => a.queueNumber - b.queueNumber);
    current = calledList[0];
  }

  if (waitingList.length > 0) {
    waitingList.sort((a, b) => a.queueNumber - b.queueNumber);
    next = waitingList[0];
  }

  return {
    context: {
      doctorId: parseInt(doctor_id),
      date: date
    },
    current: current,
    next: next,
    waitingList: waitingList,
    calledList: calledList,
    inProgress: inProgress,
    doneCount: doneCount,
    waitingCount: waitingList.length
  };
}

// Export helper để dùng trong socket handler
exports.getQueueStateInternal = getQueueStateInternal;

