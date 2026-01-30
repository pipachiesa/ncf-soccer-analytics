
import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronDown, Info } from 'lucide-react'
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
    const dropdownRef = useRef(null)

    // Fetch ALL events for this match
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

        // 2. Data Layer
        if (selectedViz.type === 'canvas') {
            const points = tacticalData[selectedViz.dataKey] || []
            // Shot Map Styling
            if (selectedViz.id === 'shot_map') {
                // Split by outcome
                const goals = points.filter(p => p.shotType === 'goal')
                const onTarget = points.filter(p => p.shotType === 'on_target')
                const other = points.filter(p => ['off_target', 'blocked'].includes(p.shotType))

                drawPoints(ctx, other, width, height, { color: '#9ca3af', radius: 3, shape: 'circle' })
                drawPoints(ctx, onTarget, width, height, { color: '#000000', radius: 4, shape: 'circle' })
                drawPoints(ctx, goals, width, height, { color: '#000000', radius: 5, shape: 'star' }) // star not impl, use square or distinct
                drawPoints(ctx, goals, width, height, { color: '#000000', radius: 6, shape: 'square' })
            } else {
                drawPoints(ctx, points, width, height, { color: '#000000', radius: 3 })
            }
        }
        else if (selectedViz.type === 'canvas_dual') {
            const attempts = tacticalData.crosses_attempted || []
            const successful = tacticalData.crosses_successful || []
            // Draw failed first
            const failed = attempts.filter(a => !successful.includes(a)) // This check might fail on obj ref. 
            // Better: buildTacticalEvents separates them? No, attempted includes successful typically in raw logic, 
            // but our tacticalMapping separates successful into own array. 
            // Use ID check or just draw attempts as gray, successful as black on top.

            drawPoints(ctx, attempts, width, height, { color: '#d1d5db', radius: 3 })
            drawPoints(ctx, successful, width, height, { color: '#000000', radius: 4, shape: 'triangle' })
        }
        else if (selectedViz.type === 'canvas_assist') {
            const assists = tacticalData.assists || []
            const keyPasses = tacticalData.key_passes || []

            drawPoints(ctx, keyPasses, width, height, { color: '#6b7280', radius: 3 })
            drawPoints(ctx, assists, width, height, { color: '#000000', radius: 4, shape: 'square' })

            // Optional lines could go here if linking logic existed
        }
        else if (selectedViz.type === 'canvas_arrows') {
            const prog = tacticalData.progressive_passes || []
            drawArrows(ctx, prog, width, height, { color: '#000000', width: 2 })
        }
        else if (selectedViz.type === 'canvas_recoveries') {
            const rec = tacticalData.recoveries || []
            const int = tacticalData.interceptions || []
            const blk = tacticalData.blocks || []

            drawPoints(ctx, blk, width, height, { color: '#9ca3af', radius: 3, shape: 'square' }) // Blocks
            drawPoints(ctx, int, width, height, { color: '#4b5563', radius: 3, shape: 'triangle' }) // Int
            drawPoints(ctx, rec, width, height, { color: '#000000', radius: 4 }) // Rec
        }
        else if (selectedViz.type === 'canvas_pressure') {
            const press = tacticalData.pressures || []
            const duels = [...(tacticalData.duels_defensive || []), ...(tacticalData.duels_offensive || [])]

            if (press.length > 0) {
                drawPoints(ctx, press, width, height, { color: '#ef4444', radius: 4, alpha: 0.5 }) // Pressure usually heat-like, use red dots
            } else {
                // Fallback to duels
                const def = tacticalData.duels_defensive || []
                const off = tacticalData.duels_offensive || []
                drawPoints(ctx, def, width, height, { color: '#000000', radius: 3 })
                drawPoints(ctx, off, width, height, { color: '#9ca3af', radius: 3, shape: 'triangle' })
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
                    ...(tacticalData.crosses_attempted || []), // attempted for broader view? User said "actions"
                    ...(tacticalData.progressive_passes || [])
                ]
                // Filter x > 0.70 normalized (0.7 * 1.05 = 0.735 approx)
                source = candidates.filter(e => {
                    // e.x_norm is already present? No, buildTacticalEvents adds it?
                    // Let's re-normalize or check buildTacticalEvents.
                    // YES, buildTacticalEvents returns objects with x_norm.
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

                {/* Canvas or Chart Rendering */}
                {(selectedViz.type.startsWith('chart')) ? (
                    <div className="w-full h-full flex items-center justify-center">
                        {chartData ? (
                            <div className="w-full max-w-md h-64 flex rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                                {/* Defensive Third */}
                                <div className="h-full bg-red-50 flex flex-col items-center justify-center border-r border-gray-100 transition-all" style={{ width: '33.3%' }}>
                                    <span className="text-3xl font-bold text-gray-800">{chartData[0]}%</span>
                                    <span className="text-xs text-gray-500 uppercase mt-1">Defensive</span>
                                </div>
                                {/* Middle Third */}
                                <div className="h-full bg-gray-50 flex flex-col items-center justify-center border-r border-gray-100 transition-all" style={{ width: '33.3%' }}>
                                    <span className="text-3xl font-bold text-gray-800">{chartData[1]}%</span>
                                    <span className="text-xs text-gray-500 uppercase mt-1">Middle</span>
                                </div>
                                {/* Attacking Third */}
                                <div className="h-full bg-blue-50 flex flex-col items-center justify-center transition-all" style={{ width: '33.3%' }}>
                                    <span className="text-3xl font-bold text-gray-800">{chartData[2]}%</span>
                                    <span className="text-xs text-gray-500 uppercase mt-1">Attacking</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400">No data available</div>
                        )}
                    </div>
                ) : (
                    <div className="relative w-full max-w-[600px] aspect-[105/68]">
                        <canvas
                            ref={canvasRef}
                            width={630} // 105 * 6
                            height={408} // 68 * 6
                            className="w-full h-full object-contain drop-shadow-sm"
                        />

                        {/* Clean Legend Overlay */}
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 shadow-sm pointer-events-none">
                            <div className="font-semibold mb-1">{selectedViz.label}</div>
                            {/* Dynamic legend based on type */}
                            {selectedViz.id === 'shot_map' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black"></span> Goal/Target</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Off/Blocked</span>
                                </div>
                            )}
                            {selectedViz.type === 'canvas_dual' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-black"></div> Successful</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Attempt</span>
                                </div>
                            )}
                            {selectedViz.id === 'chance_creation' && (
                                <div className="flex gap-3">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-black"></span> Assist</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Key Pass</span>
                                </div>
                            )}
                            {selectedViz.type === 'grid' && <span>% share of zone activity</span>}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default TacticalPitchCard
