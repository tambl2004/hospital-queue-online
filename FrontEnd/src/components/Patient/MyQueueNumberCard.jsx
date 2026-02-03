import { FaHashtag } from 'react-icons/fa';

/**
 * MyQueueNumberCard - Hiển thị số thứ tự của bệnh nhân
 */
function MyQueueNumberCard({ queueNumber, status }) {
  const getStatusInfo = (status) => {
    const statusMap = {
      WAITING: { 
        label: 'Đang chờ', 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300'
      },
      CALLED: { 
        label: 'Đã gọi', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300'
      },
      IN_PROGRESS: { 
        label: 'Đang khám', 
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300'
      },
      DONE: { 
        label: 'Hoàn thành', 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300'
      },
      CANCELLED: { 
        label: 'Đã hủy', 
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300'
      },
      SKIPPED: { 
        label: 'Bỏ qua', 
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300'
      },
    };

    return statusMap[status] || { 
      label: status, 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300'
    };
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className={`${statusInfo.bgColor} rounded-lg p-6 border ${statusInfo.borderColor} text-center shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <FaHashtag className={`${statusInfo.color} text-xl`} />
        <span className={`${statusInfo.color} text-base font-semibold`}>Số của tôi</span>
      </div>
      <div className={`${statusInfo.color} text-6xl font-bold mb-3`}>
        {queueNumber || 'N/A'}
      </div>
      <div className={`${statusInfo.color} text-sm font-semibold bg-white/60 rounded-full px-4 py-1 inline-block`}>
        {statusInfo.label}
      </div>
    </div>
  );
}

export default MyQueueNumberCard;

