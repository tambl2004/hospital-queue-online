-- Cho phép password_hash là NULL để hỗ trợ đăng nhập bằng Google
-- User đăng nhập bằng Google không cần password_hash

ALTER TABLE `users` 
MODIFY COLUMN `password_hash` text COLLATE utf8mb4_unicode_ci DEFAULT NULL;

