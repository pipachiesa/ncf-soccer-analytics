
import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronDown, Info, BookOpen } from 'lucide-react'
import { useEvents } from '../../hooks/useFetchData'
import { buildTacticalEvents, computeZoneControl, computeTerritoryByThirds } from '../../utils/tacticalMapping'
import { drawPitchBase, drawPoints, drawArrows, drawGridHeatmap } from '../../utils/canvasUtils'

// Visualization Options Configuration
const VIZ_OPTIONS = [
    {
        id: 'shot_map', label: 'Shot Map (Analytical)', type: 'canvas', dataKey: 'shots',
        description: 'All shot attempts plotted by location, showing goals, on-target efforts, and off-target/blocked shots.'
    },
    {
        id: 'zone_control', label: 'Zone Control Heatmap', type: 'grid', dataKey: 'all_creative',
        description: 'Grid-based intensity map showing areas of highest possession and creative activity.'
    },
    {
        id: 'final_third', label: 'Final Third Actions', type: 'grid_filtered', dataKey: 'final_third_actions',
        description: 'Concentration of attacking actions (shots, key passes, crosses) in the final third.'
    },
    {
        id: 'territory', label: 'Territory by Thirds', type: 'chart_thirds', dataKey: 'possession_events',
        description: 'Distribution of possession across defensive, middle, and attacking thirds of the pitch.'
    },
    {
        id: 'losses', label: 'Losses by Thirds', type: 'chart_thirds_losses', dataKey: 'losses',
        description: 'Where the team loses possession most frequently, split by defensive, middle, and attacking zones.'
    },
    {
        id: 'crossing', label: 'Crossing Map', type: 'canvas_dual', dataKey: 'crosses',
        description: 'Location of all crossing attempts, differentiating successful deliveries from failed crosses.'
    },
    {
        id: 'chance_creation', label: 'Chance Creation Map', type: 'canvas_assist', dataKey: 'chances',
        description: 'Origin points of key passes and assists that created scoring opportunities.'
    },
    {
        id: 'progressive', label: 'Progressive Passing Map', type: 'canvas_arrows', dataKey: 'progressive_passes',
        description: 'Forward-intent passes that advance the ball toward the opponent\'s goal.'
    },
    {
        id: 'recoveries_map', label: 'Defensive Recoveries Map', type: 'canvas_recoveries', dataKey: 'recoveries_combined',
        description: 'Locations where possession was regained through recoveries, interceptions, and blocks.'
    },
    {
        id: 'pressure', label: 'Pressure / Duels Map', type: 'canvas_pressure', dataKey: 'pressure_duels',
        description: 'Defensive pressure events and duel locations showing where the team contests possession.'
    }
]

