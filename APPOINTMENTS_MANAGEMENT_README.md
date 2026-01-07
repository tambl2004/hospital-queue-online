# CHỨC NĂNG QUẢN LÝ LƯỢT ĐĂNG KÝ KHÁM (APPOINTMENTS)

## 📋 Tổng quan

Chức năng quản lý lượt đăng ký khám cho phép Admin/Staff theo dõi và quản lý toàn bộ quy trình khám bệnh từ khi bệnh nhân đặt lịch đến khi hoàn thành khám.

## 🎯 Các tính năng chính

### 1. Xem danh sách lượt đăng ký khám
- Hiển thị danh sách appointments với đầy đủ thông tin
- Pagination hỗ trợ hiển thị nhiều bản ghi
- Sorting theo số thứ tự, thời gian

### 2. Bộ lọc (Filters)
- **Ngày khám**: Mặc định là hôm nay
- **Chuyên khoa**: Lọc theo department
- **Bác sĩ**: Lọc theo doctor
- **Phòng khám**: Lọc theo room
- **Trạng thái**: Lọc theo status
- **Tìm kiếm**: Theo tên/phone/email bệnh nhân

### 3. Thống kê theo ngày
Hiển thị số lượng appointments theo từng trạng thái:
- Tổng
- Đang chờ (WAITING)
- Đã gọi (CALLED)
- Đang khám (IN_PROGRESS)
- Hoàn thành (DONE)
- Đã hủy (CANCELLED)
- Bỏ qua (SKIPPED)

### 4. Quản lý trạng thái (State Machine)

#### Các trạng thái:
- **WAITING**: Đã đặt lịch, đã cấp số, chưa gọi
- **CALLED**: Đã gọi số
- **IN_PROGRESS**: Đang khám
- **DONE**: Khám xong
- **CANCELLED**: Huỷ lịch
- **SKIPPED**: Bỏ qua lượt

#### Quy tắc chuyển trạng thái:
```
WAITING → CALLED (Gọi số) hoặc CANCELLED (Hủy)
CALLED → IN_PROGRESS (Bắt đầu khám) hoặc SKIPPED (Bỏ qua)
IN_PROGRESS → DONE (Kết thúc khám)
SKIPPED → CALLED (Gọi lại)
DONE: Không thể chuyển sang trạng thái khác
CANCELLED: Không thể chuyển sang trạng thái khác
```

### 5. Các thao tác quản lý

#### Với trạng thái WAITING:
- **Hủy lịch**: Hủy appointment (yêu cầu nhập lý do)
- Sau khi hủy, appointment không thể khôi phục

#### Với trạng thái CALLED:
- **Bắt đầu khám**: Chuyển sang IN_PROGRESS
- **Bỏ qua**: Chuyển sang SKIPPED (yêu cầu nhập lý do)

#### Với trạng thái IN_PROGRESS:
- **Kết thúc**: Chuyển sang DONE
- Sau khi kết thúc, không thể thay đổi trạng thái

#### Với trạng thái SKIPPED:
- **Gọi lại**: Chuyển về CALLED để gọi lại bệnh nhân

### 6. Xem chi tiết appointment
- Thông tin bệnh nhân: Tên, phone, email, giới tính, ngày sinh, tuổi
- Thông tin bác sĩ: Tên, email, phone, kinh nghiệm, đánh giá
- Thông tin khám: Chuyên khoa, phòng, ngày/giờ, slot, số thứ tự
- Thông tin hệ thống: Ngày tạo, cập nhật, ID

## 🗄️ Cấu trúc Database

