function PlayerStatsTable({ matchStats, onMatchClick, loading }) {
  const getMatchLabel = (matchId) => {
    if (matchId === 'ncf_ave_maria') return 'NCF vs Ave Maria'
    if (matchId === 'ncf_scad') return 'NCF vs SCAD'
    if (matchId === 'ncf_fl_memorial') return 'NCF vs FL Memorial'
    // Default: capitalize and format
    return matchId?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Match History</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!matchStats || matchStats.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Match History</h3>
        <p className="text-gray-500 text-sm">No match data available for this player</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 text-lg mb-4">Match History</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Partidos</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Goals / Shots</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Passes / Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {matchStats.map((stat, index) => (
              <tr
                key={stat.match_id || index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <button
                    onClick={() => onMatchClick?.(stat.match_id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium text-left"
                  >
                    {getMatchLabel(stat.match_id)}
                  </button>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-900 font-medium">
                    {stat.goals || 0} / {stat.shots || 0}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-900 font-medium">
                    {stat.passes || 0} / {stat.pass_accuracy ? `${Math.round(stat.pass_accuracy)}%` : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PlayerStatsTable
