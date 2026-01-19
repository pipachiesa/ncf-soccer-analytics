import { useState, useRef, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTimeline } from '../hooks/useFetchData'
import { useMatch } from '../App'

// Chart configuration options
const CHART_OPTIONS = [
  {
    key: 'xg_shots',
    label: 'xG & Shots',
    lines: [
      { dataKey: 'xg', name: 'xG', color: '#22c55e', strokeWidth: 2 },
      { dataKey: 'shots', name: 'Shots', color: '#3b82f6', strokeWidth: 2 }
    ]
  },
  {
    key: 'recoveries',
    label: 'Recoveries',
    lines: [
      { dataKey: 'recoveries', name: 'Recoveries', color: '#22c55e', strokeWidth: 2 }
    ]
  },
  {
    key: 'losses',
    label: 'Losses',
    lines: [
      { dataKey: 'losses', name: 'Losses', color: '#ef4444', strokeWidth: 2 }
    ]
  },
  {
    key: 'duels',
    label: 'Duels',
    lines: [
      { dataKey: 'duels', name: 'Duels', color: '#3b82f6', strokeWidth: 2 },
      { dataKey: 'duelsWon', name: 'Duels Won', color: '#22c55e', strokeWidth: 2 }
    ]
  },
  {
    key: 'passes',
    label: 'Passes',
    lines: [
      { dataKey: 'passes', name: 'Passes', color: '#3b82f6', strokeWidth: 2 },
      { dataKey: 'passesSuccessful', name: 'Successful', color: '#22c55e', strokeWidth: 2 }
    ]
  }
]

// Generate empty timeline data for display when no data
const generateEmptyTimeline = (interval = 5) => {
  const timeline = []
  for (let i = 0; i <= 90; i += interval) {
    timeline.push({
      minute: i,
      xg: 0,
      shots: 0,
      recoveries: 0,
      losses: 0,
      duels: 0,
      duelsWon: 0,
      passes: 0,
      passesSuccessful: 0
    })
  }
  return timeline
}

function PerformanceChart() {
  const { selectedMatchId } = useMatch()
  const { data: timelineData, loading, error } = useTimeline(selectedMatchId, 5)
  const [selectedOption, setSelectedOption] = useState(CHART_OPTIONS[0])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
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

  // Use actual data or empty placeholder
  const chartData = timelineData && timelineData.length > 0
    ? timelineData
    : generateEmptyTimeline(5)

  const hasData = timelineData && timelineData.length > 0 &&
    timelineData.some(d => d.shots > 0 || d.xg > 0 || d.recoveries > 0 || d.passes > 0)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-[340px]">
        <h3 className="font-semibold text-gray-900 mb-1">xG & Shots</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {/* Header with dropdown */}
      <div className="mb-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 cursor-pointer hover:text-gray-700"
        >
          <h3 className="font-semibold text-gray-900">{selectedOption.label}</h3>
          {isOpen ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
            {CHART_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  selectedOption.key === option.key
                    ? 'text-blue-600 font-medium bg-blue-50'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        {!hasData && !loading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">No timeline data available for this match</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="minute"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
                labelFormatter={(value) => `Minute ${value}`}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
              {selectedOption.lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  dot={{ fill: line.color, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default PerformanceChart