### Bảng `appointments`
```sql
- id: Primary key
- patient_id: FK → users.id
- doctor_id: FK → doctors.id
- department_id: FK → departments.id
- room_id: FK → rooms.id (nullable)
- schedule_id: FK → doctor_schedules.id
- appointment_date: DATE
- appointment_time: TIME
- status: ENUM (WAITING, CALLED, IN_PROGRESS, DONE, CANCELLED, SKIPPED)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Bảng `queue_numbers`
```sql
- id: Primary key
- appointment_id: FK → appointments.id (UNIQUE)
- doctor_id: FK → doctors.id
- queue_date: DATE
- queue_number: INT
- created_at: TIMESTAMP
- UNIQUE (doctor_id, queue_date, queue_number)
```

### View `v_appointments_detail`
View join đầy đủ thông tin để query nhanh:
- Thông tin bệnh nhân
- Thông tin bác sĩ
- Thông tin chuyên khoa
- Thông tin phòng
- Thông tin schedule
- Số thứ tự (queue_number)

## 🔌 API Endpoints

### 1. GET `/api/appointments`
Lấy danh sách appointments với filter
**Query params:**
- `date`: YYYY-MM-DD
- `doctor_id`: number
- `department_id`: number
- `room_id`: number
- `status`: string
- `search`: string
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `sort_by`: queue_number | appointment_time | created_at
- `sort_order`: ASC | DESC

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. GET `/api/appointments/:id`
Lấy chi tiết một appointment

### 3. POST `/api/appointments`
Tạo appointment mới (Admin/Staff tạo thủ công)
**Body:**
```json
{
  "patient_id": 1,
  "doctor_id": 2,
  "schedule_id": 3,
  "appointment_date": "2026-01-10",
  "appointment_time": "08:30:00"
}
```

### 4. PATCH `/api/appointments/:id/status`
Cập nhật trạng thái appointment
**Body:**
```json
{
  "status": "CALLED",
  "reason": "optional reason"
}
```

### 5. PATCH `/api/appointments/:id/cancel`
Hủy appointment (chỉ khi WAITING)
**Body:**
```json
{
  "reason": "Bệnh nhân hủy lịch"
}
```

### 6. GET `/api/appointments/stats/daily`
Lấy thống kê theo ngày
**Query params:**
- `date`: YYYY-MM-DD

### 7. GET `/api/appointments/doctor/:doctor_id/date/:date`
Lấy appointments theo doctor và ngày (dùng cho Queue)

## 🎨 Frontend Components

### Pages
- **AdminAppointmentList.jsx**: Trang chính quản lý appointments

### Components
- **AppointmentDetailDrawer.jsx**: Drawer hiển thị chi tiết appointment
- **ConfirmAppointmentActionModal.jsx**: Modal xác nhận các thao tác

### Services
- **appointmentService.js**: Service xử lý API calls và helper functions

## 🚀 Hướng dẫn sử dụng

### 1. Truy cập trang quản lý
- Đăng nhập với tài khoản Admin hoặc Staff
- Vào menu "Quản lý lượt đăng ký"

### 2. Lọc và tìm kiếm
- Chọn ngày khám (mặc định hôm nay)
- Chọn các bộ lọc: Chuyên khoa, Bác sĩ, Phòng, Trạng thái
- Nhập từ khóa tìm kiếm bệnh nhân

### 3. Xem chi tiết
- Click vào icon "👁" để xem chi tiết appointment
- Drawer hiển thị đầy đủ thông tin

### 4. Quản lý trạng thái
- Click vào nút action tương ứng với trạng thái hiện tại
- Xác nhận thao tác trong modal
- Nhập lý do nếu yêu cầu (Hủy, Bỏ qua)

### 5. Làm mới dữ liệu
- Click nút "Làm mới" để tải lại danh sách và thống kê

## ⚠️ Lưu ý quan trọng

### Về State Machine
- Không được phép chuyển trạng thái không hợp lệ
- Trạng thái DONE và CANCELLED là trạng thái cuối, không thể thay đổi
- Hệ thống kiểm tra và báo lỗi nếu transition không hợp lệ

### Về Hủy lịch (CANCELLED)
- Chỉ có thể hủy khi appointment đang ở trạng thái WAITING
- Sau khi hủy, số thứ tự vẫn được giữ trong lịch sử
- Không thể khôi phục appointment đã hủy

### Về Số thứ tự (Queue Number)
- Mỗi appointment được cấp một số thứ tự duy nhất
- Số thứ tự được tính theo doctor và ngày khám
- Số thứ tự tự động tăng dần (1, 2, 3, ...)

### Về Slot capacity
- Hệ thống kiểm tra số lượng bệnh nhân tối đa cho mỗi slot
- Không cho phép đặt lịch khi slot đã đầy (trừ trạng thái CANCELLED)

## 🔄 Tích hợp với các module khác

### Queue Management (Sắp được triển khai)
- Hệ thống Queue sẽ đọc danh sách appointments theo doctor và ngày
- Queue sẽ gọi số tự động theo thứ tự
- Khi gọi số, Queue cập nhật trạng thái từ WAITING → CALLED

### Realtime Updates (Sắp được triển khai)
- Socket.IO sẽ emit events khi trạng thái thay đổi
- Frontend sẽ tự động cập nhật danh sách
- Màn hình hiển thị số thứ tự sẽ nhận realtime updates

### Ratings (Đã có bảng)
- Sau khi DONE, bệnh nhân có thể đánh giá bác sĩ
- Đánh giá được lưu trong bảng `ratings`
- Trigger tự động cập nhật `rating_avg` của bác sĩ

## 📝 TODO - Các cải tiến trong tương lai

1. **Appointment Logs**
   - Tạo bảng `appointment_logs` để lưu lịch sử thay đổi trạng thái
   - Ghi lại người thực hiện, thời gian, lý do

2. **Notification**
   - Gửi SMS/Email thông báo khi gọi số
   - Thông báo nhắc lịch trước 1 ngày

3. **Advanced Statistics**
   - Biểu đồ thời gian chờ trung bình
   - Tỷ lệ hoàn thành theo bác sĩ/chuyên khoa
   - Phân tích lý do hủy lịch

4. **Bulk Actions**
   - Hủy nhiều appointments cùng lúc
   - Chuyển phòng hàng loạt

5. **Export**
   - Export danh sách appointments ra Excel/PDF
   - Báo cáo theo ngày/tuần/tháng

## 🐛 Troubleshooting

### Lỗi: "Không thể chuyển trạng thái"
- Kiểm tra trạng thái hiện tại của appointment
- Đảm bảo transition hợp lệ theo state machine

### Lỗi: "Không tìm thấy lượt đăng ký khám"
- ID appointment không tồn tại hoặc đã bị xóa
- Kiểm tra lại ID trong URL/request

### Lỗi: "Lịch khám đã đầy"
- Slot đã đạt số lượng bệnh nhân tối đa
- Chọn slot khác hoặc tăng `max_patients` của slot

## 📞 Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.

---

**Version**: 1.0.0  
**Date**: January 8, 2026  
**Status**: ✅ Completed

