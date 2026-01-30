import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

// Touch map options configuration
const TOUCHMAP_OPTIONS = [
  { key: 'all', label: 'All Actions', eventTypes: [], description: 'All player events' },
  { key: 'passes', label: 'Passes', eventTypes: ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'], description: 'Pass locations' },
  { key: 'shots', label: 'Shots', eventTypes: ['Shot'], description: 'Shot locations' },
  { key: 'defensive', label: 'Defensive Actions', eventTypes: ['Tackle', 'Defensive Duel', 'Recovery', 'Interception', 'Block', 'Clearance'], description: 'Tackles, recoveries, duels' },
  { key: 'losses', label: 'Losses', eventTypes: ['Loss', 'Ball Lost'], description: 'Ball loss locations' },
]

// Color mapping for event types
const EVENT_COLORS = {
  // Passes - Blue shades
  'Pass': '#3b82f6',
  'Long Pass': '#2563eb',
  'Short Pass': '#60a5fa',
  'Through Pass': '#1d4ed8',
  'Cross': '#93c5fd',
  // Shots - Orange/Red
  'Shot': '#f97316',
  'Goal': '#22c55e',
  // Defensive - Green shades
  'Tackle': '#10b981',
  'Defensive Duel': '#059669',
  'Recovery': '#34d399',
  'Interception': '#6ee7b7',
  'Block': '#047857',
  'Clearance': '#a7f3d0',
  // Losses - Red
  'Loss': '#ef4444',
  'Ball Lost': '#dc2626',
  // Duels
  'Offensive Duel': '#8b5cf6',
  'Aerial Duel': '#a855f7',
  // Default
  'default': '#6b7280'
}

function PlayerTouchMap({ events, loading }) {
  const [selectedOption, setSelectedOption] = useState(TOUCHMAP_OPTIONS[0])
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredEvent, setHoveredEvent] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const dropdownRef = useRef(null)
  const containerRef = useRef(null)

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

  // Filter events based on selected option
  const getFilteredEvents = () => {
    if (!events) return []
    if (selectedOption.eventTypes.length === 0) return events

    return events.filter(e => {
      if (selectedOption.eventTypes.includes(e.event_type)) return true
      if (selectedOption.key === 'losses') {
        if (e.outcome === 'Lost' || e.outcome === 'Unsuccessful') return true
      }
      return false
    })
  }

  // Get color for an event
  const getEventColor = (event) => {
    // Special case for goals
    if (event.event_type === 'Shot' && event.outcome === 'Goal') {
      return EVENT_COLORS['Goal']
    }
    return EVENT_COLORS[event.event_type] || EVENT_COLORS['default']
  }

  // Convert coordinates to percentage for CSS positioning
  // Data is in 0-100 scale
  // Flip Y only (sidelines) to match field orientation
  const normalizeCoord = (x, y) => {
    let normX = parseFloat(x) || 0
    let normY = parseFloat(y) || 0

    // Clamp to valid percentage range (0-100)
    normX = Math.max(0, Math.min(100, normX))
    normY = Math.max(0, Math.min(100, normY))

    // Flip Y axis only (sidelines)
    return { x: normX, y: 100 - normY }
  }

  const handleMouseEnter = (event, e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
    setHoveredEvent(event)
  }

  const handleMouseLeave = () => {
    setHoveredEvent(null)
  }

  const filteredEvents = getFilteredEvents()
  const totalEvents = filteredEvents.length

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-900">Touch Map</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg min-h-[300px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

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

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {TOUCHMAP_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedOption.key === option.key ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                <div className={`font-medium ${selectedOption.key === option.key ? 'text-blue-600' : 'text-gray-900'}`}>
                  {option.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Soccer Field with Touch Points */}
      <div
        ref={containerRef}
        className="relative flex-1 rounded-lg overflow-hidden border-2 border-green-700"
        style={{ aspectRatio: '105/68', width: '100%' }}
      >
        {/* Field background with stripes */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: `${(i * 100) / 12}%`,
                width: `${100 / 12}%`,
                backgroundColor: i % 2 === 0 ? '#2d8a4e' : '#249142',
              }}
            />
          ))}
        </div>

        {/* Field markings (105x68 standard) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 105 68" preserveAspectRatio="none">
          <g fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5">
            <rect x="0" y="0" width="105" height="68" />
            <line x1="52.5" y1="0" x2="52.5" y2="68" />
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.4" fill="rgba(255,255,255,0.8)" stroke="none" />
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            <circle cx="11" cy="34" r="0.4" fill="rgba(255,255,255,0.8)" stroke="none" />
            <path d="M 16.5 26.68 A 9.15 9.15 0 0 1 16.5 41.32" />
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
            <circle cx="94" cy="34" r="0.4" fill="rgba(255,255,255,0.8)" stroke="none" />
            <path d="M 88.5 26.68 A 9.15 9.15 0 0 0 88.5 41.32" />
            <path d="M 0 1 A 1 1 0 0 0 1 0" />
            <path d="M 0 67 A 1 1 0 0 1 1 68" />
            <path d="M 104 0 A 1 1 0 0 1 105 1" />
            <path d="M 104 68 A 1 1 0 0 1 105 67" />
            <rect x="-1" y="30.34" width="2" height="7.32" stroke="white" strokeWidth="0.5" />
            <rect x="105" y="30.34" width="2" height="7.32" stroke="white" strokeWidth="0.5" />
          </g>
        </svg>

        {/* Touch Points Layer */}
        <div className="absolute inset-0">
          {filteredEvents.map((event, index) => {
            const rawX = event.x ?? event.start_x ?? event.location_x
            const rawY = event.y ?? event.start_y ?? event.location_y

            if (rawX === null || rawX === undefined || rawY === null || rawY === undefined) {
              return null
            }

            const { x, y } = normalizeCoord(rawX, rawY)
            const color = getEventColor(event)

            return (
              <div
                key={event.id || index}
                className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150 hover:z-10"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: color,
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => handleMouseEnter(event, e)}
                onMouseLeave={handleMouseLeave}
              />
            )
          })}
        </div>

        {/* Tooltip */}
        {hoveredEvent && (
          <div
            className="absolute bg-black/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm pointer-events-none z-50"
            style={{
              left: Math.min(tooltipPos.x + 10, containerRef.current?.offsetWidth - 150),
              top: tooltipPos.y - 40,
            }}
          >
            <div className="font-semibold">{hoveredEvent.event_type}</div>
            <div className="text-gray-300">
              {hoveredEvent.outcome && <span>{hoveredEvent.outcome}</span>}
              {hoveredEvent.minute !== undefined && <span> • {hoveredEvent.minute}'</span>}
            </div>
          </div>
        )}

        {/* Attack direction indicator */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
          Attack Direction <ArrowRight className="w-3 h-3" />
        </div>

        {/* Event count */}
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm font-medium">
          {totalEvents} events
        </div>

        {/* Color Legend */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="space-y-1">
            {selectedOption.key === 'all' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  <span>Pass</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f97316' }} />
                  <span>Shot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <span>Defensive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                  <span>Loss</span>
                </div>
              </>
            )}
            {selectedOption.key === 'shots' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                  <span>Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f97316' }} />
                  <span>Shot</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerTouchMap
