import { FaBullhorn, FaUserMd } from 'react-icons/fa';

/**
 * CurrentQueueCard - Hiển thị số đang được gọi/khám
 */
function CurrentQueueCard({ currentQueue }) {
  if (!currentQueue || !currentQueue.queueNumber) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 text-center">
        <div className="text-gray-400 text-sm mb-2">Đang gọi/đang khám</div>
        <div className="text-gray-400 text-4xl font-bold">--</div>
        <div className="text-gray-500 text-xs mt-2">Chưa có số nào</div>
      </div>
    );
  }

  const isInProgress = currentQueue.status === 'IN_PROGRESS';
  const isCalled = currentQueue.status === 'CALLED';

  return (
    <div className={`${
      isInProgress ? 'bg-purple-50 border-purple-300' : 'bg-blue-50 border-blue-300'
    } rounded-lg p-6 border-2 text-center`}>
      <div className={`${
        isInProgress ? 'text-purple-600' : 'text-blue-600'
      } text-sm font-medium mb-2 flex items-center justify-center gap-2`}>
        {isInProgress ? (
          <>
            <FaUserMd />
            <span>Đang khám</span>
          </>
        ) : (
          <>
            <FaBullhorn />
            <span>Đang gọi</span>
          </>
        )}
      </div>
      <div className={`${
        isInProgress ? 'text-purple-700' : 'text-blue-700'
      } text-6xl font-bold mb-2`}>
        {currentQueue.queueNumber}
      </div>
      {currentQueue.patientName && (
        <div className={`${
          isInProgress ? 'text-purple-600' : 'text-blue-600'
        } text-xs`}>
          {currentQueue.patientName}
        </div>
      )}
    </div>
  );
}

export default CurrentQueueCard;

