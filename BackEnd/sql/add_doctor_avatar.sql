-- Thêm cột avatar_url cho bảng doctors
ALTER TABLE `doctors`
  ADD COLUMN `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
  AFTER `bio`;

-- Cập nhật view v_doctors_info để include avatar_url
DROP VIEW IF EXISTS `v_doctors_info`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_doctors_info` AS
SELECT
  d.id AS id,
  d.user_id AS user_id,
  u.full_name AS full_name,
  u.email AS email,
  u.phone AS phone,
  u.gender AS gender,
  d.department_id AS department_id,
  dept.name AS department_name,
  d.room_id AS room_id,
  r.room_name AS room_name,
  d.experience_years AS experience_years,
  d.rating_avg AS rating_avg,
  d.bio AS bio,
  d.avatar_url AS avatar_url,
  d.is_active AS is_active,
  d.created_at AS created_at
FROM doctors d
JOIN users u ON d.user_id = u.id
JOIN departments dept ON d.department_id = dept.id
LEFT JOIN rooms r ON d.room_id = r.id;


