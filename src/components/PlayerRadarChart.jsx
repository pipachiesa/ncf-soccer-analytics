import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

function PlayerRadarChart({ playerStats, allPlayersStats }) {
  // Calculate normalized values (0-100) for radar chart
  // Normalize based on max values across all players for fair comparison
  const getMaxValues = () => {
    if (!allPlayersStats || allPlayersStats.length === 0) {
      return {
        passes: 100,
        shots: 10,
        duels_won: 20,
        recoveries: 30,
        tackles: 15,
        aerial_duels: 10
      }
    }

    return {
      passes: Math.max(...allPlayersStats.map(p => p.passes || 0), 1),
      shots: Math.max(...allPlayersStats.map(p => p.shots || 0), 1),
      duels_won: Math.max(...allPlayersStats.map(p => (p.duels_won || 0)), 1),
      recoveries: Math.max(...allPlayersStats.map(p => (p.total_recoveries || p.recoveries || 0)), 1),
      tackles: Math.max(...allPlayersStats.map(p => (p.tackles || 0)), 1),
      aerial_duels: Math.max(...allPlayersStats.map(p => (p.aerial_duels || 0)), 1)
    }
  }

  const maxValues = getMaxValues()

  const normalizeValue = (value, max) => {
    if (!value || !max) return 0
    return Math.min(Math.round((value / max) * 100), 100)
  }

  const radarData = [
    {
      metric: 'Passes',
      value: normalizeValue(playerStats?.passes, maxValues.passes),
      fullMark: 100
    },
    {
      metric: 'Shots',
      value: normalizeValue(playerStats?.shots, maxValues.shots),
      fullMark: 100
    },
    {
      metric: 'Duels Won',
      value: normalizeValue(playerStats?.duels_won, maxValues.duels_won),
      fullMark: 100
    },
    {
      metric: 'Aerial Duels',
      value: normalizeValue(playerStats?.aerial_duels, maxValues.aerial_duels),
      fullMark: 100
    },
    {
      metric: 'Recoveries',
      value: normalizeValue(playerStats?.total_recoveries || playerStats?.recoveries, maxValues.recoveries),
      fullMark: 100
    },
    {
      metric: 'Tackles',
      value: normalizeValue(playerStats?.tackles, maxValues.tackles),
      fullMark: 100
    }
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200 text-sm">
          <p className="font-medium text-gray-900">{payload[0].payload.metric}</p>
          <p className="text-blue-600">{payload[0].value}%</p>
        </div>
      )
    }
    return null
  }

  if (!playerStats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Player Radar</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Select a player to view stats</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 text-lg mb-2">Player Radar</h3>
      <p className="text-xs text-gray-500 mb-2">Relative to team (normalized 0-100)</p>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Stats"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PlayerRadarChart
