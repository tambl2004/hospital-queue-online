import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaBell, FaUsers, FaShieldAlt, FaFileAlt, FaPhone, FaMapMarkerAlt, FaEnvelope, FaFacebook, FaInstagram, FaArrowRight, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { faqService } from './services/faqService';

function LandingPage() {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await faqService.getFAQs(true);
        setFaqs(response.data || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };
    fetchFAQs();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/image/logo.png" 
                alt="Logo Bệnh viện Thu Cúc" 
                className="h-12 w-auto"
              />
              <div>
                <div className="text-gray-900 font-semibold text-lg">Bệnh viện Thu Cúc</div>
                <div className="text-teal-500 text-sm">Đặt lịch khám online</div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-teal-600 transition-colors">Tính năng</a>
              <a href="#guide" className="text-gray-700 hover:text-teal-600 transition-colors">Hướng dẫn</a>
              <a href="#faq" className="text-gray-700 hover:text-teal-600 transition-colors">FAQ</a>
              <a href="#contact" className="text-gray-700 hover:text-teal-600 transition-colors">Liên hệ</a>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 text-gray-700">
                <FaPhone className="text-teal-500" />
                <span className="font-medium">1900 55 88 92</span>
              </div>
              <Link
                to="/auth/login"
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Đặt lịch ngay
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-teal-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-sm mb-6">
                Hệ thống đặt lịch chính thức
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Đặt Lịch Khám Nhanh Chóng & Tiện Lợi
              </h1>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Hệ thống đăng ký khám và lấy số thứ tự online tại Bệnh viện Đa khoa Quốc tế Thu Cúc. 
                Tiết kiệm thời gian, không cần xếp hàng chờ đợi.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  to="/auth/register"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  Đặt lịch khám ngay
                  <FaArrowRight />
                </Link>
                <a
                  href="#guide"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-4 rounded-lg font-medium transition-colors"
                >
                  Xem hướng dẫn
                </a>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <FaClock className="text-teal-500" />
                  <span className="text-sm">Đặt lịch 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm">Xác nhận ngay</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaShieldAlt className="text-teal-500" />
                  <span className="text-sm">Bảo mật thông tin</span>
                </div>
              </div>
            </div>

            {/* Right Content - Appointment Card */}
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Miễn phí đặt lịch
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-4">Số thứ tự của bạn</h3>
                <div className="text-6xl font-bold text-teal-500 mb-4">A-042</div>
                <div className="text-gray-600 mb-6">Phòng khám Nội tổng quát</div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaCalendarAlt className="text-teal-500" />
                    <div>
                      <div className="text-sm text-gray-500">Ngày khám</div>
                      <div className="font-medium">26/01/2026</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaClock className="text-teal-500" />
                    <div>
                      <div className="text-sm text-gray-500">Giờ dự kiến</div>
                      <div className="font-medium">09:30</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-teal-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Thời gian chờ</div>
                      <div className="font-medium">~15 phút</div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                      Sắp đến lượt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block text-teal-500 text-sm font-medium mb-2">Tính năng nổi bật</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trải nghiệm khám bệnh hiện đại</h2>
            <p className="text-gray-600 text-lg">
              Hệ thống được thiết kế để mang đến sự tiện lợi tối đa cho bệnh nhân
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FaCalendarAlt, title: 'Đặt lịch khám online', desc: 'Đặt lịch khám bệnh nhanh chóng qua hệ thống online' },
              { icon: FaClock, title: 'Lấy số thứ tự từ xa', desc: 'Nhận số thứ tự ngay tại nhà, không cần đến sớm' },
              { icon: FaBell, title: 'Thông báo nhắc lịch', desc: 'Nhận thông báo nhắc nhở trước giờ khám' },
              { icon: FaUsers, title: 'Quản lý hồ sơ gia đình', desc: 'Quản lý thông tin khám bệnh cho cả gia đình' },
              { icon: FaShieldAlt, title: 'Bảo mật thông tin', desc: 'Thông tin cá nhân được bảo mật tuyệt đối' },
              { icon: FaFileAlt, title: 'Tra cứu kết quả online', desc: 'Xem kết quả khám bệnh trực tuyến mọi lúc' },
            ].map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="text-teal-500 text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How-To Section */}
      <section id="guide" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block text-teal-500 text-sm font-medium mb-2">Hướng dẫn sử dụng</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Đặt lịch khám chỉ với 3 bước đơn giản</h2>
            <p className="text-gray-600 text-lg">
              Quy trình đăng ký dễ dàng, nhanh chóng dành cho mọi đối tượng
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {[
              { number: '01', icon: FaUsers, title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản nhanh chóng với email và số điện thoại' },
              { number: '02', icon: FaCalendarAlt, title: 'Chọn lịch khám', desc: 'Chọn chuyên khoa, bác sĩ và thời gian phù hợp' },
              { number: '03', icon: FaClock, title: 'Nhận số thứ tự', desc: 'Nhận số thứ tự và thông tin khám bệnh ngay lập tức' },
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="bg-white rounded-xl p-8 shadow-lg w-full max-w-sm text-center">
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <step.icon className="text-teal-500 text-4xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block text-teal-500 text-3xl mx-4">
                    <FaArrowRight />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500,000+', label: 'Lượt đặt lịch thành công' },
              { number: '50+', label: 'Chuyên khoa đa dạng' },
              { number: '200+', label: 'Bác sĩ chuyên môn cao' },
              { number: '98%', label: 'Khách hàng hài lòng' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-teal-500 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block text-teal-500 text-sm font-medium mb-2">Câu hỏi thường gặp</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>
            <p className="text-gray-600 text-lg">
              Tìm câu trả lời cho những thắc mắc phổ biến về dịch vụ đặt lịch khám bệnh online
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <FaChevronUp className="text-teal-500 flex-shrink-0" />
                  ) : (
                    <FaChevronDown className="text-teal-500 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <div className="text-gray-600 whitespace-pre-line">{faq.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Sẵn sàng đặt lịch khám?</h2>
          <p className="text-white/90 text-lg mb-8">
            Đăng ký ngay hôm nay để trải nghiệm dịch vụ y tế chất lượng cao tại Bệnh viện Thu Cúc
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/auth/register"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              Đặt lịch khám ngay
              <FaArrowRight />
            </Link>
            <a
              href="tel:1900558892"
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg font-medium flex items-center gap-2 transition-colors backdrop-blur-sm"
            >
              <FaPhone />
              Hotline: 1900 55 88 92
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/image/logo.png" 
                  alt="Logo Bệnh viện Thu Cúc" 
                  className="h-12 w-auto"
                />
                <div>
                  <div className="font-semibold text-lg">Bệnh viện Thu Cúc</div>
                  <div className="text-teal-400 text-sm">Đặt lịch khám online</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Bệnh viện Đa khoa Quốc tế Thu Cúc - Hệ thống y tế chất lượng cao với đội ngũ bác sĩ giàu kinh nghiệm.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-teal-500 transition-colors">
                  <FaFacebook />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-teal-500 transition-colors">
                  <FaInstagram />
                </a>
              </div>
            </div>

            {/* Middle */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2">
                <li><Link to="/auth/register" className="text-gray-400 hover:text-white transition-colors">Đặt lịch khám</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tra cứu kết quả</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Đội ngũ bác sĩ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bảng giá dịch vụ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>

            {/* Right */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Thông tin liên hệ</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-400">
                  <FaMapMarkerAlt className="text-teal-500 mt-1" />
                  <span>286 Thụy Khuê, Tây Hồ, Hà Nội</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <FaPhone className="text-teal-500" />
                  <span>1900 55 88 92</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <FaEnvelope className="text-teal-500" />
                  <span>contact@thucuchospital.vn</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <FaClock className="text-teal-500 mt-1" />
                  <span>Thứ 2 - Chủ nhật: 7:00 - 20:00</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2026 Bệnh viện Đa khoa Quốc tế Thu Cúc. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

