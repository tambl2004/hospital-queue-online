-- Thêm cột google_id vào bảng users để lưu Google ID của người dùng
-- Nếu người dùng đăng nhập bằng Google, google_id sẽ được lưu
-- Nếu đăng nhập bằng email/password thông thường, google_id sẽ là NULL

ALTER TABLE `users` 
ADD COLUMN `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Google ID của người dùng' AFTER `email`,
ADD UNIQUE KEY `idx_google_id` (`google_id`);

