import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { useHeatmapData } from '../hooks/useFetchData'
import { useMatch } from '../App'

// Heatmap options configuration
const HEATMAP_OPTIONS = [
  { key: 'attacking', label: 'Attacking Activity', eventTypes: ['Shot', 'Cross', 'Through Pass', 'Key Pass'] },
  { key: 'recovery', label: 'Recovery Heatmap', eventTypes: ['Recovery', 'Interception'] },
  { key: 'loss', label: 'Loss Heatmap', eventTypes: ['Loss', 'Ball Lost'] },
  { key: 'defensive', label: 'Defensive Actions', eventTypes: ['Tackle', 'Defensive Duel', 'Block', 'Clearance'] },
  { key: 'crosses', label: 'Crosses', eventTypes: ['Cross'] },
  { key: 'aerial', label: 'Aerial Duels', eventTypes: ['Aerial Duel', 'Header'] },
]

function ActivityHeatmap() {
  const { selectedMatchId } = useMatch()
  const [selectedOption, setSelectedOption] = useState(HEATMAP_OPTIONS[0])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const { data: heatmapData, loading, error } = useHeatmapData(selectedMatchId, selectedOption.eventTypes)

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

  // Get max value for intensity calculation
  const getMaxValue = () => {
    if (!heatmapData || heatmapData.length === 0) return 1
    return Math.max(...heatmapData.map(p => p.count), 1)
  }

  // Get color intensity based on count
  const getPointStyle = (count, maxVal) => {
    const intensity = count / maxVal
    const size = Math.max(20, Math.min(50, 20 + intensity * 30))
    const opacity = Math.max(0.3, Math.min(0.9, 0.3 + intensity * 0.6))
    return { size, opacity }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-900">{selectedOption.label}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg min-h-[300px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4">{selectedOption.label}</h3>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg min-h-[300px]">
          <p className="text-red-500">Error loading data</p>
        </div>
      </div>
    )
  }

  const maxVal = getMaxValue()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
      {/* Header with dropdown */}
      <div className="relative mb-4" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 -ml-2 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 text-lg">{selectedOption.label}</h3>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {HEATMAP_OPTIONS.map((option) => (
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

      {/* Soccer Field */}
      <div className="relative flex-1 min-h-[400px] rounded-lg overflow-hidden border-2 border-green-700">
        {/* Field background with stripes */}
        <div className="absolute inset-0 bg-green-600">
          {/* Vertical stripes */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: `${(i * 100) / 12}%`,
                width: `${100 / 12}%`,
                backgroundColor: i % 2 === 0 ? 'rgb(22 163 74)' : 'rgb(21 128 61)',
              }}
            />
          ))}
        </div>

        {/* Field markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 66.67" preserveAspectRatio="none">
          {/* Outer boundary */}
          <rect x="2" y="2" width="96" height="62.67" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />

          {/* Center line */}
          <line x1="50" y1="2" x2="50" y2="64.67" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />

          {/* Center circle */}
          <circle cx="50" cy="33.33" r="9" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
          <circle cx="50" cy="33.33" r="0.5" fill="rgba(255,255,255,0.6)" />

          {/* Left penalty area */}
          <rect x="2" y="16.67" width="16" height="33.33" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
          {/* Left goal area */}
          <rect x="2" y="24.67" width="6" height="17.33" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
          {/* Left penalty spot */}
          <circle cx="12" cy="33.33" r="0.5" fill="rgba(255,255,255,0.6)" />

          {/* Right penalty area */}
          <rect x="82" y="16.67" width="16" height="33.33" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
          {/* Right goal area */}
          <rect x="92" y="24.67" width="6" height="17.33" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
          {/* Right penalty spot */}
          <circle cx="88" cy="33.33" r="0.5" fill="rgba(255,255,255,0.6)" />
        </svg>

        {/* Heatmap points */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 66.67" preserveAspectRatio="none">
          <defs>
            <radialGradient id="heatGradient">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.9)" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.5)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>
          </defs>
          {heatmapData && heatmapData.map((point, index) => {
            const { size, opacity } = getPointStyle(point.count, maxVal)
            // Convert x (0-100) and y (0-100) to viewBox coordinates
            const x = (point.x / 100) * 96 + 2
            const y = (point.y / 100) * 62.67 + 2
            const radius = (size / 100) * 10

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={radius}
                fill={`rgba(239, 68, 68, ${opacity})`}
                style={{ filter: 'blur(2px)' }}
              />
            )
          })}
        </svg>

        {/* Attack direction indicator */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-gray-800/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
          Attack Direction <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}

export default ActivityHeatmap
