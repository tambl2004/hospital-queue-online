import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import QuickBookingBar from '../components/Patient/QuickBookingBar';
import { FaHospital, FaUserMd, FaCalendarCheck, FaArrowRight, FaStar } from 'react-icons/fa';

function HomePage() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy top 6 chuyên khoa
      const deptResponse = await patientService.getDepartments({ limit: 6, page: 1 });
      if (deptResponse.success) {
        setDepartments(deptResponse.data || []);
      }

      // Lấy top 6 bác sĩ nổi bật
      const doctorResponse = await patientService.getDoctors({ 
        status: 'active', 
        limit: 6, 
        page: 1 
      });
      if (doctorResponse.success) {
        setDoctors(doctorResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Hệ Thống Đặt Lịch Khám Bệnh</h1>
          <p className="text-xl mb-8 text-blue-100">
            Đặt lịch khám nhanh chóng, tiện lợi với đội ngũ bác sĩ chuyên nghiệp
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/departments"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Xem Chuyên Khoa
            </Link>
            <Link
              to="/auth/login"
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors"
            >
              Đăng Nhập Để Đặt Lịch
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Booking Bar */}
        <QuickBookingBar />
        {/* Chuyên Khoa */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaHospital className="text-blue-600" />
              Chuyên Khoa
            </h2>
            <Link
              to="/departments"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              Xem tất cả <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  to={`/departments/${dept.id}/doctors`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaHospital className="text-blue-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{dept.name}</h3>
                  </div>
                  {dept.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{dept.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bác Sĩ Nổi Bật */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaUserMd className="text-blue-600" />
              Bác Sĩ Nổi Bật
            </h2>
            <Link
              to="/doctors"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              Xem tất cả <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Link
                  key={doctor.id}
                  to={`/doctors/${doctor.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUserMd className="text-blue-600 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {doctor.full_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{doctor.department?.name}</p>
                      {doctor.rating_avg > 0 && (
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400 text-sm" />
                          <span className="text-sm font-medium text-gray-700">
                            {doctor.rating_avg.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-12 text-center text-white">
          <FaCalendarCheck className="text-5xl mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Sẵn Sàng Đặt Lịch Khám?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Đăng nhập ngay để đặt lịch khám với bác sĩ chuyên khoa
          </p>
          <Link
            to="/auth/login"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Đăng Nhập Ngay
          </Link>
        </section>
      </div>
    </div>
  );
}

export default HomePage;

