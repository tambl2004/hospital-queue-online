-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 03, 2026 at 02:34 PM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `benhvien`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `schedule_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WAITING' COMMENT 'WAITING, CALLED, IN_PROGRESS, DONE, CANCELLED, SKIPPED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `department_id`, `room_id`, `schedule_id`, `appointment_date`, `appointment_time`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 1, 1, 13, '2026-01-08', '08:00:00', 'DONE', '2026-01-08 08:33:13', '2026-01-08 08:56:49'),
(2, 3, 1, 1, 1, 14, '2026-01-08', '08:15:00', 'DONE', '2026-01-08 09:00:29', '2026-01-08 09:21:20'),
(3, 3, 1, 1, 1, 15, '2026-01-08', '08:30:00', 'DONE', '2026-01-08 09:26:35', '2026-01-08 09:32:26'),
(4, 3, 1, 1, 1, 16, '2026-01-08', '08:45:00', 'DONE', '2026-01-08 13:05:56', '2026-01-08 13:06:34'),
(5, 3, 1, 1, 1, 45, '2026-01-28', '08:00:00', 'DONE', '2026-01-28 16:08:16', '2026-01-28 16:22:37'),
(6, 3, 1, 1, 1, 45, '2026-01-28', '08:00:00', 'DONE', '2026-01-28 16:23:11', '2026-01-28 16:30:30'),
(7, 3, 1, 1, 1, 46, '2026-01-28', '13:30:00', 'DONE', '2026-01-28 16:34:42', '2026-01-28 16:38:08'),
(8, 3, 1, 1, 1, 45, '2026-01-28', '08:00:00', 'DONE', '2026-01-28 16:39:29', '2026-01-28 16:49:04'),
(9, 3, 1, 1, 1, 45, '2026-01-28', '08:00:00', 'DONE', '2026-01-28 16:50:36', '2026-01-28 17:01:35'),
(10, 3, 1, 1, 1, 45, '2026-01-28', '08:00:00', 'DONE', '2026-01-28 17:18:17', '2026-01-28 17:18:54');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Tai Mũi Họng', 'Khám và điều trị các bệnh về tai, mũi, họng', 1, '2026-01-07 16:47:32', '2026-01-07 17:11:03');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `experience_years` int(11) DEFAULT '0',
  `rating_avg` decimal(3,2) DEFAULT '0.00' COMMENT '0.00 to 5.00',
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `department_id`, `room_id`, `experience_years`, `rating_avg`, `bio`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 10, 5.00, 'kinh nghiệm bốc phét', '/uploads/doctors/doctor_2_1769614660112.jpg', 1, '2026-01-07 17:38:54', '2026-01-28 15:37:40');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_schedules`
--

CREATE TABLE `doctor_schedules` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_patients` int(11) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctor_schedules`
--

INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `work_date`, `start_time`, `end_time`, `max_patients`, `is_active`, `created_at`) VALUES
(13, 1, '2026-01-08', '08:00:00', '08:15:00', 1, 1, '2026-01-08 08:29:52'),
(14, 1, '2026-01-08', '08:15:00', '08:30:00', 1, 1, '2026-01-08 08:29:52'),
(15, 1, '2026-01-08', '08:30:00', '08:45:00', 1, 1, '2026-01-08 08:29:52'),
(16, 1, '2026-01-08', '08:45:00', '09:00:00', 1, 1, '2026-01-08 08:29:52'),
(17, 1, '2026-01-08', '09:00:00', '09:15:00', 1, 1, '2026-01-08 08:29:52'),
(18, 1, '2026-01-08', '09:15:00', '09:30:00', 1, 1, '2026-01-08 08:29:52'),
(19, 1, '2026-01-08', '09:30:00', '09:45:00', 1, 1, '2026-01-08 08:29:52'),
(20, 1, '2026-01-08', '09:45:00', '10:00:00', 1, 1, '2026-01-08 08:29:52'),
(21, 1, '2026-01-08', '10:00:00', '10:15:00', 1, 1, '2026-01-08 08:29:52'),
(22, 1, '2026-01-08', '10:15:00', '10:30:00', 1, 1, '2026-01-08 08:29:52'),
(23, 1, '2026-01-08', '10:30:00', '10:45:00', 1, 1, '2026-01-08 08:29:52'),
(24, 1, '2026-01-08', '10:45:00', '11:00:00', 1, 1, '2026-01-08 08:29:52'),
(25, 1, '2026-01-08', '11:00:00', '11:15:00', 1, 1, '2026-01-08 08:29:52'),
(26, 1, '2026-01-08', '11:15:00', '11:30:00', 1, 1, '2026-01-08 08:29:52'),
(27, 1, '2026-01-08', '11:30:00', '11:45:00', 1, 1, '2026-01-08 08:29:52'),
(28, 1, '2026-01-08', '11:45:00', '12:00:00', 1, 1, '2026-01-08 08:29:52'),
(45, 1, '2026-01-28', '08:00:00', '12:00:00', 10, 1, '2026-01-28 15:18:28'),
(46, 1, '2026-01-28', '13:30:00', '17:30:00', 20, 1, '2026-01-28 15:25:52');

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` int(11) NOT NULL,
  `question` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Câu hỏi',
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Câu trả lời',
  `display_order` int(11) DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '1: Hiển thị, 0: Ẩn',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Làm thế nào để đặt lịch khám bệnh online?', 'Bạn có thể đặt lịch khám bệnh online bằng cách:\n1. Đăng ký tài khoản trên hệ thống\n2. Chọn chuyên khoa và bác sĩ\n3. Chọn thời gian phù hợp\n4. Xác nhận đặt lịch và nhận số thứ tự', 1, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(2, 'Tôi có thể hủy lịch khám đã đặt không?', 'Có, bạn có thể hủy lịch khám đã đặt trong phần \"Lịch đã đặt\" của tài khoản. Vui lòng hủy trước ít nhất 2 giờ so với giờ hẹn để tránh ảnh hưởng đến lịch trình của bác sĩ.', 2, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(3, 'Làm sao để biết số thứ tự của tôi?', 'Sau khi đặt lịch thành công, bạn sẽ nhận được số thứ tự qua SMS và email. Bạn cũng có thể xem số thứ tự trong phần \"Theo dõi số thứ tự\" trên website.', 3, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(4, 'Tôi có thể đặt lịch cho người thân không?', 'Có, bạn có thể quản lý hồ sơ cho cả gia đình từ một tài khoản. Trong phần đặt lịch, bạn có thể chọn người khám là bạn hoặc thành viên trong gia đình.', 4, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(5, 'Hệ thống có tính phí đặt lịch không?', 'Không, việc đặt lịch khám bệnh online hoàn toàn miễn phí. Bạn chỉ cần thanh toán phí khám bệnh khi đến bệnh viện.', 5, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(6, 'Làm thế nào để thay đổi thông tin cá nhân?', 'Bạn có thể cập nhật thông tin cá nhân trong phần \"Hồ sơ cá nhân\" của tài khoản. Một số thông tin quan trọng có thể cần xác thực lại.', 6, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(7, 'Tôi quên mật khẩu thì làm sao?', 'Bạn có thể sử dụng chức năng \"Quên mật khẩu\" trên trang đăng nhập. Hệ thống sẽ gửi link đặt lại mật khẩu đến email của bạn.', 7, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10'),
(8, 'Thông tin của tôi có được bảo mật không?', 'Có, tất cả thông tin cá nhân và bệnh án của bạn đều được mã hóa và bảo mật tuyệt đối theo tiêu chuẩn quốc tế. Chúng tôi cam kết không chia sẻ thông tin của bạn cho bên thứ ba.', 8, 1, '2026-01-26 16:51:10', '2026-01-26 16:51:10');

-- --------------------------------------------------------

--
-- Table structure for table `queue_numbers`
--

CREATE TABLE `queue_numbers` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `queue_date` date NOT NULL,
  `queue_number` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `queue_numbers`
--

INSERT INTO `queue_numbers` (`id`, `appointment_id`, `doctor_id`, `queue_date`, `queue_number`, `created_at`) VALUES
(1, 1, 1, '2026-01-08', 1, '2026-01-08 08:33:13'),
(2, 2, 1, '2026-01-08', 2, '2026-01-08 09:00:29'),
(3, 3, 1, '2026-01-08', 3, '2026-01-08 09:26:35'),
(4, 4, 1, '2026-01-08', 4, '2026-01-08 13:05:56'),
(5, 5, 1, '2026-01-28', 1, '2026-01-28 16:08:16'),
(6, 6, 1, '2026-01-28', 2, '2026-01-28 16:23:11'),
(7, 7, 1, '2026-01-28', 3, '2026-01-28 16:34:42'),
(8, 8, 1, '2026-01-28', 4, '2026-01-28 16:39:29'),
(9, 9, 1, '2026-01-28', 5, '2026-01-28 16:50:36'),
(10, 10, 1, '2026-01-28', 6, '2026-01-28 17:18:17');

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`id`, `appointment_id`, `doctor_id`, `patient_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 3, 5, NULL, '2026-01-08 08:57:18'),
(2, 2, 1, 3, 5, NULL, '2026-01-08 09:21:47'),
(3, 4, 1, 3, 5, NULL, '2026-01-08 13:15:48');

--
-- Triggers `ratings`
--
DELIMITER $$
CREATE TRIGGER `update_doctor_rating_avg` AFTER INSERT ON `ratings` FOR EACH ROW BEGIN
  UPDATE doctors
  SET rating_avg = (
    SELECT AVG(rating)
    FROM ratings
    WHERE doctor_id = NEW.doctor_id
  )
  WHERE id = NEW.doctor_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_doctor_rating_avg_on_update` AFTER UPDATE ON `ratings` FOR EACH ROW BEGIN
  UPDATE doctors
  SET rating_avg = (
    SELECT AVG(rating)
    FROM ratings
    WHERE doctor_id = NEW.doctor_id
  )
  WHERE id = NEW.doctor_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ADMIN, STAFF, PATIENT, DOCTOR',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `code`, `name`, `created_at`) VALUES
(1, 'ADMIN', 'Quản trị viên', '2026-01-07 15:53:14'),
(3, 'DOCTOR', 'Bác sĩ', '2026-01-07 15:53:14'),
(4, 'PATIENT', 'Bệnh nhân', '2026-01-07 15:53:14');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `room_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `room_code`, `room_name`, `department_id`, `is_active`, `created_at`) VALUES
(1, 'PTMH1', 'Tai mũi họng 1', 1, 1, '2026-01-07 17:32:10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MALE, FEMALE, OTHER',
  `date_of_birth` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `phone`, `gender`, `date_of_birth`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@gmail.com', '$2a$12$qEbicBaKZ3gY9LyiDn/SD.tQ/TXUo3pLRtYTNFX.1CuvfVFVbbrIO', '0969859400', 'MALE', '2004-02-19', 1, '2026-01-07 16:08:55', '2026-01-07 16:08:55'),
(2, 'Bác sĩ Tâm', 'bacsi@gmail.com', '$2a$12$iwin9jtCaIuEj75GVFWA1.XVhl4butFrXjyQr09tPS70huFa/IubK', '0335974080', 'MALE', '2004-02-18', 1, '2026-01-07 17:38:54', '2026-01-07 18:02:58'),
(3, 'Tâm', 'tam@gmail.com', '$2a$12$oNx5x0Kh99zy0Vaj8oC0iOZyoTXKA/mgqUVpgN1wqgZLP3EwOt4Y2', '0335974080', 'MALE', '2004-02-17', 1, '2026-01-07 17:39:36', '2026-01-08 09:22:04');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 3),
(3, 4);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_appointments_detail`
-- (See below for the actual view)
--
CREATE TABLE `v_appointments_detail` (
`id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(150)
,`patient_phone` varchar(20)
,`doctor_id` int(11)
,`doctor_user_id` int(11)
,`doctor_name` varchar(150)
,`department_id` int(11)
,`department_name` varchar(100)
,`room_id` int(11)
,`room_name` varchar(100)
,`schedule_id` int(11)
,`work_date` date
,`start_time` time
,`end_time` time
,`appointment_date` date
,`appointment_time` time
,`status` varchar(30)
,`queue_number` int(11)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_doctors_info`
-- (See below for the actual view)
--
CREATE TABLE `v_doctors_info` (
`id` int(11)
,`user_id` int(11)
,`full_name` varchar(150)
,`email` varchar(150)
,`phone` varchar(20)
,`gender` varchar(10)
,`department_id` int(11)
,`department_name` varchar(100)
,`room_id` int(11)
,`room_name` varchar(100)
,`experience_years` int(11)
,`rating_avg` decimal(3,2)
,`bio` text
,`avatar_url` varchar(255)
,`is_active` tinyint(1)
,`created_at` timestamp
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_department_id` (`department_id`),
  ADD KEY `idx_schedule_id` (`schedule_id`),
  ADD KEY `idx_appointment_date` (`appointment_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_doctor_date` (`doctor_id`,`appointment_date`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_department_id` (`department_id`),
  ADD KEY `idx_room_id` (`room_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_rating_avg` (`rating_avg`);

--
-- Indexes for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_schedule` (`doctor_id`,`work_date`,`start_time`,`end_time`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_work_date` (`work_date`),
  ADD KEY `idx_doctor_date` (`doctor_id`,`work_date`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indexes for table `queue_numbers`
--
ALTER TABLE `queue_numbers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_id` (`appointment_id`),
  ADD UNIQUE KEY `unique_queue` (`doctor_id`,`queue_date`,`queue_number`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_queue_date` (`queue_date`),
  ADD KEY `idx_doctor_date` (`doctor_id`,`queue_date`),
  ADD KEY `idx_queue_number` (`queue_number`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_id` (`appointment_id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_code` (`room_code`),
  ADD KEY `idx_room_code` (`room_code`),
  ADD KEY `idx_department_id` (`department_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `queue_numbers`
--
ALTER TABLE `queue_numbers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------

--
-- Structure for view `v_appointments_detail`
--
DROP TABLE IF EXISTS `v_appointments_detail`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_appointments_detail`  AS SELECT `a`.`id` AS `id`, `a`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`phone` AS `patient_phone`, `a`.`doctor_id` AS `doctor_id`, `d`.`user_id` AS `doctor_user_id`, `doc_info`.`full_name` AS `doctor_name`, `a`.`department_id` AS `department_id`, `doc_info`.`department_name` AS `department_name`, `a`.`room_id` AS `room_id`, `doc_info`.`room_name` AS `room_name`, `a`.`schedule_id` AS `schedule_id`, `ds`.`work_date` AS `work_date`, `ds`.`start_time` AS `start_time`, `ds`.`end_time` AS `end_time`, `a`.`appointment_date` AS `appointment_date`, `a`.`appointment_time` AS `appointment_time`, `a`.`status` AS `status`, `qn`.`queue_number` AS `queue_number`, `a`.`created_at` AS `created_at`, `a`.`updated_at` AS `updated_at` FROM (((((`appointments` `a` join `users` `p` on((`a`.`patient_id` = `p`.`id`))) join `doctors` `d` on((`a`.`doctor_id` = `d`.`id`))) join `v_doctors_info` `doc_info` on((`d`.`id` = `doc_info`.`id`))) join `doctor_schedules` `ds` on((`a`.`schedule_id` = `ds`.`id`))) left join `queue_numbers` `qn` on((`a`.`id` = `qn`.`appointment_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_doctors_info`
--
DROP TABLE IF EXISTS `v_doctors_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_doctors_info`  AS SELECT `d`.`id` AS `id`, `d`.`user_id` AS `user_id`, `u`.`full_name` AS `full_name`, `u`.`email` AS `email`, `u`.`phone` AS `phone`, `u`.`gender` AS `gender`, `d`.`department_id` AS `department_id`, `dept`.`name` AS `department_name`, `d`.`room_id` AS `room_id`, `r`.`room_name` AS `room_name`, `d`.`experience_years` AS `experience_years`, `d`.`rating_avg` AS `rating_avg`, `d`.`bio` AS `bio`, `d`.`avatar_url` AS `avatar_url`, `d`.`is_active` AS `is_active`, `d`.`created_at` AS `created_at` FROM (((`doctors` `d` join `users` `u` on((`d`.`user_id` = `u`.`id`))) join `departments` `dept` on((`d`.`department_id` = `dept`.`id`))) left join `rooms` `r` on((`d`.`room_id` = `r`.`id`))) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`schedule_id`) REFERENCES `doctor_schedules` (`id`);

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `doctors_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `doctors_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `queue_numbers`
--
ALTER TABLE `queue_numbers`
  ADD CONSTRAINT `queue_numbers_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `queue_numbers_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
