import { ChevronDown } from 'lucide-react'

function PlayerSelector({ players, selectedPlayer, onPlayerChange, loading }) {
  if (loading) {
    return (
      <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  return (
    <div className="relative">
      <select
        value={selectedPlayer || ''}
        onChange={(e) => onPlayerChange(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <option value="" disabled>Select a player</option>
        {players?.map((player) => (
          <option key={player.player_id || player.player} value={player.player}>
            {player.player}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        size={16}
      />
    </div>
  )
}

export default PlayerSelector
