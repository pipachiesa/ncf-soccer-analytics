import { Calendar, MapPin, User } from 'lucide-react'

// Match-specific data mapping
const matchDataMap = {
  'ncf_ave_maria': {
    date: '10/29/2025',
    location: 'Gyrene Field',
    referee: 'Cooper Huskey',
    opponent: 'AVE MARIA',
    opponentScore: 1,
    ncfScore: 3
  },
  'ncf_scad': {
    date: '10/11/2025',
    location: 'NCF Bayfront',
    referee: 'Aaron Gershon',
    opponent: 'SCAD',
    opponentScore: 1,
    ncfScore: 0
  },
  'ncf_fl_memorial': {
    date: '10/22/2025',
    location: 'NCF Bayfront',
    referee: 'Aaron Gershon',
    opponent: 'FLORIDA MEMORIAL',
    opponentScore: 0,
    ncfScore: 6
  }
}

function GameInfoCard({ match, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Loading match info...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">No match selected</div>
      </div>
    )
  }

  // Get match-specific data
  const matchData = matchDataMap[match.match_id] || {
    date: 'N/A',
    location: 'N/A',
    referee: 'N/A',
    opponent: 'OPPONENT',
    opponentScore: 0,
    ncfScore: 0
  }

  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-xl border border-gray-200 py-6 px-12 shadow-sm inline-block">
        {/* Score Display */}
        <div className="flex items-center justify-center gap-6 mb-4">
        <span className="text-xl font-bold text-gray-900 uppercase tracking-wide">
          {matchData.opponent}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-white bg-primary-600 px-4 py-2 rounded-lg">
            {matchData.opponentScore}-{matchData.ncfScore}
          </span>
        </div>
        <span className="text-xl font-bold text-gray-900 uppercase tracking-wide">
          NCF
        </span>
      </div>

      {/* Match Details */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-gray-400" />
          <span>{matchData.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-gray-400" />
          <span>{matchData.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-gray-400" />
          <span>Ref: {matchData.referee}</span>
        </div>
      </div>
      </div>
    </div>
  )
}

export default GameInfoCard
