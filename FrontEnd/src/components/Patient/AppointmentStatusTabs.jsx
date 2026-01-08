function AppointmentStatusTabs({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'all', label: 'Tất cả', status: null },
    { key: 'waiting', label: 'Đang chờ', status: ['WAITING', 'CALLED'] },
    { key: 'in_progress', label: 'Đang khám', status: ['IN_PROGRESS'] },
    { key: 'done', label: 'Hoàn thành', status: ['DONE'] },
    { key: 'cancelled', label: 'Đã hủy', status: ['CANCELLED'] },
  ];

  return (
    <div className="mb-6 flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key, tab.status)}
          className={`px-4 py-2 rounded-lg transition-colors font-medium ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default AppointmentStatusTabs;

