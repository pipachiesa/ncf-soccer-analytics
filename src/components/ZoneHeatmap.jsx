import { useZonePressure } from '../hooks/useFetchData'
import { useMatch } from '../App'

function ZoneHeatmap({ title = "Recovery Zones", subtitle = "Ball recoveries by pitch area" }) {
  const { selectedMatchId } = useMatch()
  const { data: zoneData, loading, error } = useZonePressure(selectedMatchId)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !zoneData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    )
  }

  const values = Object.values(zoneData)
  const maxVal = Math.max(...values, 1)

  const zones = [
    ['R3C1', 'R3C2', 'R3C3'],
    ['R2C1', 'R2C2', 'R2C3'],
    ['R1C1', 'R1C2', 'R1C3'],
  ]

  const getIntensityColor = (value) => {
    const intensity = value / maxVal
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.25) return 'bg-blue-100'
    if (intensity < 0.5) return 'bg-blue-200'
    if (intensity < 0.75) return 'bg-blue-300'
    return 'bg-blue-400'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Soccer pitch visualization */}
      <div className="relative aspect-[3/2] bg-green-600 rounded-lg overflow-hidden border-2 border-green-700">
        {/* Field markings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-2 border-green-400 rounded-full opacity-50"></div>
        </div>
        <div className="absolute left-0 top-1/4 bottom-1/4 w-12 border-2 border-green-400 border-l-0 opacity-50"></div>
        <div className="absolute right-0 top-1/4 bottom-1/4 w-12 border-2 border-green-400 border-r-0 opacity-50"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 opacity-50"></div>

        {/* Zone grid */}
        <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-1">
          {zones.flat().map((zone) => {
            const value = zoneData[zone] || 0
            return (
              <div
                key={zone}
                className={`${getIntensityColor(value)} rounded flex items-center justify-center transition-all duration-300 hover:scale-105`}
                title={`${zone}: ${value} actions`}
              >
                <span className="text-xs font-bold text-gray-800">{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs">
        <span className="text-gray-500">Low</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
        </div>
        <span className="text-gray-500">High</span>
      </div>
    </div>
  )
}

export default ZoneHeatmap
