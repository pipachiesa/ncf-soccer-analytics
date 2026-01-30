import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

// Heatmap options configuration for player analysis
const HEATMAP_OPTIONS = [
  { key: 'all', label: 'All Actions', eventTypes: [], description: 'All player events' },
  { key: 'passes', label: 'Passes', eventTypes: ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'], description: 'Pass locations' },
  { key: 'shots', label: 'Shots', eventTypes: ['Shot'], description: 'Shot locations' },
  { key: 'defensive', label: 'Defensive Actions', eventTypes: ['Tackle', 'Defensive Duel', 'Recovery', 'Interception', 'Block', 'Clearance'], description: 'Tackles, recoveries, duels' },
  { key: 'losses', label: 'Losses', eventTypes: ['Loss', 'Ball Lost'], description: 'Ball loss locations' },
]

// Color gradient for heatmap
const GRADIENT_COLORS = [
  { stop: 0.0, color: [0, 0, 0, 0] },
  { stop: 0.1, color: [0, 0, 255, 0.4] },
  { stop: 0.25, color: [0, 255, 255, 0.6] },
  { stop: 0.4, color: [0, 255, 0, 0.7] },
  { stop: 0.55, color: [255, 255, 0, 0.8] },
  { stop: 0.7, color: [255, 165, 0, 0.9] },
  { stop: 0.85, color: [255, 0, 0, 1] },
  { stop: 1.0, color: [255, 0, 0, 1] },
]

function PlayerHeatmap({ events, title, showDropdown = false, compact = false }) {
  const [selectedOption, setSelectedOption] = useState(HEATMAP_OPTIONS[0])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const canvasRef = useRef(null)
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
  const filteredEvents = useCallback(() => {
    if (!events) return []
    if (selectedOption.eventTypes.length === 0) return events

    return events.filter(e => {
      if (selectedOption.eventTypes.includes(e.event_type)) return true
      // For Loss heatmap, also include events with Lost/Unsuccessful outcome
      if (selectedOption.key === 'losses') {
        if (e.outcome === 'Lost' || e.outcome === 'Unsuccessful') return true
      }
      return false
    })
  }, [events, selectedOption])

  // Process events to heatmap data
  // Groups events into a 10x10 grid for density visualization
  // Flips coordinates to match field orientation (attack direction left to right)
  const processEventsToHeatmap = useCallback((eventsList) => {
    if (!eventsList || eventsList.length === 0) return []

    const gridSize = 10 // 10x10 grid cells
    const grid = {}

    eventsList.forEach(event => {
      let x = parseFloat(event.x ?? event.start_x ?? event.location_x)
      let y = parseFloat(event.y ?? event.start_y ?? event.location_y)

      if (isNaN(x) || isNaN(y)) return

      // Clamp to valid percentage range (0-100)
      x = Math.max(0, Math.min(100, x))
      y = Math.max(0, Math.min(100, y))

      // Flip Y axis only (sidelines)
      y = 100 - y

      const gridX = Math.floor(x / gridSize)
      const gridY = Math.floor(y / gridSize)
      const key = `${gridX}-${gridY}`

      if (!grid[key]) {
        grid[key] = {
          x: gridX * gridSize + gridSize / 2,
          y: gridY * gridSize + gridSize / 2,
          count: 0
        }
      }
      grid[key].count++
    })

    return Object.values(grid)
  }, [])

  // Interpolate color from gradient
  const getColorAtValue = useCallback((value) => {
    for (let i = 0; i < GRADIENT_COLORS.length - 1; i++) {
      const curr = GRADIENT_COLORS[i]
      const next = GRADIENT_COLORS[i + 1]
      if (value >= curr.stop && value <= next.stop) {
        const t = (value - curr.stop) / (next.stop - curr.stop)
        return [
          Math.round(curr.color[0] + t * (next.color[0] - curr.color[0])),
          Math.round(curr.color[1] + t * (next.color[1] - curr.color[1])),
          Math.round(curr.color[2] + t * (next.color[2] - curr.color[2])),
          curr.color[3] + t * (next.color[3] - curr.color[3])
        ]
      }
    }
    return GRADIENT_COLORS[GRADIENT_COLORS.length - 1].color
  }, [])

  // Draw heatmap on canvas
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const filtered = filteredEvents()
    const heatmapData = processEventsToHeatmap(filtered)

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    if (heatmapData.length === 0) return

    const maxVal = Math.max(...heatmapData.map(p => p.count), 1)

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')

    heatmapData.forEach(point => {
      // Convert percentage (0-100) to pixel position
      const x = (point.x / 100) * width
      const y = (point.y / 100) * height

      const intensity = point.count / maxVal
      const radius = compact ? Math.max(20, 35 * intensity + 15) : Math.max(30, 50 * intensity + 20)

      const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      tempCtx.beginPath()
      tempCtx.fillStyle = gradient
      tempCtx.arc(x, y, radius, 0, Math.PI * 2)
      tempCtx.fill()
    })

    const imageData = tempCtx.getImageData(0, 0, width, height)
    const data = imageData.data

    const outputData = ctx.createImageData(width, height)
    const output = outputData.data

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255
      if (alpha > 0.02) {
        const color = getColorAtValue(Math.min(alpha * 1.5, 1))
        output[i] = color[0]
        output[i + 1] = color[1]
        output[i + 2] = color[2]
        output[i + 3] = Math.round(color[3] * 255 * 0.85)
      }
    }

    ctx.putImageData(outputData, 0, 0)
    canvas.style.filter = 'blur(6px)'
  }, [filteredEvents, processEventsToHeatmap, getColorAtValue, compact])

  // Redraw on data change or resize
  useEffect(() => {
    drawHeatmap()
    const handleResize = () => drawHeatmap()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawHeatmap])

  const filtered = filteredEvents()
  const totalEvents = filtered?.length || 0

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col ${compact ? 'min-h-[250px]' : ''}`}>
      {/* Header with optional dropdown */}
      {showDropdown ? (
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
              {HEATMAP_OPTIONS.map((option) => (
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
      ) : (
        <h3 className="font-semibold text-gray-900 text-lg mb-4">{title || 'Player Heatmap'}</h3>
      )}

      {/* Soccer Field with Heatmap */}
      <div ref={containerRef} className="relative flex-1 rounded-lg overflow-hidden border-2 border-green-700" style={{ aspectRatio: '105/68', width: '100%' }}>
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

        {/* Heatmap Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: 'normal' }}
        />

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

        {/* Attack direction indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
          Attack <ArrowRight className="w-3 h-3" />
        </div>

        {/* Event count */}
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm font-medium">
          {totalEvents} events
        </div>

        {/* Color Legend */}
        {!compact && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Low</span>
              <div
                className="w-12 h-2 rounded"
                style={{
                  background: 'linear-gradient(to right, rgba(0,0,255,0.6), rgba(0,255,255,0.7), rgba(0,255,0,0.8), rgba(255,255,0,0.9), rgba(255,165,0,0.95), rgba(255,0,0,1))'
                }}
              />
              <span className="text-[10px]">High</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerHeatmap
