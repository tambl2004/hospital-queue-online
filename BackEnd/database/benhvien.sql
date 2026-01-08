-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost
-- Thời gian đã tạo: Th1 08, 2026 lúc 09:15 AM
-- Phiên bản máy phục vụ: 5.7.24
-- Phiên bản PHP: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `benhvien`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointments`
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
-- Đang đổ dữ liệu cho bảng `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `department_id`, `room_id`, `schedule_id`, `appointment_date`, `appointment_time`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 1, 1, 13, '2026-01-08', '08:00:00', 'DONE', '2026-01-08 08:33:13', '2026-01-08 08:56:49'),
(2, 3, 1, 1, 1, 14, '2026-01-08', '08:15:00', 'CALLED', '2026-01-08 09:00:29', '2026-01-08 09:13:35');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `departments`
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
-- Đang đổ dữ liệu cho bảng `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Tai Mũi Họng', 'Khám và điều trị các bệnh về tai, mũi, họng', 1, '2026-01-07 16:47:32', '2026-01-07 17:11:03');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `experience_years` int(11) DEFAULT '0',
  `rating_avg` decimal(3,2) DEFAULT '0.00' COMMENT '0.00 to 5.00',
  `bio` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `department_id`, `room_id`, `experience_years`, `rating_avg`, `bio`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 10, 5.00, 'kinh nghiệm bốc phét', 1, '2026-01-07 17:38:54', '2026-01-08 08:57:18');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `doctor_schedules`
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
-- Đang đổ dữ liệu cho bảng `doctor_schedules`
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
(28, 1, '2026-01-08', '11:45:00', '12:00:00', 1, 1, '2026-01-08 08:29:52');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `queue_numbers`
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
-- Đang đổ dữ liệu cho bảng `queue_numbers`
--

INSERT INTO `queue_numbers` (`id`, `appointment_id`, `doctor_id`, `queue_date`, `queue_number`, `created_at`) VALUES
(1, 1, 1, '2026-01-08', 1, '2026-01-08 08:33:13'),
(2, 2, 1, '2026-01-08', 2, '2026-01-08 09:00:29');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ratings`
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
-- Đang đổ dữ liệu cho bảng `ratings`
--

INSERT INTO `ratings` (`id`, `appointment_id`, `doctor_id`, `patient_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 3, 5, NULL, '2026-01-08 08:57:18');

--
-- Bẫy `ratings`
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
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ADMIN, STAFF, PATIENT, DOCTOR',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`id`, `code`, `name`, `created_at`) VALUES
(1, 'ADMIN', 'Quản trị viên', '2026-01-07 15:53:14'),
(3, 'DOCTOR', 'Bác sĩ', '2026-01-07 15:53:14'),
(4, 'PATIENT', 'Bệnh nhân', '2026-01-07 15:53:14');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `rooms`
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
-- Đang đổ dữ liệu cho bảng `rooms`
--

INSERT INTO `rooms` (`id`, `room_code`, `room_name`, `department_id`, `is_active`, `created_at`) VALUES
(1, 'PTMH1', 'Tai mũi họng 1', 1, 1, '2026-01-07 17:32:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
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
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `phone`, `gender`, `date_of_birth`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@gmail.com', '$2a$12$qEbicBaKZ3gY9LyiDn/SD.tQ/TXUo3pLRtYTNFX.1CuvfVFVbbrIO', '0969859400', 'MALE', '2004-02-19', 1, '2026-01-07 16:08:55', '2026-01-07 16:08:55'),
(2, 'Bác sĩ Tâm', 'bacsi@gmail.com', '$2a$12$iwin9jtCaIuEj75GVFWA1.XVhl4butFrXjyQr09tPS70huFa/IubK', '0335974080', 'MALE', '2004-02-18', 1, '2026-01-07 17:38:54', '2026-01-07 18:02:58'),
(3, 'Tâm', 'tam@gmail.com', '$2a$12$oNx5x0Kh99zy0Vaj8oC0iOZyoTXKA/mgqUVpgN1wqgZLP3EwOt4Y2', '0335974080', 'MALE', '2004-02-19', 1, '2026-01-07 17:39:36', '2026-01-07 17:39:36');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 3),
(3, 4);

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `v_appointments_detail`
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
-- Cấu trúc đóng vai cho view `v_doctors_info`
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
,`is_active` tinyint(1)
,`created_at` timestamp
);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `appointments`
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
-- Chỉ mục cho bảng `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Chỉ mục cho bảng `doctors`
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
-- Chỉ mục cho bảng `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_schedule` (`doctor_id`,`work_date`,`start_time`,`end_time`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_work_date` (`work_date`),
  ADD KEY `idx_doctor_date` (`doctor_id`,`work_date`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Chỉ mục cho bảng `queue_numbers`
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
-- Chỉ mục cho bảng `ratings`
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
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`);

--
-- Chỉ mục cho bảng `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_code` (`room_code`),
  ADD KEY `idx_room_code` (`room_code`),
  ADD KEY `idx_department_id` (`department_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Chỉ mục cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_role_id` (`role_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT cho bảng `queue_numbers`
--
ALTER TABLE `queue_numbers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_appointments_detail`
--
DROP TABLE IF EXISTS `v_appointments_detail`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_appointments_detail`  AS SELECT `a`.`id` AS `id`, `a`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`phone` AS `patient_phone`, `a`.`doctor_id` AS `doctor_id`, `d`.`user_id` AS `doctor_user_id`, `doc_info`.`full_name` AS `doctor_name`, `a`.`department_id` AS `department_id`, `doc_info`.`department_name` AS `department_name`, `a`.`room_id` AS `room_id`, `doc_info`.`room_name` AS `room_name`, `a`.`schedule_id` AS `schedule_id`, `ds`.`work_date` AS `work_date`, `ds`.`start_time` AS `start_time`, `ds`.`end_time` AS `end_time`, `a`.`appointment_date` AS `appointment_date`, `a`.`appointment_time` AS `appointment_time`, `a`.`status` AS `status`, `qn`.`queue_number` AS `queue_number`, `a`.`created_at` AS `created_at`, `a`.`updated_at` AS `updated_at` FROM (((((`appointments` `a` join `users` `p` on((`a`.`patient_id` = `p`.`id`))) join `doctors` `d` on((`a`.`doctor_id` = `d`.`id`))) join `v_doctors_info` `doc_info` on((`d`.`id` = `doc_info`.`id`))) join `doctor_schedules` `ds` on((`a`.`schedule_id` = `ds`.`id`))) left join `queue_numbers` `qn` on((`a`.`id` = `qn`.`appointment_id`))) ;

-- --------------------------------------------------------

--
-- Cấu trúc cho view `v_doctors_info`
--
DROP TABLE IF EXISTS `v_doctors_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_doctors_info`  AS SELECT `d`.`id` AS `id`, `d`.`user_id` AS `user_id`, `u`.`full_name` AS `full_name`, `u`.`email` AS `email`, `u`.`phone` AS `phone`, `u`.`gender` AS `gender`, `d`.`department_id` AS `department_id`, `dept`.`name` AS `department_name`, `d`.`room_id` AS `room_id`, `r`.`room_name` AS `room_name`, `d`.`experience_years` AS `experience_years`, `d`.`rating_avg` AS `rating_avg`, `d`.`bio` AS `bio`, `d`.`is_active` AS `is_active`, `d`.`created_at` AS `created_at` FROM (((`doctors` `d` join `users` `u` on((`d`.`user_id` = `u`.`id`))) join `departments` `dept` on((`d`.`department_id` = `dept`.`id`))) left join `rooms` `r` on((`d`.`room_id` = `r`.`id`))) ;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`schedule_id`) REFERENCES `doctor_schedules` (`id`);

--
-- Ràng buộc cho bảng `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `doctors_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  ADD CONSTRAINT `doctors_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `queue_numbers`
--
ALTER TABLE `queue_numbers`
  ADD CONSTRAINT `queue_numbers_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `queue_numbers_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Ràng buộc cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
