
// Canvas Rendering Utilities for Tactical Pitch Maps

const PITCH_LENGTH = 1.05
const PITCH_WIDTH = 0.95

// Modern pitch colors
const PITCH_COLORS = {
    grass: '#1a472a',      // Deep forest green
    grassLight: '#1e5631', // Slightly lighter for stripes
    lines: '#ffffff',      // White lines
    lineOpacity: 0.85
}

// Heatmap color scale (simple blue intensity gradient)
const HEATMAP_COLORS = [
    { pct: 0, color: { r: 219, g: 234, b: 254 } },   // Blue-100 (light)
    { pct: 0.5, color: { r: 59, g: 130, b: 246 } },  // Blue-500 (medium)
    { pct: 1, color: { r: 30, g: 64, b: 175 } }      // Blue-800 (dark)
]

/**
 * Get color for heatmap value (0-1 range)
 */
const getHeatmapColor = (value, alpha = 0.7) => {
    // Clamp value
    const v = Math.max(0, Math.min(1, value))

    // Find the two colors to interpolate between
    let lower = HEATMAP_COLORS[0]
    let upper = HEATMAP_COLORS[HEATMAP_COLORS.length - 1]

    for (let i = 0; i < HEATMAP_COLORS.length - 1; i++) {
        if (v >= HEATMAP_COLORS[i].pct && v <= HEATMAP_COLORS[i + 1].pct) {
            lower = HEATMAP_COLORS[i]
            upper = HEATMAP_COLORS[i + 1]
            break
        }
    }

    // Interpolate
    const range = upper.pct - lower.pct
    const pct = range === 0 ? 0 : (v - lower.pct) / range

    const r = Math.round(lower.color.r + (upper.color.r - lower.color.r) * pct)
    const g = Math.round(lower.color.g + (upper.color.g - lower.color.g) * pct)
    const b = Math.round(lower.color.b + (upper.color.b - lower.color.b) * pct)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Draw the base pitch (Modern Style: Green grass, White lines)
 */
export const drawPitchBase = (ctx, width, height) => {
    // Draw grass background with subtle stripes
    const stripeWidth = width / 12
    for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 === 0 ? PITCH_COLORS.grass : PITCH_COLORS.grassLight
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, height)
    }

    // Set line style
    ctx.strokeStyle = PITCH_COLORS.lines
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.globalAlpha = PITCH_COLORS.lineOpacity

    // Scale factors
    const sx = width / PITCH_LENGTH
    const sy = height / PITCH_WIDTH

    // Outer boundary
    ctx.strokeRect(0, 0, width, height)

    // Halfway line
    const midX = (PITCH_LENGTH / 2) * sx
    ctx.beginPath()
    ctx.moveTo(midX, 0)
    ctx.lineTo(midX, height)
    ctx.stroke()

    // Center circle
    const midY = (PITCH_WIDTH / 2) * sy
    // Radius ~9.15m. 9.15 / 100 ~ 0.0915 normalized?
    // Let's approximate visually: ~10% of width
    const centerRadius = (0.0915 / PITCH_LENGTH) * width
    ctx.beginPath()
    ctx.arc(midX, midY, centerRadius, 0, Math.PI * 2)
    ctx.stroke()

    // Penalty Areas
    // 16.5m box. 
    const boxDepth = (0.165 / PITCH_LENGTH) * width
    const boxWidth = (0.403 / PITCH_WIDTH) * height // ~40.3m width
    const boxTop = (height - boxWidth) / 2

    // Left Penalty Area
    ctx.strokeRect(0, boxTop, boxDepth, boxWidth)

    // Right Penalty Area
    ctx.strokeRect(width - boxDepth, boxTop, boxDepth, boxWidth)

    // Goal Areas (6yd box)
    const goalDepth = (0.055 / PITCH_LENGTH) * width
    const goalWidth = (0.183 / PITCH_WIDTH) * height
    const goalTop = (height - goalWidth) / 2

    // Left Goal Area
    ctx.strokeRect(0, goalTop, goalDepth, goalWidth)

    // Right Goal Area
    ctx.strokeRect(width - goalDepth, goalTop, goalDepth, goalWidth)

    // Goals (small indentations outside usually, but let's draw them on boundary for simplicity or small stick out)
    ctx.beginPath()
    ctx.moveTo(0, (height - 7) / 2) // Approximate goal width
    // Just simple lines or keep it clean without goals structure outside box

    // Reset alpha
    ctx.globalAlpha = 1.0
}

/**
 * Draw simple points
 */
