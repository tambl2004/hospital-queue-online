import { FaClock, FaUsers } from 'react-icons/fa';

/**
 * QueueEstimateCard - Hiển thị ước lượng còn bao nhiêu lượt trước bệnh nhân
 */
function QueueEstimateCard({ aheadCount, estimatedMinutes }) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border-2 border-orange-200">
      <div className="flex items-center justify-center gap-2 mb-4">
        <FaUsers className="text-orange-600 text-lg" />
        <span className="text-orange-800 font-semibold">Ước lượng thời gian chờ</span>
      </div>
      
      <div className="text-center">
        <div className="text-orange-700 text-4xl font-bold mb-2">
          {aheadCount !== null && aheadCount !== undefined ? aheadCount : 0}
        </div>
        <div className="text-orange-600 text-sm mb-4">
          {aheadCount === 0 
            ? 'Đến lượt bạn rồi!' 
            : aheadCount === 1
            ? 'Còn 1 lượt trước bạn'
            : `Còn ${aheadCount} lượt trước bạn`
          }
        </div>

        {estimatedMinutes !== null && estimatedMinutes !== undefined && estimatedMinutes > 0 && (
          <div className="flex items-center justify-center gap-2 text-orange-700 text-sm border-t border-orange-200 pt-4">
            <FaClock />
            <span>Ước tính: ~{estimatedMinutes} phút</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueEstimateCard;

