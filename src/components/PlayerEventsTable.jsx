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

// GK-specific outcome colors
const GK_OUTCOME_COLORS = {
  'Save': 'bg-green-100 text-green-700',
  'Saved': 'bg-green-100 text-green-700',
  'Claim': 'bg-indigo-100 text-indigo-700',
  'Catch': 'bg-indigo-100 text-indigo-700',
  'Caught': 'bg-indigo-100 text-indigo-700',
  'Collected': 'bg-indigo-100 text-indigo-700',
  'Punch': 'bg-purple-100 text-purple-700',
  'Punched': 'bg-purple-100 text-purple-700',
  'Distribution': 'bg-blue-100 text-blue-700',
  'Throw': 'bg-blue-100 text-blue-700',
  'Kick': 'bg-blue-100 text-blue-700',
}

// Events that make more sense to show as ratio (successful/total)
const RATIO_EVENTS = ['Pass', 'Long Pass', 'Shot', 'Cross', 'Tackle', 'Defensive Duel', 'Aerial Duel', 'Offensive Duel']

function PlayerEventsTable({ events, loading, isGoalkeeper, gkStats }) {
  const getEventColor = (eventType) => {
    return EVENT_TYPE_COLORS[eventType] || 'bg-gray-100 text-gray-700'
  }

  const getGKOutcomeColor = (outcome) => {
    // Check each key for partial match
    for (const [key, color] of Object.entries(GK_OUTCOME_COLORS)) {
      if (outcome.toLowerCase().includes(key.toLowerCase())) {
        return color
      }
    }
    return 'bg-gray-100 text-gray-700'
  }

  // Aggregate events by type (for outfield players)
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

  // Aggregate GK actions by outcome type
  const aggregatedGKActions = useMemo(() => {
    if (!events || events.length === 0 || !isGoalkeeper) return []

    const gkEvents = events.filter(e => e.event_type === 'GK Action')
    const passEvents = events.filter(e => e.event_type === 'Pass' || e.event_type === 'Long Pass')

    // Categorize GK actions
    const categories = {
      'Saves': { total: 0, successful: 0 },
      'Claims/Catches': { total: 0, successful: 0 },
      'Punches': { total: 0, successful: 0 },
      'Distribution': { total: 0, successful: 0 },
    }

    gkEvents.forEach(e => {
      const outcome = (e.outcome || '').toLowerCase()

      if (outcome.includes('save') || outcome === 'saved') {
        categories['Saves'].total++
        categories['Saves'].successful++
      } else if (outcome.includes('claim') || outcome.includes('catch') || outcome.includes('caught') || outcome.includes('collected')) {
        categories['Claims/Catches'].total++
        categories['Claims/Catches'].successful++
      } else if (outcome.includes('punch')) {
        categories['Punches'].total++
        categories['Punches'].successful++
      } else if (outcome.includes('distribution') || outcome.includes('throw') || outcome.includes('kick')) {
        categories['Distribution'].total++
        if (outcome.includes('success') || outcome.includes('accurate')) {
          categories['Distribution'].successful++
        }
      }
    })

    // Add passes as part of distribution
    passEvents.forEach(e => {
      categories['Distribution'].total++
      const outcome = e.outcome || ''
      if (['Successful', 'Assist', 'Key Pass', 'Progressive Pass'].includes(outcome)) {
        categories['Distribution'].successful++
      }
    })

    // Convert to array format
    return Object.entries(categories)
      .filter(([_, data]) => data.total > 0)
      .map(([category, data]) => ({
        eventType: category,
        total: data.total,
        successful: data.successful,
        unsuccessful: data.total - data.successful
      }))
  }, [events, isGoalkeeper])

  const totalEvents = events?.length || 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">
          {isGoalkeeper ? 'Goalkeeper Events Summary' : 'Player Events Summary'}
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!events || events.length === 0 || (isGoalkeeper ? aggregatedGKActions.length === 0 : aggregatedEvents.length === 0)) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">
          {isGoalkeeper ? 'Goalkeeper Events Summary' : 'Player Events Summary'}
        </h3>
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
      // Show as percentage or count
      if (event.total === event.successful) {
        return `${event.successful}/${event.total}`
      }
      const rate = Math.round((event.successful / event.total) * 100)
      return `${rate}%`
    }
  }

  // GK-specific format
  const formatGKSuccess = (event) => {
    if (event.eventType === 'Distribution') {
      // Show as ratio for distribution
      return `${event.successful}/${event.total}`
    }
    // For saves, claims, punches - just show the count
    return event.total.toString()
  }

  const displayData = isGoalkeeper ? aggregatedGKActions : aggregatedEvents

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">
          {isGoalkeeper ? 'Goalkeeper Events Summary' : 'Player Events Summary'}
        </h3>
        <span className="text-sm text-gray-500">{totalEvents} total events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header - Event Types as columns */}
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 min-w-[80px]">Metric</th>
              {displayData.map((event) => (
                <th key={event.eventType} className="text-center py-3 px-2 min-w-[80px]">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    isGoalkeeper ? 'bg-indigo-100 text-indigo-700' : getEventColor(event.eventType)
                  }`}>
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
              {displayData.map((event) => (
                <td key={event.eventType} className="py-3 px-2 text-center">
                  <span className="text-lg font-bold text-gray-900">{event.total}</span>
                </td>
              ))}
            </tr>
            {/* Row 2: Success (ratio or %) */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-3 text-sm font-medium text-gray-600">
                {isGoalkeeper ? 'Success' : 'Success'}
              </td>
              {displayData.map((event) => (
                <td key={event.eventType} className="py-3 px-2 text-center">
                  <span className="text-sm font-medium text-green-600">
                    {isGoalkeeper ? formatGKSuccess(event) : formatSuccess(event)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* GK Stats Summary Card - uses table-calculated values for consistency */}
      {isGoalkeeper && aggregatedGKActions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {aggregatedGKActions.find(a => a.eventType === 'Saves')?.total || 0}
              </div>
              <div className="text-xs text-green-600">Saves</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-700">
                {aggregatedGKActions.find(a => a.eventType === 'Claims/Catches')?.total || 0}
              </div>
              <div className="text-xs text-indigo-600">Claims/Catches</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">
                {aggregatedGKActions.find(a => a.eventType === 'Punches')?.total || 0}
              </div>
              <div className="text-xs text-purple-600">Punches</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              {(() => {
                const dist = aggregatedGKActions.find(a => a.eventType === 'Distribution')
                const rate = dist && dist.total > 0
                  ? Math.round((dist.successful / dist.total) * 100)
                  : 0
                return <div className="text-2xl font-bold text-blue-700">{rate}%</div>
              })()}
              <div className="text-xs text-blue-600">Distribution Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerEventsTable
