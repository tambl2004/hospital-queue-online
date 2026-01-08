import { FaHashtag } from 'react-icons/fa';

/**
 * QueueNearbyList - Hiển thị danh sách các số gần nhất (5 số trước và 5 số sau)
 */
function QueueNearbyList({ queueList, myQueueNumber, myAppointmentId }) {
  if (!queueList || queueList.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Các số gần nhất</h3>
        <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
      </div>
    );
  }

  // Tìm vị trí của số của mình
  const myIndex = queueList.findIndex(
    (item) => item.appointmentId === myAppointmentId || item.queueNumber === myQueueNumber
  );

  // Lấy 5 số trước và 5 số sau
  const startIndex = Math.max(0, myIndex - 5);
  const endIndex = Math.min(queueList.length, myIndex + 6);
  const nearbyList = queueList.slice(startIndex, endIndex);

  const getStatusColor = (status) => {
    const statusMap = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      CALLED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      DONE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      SKIPPED: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      WAITING: 'Chờ',
      CALLED: 'Đã gọi',
      IN_PROGRESS: 'Đang khám',
      DONE: 'Xong',
      CANCELLED: 'Hủy',
      SKIPPED: 'Bỏ qua',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FaHashtag className="text-blue-600" />
        Các số gần nhất
      </h3>
      
      <div className="space-y-2">
        {nearbyList.map((item, index) => {
          const isMine = item.appointmentId === myAppointmentId || item.queueNumber === myQueueNumber;
          
          return (
            <div
              key={item.appointmentId || index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isMine
                  ? 'bg-blue-50 border-blue-300 border-2'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`text-lg font-bold ${
                  isMine ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  #{item.queueNumber}
                </div>
                {isMine && (
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    Của tôi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QueueNearbyList;

