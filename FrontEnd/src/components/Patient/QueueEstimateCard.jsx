import { FaClock, FaUsers } from 'react-icons/fa';

/**
 * QueueEstimateCard - Hiển thị ước lượng còn bao nhiêu lượt trước bệnh nhân
 */
function QueueEstimateCard({ aheadCount, estimatedMinutes }) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-8 border-2 border-orange-300 shadow-lg">
      <div className="flex items-center justify-center gap-2 mb-6">
        <FaUsers className="text-orange-600 text-2xl" />
        <span className="text-orange-800 font-bold text-lg">Ước lượng thời gian chờ</span>
      </div>
      
      <div className="text-center">
        <div className="text-orange-700 text-6xl font-bold mb-4 drop-shadow-lg">
          {aheadCount !== null && aheadCount !== undefined ? aheadCount : 0}
        </div>
        <div className="text-orange-700 text-base font-semibold mb-4 bg-white/50 rounded-full px-6 py-2 inline-block">
          {aheadCount === 0 
            ? '🎉 Đến lượt bạn rồi!' 
            : aheadCount === 1
            ? 'Còn 1 lượt trước bạn'
            : `Còn ${aheadCount} lượt trước bạn`
          }
        </div>

        {estimatedMinutes !== null && estimatedMinutes !== undefined && estimatedMinutes > 0 && (
          <div className="flex items-center justify-center gap-2 text-orange-700 text-sm font-medium border-t border-orange-300 pt-4 mt-4">
            <FaClock className="text-lg" />
            <span>Ước tính: ~{estimatedMinutes} phút</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueEstimateCard;

