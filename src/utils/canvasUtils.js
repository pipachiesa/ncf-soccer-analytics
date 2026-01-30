
// Canvas Rendering Utilities for Tactical Pitch Maps

const PITCH_LENGTH = 1.05
const PITCH_WIDTH = 0.95

/**
 * Draw the base pitch (Analytical Style: White bg, Black lines)
 */
export const drawPitchBase = (ctx, width, height) => {
    // Clear background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Set line style
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

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
}

/**
 * Draw simple points
 */
export const drawPoints = (ctx, points, width, height, config = {}) => {
    const sx = width / PITCH_LENGTH
    const sy = height / PITCH_WIDTH
    const {
        color = '#000000',
        radius = 3,
        alpha = 0.7,
        shape = 'circle' // circle, square, triangle
    } = config

    ctx.fillStyle = color
    ctx.globalAlpha = alpha

    points.forEach(pt => {
        // Add slight jitter to avoid perfect overlap
        const jitterX = (Math.random() * 4) - 2
        const jitterY = (Math.random() * 4) - 2

        const cx = (pt.x_norm * sx) + jitterX
        const cy = (pt.y_norm * sy) + jitterY

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

    ctx.globalAlpha = 1.0
}

/**
 * Draw arrows for passes
 */
export const drawArrows = (ctx, events, width, height, config = {}) => {
    const sx = width / PITCH_LENGTH
    const sy = height / PITCH_WIDTH
    const { color = '#000000', width: urlWidth = 1.5, alpha = 0.6 } = config

    ctx.strokeStyle = color
    ctx.lineWidth = urlWidth
    ctx.globalAlpha = alpha

    events.forEach(e => {
        // Start
        const x1 = e.x_norm * sx
        const y1 = e.y_norm * sy

        // End (if available, requires normalization of end_x/end_y)
        // Assuming end_x / end_y in raw event are same scale (0-100)
        let x2 = x1
        let y2 = y1

        if (e.end_x != null && e.end_y != null) {
            x2 = ((e.end_x * 1.05) / 100) * sx
            y2 = ((e.end_y * 0.95) / 100) * sy
        } else {
            // Draw short Stub if no end coords? Or skip?
            // User requirement: "If end coordinates not available, plot starts only but label it clearly"
            // For now, let's draw a small dot if no end coord to indicate start
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

    gridValues.forEach((row, r) => {
        row.forEach((pct, c) => {
            if (pct <= 0) return

            const x = c * cellW
            const y = r * cellH

            // Greyscale intensity or Opacity
            // User requested "Higher % = darker shade"
            // Analytical style: Black with opacity
            const opacity = Math.min((pct / 20), 0.9) // Cap opacity, scale: 20% = full black roughly? No, 20% is high for a single cell.
            // Let's use a non-linear scale or simple linear. 
            // Max typical cell share might be ~10-30%.

            ctx.fillStyle = `rgba(0, 0, 0, ${opacity + 0.1})` // Base visibility + value
            ctx.fillRect(x, y, cellW, cellH)

            // Border for grid look (optional, but requested "Square Grid")
            ctx.strokeStyle = 'rgba(0,0,0,0.1)'
            ctx.strokeRect(x, y, cellW, cellH)

            // Optional: Draw text %
            if (pct > 5) {
                ctx.fillStyle = '#fff'
                ctx.font = '10px Inter'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${pct.toFixed(1)}%`, x + cellW / 2, y + cellH / 2)
            }
        })
    })
}
