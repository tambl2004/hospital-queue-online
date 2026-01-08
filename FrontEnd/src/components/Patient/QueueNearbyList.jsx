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
    <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaHashtag className="text-blue-600 text-2xl" />
        Các số gần nhất
      </h3>
      
      <div className="space-y-3">
        {nearbyList.map((item, index) => {
          const isMine = item.appointmentId === myAppointmentId || item.queueNumber === myQueueNumber;
          
          return (
            <div
              key={item.appointmentId || index}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                isMine
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400 shadow-md'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${
                  isMine ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  #{item.queueNumber}
                </div>
                {isMine && (
                  <span className="text-sm font-bold text-blue-700 bg-blue-200 px-3 py-1 rounded-full border border-blue-400">
                    Của tôi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
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