function TacticalPitchCard({ matchId }) {
    const [selectedViz, setSelectedViz] = useState(VIZ_OPTIONS[0])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Fetch all events for this match
    // We don't filter by type efficiently here because we need "everything" to classify locally
    const { data: allEvents, loading, error } = useEvents(matchId)

    const canvasRef = useRef(null)

    // Process Data
    const tacticalData = useMemo(() => {
        if (!allEvents) return null
        return buildTacticalEvents(allEvents)
    }, [allEvents])

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Drawing Logic
    useEffect(() => {
        if (!canvasRef.current || !tacticalData || loading) return
        const ctx = canvasRef.current.getContext('2d')
        const width = canvasRef.current.width
        const height = canvasRef.current.height

        // 1. Draw Base
        drawPitchBase(ctx, width, height)

        // 2. Data Layer: Better colors for dark green pitch
        if (selectedViz.type === 'canvas') {
            const points = tacticalData[selectedViz.dataKey] || []
            // Shot Map Styling
            if (selectedViz.id === 'shot_map') {
                // Split by outcome
                const goals = points.filter(p => p.shotType === 'goal')
                const onTarget = points.filter(p => p.shotType === 'on_target')
                const other = points.filter(p => ['off_target', 'blocked'].includes(p.shotType))

                drawPoints(ctx, other, width, height, { color: 'rgba(255,255,255,0.6)', radius: 4, shape: 'circle' })
                drawPoints(ctx, onTarget, width, height, { color: '#facc15', radius: 5, shape: 'circle' }) // Yellow-400
                drawPoints(ctx, goals, width, height, { color: '#facc15', radius: 7, shape: 'square' }) // Yellow-400
            } else {
                drawPoints(ctx, points, width, height, { color: '#ffffff', radius: 4 })
            }
        }
        else if (selectedViz.type === 'canvas_dual') {
            const attempts = tacticalData.crosses_attempted || []
            const successful = tacticalData.crosses_successful || []

            drawPoints(ctx, attempts, width, height, { color: 'rgba(255,255,255,0.5)', radius: 4 })
            drawPoints(ctx, successful, width, height, { color: '#facc15', radius: 5, shape: 'triangle' }) // Yellow-400
        }
        else if (selectedViz.type === 'canvas_assist') {
            const assists = tacticalData.assists || []
            const keyPasses = tacticalData.key_passes || []

            drawPoints(ctx, keyPasses, width, height, { color: '#22d3ee', radius: 4 }) // Cyan-400
            drawPoints(ctx, assists, width, height, { color: '#facc15', radius: 5, shape: 'square' }) // Yellow-400
        }
        else if (selectedViz.type === 'canvas_arrows') {
            const prog = tacticalData.progressive_passes || []
            drawArrows(ctx, prog, width, height, { color: '#facc15', width: 2 }) // Yellow-400
        }
        else if (selectedViz.type === 'canvas_recoveries') {
            const rec = tacticalData.recoveries || []
            const int = tacticalData.interceptions || []
            const blk = tacticalData.blocks || []

            drawPoints(ctx, blk, width, height, { color: 'rgba(255,255,255,0.5)', radius: 4, shape: 'square' }) // Blocks
            drawPoints(ctx, int, width, height, { color: '#22d3ee', radius: 4, shape: 'triangle' })
            drawPoints(ctx, rec, width, height, { color: '#facc15', radius: 5 })
        }
        else if (selectedViz.type === 'canvas_pressure') {
            const press = tacticalData.pressures || []

            if (press.length > 0) {
                drawPoints(ctx, press, width, height, { color: '#f87171', radius: 5, alpha: 0.7 })
            } else {
                // Fallback to duels
                const def = tacticalData.duels_defensive || []
                const off = tacticalData.duels_offensive || []
                drawPoints(ctx, def, width, height, { color: '#facc15', radius: 4 })
                drawPoints(ctx, off, width, height, { color: '#22d3ee', radius: 4, shape: 'triangle' })
            }
        }
        else if (selectedViz.type === 'grid' || selectedViz.type === 'grid_filtered') {
            let source = []
            if (selectedViz.id === 'zone_control') {
                // Combine "creative" events
                source = [
                    ...(tacticalData.passes_completed || []),
                    ...(tacticalData.progressive_passes || []),
                    ...(tacticalData.key_passes || []),
                    ...(tacticalData.crosses_successful || [])
                ]
            } else if (selectedViz.id === 'final_third') {
                const candidates = [
                    ...(tacticalData.shots || []),
                    ...(tacticalData.key_passes || []),
                    ...(tacticalData.crosses_attempted || []),
                    ...(tacticalData.progressive_passes || [])
                ]
                // Filter to attacking third only
                source = candidates.filter(e => {
                    return e.x_norm > (1.05 * 0.66) // Attacking third
                })
            }

            const grid = computeZoneControl(source, 6, 4)
            drawGridHeatmap(ctx, grid, width, height)
        }

    }, [selectedViz, tacticalData, loading])

    // Helper for Chart Data (Territory / Losses)
    const chartData = useMemo(() => {
        if (!tacticalData) return null
        if (selectedViz.type === 'chart_thirds') {
            const source = [
                ...(tacticalData.passes_completed || []),
                ...(tacticalData.progressive_passes || []),
                ...(tacticalData.key_passes || [])
            ]
            return computeTerritoryByThirds(source)
        }
        if (selectedViz.type === 'chart_thirds_losses') {
            return computeTerritoryByThirds(tacticalData.losses || [])
        }
        return null
    }, [tacticalData, selectedViz])

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[500px]">

            {/* Header with Dropdown */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                        {selectedViz.label}
                        <ChevronDown size={20} className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 z-10 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 max-h-96 overflow-y-auto">
                            {VIZ_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setSelectedViz(opt); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2
                    ${selectedViz.id === opt.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info/Legend Hint */}
                <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Info size={14} />
                    <span>Analytical View</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <div className="text-gray-500">Loading events...</div>
                    </div>
                )}

                {/* Chart Rendering */}
                {(selectedViz.type.startsWith('chart')) ? (
                    <div className="w-full flex items-center justify-center">
                        {chartData ? (
                            <div className="w-full aspect-[105/68] flex rounded-lg overflow-hidden border border-gray-200 shadow-md bg-white">
                                {/* Defensive Third */}
                                <div className="h-full bg-red-200 flex flex-col items-center justify-center border-r border-gray-200 transition-all" style={{ width: '33.3%' }}>
                                    <span className="text-5xl font-bold text-gray-800">{chartData[0]}%</span>
                                    <span className="text-sm text-gray-600 uppercase mt-2 tracking-wide">Defensive</span>
                                </div>
                                {/* Middle Third */}
                                <div className="h-full bg-gray-200 flex flex-col items-center justify-center border-r border-gray-300 transition-all" style={{ width: '33.3%' }}>
                                    <span className="text-5xl font-bold text-gray-800">{chartData[1]}%</span>
                                    <span className="text-sm text-gray-600 uppercase mt-2 tracking-wide">Middle</span>
                                </div>
                                {/* Attacking Third */}
                                <div className="h-full bg-blue-200 flex flex-col items-center justify-center transition-all" style={{ width: '33.3%' }}>
                                    <span className="text-5xl font-bold text-gray-800">{chartData[2]}%</span>
                                    <span className="text-sm text-gray-600 uppercase mt-2 tracking-wide">Attacking</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400">No data available</div>
                        )}
                    </div>
                ) : (
                    <div className="relative w-full aspect-[105/68]">
                        <canvas
                            ref={canvasRef}
                            width={840}
                            height={544}
                            className="w-full h-full rounded-lg shadow-md"
                        />

                        {/* Clean Legend Overlay */}
                        <div className="absolute bottom-3 left-3 bg-gray-900/85 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white shadow-lg pointer-events-none">
                            <div className="font-semibold mb-1">{selectedViz.label}</div>
                            {/* Dynamic legend based on type */}
                            {selectedViz.id === 'shot_map' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Goal/Target</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/60"></span> Off/Blocked</span>
                                </div>
                            )}
                            {selectedViz.type === 'canvas_dual' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-yellow-400"></div> Successful</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/50"></span> Attempt</span>
                                </div>
                            )}
                            {selectedViz.id === 'chance_creation' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400"></span> Assist</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Key Pass</span>
                                </div>
                            )}
                            {selectedViz.type === 'grid' && (
                                <div className="flex items-center gap-2">
                                    <span>% zone activity</span>
                                    <div className="flex h-2 w-16 rounded overflow-hidden" style={{ background: 'linear-gradient(to right, #dbeafe, #3b82f6, #1e40af)' }}>
                                    </div>
                                </div>
                            )}
                            {selectedViz.id === 'recoveries_map' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Recovery</span>
                                    <span className="flex items-center gap-1"><div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400"></div> Interception</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-white/50"></span> Block</span>
                                </div>
                            )}
                            {selectedViz.id === 'progressive' && (
                                <span className="flex items-center gap-1">Forward passes advancing toward goal</span>
                            )}
                            {selectedViz.id === 'pressure' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Defensive Duel</span>
                                    <span className="flex items-center gap-1"><div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400"></div> Offensive Duel</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Glossary Section */}
            <div className="border-t border-gray-100">
                <button
                    onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span className="font-medium">Visualization Glossary</span>
                    </div>
                    <ChevronDown size={16} className={`transform transition-transform ${isGlossaryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGlossaryOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                            {VIZ_OPTIONS.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`p-3 rounded-lg border transition-colors ${selectedViz.id === opt.id
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <div className={`font-medium text-sm ${selectedViz.id === opt.id ? 'text-blue-700' : 'text-gray-800'
                                        }`}>
                                        {opt.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {opt.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TacticalPitchCard