export const drawPoints = (ctx, points, width, height, config = {}) => {
    const {
        color = '#000000',
        radius = 3,
        alpha = 0.7,
        shape = 'circle' // circle, square, triangle
    } = config

    ctx.fillStyle = color
    ctx.globalAlpha = alpha

    // Group points by proximity for better jitter
    const coordMap = new Map()
    points.forEach(pt => {
        const key = `${Math.floor(pt.x_norm * 20)}-${Math.floor(pt.y_norm * 20)}`
        if (!coordMap.has(key)) {
            coordMap.set(key, [])
        }
        coordMap.get(key).push(pt)
    })

    // Draw with jitter for overlapping points
    coordMap.forEach((group) => {
        group.forEach((pt, idx) => {
            // Calculate jitter based on group size
            let jitterX = 0, jitterY = 0
            if (group.length > 1) {
                const angle = (idx / group.length) * 2 * Math.PI + Math.PI / 4
                const jitterRadius = 6 + (group.length * 2)
                jitterX = Math.cos(angle) * jitterRadius
                jitterY = Math.sin(angle) * jitterRadius
            }

            // Map coordinates: x_norm (0-1) to width, y_norm (0-1) inverted to height
            const cx = (pt.x_norm * width) + jitterX
            const cy = ((1 - pt.y_norm) * height) + jitterY  // Inverted Y for sidelines

            ctx.beginPath()
            if (shape === 'square') {
                ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
            } else if (shape === 'triangle') {
                ctx.moveTo(cx, cy - radius)
                ctx.lineTo(cx + radius, cy + radius)
                ctx.lineTo(cx - radius, cy + radius)
                ctx.closePath()
                ctx.fill()
            } else {
                ctx.arc(cx, cy, radius, 0, Math.PI * 2)
                ctx.fill()
            }
        })
    })

    ctx.globalAlpha = 1.0
}

/**
 * Draw arrows for passes
 */
export const drawArrows = (ctx, events, width, height, config = {}) => {
    const { color = '#000000', width: lineWidth = 1.5, alpha = 0.6 } = config

    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.globalAlpha = alpha

    events.forEach(e => {
        // Start - using normalized coordinates (0-1 range), Y inverted
        const x1 = e.x_norm * width
        const y1 = (1 - e.y_norm) * height

        // End (if available)
        let x2 = x1
        let y2 = y1

        if (e.end_x != null && e.end_y != null) {
            // Normalize end coordinates same way: X/105, Y/100, Y inverted
            const endXNorm = e.end_x / 105
            const endYNorm = e.end_y / 100
            x2 = endXNorm * width
            y2 = (1 - endYNorm) * height
        } else {
            // Draw a small dot if no end coord
            ctx.beginPath()
            ctx.arc(x1, y1, 2, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            return
        }

        // Draw Line
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Draw Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLen = 6
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
        ctx.fillStyle = color
        ctx.fill()
    })

    ctx.globalAlpha = 1.0
}

/**
 * Draw Grid Heatmap
 * gridValues: 2D array of percentages
 */
export const drawGridHeatmap = (ctx, gridValues, width, height) => {
    if (!gridValues || !gridValues.length) return

    const rows = gridValues.length
    const cols = gridValues[0].length
    const cellW = width / cols
    const cellH = height / rows

    // Find max value for normalization
    let maxPct = 0
    gridValues.forEach(row => {
        row.forEach(pct => {
            if (pct > maxPct) maxPct = pct
        })
    })

    // Ensure we have at least some range
    if (maxPct === 0) maxPct = 1

    gridValues.forEach((row, r) => {
        row.forEach((pct, c) => {
            if (pct <= 0) return

            const x = c * cellW
            const y = r * cellH

            // Normalize percentage to 0-1 range based on max value
            const normalized = pct / maxPct

            // Get colorful heatmap color
            ctx.fillStyle = getHeatmapColor(normalized, 0.75)
            ctx.fillRect(x, y, cellW, cellH)

            // Subtle border for grid look
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 1
            ctx.strokeRect(x, y, cellW, cellH)

            // Draw text % with shadow for readability
            if (pct > 4) {
                ctx.font = 'bold 11px Inter, system-ui, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Text shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillText(`${pct.toFixed(1)}%`, x + cellW / 2 + 1, y + cellH / 2 + 1)

                // Main text
                ctx.fillStyle = '#ffffff'
                ctx.fillText(`${pct.toFixed(1)}%`, x + cellW / 2, y + cellH / 2)
            }
        })
    })
}
