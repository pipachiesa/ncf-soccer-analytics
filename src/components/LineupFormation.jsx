import { useMatchLineup } from '../hooks/useFetchData'

// 5-2-1-2 Formation configuration
// Positions use percentage coordinates (0-100) for x and y
const LINEUP_CONFIG = {
  formation: '5-2-1-2',
  positions: [
    { id: 'GK', name: 'GK', x: 50, y: 89 },
    { id: 'LWB', name: 'LWB', x: 12, y: 65 },
    { id: 'CB_L', name: 'CB', x: 28, y: 72 },
    { id: 'CB_C', name: 'CB', x: 50, y: 74 },
    { id: 'CB_R', name: 'CB', x: 72, y: 72 },
    { id: 'RWB', name: 'RWB', x: 88, y: 65 },
    { id: 'CM_L', name: 'CM', x: 35, y: 50 },
    { id: 'CM_R', name: 'CM', x: 65, y: 50 },
    { id: 'CAM', name: 'CAM', x: 50, y: 36 },
    { id: 'ST_L', name: 'ST', x: 35, y: 18 },
    { id: 'ST_R', name: 'ST', x: 65, y: 18 },
  ]
}

// Default lineup - will be replaced with actual data when available
const DEFAULT_LINEUP = [
  { position: 'GK', number: 1, name: 'Goalkeeper' },
  { position: 'LWB', number: 3, name: 'Left WB' },
  { position: 'CB_L', number: 4, name: 'Center Back' },
  { position: 'CB_C', number: 5, name: 'Center Back' },
  { position: 'CB_R', number: 6, name: 'Center Back' },
  { position: 'RWB', number: 2, name: 'Right WB' },
  { position: 'CM_L', number: 8, name: 'Midfielder' },
  { position: 'CM_R', number: 6, name: 'Midfielder' },
  { position: 'CAM', number: 10, name: 'Attacking Mid' },
  { position: 'ST_L', number: 9, name: 'Striker' },
  { position: 'ST_R', number: 11, name: 'Striker' },
]

function LineupFormation({ matchId, loading: externalLoading }) {
  const { data: lineupData, loading: lineupLoading } = useMatchLineup(matchId)

  const loading = externalLoading || lineupLoading

  // Use lineup from database, or fall back to defaults
  const lineup = (lineupData && lineupData.length > 0) ? lineupData : DEFAULT_LINEUP

  // Get player info for a position
  const getPlayerForPosition = (positionId) => {
    return lineup.find(p => p.position === positionId) || { number: '?', name: 'TBD' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col min-h-[480px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">Lineup Formation</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {LINEUP_CONFIG.formation}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Loading lineup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col min-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">Lineup Formation</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {LINEUP_CONFIG.formation}
        </span>
      </div>

      {/* Soccer Pitch */}
      <div className="relative flex-1 rounded-lg overflow-hidden">
        {/* Field background with stripes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top: `${(i * 100) / 8}%`,
                height: `${100 / 8}%`,
                backgroundColor: i % 2 === 0 ? '#2d8a4e' : '#249142',
              }}
            />
          ))}
        </div>

        {/* Field markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Outer boundary */}
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />

          {/* Center line */}
          <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />

          {/* Center circle */}
          <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.6)" />

          {/* Top penalty area (attacking end) */}
          <rect x="22" y="2" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          {/* Top goal area */}
          <rect x="34" y="2" width="32" height="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          {/* Top penalty spot */}
          <circle cx="50" cy="12" r="0.8" fill="rgba(255,255,255,0.6)" />
          {/* Top penalty arc */}
          <path d="M 35 18 A 10 10 0 0 0 65 18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />

          {/* Bottom penalty area (defensive end) */}
          <rect x="22" y="82" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          {/* Bottom goal area */}
          <rect x="34" y="92" width="32" height="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          {/* Bottom penalty spot */}
          <circle cx="50" cy="88" r="0.8" fill="rgba(255,255,255,0.6)" />
          {/* Bottom penalty arc */}
          <path d="M 35 82 A 10 10 0 0 1 65 82" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />

          {/* Corner arcs */}
          <path d="M 2 5 A 3 3 0 0 0 5 2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          <path d="M 95 2 A 3 3 0 0 0 98 5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          <path d="M 2 95 A 3 3 0 0 1 5 98" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          <path d="M 95 98 A 3 3 0 0 1 98 95" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        </svg>

        {/* Player markers */}
        <div className="absolute inset-0">
          {LINEUP_CONFIG.positions.map((pos) => {
            const player = getPlayerForPosition(pos.id)

            return (
              <div
                key={pos.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {/* Player circle */}
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                  {player.number}
                </div>
                {/* Player name */}
                <span className="mt-1 text-[10px] md:text-xs text-white font-medium bg-black/50 px-2 py-0.5 rounded whitespace-nowrap">
                  {player.name.split(' ').pop()}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LineupFormation
