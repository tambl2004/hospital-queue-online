import { useState, useEffect } from 'react';
import Layout from './Layout';
import { faqService } from '../services/faqService';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';

const AdminFAQList = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await faqService.getAllFAQs();

      if (response.success) {
        setFaqs(response.data || []);
      } else {
        setError('Không thể tải danh sách FAQ');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      display_order: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active === 1 || faq.is_active === true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      let response;
      if (editingFAQ) {
        response = await faqService.updateFAQ(editingFAQ.id, formData);
      } else {
        response = await faqService.createFAQ(formData);
      }

      if (response.success) {
        setIsModalOpen(false);
        setEditingFAQ(null);
        fetchFAQs();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting FAQ:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faq) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa FAQ "${faq.question}"?`)) {
      return;
    }

    try {
      setError('');
      const response = await faqService.deleteFAQ(faq.id);

      if (response.success) {
        fetchFAQs();
      } else {
        setError(response.message || 'Có lỗi xảy ra khi xóa');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa FAQ');
    }
  };

  const handleToggleStatus = async (faq) => {
    const newStatus = !(faq.is_active === 1 || faq.is_active === true);
    const action = newStatus ? 'kích hoạt' : 'ẩn';

    if (!window.confirm(`Bạn có chắc chắn muốn ${action} FAQ "${faq.question}"?`)) {
      return;
    }

    try {
      setError('');
      const response = await faqService.updateFAQ(faq.id, { is_active: newStatus });

      if (response.success) {
        fetchFAQs();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating FAQ status:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Câu hỏi thường gặp (FAQ)</h1>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus />
            Thêm FAQ mới
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* FAQ List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Chưa có FAQ nào. Hãy thêm FAQ mới!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Câu hỏi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thứ tự
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={faq.question}>
                        {faq.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.display_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {faq.is_active === 1 || faq.is_active === true ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheckCircle className="mr-1" />
                          Hiển thị
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FaTimesCircle className="mr-1" />
                          Ẩn
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(faq)}
                          className={`${
                            faq.is_active === 1 || faq.is_active === true
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={faq.is_active === 1 || faq.is_active === true ? 'Ẩn' : 'Hiển thị'}
                        >
                          {faq.is_active === 1 || faq.is_active === true ? (
                            <FaTimesCircle />
                          ) : (
                            <FaCheckCircle />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(faq)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {editingFAQ ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập câu hỏi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Câu trả lời <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập câu trả lời"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thứ tự hiển thị
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select
                        value={formData.is_active ? '1' : '0'}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.value === '1' })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Hiển thị</option>
                        <option value="0">Ẩn</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingFAQ(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang lưu...' : editingFAQ ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminFAQList;

