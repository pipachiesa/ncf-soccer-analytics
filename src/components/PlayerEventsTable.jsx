import { useMemo } from 'react'

// Color mapping for event types
const EVENT_TYPE_COLORS = {
  'Pass': 'bg-blue-100 text-blue-700',
  'Long Pass': 'bg-blue-100 text-blue-700',
  'Shot': 'bg-orange-100 text-orange-700',
  'Cross': 'bg-blue-100 text-blue-700',
  'Tackle': 'bg-emerald-100 text-emerald-700',
  'Recovery': 'bg-emerald-100 text-emerald-700',
  'Interception': 'bg-emerald-100 text-emerald-700',
  'Defensive Duel': 'bg-emerald-100 text-emerald-700',
  'Aerial Duel': 'bg-purple-100 text-purple-700',
  'Offensive Duel': 'bg-purple-100 text-purple-700',
  'Loss': 'bg-red-100 text-red-700',
  'Clearance': 'bg-gray-100 text-gray-700',
  'Block': 'bg-gray-100 text-gray-700',
  'Foul Committed': 'bg-yellow-100 text-yellow-700',
  'Foul Won': 'bg-teal-100 text-teal-700',
  'GK Action': 'bg-indigo-100 text-indigo-700',
}

// Events that make more sense to show as ratio (successful/total)
const RATIO_EVENTS = ['Pass', 'Long Pass', 'Shot', 'Cross', 'Tackle', 'Defensive Duel', 'Aerial Duel', 'Offensive Duel']

function PlayerEventsTable({ events, loading }) {
  const getEventColor = (eventType) => {
    return EVENT_TYPE_COLORS[eventType] || 'bg-gray-100 text-gray-700'
  }

  // Aggregate events by type
  const aggregatedEvents = useMemo(() => {
    if (!events || events.length === 0) return []

    const counts = {}

    events.forEach(event => {
      const type = event.event_type || 'Unknown'
      if (!counts[type]) {
        counts[type] = {
          eventType: type,
          total: 0,
          successful: 0,
          unsuccessful: 0,
        }
      }
      counts[type].total++

      // Count outcomes
      const outcome = event.outcome?.toLowerCase() || ''
      if (outcome.includes('successful') || outcome.includes('won') || outcome === 'goal' || outcome === 'assist' || outcome === 'key pass') {
        counts[type].successful++
      } else if (outcome.includes('unsuccessful') || outcome.includes('lost') || outcome === 'blocked' || outcome === 'off target' || outcome === 'saved') {
        counts[type].unsuccessful++
      }
    })

    // Convert to array and sort by total count
    return Object.values(counts).sort((a, b) => b.total - a.total)
  }, [events])

  const totalEvents = events?.length || 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Player Events Summary</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!events || events.length === 0 || aggregatedEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Player Events Summary</h3>
        <p className="text-gray-500 text-sm">No events available for this player</p>
      </div>
    )
  }

  // Helper to format success value based on event type
  const formatSuccess = (event) => {
    const hasOutcomes = event.successful > 0 || event.unsuccessful > 0
    if (!hasOutcomes) return '-'

    if (RATIO_EVENTS.includes(event.eventType)) {
      // Show as ratio: successful/total
      return `${event.successful}/${event.total}`
    } else {
      // Show as percentage
      const rate = Math.round((event.successful / (event.successful + event.unsuccessful)) * 100)
      return `${rate}%`
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">Player Events Summary</h3>
        <span className="text-sm text-gray-500">{totalEvents} total events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header - Event Types as columns */}
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 min-w-[80px]">Metric</th>
              {aggregatedEvents.map((event) => (
                <th key={event.eventType} className="text-center py-3 px-2 min-w-[80px]">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventColor(event.eventType)}`}>
                    {event.eventType}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Total */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-3 text-sm font-medium text-gray-600">Total</td>
              {aggregatedEvents.map((event) => (
                <td key={event.eventType} className="py-3 px-2 text-center">
                  <span className="text-lg font-bold text-gray-900">{event.total}</span>
                </td>
              ))}
            </tr>
            {/* Row 2: Success (ratio or %) */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-3 text-sm font-medium text-gray-600">Success</td>
              {aggregatedEvents.map((event) => (
                <td key={event.eventType} className="py-3 px-2 text-center">
                  <span className="text-sm font-medium text-green-600">
                    {formatSuccess(event)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PlayerEventsTable
