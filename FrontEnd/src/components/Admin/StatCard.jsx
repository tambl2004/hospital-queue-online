const StatCard = ({ title, value, icon: Icon, change, changeType = 'neutral', subtitle, iconColor = 'bg-indigo-500' }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {change && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-semibold ${getChangeColor()}`}>{change}</span>
            </div>
          )}
        </div>
        <div className={`${iconColor} w-16 h-16 rounded-xl flex items-center justify-center text-white`}>
          {Icon && <Icon className="text-2xl" />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

