import { useTopPerformers } from '../hooks/useFetchData'
import { useMatch } from '../App'

function TopPerformers() {
  const { selectedMatchId } = useMatch()
  const { data: players, loading, error } = useTopPerformers(selectedMatchId)

  const getPlayerName = (player) => {
    return player?.players?.first_name || ''
  }

  const getPosition = (player) => {
    const name = getPlayerName(player).toUpperCase()
    if (name.includes('GK') || name === 'MATHIS') return 'Goalkeeper'
    if (['PABLO', 'HANNES', 'MAYA', 'MARTIN'].includes(name)) return 'Defense'
    if (['PEDRI', 'ANDRES', 'GUTI', 'LAWRENCE', 'FABIAN'].includes(name)) return 'Midfielder'
    if (['CAMERON', 'JADEN', 'DUKE'].includes(name)) return 'Attacker'
    return 'Player'
  }

  const formatName = (name) => {
    if (!name) return ''
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Top Performers</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !players?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Top Performers</h3>
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    )
  }

  const rankColors = [
    'bg-blue-500',
    'bg-blue-400',
    'bg-blue-300',
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Top Performers</h3>
        <p className="text-sm text-gray-500">Leading players this match</p>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.id || index}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className={`w-8 h-8 ${rankColors[index]} text-white rounded-full flex items-center justify-center font-bold text-sm`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {formatName(getPlayerName(player))}
              </p>
              <p className="text-xs text-gray-500">{getPosition(player)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{player.total_actions || 0}</p>
              <p className="text-xs text-gray-500">Touches</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">{player.pass_accuracy || 0}%</p>
              <p className="text-xs text-gray-500">Pass Acc.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopPerformers
