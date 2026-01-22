import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { useHeatmapData } from '../hooks/useFetchData'
import { useMatch } from '../App'

// Heatmap options
const HEATMAP_OPTIONS = [
  {
    key: 'passes',
    label: 'Passes',
    eventTypes: ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'],
    description: 'All passing actions'
  },
  {
    key: 'shots',
    label: 'Shots',
    eventTypes: ['Shot'],
    description: 'All shot locations'
  },
  {
    key: 'recoveries',
    label: 'Recoveries',
    eventTypes: ['Recovery', 'Interception'],
    description: 'Ball recovery positions'
  },
  {
    key: 'defensive',
    label: 'Defensive Actions',
    eventTypes: ['Tackle', 'Defensive Duel', 'Block', 'Clearance', 'Interception'],
    description: 'All defensive events'
  },
  {
    key: 'losses',
    label: 'Losses',
    eventTypes: ['Loss', 'Ball Lost'],
    description: 'Ball loss locations'
  },
]

// Color gradient for heatmap (green -> blue -> cyan -> yellow -> orange -> red)
const GRADIENT_COLORS = [
  { stop: 0.0, color: [0, 0, 0, 0] },       // Transparent
  { stop: 0.1, color: [0, 0, 255, 0.4] },   // Blue
  { stop: 0.25, color: [0, 255, 255, 0.6] }, // Cyan
  { stop: 0.4, color: [0, 255, 0, 0.7] },   // Green
  { stop: 0.55, color: [255, 255, 0, 0.8] }, // Yellow
  { stop: 0.7, color: [255, 165, 0, 0.9] }, // Orange
  { stop: 0.85, color: [255, 0, 0, 1] },    // Red
  { stop: 1.0, color: [255, 0, 0, 1] },     // Red
]

function TeamHeatmap() {
  const { selectedMatchId } = useMatch()
  const [selectedOption, setSelectedOption] = useState(HEATMAP_OPTIONS[0])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

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
    if (!canvas || !container || !heatmapData || heatmapData.length === 0) return

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Set canvas size
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    // Get max value for normalization
    const maxVal = Math.max(...heatmapData.map(p => p.count), 1)

    // Create a temporary canvas for the intensity map
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')

    // Draw intensity circles (grayscale)
    heatmapData.forEach(point => {
      // NORMALIZATION:
      // X (%) = X_raw * 1.05 / 100
      // Y (%) = Y_raw * 0.95 / 100

      const normalizedXPercent = (point.x * 1.05) / 100
      const normalizedYPercent = (point.y * 0.95) / 100

      const x = normalizedXPercent * width
      const y = normalizedYPercent * height

      const intensity = point.count / maxVal
      const radius = Math.max(40, 60 * intensity + 30) // Larger radius for smoother blending

      const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      tempCtx.beginPath()
      tempCtx.fillStyle = gradient
      tempCtx.arc(x, y, radius, 0, Math.PI * 2)
      tempCtx.fill()
    })

    // Get the intensity data
    const imageData = tempCtx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Create output image data
    const outputData = ctx.createImageData(width, height)
    const output = outputData.data

    // Map grayscale intensity to color gradient
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255 // Use alpha as intensity
      if (alpha > 0.02) { // Threshold to avoid noise
        const color = getColorAtValue(Math.min(alpha * 1.5, 1)) // Boost intensity a bit
        output[i] = color[0]
        output[i + 1] = color[1]
        output[i + 2] = color[2]
        output[i + 3] = Math.round(color[3] * 255 * 0.85) // Slightly transparent
      }
    }

    ctx.putImageData(outputData, 0, 0)

    // Apply blur effect using CSS filter
    canvas.style.filter = 'blur(8px)'
  }, [heatmapData, getColorAtValue])

  // Redraw on data change or resize
  useEffect(() => {
    drawHeatmap()

    const handleResize = () => drawHeatmap()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawHeatmap])

  // Calculate total events
  const totalEvents = heatmapData?.reduce((sum, p) => sum + p.count, 0) || 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-900">{selectedOption.label}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg min-h-[420px]">
          <p className="text-gray-500">Loading heatmap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4">{selectedOption.label}</h3>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg min-h-[420px]">
          <p className="text-red-500">Error loading heatmap data</p>
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

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {HEATMAP_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleOptionSelect(option)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedOption.key === option.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700'
                  }`}
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

      {/* Soccer Field with Heatmap */}
      {/* Maintain 105:68 aspect ratio for the container */}
      <div ref={containerRef} className="relative flex-1 rounded-lg overflow-hidden border-2 border-green-700" style={{ aspectRatio: '105/68', width: '100%', minHeight: 'auto' }}>
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
          {/* Lines Group */}
          <g fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5">
            {/* Outer Boundary */}
            <rect x="0" y="0" width="105" height="68" />

            {/* Center Line */}
            <line x1="52.5" y1="0" x2="52.5" y2="68" />

            {/* Center Circle */}
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.4" fill="rgba(255,255,255,0.8)" stroke="none" />

            {/* Left Penalty Area */}
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            {/* Left Goal Area */}
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            {/* Left Penalty Spot */}
            <circle cx="11" cy="34" r="0.4" fill="rgba(255,255,255,0.8)" stroke="none" />
            {/* Left Arc */}
            <path d="M 16.5 26.68 A 9.15 9.15 0 0 1 16.5 41.32" />

            {/* Right Penalty Area */}
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            {/* Right Goal Area */}
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
            {/* Right Penalty Spot */}
            <circle cx="94" cy="34" r="0.4" fill="rgba(255,255,255,0.8)" stroke="none" />
            {/* Right Arc */}
            <path d="M 88.5 26.68 A 9.15 9.15 0 0 0 88.5 41.32" />

            {/* Corner Arcs */}
            <path d="M 0 1 A 1 1 0 0 0 1 0" />
            <path d="M 0 67 A 1 1 0 0 1 1 68" />
            <path d="M 104 0 A 1 1 0 0 1 105 1" />
            <path d="M 104 68 A 1 1 0 0 1 105 67" />

            {/* Goals */}
            <rect x="-1" y="30.34" width="2" height="7.32" stroke="white" strokeWidth="0.5" />
            <rect x="105" y="30.34" width="2" height="7.32" stroke="white" strokeWidth="0.5" />
          </g>
        </svg>

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
          <div className="flex items-center gap-2">
            <span className="text-[10px]">Low</span>
            <div
              className="w-16 h-3 rounded"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,255,0.6), rgba(0,255,255,0.7), rgba(0,255,0,0.8), rgba(255,255,0,0.9), rgba(255,165,0,0.95), rgba(255,0,0,1))'
              }}
            />
            <span className="text-[10px]">High</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamHeatmap
