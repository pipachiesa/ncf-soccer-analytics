// Color mapping for different metric types
const colorClasses = {
  primary: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
}

function MetricBox({
  title,
  primaryValue,
  secondaryValue,
  color = 'primary',
  isExpanded,
  onToggle,
  expandedContent = [],
  stats,
  loading
}) {
  const colors = colorClasses[color] || colorClasses.primary

  // Helper to get expanded detail value
  const getDetailValue = (detail) => {
    if (!stats) return 0
    const rawValue = stats[detail.field]
    if (detail.format) {
      return detail.format(rawValue, stats)
    }
    return rawValue || 0
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-24"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border ${colors.border} shadow-sm`}>
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>

        {/* Primary value */}
        <div className={`text-2xl font-bold ${colors.text}`}>
          {primaryValue}
        </div>

        {/* Secondary value */}
        {secondaryValue && (
          <div className="text-sm text-gray-500 mt-1">
            {secondaryValue}
          </div>
        )}
      </div>

      {/* Expanded content - always visible */}
      {expandedContent.length > 0 && (
        <div className={`px-4 pb-4 border-t ${colors.border}`}>
          <div className="pt-3 space-y-2">
            {expandedContent.map((detail, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{detail.label}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {getDetailValue(detail)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MetricBox
