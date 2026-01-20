import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useOutcomesData } from '../hooks/useFetchData'
import { useMatch } from '../App'

// Chart options configuration
const CHART_OPTIONS = [
  {
    key: 'pass_outcomes',
    label: 'Pass Outcomes',
    getData: (stats) => [
      { name: 'Successful', value: stats?.passesSuccessful || 0 },
      { name: 'Unsuccessful', value: stats?.passesUnsuccessful || 0 },
      { name: 'Key Pass', value: stats?.keyPasses || 0 },
      { name: 'Progressive Pass', value: stats?.progressivePasses || 0 },
      { name: 'Assist', value: stats?.assists || 0 },
    ]
  },
  {
    key: 'shot_outcomes',
    label: 'Shot Outcomes',
    getData: (stats) => [
      { name: 'Goal', value: stats?.goals || 0 },
      { name: 'On Target', value: stats?.shotsOnTarget || 0 },
      { name: 'Blocked', value: stats?.shotsBlocked || 0 },
      { name: 'Off Target', value: stats?.shotsOffTarget || 0 },
    ]
  },
  {
    key: 'event_types',
    label: 'Event Types',
    getData: (stats) => [
      { name: 'Passes', value: stats?.totalPasses || 0 },
      { name: 'Aerial Duels', value: stats?.aerialDuels || 0 },
      { name: 'Offensive Duels', value: stats?.offensiveDuels || 0 },
      { name: 'Defensive Duels', value: stats?.defensiveDuels || 0 },
      { name: 'Long Pass', value: stats?.longPasses || 0 },
      { name: 'Cross', value: stats?.crosses || 0 },
      { name: 'Tackle', value: stats?.tackles || 0 },
      { name: 'Loss', value: stats?.losses || 0 },
      { name: 'Clearance', value: stats?.clearances || 0 },
      { name: 'Recoveries', value: stats?.totalRecoveries || 0 },
    ]
  },
  {
    key: 'zones',
    label: 'Zones',
    getData: (stats) => [
      { name: 'Defensive', value: stats?.defensiveThird || 0 },
      { name: 'Middle', value: stats?.middleThird || 0 },
      { name: 'Attacking', value: stats?.attackingThird || 0 },
    ]
  }
]

function OutcomesChart() {
  const { selectedMatchId } = useMatch()
  const { data: outcomesData, loading, error } = useOutcomesData(selectedMatchId)

  const [selectedOption, setSelectedOption] = useState(CHART_OPTIONS[0])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionSelect = (option) => {
    setSelectedOption(option)
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-900">Pass Outcomes</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Pass Outcomes</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-red-500">Error loading data</p>
        </div>
      </div>
    )
  }

  const chartData = selectedOption.getData(outcomesData)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {/* Header with dropdown */}
      <div className="relative mb-4" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 -ml-2 transition-colors"
        >
          <h3 className="font-semibold text-blue-600 text-lg">{selectedOption.label}</h3>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {CHART_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  selectedOption.key === option.key
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="h-64">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="value"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OutcomesChart
