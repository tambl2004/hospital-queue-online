# 🏥 HỆ THỐNG QUẢN LÝ BỆNH VIỆN ONLINE

Hệ thống quản lý bệnh viện trực tuyến với đầy đủ chức năng đặt lịch khám, quản lý hàng đợi, thống kê và báo cáo. Hệ thống hỗ trợ 3 vai trò chính: **Admin**, **Bác sĩ**, và **Bệnh nhân**.

## 📋 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt và chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [API Endpoints](#-api-endpoints)
- [Chức năng chi tiết](#-chức-năng-chi-tiết)

---

## ✨ Tính năng chính

### 👨‍💼 Giao diện Admin
- **Dashboard tổng quan**: Thống kê realtime, biểu đồ 7 ngày gần nhất
- **Quản lý người dùng**: Quản lý bệnh nhân, bác sĩ, nhân viên
- **Quản lý chuyên khoa**: Thêm, sửa, xóa các chuyên khoa
- **Quản lý bác sĩ**: Quản lý thông tin bác sĩ, chuyên môn
- **Quản lý phòng khám**: Quản lý các phòng khám trong bệnh viện
- **Quản lý lịch khám**: Tạo và quản lý lịch khám của bác sĩ
- **Quản lý lượt đăng ký**: Xem, cập nhật trạng thái các lượt đăng ký khám
- **Quản lý hàng đợi**: Theo dõi và quản lý hàng đợi realtime
- **Báo cáo thống kê**: Báo cáo chi tiết với biểu đồ trực quan

### 👨‍⚕️ Giao diện Bác sĩ
- **Dashboard bác sĩ**: Tổng quan lịch khám trong ngày
- **Quản lý lịch khám**: Xem và cập nhật lịch khám cá nhân
- **Quản lý lượt khám**: Xem danh sách bệnh nhân đã đặt lịch
- **Quản lý hàng đợi**: Gọi số, bắt đầu khám, hoàn thành
- **Hồ sơ bác sĩ**: Cập nhật thông tin cá nhân

### 👤 Giao diện Bệnh nhân
- **Trang chủ**: Tìm kiếm bác sĩ, chuyên khoa
- **Đặt lịch khám**: Đặt lịch khám với bác sĩ
- **Lịch khám của tôi**: Xem và quản lý các lịch đã đặt
- **Theo dõi hàng đợi**: Xem số thứ tự và thời gian ước tính
- **Đánh giá bác sĩ**: Đánh giá và xem đánh giá bác sĩ
- **Hồ sơ cá nhân**: Quản lý thông tin cá nhân

### 🔄 Tính năng đặc biệt
- **Realtime Queue Management**: Quản lý hàng đợi realtime với Socket.IO
- **Smart Queue System**: Hệ thống gọi số thông minh
- **Statistics & Reports**: Báo cáo thống kê với biểu đồ Recharts
- **Responsive Design**: Giao diện responsive với Tailwind CSS

---

## 🛠 Công nghệ sử dụng

### Frontend
- **React 18.2.0** - UI Framework
- **React Router DOM 6.21.1** - Routing
- **Vite 5.0.8** - Build tool
- **Tailwind CSS 3.4.0** - Styling
- **Recharts 3.6.0** - Charts & Graphs
- **Axios 1.6.2** - HTTP Client
- **Socket.IO Client 4.6.1** - Realtime communication
- **React Icons 5.5.0** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **MySQL2 3.6.5** - Database driver
- **Socket.IO 4.6.1** - Realtime server
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **Bcryptjs 2.4.3** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing
- **Dotenv 16.3.1** - Environment variables

### Database
- **MySQL** - Relational database

---

## 📁 Cấu trúc dự án

```
BenhVien/
├── BackEnd/                    # Backend API Server
│   ├── config/                 # Cấu hình
│   │   └── database.js         # Database connection
│   ├── controllers/            # Business logic
│   │   ├── appointments.controller.js
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── doctors.controller.js
│   │   ├── queue.controller.js
│   │   └── ...
│   ├── database/               # Database scripts
│   │   └── benhvien.sql        # SQL schema
│   ├── middlewares/            # Middleware functions
│   │   ├── auth.js             # Authentication middleware
│   │   └── error.js            # Error handling
│   ├── routes/                 # API routes
│   │   ├── appointments.routes.js
│   │   ├── auth.routes.js
│   │   └── ...
│   ├── socketHandlers/         # Socket.IO handlers
│   │   └── queue.handler.js
│   ├── utils/                  # Utility functions
│   │   ├── jwt.js
│   │   └── validation.js
│   ├── app.js                  # Express app setup
│   ├── server.js               # Server entry point
│   └── package.json
│
├── FrontEnd/                   # Frontend React App
│   ├── public/                 # Static files
│   ├── src/
│   │   ├── Admin/              # Admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AdminAppointmentList.jsx
│   │   │   ├── AdminReports.jsx
│   │   │   └── ...
│   │   ├── Doctor/             # Doctor pages
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── DoctorQueue.jsx
│   │   │   └── ...
│   │   ├── Patient/             # Patient pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── BookAppointment.jsx
│   │   │   ├── MyAppointments.jsx
│   │   │   └── ...
│   │   ├── Auth/                # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API services
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── appointmentService.js
│   │   │   └── ...
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── README.md                    # File này
```

---

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- **Node.js** >= 16.x
- **MySQL** >= 8.0
- **npm** hoặc **yarn**

### Bước 1: Clone repository
```bash
git clone https://github.com/tambl2004/hospital-queue-online.git


### Bước 2: Cài đặt Backend
```bash
cd BackEnd
npm install
```

### Bước 3: Cài đặt Frontend
```bash
cd ../FrontEnd
npm install
```

### Bước 4: Cấu hình Database
1. Tạo database MySQL:
```sql
CREATE DATABASE benhvien CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import schema:
```bash
mysql -u root -p benhvien < BackEnd/database/benhvien.sql
```

### Bước 5: Cấu hình môi trường

Tạo file `.env` trong thư mục `BackEnd/`:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=benhvien

# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

### Bước 6: Chạy Backend
```bash
cd BackEnd
npm start
```

Backend sẽ chạy tại: `http://localhost:5000`

### Bước 7: Chạy Frontend
```bash
cd FrontEnd
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## ⚙️ Cấu hình môi trường

### Backend Environment Variables

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `` |
| `DB_NAME` | Database name | `benhvien` |
| `PORT` | Server port | `5000` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |
| `JWT_SECRET` | JWT secret key | (bắt buộc) |
| `JWT_EXPIRE` | JWT expiration | `7d` |

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Appointments
- `GET /api/appointments` - Lấy danh sách appointments
- `GET /api/appointments/:id` - Lấy chi tiết appointment
- `POST /api/appointments` - Tạo appointment mới
- `PATCH /api/appointments/:id/status` - Cập nhật trạng thái
- `PATCH /api/appointments/:id/cancel` - Hủy appointment

### Queue Management
- `GET /api/queue/:doctorId/:date` - Lấy trạng thái hàng đợi
- `POST /api/queue/call-next` - Gọi số tiếp theo
- `POST /api/queue/start` - Bắt đầu khám
- `POST /api/queue/complete` - Hoàn thành khám
- `POST /api/queue/skip` - Bỏ qua

### Admin
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/reports` - Báo cáo thống kê
- `GET /api/admin/users` - Quản lý users
- `GET /api/admin/doctors` - Quản lý doctors
- `GET /api/admin/departments` - Quản lý departments
- `GET /api/admin/rooms` - Quản lý rooms
- `GET /api/admin/schedules` - Quản lý schedules

### Doctor
- `GET /api/doctor/dashboard` - Dashboard bác sĩ
- `GET /api/doctor/appointments` - Lịch khám của bác sĩ
- `GET /api/doctor/schedule` - Lịch làm việc

---

## 📱 Chức năng chi tiết

### 1. Quản lý Appointments

#### Trạng thái Appointments
- **WAITING**: Đang chờ gọi
- **CALLED**: Đã gọi
- **IN_PROGRESS**: Đang khám
- **DONE**: Hoàn thành
- **CANCELLED**: Đã hủy
- **SKIPPED**: Bỏ qua

#### State Machine Transitions
```
WAITING → CALLED (Gọi số)
WAITING → CANCELLED (Hủy lịch)
CALLED → IN_PROGRESS (Bắt đầu khám)
CALLED → SKIPPED (Bỏ qua)
IN_PROGRESS → DONE (Hoàn thành)
SKIPPED → CALLED (Gọi lại)
```

### 2. Hệ thống Hàng đợi (Queue)

- **Tự động phân số thứ tự** khi bệnh nhân đặt lịch
- **Realtime updates** qua Socket.IO
- **Ước tính thời gian chờ** dựa trên lịch sử
- **Gọi số tự động** và thông báo realtime

### 3. Thống kê và Báo cáo

- **Dashboard tổng quan**: Thống kê realtime
- **Biểu đồ 7 ngày gần nhất**: Bar chart với Recharts
- **Báo cáo chi tiết**: 
  - Biểu đồ theo ngày
  - Phân bổ theo trạng thái (Pie chart)
  - Top bác sĩ
  - Top chuyên khoa

### 4. Quản lý Lịch khám

- **Tạo lịch khám**: Bác sĩ tạo lịch theo ngày
- **Quản lý slot**: Thêm, sửa, xóa các slot khám
- **Đặt lịch**: Bệnh nhân chọn slot phù hợp
- **Tự động cập nhật**: Cập nhật số lượng còn lại

---

## 👥 Vai trò và Quyền

### Admin
- Toàn quyền quản lý hệ thống
- Xem tất cả appointments
- Quản lý users, doctors, departments, rooms
- Xem báo cáo và thống kê

### Doctor
- Xem appointments của chính mình
- Quản lý lịch khám cá nhân
- Quản lý hàng đợi
- Cập nhật trạng thái khám

### Patient
- Đặt lịch khám
- Xem appointments của chính mình
- Theo dõi hàng đợi
- Đánh giá bác sĩ

---

## 🔐 Authentication

Hệ thống sử dụng **JWT (JSON Web Token)** để xác thực:
- Token được lưu trong localStorage
- Token có thời hạn (mặc định 7 ngày)
- Mỗi request cần gửi token trong header: `Authorization: Bearer <token>`

---

## 📊 Database Schema

### Các bảng chính:
- `users` - Thông tin người dùng
- `doctors` - Thông tin bác sĩ
- `departments` - Chuyên khoa
- `rooms` - Phòng khám
- `doctor_schedules` - Lịch khám của bác sĩ
- `appointments` - Lượt đăng ký khám
- `queue_numbers` - Số thứ tự hàng đợi
- `ratings` - Đánh giá bác sĩ

---

## 🐛 Troubleshooting

### Lỗi kết nối Database
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra thông tin trong file `.env`
- Kiểm tra database đã được tạo chưa

### Lỗi CORS
- Kiểm tra `CLIENT_URL` trong `.env`
- Đảm bảo frontend và backend chạy đúng port

### Lỗi JWT
- Kiểm tra `JWT_SECRET` đã được set chưa
- Kiểm tra token có hết hạn không

---

## 📝 Ghi chú

- Đảm bảo MySQL đã được cài đặt và chạy trước khi start backend
- Port mặc định: Backend (5000), Frontend (5173)
- Database charset: `utf8mb4` để hỗ trợ tiếng Việt

