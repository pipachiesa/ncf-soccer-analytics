
// Tactical Mapping Utility
// Processes raw events into tactical datasets for pitch visualizations

/**
 * Normalize coordinates to pitch units (0-105 x 0-68) or % based on custom scaling
 * Standard pitch is ~105x68.
 * Custom scaling rule provided:
 * x_norm = x * 1.05 / 100  (Assuming input is 0-100, mapped to 1.05 scale?)
 * Actually, usually x is 0-100. normalizing to meters (105) would be x * 1.05.
 * The rule says: x_norm = x * 1.05 / 100  -> This yields very small numbers like 0-1.05?
 * Wait, likely input x is 0-100.
 * Maybe the user meant: x_norm = x * 1.05 (to get meters).
 * Quote: "x_norm = x * 1.05 / 100" -> If x is 50, result is 0.525. This seems to be 0-1 normalized?
 * If so, canvasUtils should expect 0-1 coordinates.
 * Let's assume normalizing to 0-1 range first, then scaling to canvas width/height.
 *
 * BUT, if the user means "Convert to meters", then 105 length.
 * Let's reread: "x_norm = x * 1.05 / 100".
 * If input x=100, x_norm = 1.05.
 * This seems odd unless it's a specific scaling factor.
 * Let's look at the previous code in ShotMap.jsx:
 * // X_meters = (rawX / 100) * 105.
 * // CanvasX = (rawY / 100) * width.
 *
 * Let's assume the user command is STRICT: "x_norm = x * 1.05 / 100".
 * I will return this value. The Canvas drawer will need to handle it.
 * If these are truly 0-1 normalized (almost), I'll treat them as such.
 * Actually 1.05 is slightly > 1. Maybe overscan?
 * Let's implement strictly.
 */
export const normalizeCoordinates = (x, y) => {
    // Ensure inputs are numbers
    const safeX = parseFloat(x) || 0
    const safeY = parseFloat(y) || 0

    // Data format: X is 0-105 (meters), Y is 0-100 (percentage)
    // Normalize to 0-1 range for canvas mapping
    let normX = safeX / 105  // X: 0-105 -> 0-1
    const normY = safeY / 100  // Y: 0-100 -> 0-1

    // Move shots at goal line (X > 98%) slightly back into 6-yard box
    if (normX > 0.98) {
        normX = 0.95
    }

    return { x: normX, y: normY }
}

/**
 * Classify event into tactical category
 */
const classifyEvent = (event) => {
    const type = event.event_type || ''
    const outcome = event.outcome || ''
    const typeLower = type.toLowerCase()

    // Outcome keywords
    const isSuccessful = ['Successful', 'Goal', 'Won', 'Controlled'].includes(outcome) || outcome === 'On Target'
    const isUnsuccessful = ['Unsuccessful', 'Lost', 'Off Target', 'Blocked', 'Saved', 'Wayward', 'Missed'].includes(outcome)
    const isProgressive = outcome === 'Progressive Pass' || event.progressive
    const isKeyPass = outcome === 'Key Pass'
    const isAssist = outcome === 'Assist'

    // --- SHOTS ---
    if (type === 'Shot' || type === 'Goal') {
        const shotType =
            outcome === 'Goal' ? 'goal' :
                outcome === 'Blocked' ? 'blocked' :
                    ['Saved', 'On Target'].includes(outcome) ? 'on_target' :
                        'off_target'
        return { category: 'shots', subType: shotType }
    }

    // --- CROSSES ---
    if (type === 'Cross') {
        return {
            category: isSuccessful || isAssist ? 'crosses_successful' : 'crosses_attempted', // attempted usually implies 'all', but here we might want split? 
            // Better: Return 'cross' and let aggregator split.
            // But prompt asks for specific arrays.
            // Let's return primary intent.
            visualCategory: 'crosses',
            isSuccessful
        }
    }

    // --- PASSING ---
    if (['Pass', 'Long Pass', 'Through Pass', 'Launch', 'Smart Pass', 'Hand Pass', 'Head Pass'].includes(type) || type.includes('Pass')) {
        let cats = ['passes_attempted']
        if (isSuccessful || isKeyPass || isAssist || isProgressive) cats.push('passes_completed')

        if (isProgressive) cats.push('progressive_passes')
        if (isKeyPass) cats.push('key_passes')
        if (isAssist) cats.push('assists')

        return { category: 'passing', categories: cats }
    }

    // --- RECOVERIES ---
    if (['Recovery', 'Interception', 'Block'].includes(type) || type === '50/50') {
        // "Recoveries" (ball recovery/regain) vs defensive actions (Block/Interception)
        // Prompt asks for 'recoveries', 'interceptions', 'blocks'.
        if (type === 'Recovery') return { category: 'recoveries' }
        if (type === 'Interception') return { category: 'interceptions' }
        if (type === 'Block') return { category: 'blocks' } // Shot block or pass block
        // 50/50 often implies duel, but let's check outcome
        if (type === '50/50' && outcome === 'Won') return { category: 'recoveries' }
    }

    // --- LOSSES ---
    if (type === 'Loss' || type === 'Ball Lost' || outcome === 'Lost' || type === 'Dispossessed') {
        return { category: 'losses' }
    }

    // --- DUELS ---
    if (type.includes('Duel')) {
        if (type === 'Aerial Duel') return { category: 'aerial_duels' }
        if (['Defensive Duel', 'Loose Ball Duel'].includes(type)) return { category: 'duels_defensive' }
        if (['Offensive Duel'].includes(type)) return { category: 'duels_offensive' }
        return { category: 'duels_other' }
    }

    // --- DEFENSIVE ACTIONS ---
    if (type === 'Clearance') return { category: 'clearances' }
    if (type === 'Tackle') return { category: 'duels_defensive' } // Tackles are often part of defensive duels logic
    if (type === 'Pressure') return { category: 'pressures' }

    return { category: 'other' }
}

