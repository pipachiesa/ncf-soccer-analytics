import React, { useEffect, useRef, useState, useMemo } from 'react'

function ShotMap({ shots }) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 400, height: 500 })
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, player: '', minute: '', outcome: '' })

    // Filter and validate shots with jitter
    const processedShots = useMemo(() => {
        if (!shots || !Array.isArray(shots)) return []

        const validShots = shots.filter(shot => {
            const x = parseFloat(shot.x)
            const y = parseFloat(shot.y)
            return !isNaN(x) && !isNaN(y) && shot.event_type === 'Shot'
        })

        // Group by proximity
        const coordMap = new Map()
        validShots.forEach(shot => {
            const x = parseFloat(shot.x)
            const y = parseFloat(shot.y)
            const key = `${Math.floor(x)}-${Math.floor(y)}`
            if (!coordMap.has(key)) {
                coordMap.set(key, [])
            }
            coordMap.get(key).push(shot)
        })

        // Apply jitter
        const processed = []
        coordMap.forEach((group) => {
            if (group.length === 1) {
                processed.push({ ...group[0], jitterX: 0, jitterY: 0 })
            } else {
                group.forEach((shot, idx) => {
                    const angle = (idx / group.length) * 2 * Math.PI
                    const radius = 1.2
                    processed.push({
                        ...shot,
                        jitterX: Math.cos(angle) * radius,
                        jitterY: Math.sin(angle) * radius
                    })
                })
            }
        })

        return processed
    }, [shots])

    // Update dimensions - VERTICAL half pitch
    useEffect(() => {
        if (!containerRef.current) return

        const updateDimensions = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth
                // Vertical half pitch: Width=68m, Height=52.5m (or less for emphasis)
                // Ratio: 68/52.5 = 1.29 (Width/Height)
                // Canvas Height should be Width / 1.29

                // However, user said "enfasis en el area", maybe we zoom in a bit more?
                // Let's keep strict half pitch for data accuracy first.
                // 68m width, 52.5m height
                const h = w * (52.5 / 68)
                setDimensions({ width: w, height: h })
            }
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    // Draw
    useEffect(() => {
        if (!canvasRef.current || dimensions.width === 0) return

        const canvas = canvasRef.current
        const { width, height } = dimensions
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, width, height)

        // Dot grid background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = '#f0f0f0'
        const gridSize = 20
        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                ctx.beginPath()
                ctx.arc(x, y, 1, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Pitch dimensions
        // Vertical: Width corresponds to 68m. Height corresponds to 52.5m.
        const pitchWidth = 68
        const halfLength = 52.5

        const scaleX = width / pitchWidth // pixels per meter (width)
        const scaleY = height / halfLength // pixels per meter (height)

        // Pitch markings (Black/Dark Gray)
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2

        // Outer box (Half pitch boundary)
        ctx.strokeRect(0, 0, width, height)

        // Goal Post (Top Center)
        const goalWidthM = 7.32
        const goalX = (width - (goalWidthM * scaleX)) / 2
        // Draw goal slightly outside or on line? Usually on line.
        // Let's draw it just above the line
        ctx.beginPath()
        ctx.moveTo(goalX, 0)
        ctx.lineTo(goalX + goalWidthM * scaleX, 0)
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.lineWidth = 2

        // Goal Area (5.5m deep, 18.32m wide)
        // In vertical: Width=18.32, Height=5.5. Centered X, Top Y.
        const goalAreaWidth = 18.32 * scaleX
        const goalAreaHeight = 5.5 * scaleY
        const goalAreaX = (width - goalAreaWidth) / 2

        ctx.strokeRect(goalAreaX, 0, goalAreaWidth, goalAreaHeight)

        // Penalty Area (16.5m deep, 40.32m wide)
        const penAreaWidth = 40.32 * scaleX
        const penAreaHeight = 16.5 * scaleY
        const penAreaX = (width - penAreaWidth) / 2

        ctx.strokeRect(penAreaX, 0, penAreaWidth, penAreaHeight)

        // Penalty Spot (11m from goal line)
        const penSpotY = 11 * scaleY
        const penSpotX = width / 2

        ctx.beginPath()
        ctx.arc(penSpotX, penSpotY, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#000000'
        ctx.fill()

        // Penalty Arc
        // Radius 9.15m, center at penalty spot.
        // Only draw the part outside the penalty box (y > 16.5m)
        const arcRadius = 9.15 * scaleY // approximate scaling if square
        // Start angle: where arc intersects line y=16.5
        // dy = 16.5 - 11 = 5.5
        // angle = acos(5.5 / 9.15)
        const angle = Math.acos(5.5 / 9.15)

        ctx.beginPath()
        ctx.arc(penSpotX, penSpotY, arcRadius, angle, Math.PI - angle)
        ctx.stroke()

        // Center Circle Arc (at bottom)
        // Center is at (width/2, height)
        const centerRadius = 9.15 * scaleY
        ctx.beginPath()
        ctx.arc(width / 2, height, centerRadius, Math.PI, 2 * Math.PI)
        ctx.stroke()

        // Draw Shots
        processedShots.forEach(shot => {
            // Mapping:
            // Data X: 0-100 (100 is opponent goal line). We want X=100 at Y=0.
            // Data Y: 0-100 (50 is center). We want Y=50 at X=width/2.

            const rawX = parseFloat(shot.x)
            const rawY = parseFloat(shot.y)

            // Normalize to meters first?
            // Standard pitch 105x68
            // X_meters = (rawX / 100) * 105. 
            // Y_meters = (rawY / 100) * 68.

            // In vertical view (Attacking):
            // CanvasY = (105 - X_meters) * scaleY
            // CanvasX = Y_meters * scaleX
            // Wait, Y=0 is usually bottom-left in data? Or top-left?
            // Usually Y=0 is left, Y=100 is right (looking from center to goal).
            // If X=100 is goal, Y=50 is center.
            // CanvasX: 0 is Left touchline, width is Right touchline.
            // So CanvasX = (rawY / 100) * width.
            // CanvasY: 0 is Goal line (X=100). Height is Halfway line (X=50).
            // So CanvasY = ((100 - rawX) / 50) * height (since we cover 50 units).

            // Jitter
            const x_j = shot.jitterX || 0
            const y_j = shot.jitterY || 0

            // Inverted X/Y for vertical
            // Data X -> Canvas Y
            // Data Y -> Canvas X

            const canvasX = (rawY / 100) * width + x_j * scaleX

            // X goes 50->100.
            // At 100 -> Y=0. At 50 -> Y=height.
            const canvasY = ((100 - rawX) / 50) * height + y_j * scaleY

            // Skip if undefined or out of range (defensive half shots?)
            if (rawX < 50) return

            const outcome = shot.outcome
            let color = '#999'

            // Colors: Verde = gol, azul = on target, gris = blocked, red = off target, yellow = on the post
            if (outcome === 'Goal') {
                color = '#22c55e' // Green
            } else if (['Saved', 'On Target'].includes(outcome)) {
                color = '#3b82f6' // Blue
            } else if (outcome === 'Blocked') {
                color = '#9ca3af' // Gray
            } else if (['Post', 'Woodwork'].includes(outcome)) { // Check exact value for post
                color = '#eab308' // Yellow
            } else {
                color = '#ef4444' // Red (Off Target)
            }

            // Draw Triangle
            const size = 6
            ctx.fillStyle = color
            ctx.beginPath()
            // Triangle pointing up (towards goal)
            ctx.moveTo(canvasX, canvasY - size) // Top
            ctx.lineTo(canvasX - size, canvasY + size) // Bottom Left
            ctx.lineTo(canvasX + size, canvasY + size) // Bottom Right
            ctx.closePath()
            ctx.fill()

        })

    }, [processedShots, dimensions])

    // Tooltip logic needs to be updated for coordinate system
    const handleMouseMove = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const { width, height } = dimensions
        const scaleX = width / 68
        const scaleY = height / 52.5

        let foundShot = null
        let minDistance = Infinity

        for (const shot of processedShots) {
            const rawX = parseFloat(shot.x)
            const rawY = parseFloat(shot.y)
            if (rawX < 50) continue

            const canvasX = (rawY / 100) * width + (shot.jitterX || 0) * scaleX
            const canvasY = ((100 - rawX) / 50) * height + (shot.jitterY || 0) * scaleY

            const distance = Math.sqrt(Math.pow(mouseX - canvasX, 2) + Math.pow(mouseY - canvasY, 2))
            if (distance < 10 && distance < minDistance) {
                foundShot = shot
                minDistance = distance
            }
        }

        if (foundShot) {
            const minute = foundShot.minute || (foundShot.second ? Math.floor(foundShot.second / 60) : '?')
            setTooltip({
                visible: true,
                x: mouseX,
                y: mouseY,
                player: foundShot.player || 'Unknown',
                minute: minute + "'",
                outcome: foundShot.outcome || ''
            })
        } else {
            setTooltip({ ...tooltip, visible: false })
        }
    }

    const handleMouseLeave = () => {
        setTooltip({ ...tooltip, visible: false })
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Shot Map</h3>

            <div className="flex flex-wrap gap-4 justify-center mb-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#22c55e]"></div>
                    <span>Goal</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#3b82f6]"></div>
                    <span>On Target</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#9ca3af]"></div>
                    <span>Blocked</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#ef4444]"></div>
                    <span>Off Target</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#eab308]"></div>
                    <span>Post</span>
                </div>
            </div>

            <div ref={containerRef} className="w-full relative flex justify-center">
                <canvas
                    ref={canvasRef}
                    className="border border-gray-200 cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />

                {tooltip.visible && (
                    <div
                        className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10 whitespace-nowrap"
                        style={{
                            left: `${tooltip.x}px`,
                            top: `${tooltip.y}px`,
                            transform: 'translate(-50%, calc(-100% - 10px))'
                        }}
                    >
                        <div className="font-bold">{tooltip.player}</div>
                        <div className="text-gray-300 text-xs">{tooltip.minute} • {tooltip.outcome}</div>
                    </div>
                )}
            </div>

            {processedShots.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-4 italic">
                    No shot data available
                </p>
            )}
        </div>
    )
}

export default ShotMap
