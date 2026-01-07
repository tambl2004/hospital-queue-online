-- ============================================
-- DATABASE SCHEMA FOR BENHVIEN SYSTEM
-- MySQL Database Schema
-- ============================================



-- ============================================
-- 1. Bảng roles - Quản lý các loại user
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL COMMENT 'ADMIN, STAFF, PATIENT, DOCTOR',
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Bảng users - Lưu tất cả tài khoản người dùng
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(20),
  gender VARCHAR(10) COMMENT 'MALE, FEMALE, OTHER',
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Bảng user_roles - Gán role cho user
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Bảng departments - Chuyên khoa khám bệnh
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Bảng rooms - Phòng khám
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(50) UNIQUE NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  INDEX idx_room_code (room_code),
  INDEX idx_department_id (department_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. Bảng doctors - Thông tin bác sĩ
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  department_id INT NOT NULL,
  room_id INT,
  experience_years INT DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 0.00 COMMENT '0.00 to 5.00',
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_department_id (department_id),
  INDEX idx_room_id (room_id),
  INDEX idx_is_active (is_active),
  INDEX idx_rating_avg (rating_avg)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. Bảng doctor_schedules - Lịch làm việc của bác sĩ
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_patients INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_work_date (work_date),
  INDEX idx_doctor_date (doctor_id, work_date),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_schedule (doctor_id, work_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. Bảng appointments - Lượt đăng ký khám
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  department_id INT NOT NULL,
  room_id INT,
  schedule_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING' COMMENT 'WAITING, CALLED, IN_PROGRESS, DONE, CANCELLED, SKIPPED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(id) ON DELETE RESTRICT,
  INDEX idx_patient_id (patient_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_department_id (department_id),
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_status (status),
  INDEX idx_doctor_date (doctor_id, appointment_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. Bảng queue_numbers - Quản lý số thứ tự
-- ============================================
CREATE TABLE IF NOT EXISTS queue_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT UNIQUE NOT NULL,
  doctor_id INT NOT NULL,
  queue_date DATE NOT NULL,
  queue_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  INDEX idx_appointment_id (appointment_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_queue_date (queue_date),
  INDEX idx_doctor_date (doctor_id, queue_date),
  INDEX idx_queue_number (queue_number),
  UNIQUE KEY unique_queue (doctor_id, queue_date, queue_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. Bảng ratings - Đánh giá bác sĩ
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT UNIQUE NOT NULL,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_appointment_id (appointment_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGERS & STORED PROCEDURES
-- ============================================

-- Trigger: Cập nhật rating_avg của doctor sau khi có rating mới
DELIMITER //
CREATE TRIGGER update_doctor_rating_avg
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
  UPDATE doctors
  SET rating_avg = (
    SELECT AVG(rating)
    FROM ratings
    WHERE doctor_id = NEW.doctor_id
  )
  WHERE id = NEW.doctor_id;
END//
DELIMITER ;

-- Trigger: Cập nhật rating_avg khi rating được cập nhật
DELIMITER //
CREATE TRIGGER update_doctor_rating_avg_on_update
AFTER UPDATE ON ratings
FOR EACH ROW
BEGIN
  UPDATE doctors
  SET rating_avg = (
    SELECT AVG(rating)
    FROM ratings
    WHERE doctor_id = NEW.doctor_id
  )
  WHERE id = NEW.doctor_id;
END//
DELIMITER ;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (code, name) VALUES
('ADMIN', 'Quản trị viên'),
('STAFF', 'Nhân viên'),
('DOCTOR', 'Bác sĩ'),
('PATIENT', 'Bệnh nhân')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- VIEWS (Optional - for easier queries)
-- ============================================

-- View: Thông tin bác sĩ đầy đủ
CREATE OR REPLACE VIEW v_doctors_info AS
SELECT 
  d.id,
  d.user_id,
  u.full_name,
  u.email,
  u.phone,
  u.gender,
  d.department_id,
  dept.name AS department_name,
  d.room_id,
  r.room_name,
  d.experience_years,
  d.rating_avg,
  d.bio,
  d.is_active,
  d.created_at
FROM doctors d
INNER JOIN users u ON d.user_id = u.id
INNER JOIN departments dept ON d.department_id = dept.id
LEFT JOIN rooms r ON d.room_id = r.id;

-- View: Thông tin appointment đầy đủ
CREATE OR REPLACE VIEW v_appointments_detail AS
SELECT 
  a.id,
  a.patient_id,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  a.doctor_id,
  d.user_id AS doctor_user_id,
  doc_info.full_name AS doctor_name,
  a.department_id,
  doc_info.department_name,
  a.room_id,
  doc_info.room_name,
  a.schedule_id,
  ds.work_date,
  ds.start_time,
  ds.end_time,
  a.appointment_date,
  a.appointment_time,
  a.status,
  qn.queue_number,
  a.created_at,
  a.updated_at
FROM appointments a
INNER JOIN users p ON a.patient_id = p.id
INNER JOIN doctors d ON a.doctor_id = d.id
INNER JOIN v_doctors_info doc_info ON d.id = doc_info.id
INNER JOIN doctor_schedules ds ON a.schedule_id = ds.id
LEFT JOIN queue_numbers qn ON a.id = qn.appointment_id;

-- ============================================
-- END OF SCHEMA
-- ============================================