/**
 * Build classified tactical datasets from raw events
 */
export const buildTacticalEvents = (events) => {
    const data = {
        shots: [],
        passes_attempted: [],
        passes_completed: [],
        progressive_passes: [],
        key_passes: [],
        assists: [],
        crosses_attempted: [],
        crosses_successful: [],
        recoveries: [],
        interceptions: [],
        blocks: [],
        clearances: [],
        losses: [],
        duels_defensive: [],
        duels_offensive: [],
        aerial_duels: [],
        pressures: [],
        other: [] // Catch-all for debugging
    }

    if (!events || !Array.isArray(events)) return data

    events.forEach(e => {
        const { x, y } = normalizeCoordinates(e.x, e.y)
        const normalizedEvent = { ...e, x_norm: x, y_norm: y }

        const classification = classifyEvent(e)

        if (classification.category === 'passing') {
            classification.categories.forEach(cat => {
                if (data[cat]) data[cat].push(normalizedEvent)
            })
        } else if (classification.visualCategory === 'crosses') {
            data.crosses_attempted.push(normalizedEvent)
            if (classification.isSuccessful) data.crosses_successful.push(normalizedEvent)
        } else if (classification.category === 'shots') {
            // Add subtype info to the event for drawing
            normalizedEvent.shotType = classification.subType
            data.shots.push(normalizedEvent)
        } else if (data[classification.category]) {
            data[classification.category].push(normalizedEvent)
        } else {
            data.other.push(normalizedEvent)
        }
    })

    return data
}

/**
 * Compute Zone Control Grid (e.g. 6x4)
 * Returns 2D array or flat array of grid cells with % values.
 */
export const computeZoneControl = (events, gridX = 6, gridY = 4) => {
    // Buckets - Y is inverted so row 0 is top of pitch
    const grid = Array(gridY).fill().map(() => Array(gridX).fill(0))
    let total = 0

    events.forEach(e => {
        // Use normalized coordinates (0-1 range)
        const { x, y } = normalizeCoordinates(e.x, e.y)

        // Map to grid indices (x is 0-1, y is 0-1)
        const col = Math.min(Math.floor(x * gridX), gridX - 1)
        // Invert Y for grid (top of pitch = low Y values in data = top rows in grid)
        const row = Math.min(Math.floor((1 - y) * gridY), gridY - 1)

        if (col >= 0 && row >= 0) {
            grid[row][col]++
            total++
        }
    })

    // Convert to percentages (0-100)
    const safeTotal = total || 1
    return grid.map(row => row.map(count => (count / safeTotal) * 100))
}

/**
 * Compute Territory by Thirds
 * Returns [defensive%, middle%, attacking%]
 */
export const computeTerritoryByThirds = (events) => {
    // 3 buckets
    const thirds = [0, 0, 0] // Def, Mid, Att
    let total = 0

    events.forEach(e => {
        const { x } = normalizeCoordinates(e.x, e.y)
        // x is now 0 to 1 (normalized)
        // Thirds: < 0.33, 0.33-0.66, > 0.66

        if (x < 0.33) thirds[0]++
        else if (x < 0.66) thirds[1]++
        else thirds[2]++

        total++
    })

    const safeTotal = total || 1
    return thirds.map(count => Math.round((count / safeTotal) * 100))
}
