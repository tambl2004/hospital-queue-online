import { FaBullhorn, FaUserMd } from 'react-icons/fa';

/**
 * CurrentQueueCard - Hiển thị số đang được gọi/khám
 */
function CurrentQueueCard({ currentQueue }) {
  if (!currentQueue || !currentQueue.queueNumber) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-300 text-center shadow-md">
        <div className="text-gray-500 text-base font-medium mb-2">Đang gọi/đang khám</div>
        <div className="text-gray-400 text-4xl font-bold mb-1">--</div>
        <div className="text-gray-500 text-sm mt-2">Chưa có số nào</div>
      </div>
    );
  }

  const isInProgress = currentQueue.status === 'IN_PROGRESS';
  const isCalled = currentQueue.status === 'CALLED';

  return (
    <div className={`${
      isInProgress 
        ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400 shadow-md' 
        : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-md'
    } rounded-lg p-6 border text-center transition-all duration-300`}>
      <div className={`${
        isInProgress ? 'text-purple-700' : 'text-blue-700'
      } text-base font-semibold mb-3 flex items-center justify-center gap-2`}>
        {isInProgress ? (
          <>
            <FaUserMd className="text-xl" />
            <span>Đang khám</span>
          </>
        ) : (
          <>
            <FaBullhorn className="text-xl" />
            <span>Đang gọi</span>
          </>
        )}
      </div>
      <div className={`${
        isInProgress ? 'text-purple-800' : 'text-blue-800'
      } text-7xl font-bold mb-3 drop-shadow-lg`}>
        #{currentQueue.queueNumber}
      </div>
      {currentQueue.patientName && (
        <div className={`${
          isInProgress ? 'text-purple-700' : 'text-blue-700'
        } text-sm font-medium bg-white/50 rounded-full px-4 py-1 inline-block`}>
          {currentQueue.patientName}
        </div>
      )}
    </div>
  );
}

export default CurrentQueueCard;

