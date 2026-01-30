function PlayerInfoCard({ player, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center h-20">
          <p className="text-gray-500">Select a player to view details</p>
        </div>
      </div>
    )
  }

  // Get position abbreviation
  const getPositionAbbr = (position) => {
    if (!position) return '-'
    const posMap = {
      'Goalkeeper': 'GK',
      'Defender': 'DEF',
      'Center Back': 'CB',
      'Left Back': 'LB',
      'Right Back': 'RB',
      'Wing Back': 'WB',
      'Midfielder': 'MID',
      'Central Midfielder': 'CM',
      'Defensive Midfielder': 'CDM',
      'Attacking Midfielder': 'CAM',
      'Left Midfielder': 'LM',
      'Right Midfielder': 'RM',
      'Winger': 'WNG',
      'Left Winger': 'LW',
      'Right Winger': 'RW',
      'Forward': 'FWD',
      'Striker': 'ST',
      'Center Forward': 'CF'
    }
    return posMap[position] || position.slice(0, 3).toUpperCase()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-6">
        {/* Jersey Number Circle */}
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-3xl shadow-md">
          {player.shirt_number || '#'}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{player.player || 'Unknown Player'}</h2>
          <p className="text-gray-600 mt-1">Team: <span className="font-medium">NCF</span></p>
          <p className="text-gray-500 text-sm">
            {player.position || 'Position not specified'}
          </p>
        </div>

        {/* Position Badge */}
        <div className="text-right">
          <div className="inline-flex items-center justify-center bg-gray-100 rounded-lg px-4 py-2">
            <span className="text-2xl font-bold text-gray-700">
              {getPositionAbbr(player.position)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Position</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      {player.total_actions && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-8">
          <div>
            <p className="text-2xl font-bold text-gray-900">{player.total_actions || 0}</p>
            <p className="text-xs text-gray-500">Total Actions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{player.goals || 0}</p>
            <p className="text-xs text-gray-500">Goals</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{player.assists || 0}</p>
            <p className="text-xs text-gray-500">Assists</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{player.passes || 0}</p>
            <p className="text-xs text-gray-500">Passes</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerInfoCard
