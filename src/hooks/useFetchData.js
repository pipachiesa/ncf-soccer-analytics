import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Get all matches for dropdown
export function useMatches() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        console.log('8')
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('date', { ascending: false })
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { data, loading, error }
}

// Match info for a specific match
export function useMatchInfo(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      // If "all" or no matchId, return null (handled by caller or not needed)
      if (!matchId || matchId === 'all') {
        setData(null)
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        console.log('9')
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('match_id', matchId)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        setData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// Player stats for a specific match or all matches
export function usePlayerStats(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      // If no matchId (and not 'all'), do nothing
      if (!matchId) return

      try {
        console.log('2')
        setLoading(true)
        let query = supabase.from('player_stats').select('*, players(first_name, last_name, position, shirt_number)')

        // Filter by matchId only if it's not 'all'
        if (matchId !== 'all') {
          query = query.eq('match_id', matchId)
        }

        const { data: rawData, error } = await query

        if (error) throw error

        // Map player names from joined players table
        const mappedData = rawData.map(stat => ({
          ...stat,
          player: stat.players ? `${stat.players.first_name} ${stat.players.last_name}`.trim() : 'Unknown',
          position: stat.players?.position,
          shirt_number: stat.players?.shirt_number
        }))

        if (matchId === 'all') {
          // Aggregate stats by player_id
          const aggregated = {}
          mappedData.forEach(stat => {
            const pid = stat.player_id
            if (!aggregated[pid]) {
              // Initialize with first record's static info, zero out metrics
              aggregated[pid] = { ...stat, shots: 0, goals: 0, xg: 0, assists: 0, passes: 0, pass_success: 0, minutes_played: 0, total_actions: 0 }
            }
            aggregated[pid].shots += (stat.shots || 0)
            aggregated[pid].goals += (stat.goals || 0)
            aggregated[pid].xg += (stat.xg || 0)
            aggregated[pid].assists += (stat.assists || 0)
            aggregated[pid].passes += (stat.passes || 0)
            aggregated[pid].pass_success += (stat.pass_success || 0)
            aggregated[pid].minutes_played += (stat.minutes_played || 0)
            aggregated[pid].total_actions += (stat.total_actions || 0)
          })
          // Convert back to array
          setData(Object.values(aggregated).sort((a, b) => b.total_actions - a.total_actions))
        } else {
          setData(mappedData.sort((a, b) => b.total_actions - a.total_actions))
        }

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// Team stats for a specific match or all matches
export function useTeamStats(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      // if (!matchId) return

      try {
        setLoading(true)
        console.log('3')
        console.log(data)
        let query = supabase.from('team_stats').select('*')

        if (matchId) {
          query = query.eq('match_id', matchId).single()
        }

        const { data: result, error } = await query

        if (error && error.code !== 'PGRST116') throw error

        if (matchId === 'all') {
          // result is an array of stats from all matches
          if (!result || result.length === 0) {
            setData(null)
          } else {
            // Aggregate
            const agg = {
              // Shots metrics
              total_shots: 0, goals: 0, shots_on_target: 0, xg_total: 0,
              chances_created: 0, crosses: 0, crosses_successful: 0,
              // Pass metrics
              total_passes: 0, passes_successful: 0,
              progressive_passes: 0, long_passes: 0, long_passes_successful: 0,
              key_passes: 0, assists: 0,
              // Recovery metrics
              total_recoveries: 0, controlled_recoveries: 0,
              losses: 0, dangerous_losses: 0,
              // Defensive metrics
              duels_total: 0, duels_won: 0,
              defensive_duels: 0, defensive_duels_won: 0,
              aerial_duels: 0, aerial_duels_won: 0,
              tackles: 0, tackles_won: 0,
              clearances: 0, blocks: 0, fouls_committed: 0,
              interceptions: 0,
              total_events: 0
            }

            result.forEach(r => {
              // Shots
              agg.total_shots += (r.total_shots || 0)
              agg.goals += (r.goals || 0)
              agg.shots_on_target += (r.shots_on_target || 0)
              agg.xg_total += (r.xg_total || 0)
              agg.chances_created += (r.chances_created || 0)
              agg.crosses += (r.crosses || 0)
              agg.crosses_successful += (r.crosses_successful || 0)
              // Passes
              agg.total_passes += (r.total_passes || 0)
              agg.passes_successful += (r.passes_successful || 0)
              agg.progressive_passes += (r.progressive_passes || 0)
              agg.long_passes += (r.long_passes || 0)
              agg.long_passes_successful += (r.long_passes_successful || 0)
              agg.key_passes += (r.key_passes || 0)
              agg.assists += (r.assists || 0)
              // Recoveries
              agg.total_recoveries += (r.total_recoveries || 0)
              agg.controlled_recoveries += (r.controlled_recoveries || 0)
              agg.losses += (r.losses || 0)
              agg.dangerous_losses += (r.dangerous_losses || 0)
              // Defensive
              agg.duels_total += (r.duels_total || 0)
              agg.duels_won += (r.duels_won || 0)
              agg.defensive_duels += (r.defensive_duels || 0)
              agg.defensive_duels_won += (r.defensive_duels_won || 0)
              agg.aerial_duels += (r.aerial_duels || 0)
              agg.aerial_duels_won += (r.aerial_duels_won || 0)
              agg.tackles += (r.tackles || 0)
              agg.tackles_won += (r.tackles_won || 0)
              agg.clearances += (r.clearances || 0)
              agg.blocks += (r.blocks || 0)
              agg.fouls_committed += (r.fouls_committed || 0)
              agg.interceptions += (r.interceptions || 0)
              agg.total_events += (r.total_events || 0)
            })

            // Recalculate rates
            agg.pass_accuracy = agg.total_passes > 0 ? Math.round((agg.passes_successful / agg.total_passes) * 1000) / 10 : 0
            agg.duel_success_rate = agg.duels_total > 0 ? Math.round((agg.duels_won / agg.duels_total) * 1000) / 10 : 0
            agg.shot_accuracy = agg.total_shots > 0 ? Math.round((agg.shots_on_target / agg.total_shots) * 1000) / 10 : 0
            agg.conversion_rate = agg.total_shots > 0 ? Math.round((agg.goals / agg.total_shots) * 1000) / 10 : 0
            agg.long_pass_accuracy = agg.long_passes > 0 ? Math.round((agg.long_passes_successful / agg.long_passes) * 1000) / 10 : 0
            agg.recovery_loss_ratio = agg.losses > 0 ? Math.round((agg.total_recoveries / agg.losses) * 100) / 100 : agg.total_recoveries
            agg.defensive_duel_success = agg.defensive_duels > 0 ? Math.round((agg.defensive_duels_won / agg.defensive_duels) * 1000) / 10 : 0
            agg.aerial_win_rate = agg.aerial_duels > 0 ? Math.round((agg.aerial_duels_won / agg.aerial_duels) * 1000) / 10 : 0
            agg.tackle_success = agg.tackles > 0 ? Math.round((agg.tackles_won / agg.tackles) * 1000) / 10 : 0

            // Add per90 object? The view logic seems to handle per90 separate, 
            // but Overview.jsx expects raw totals here and calculates per90 itself if needed,
            // OR it mistakenly expects per90 object on this result. 
            // Overview.jsx: const stats = useMemo(() => calculateTeamStats(events, matchCount)...) 
            // Wait, Overview.jsx computes stats from events again? 
            // Overview line 36: const stats = calculateTeamStats(events...)
            // Overview line 11 (TeamAnalysis) uses useTeamStats. 
            // TeamAnalysis.jsx is the one using this hook directly.

            setData(agg)
          }
        } else {
          // Single match - add calculated rates
          if (result) {
            const enhanced = { ...result }
            enhanced.pass_accuracy = enhanced.total_passes > 0 ? Math.round((enhanced.passes_successful / enhanced.total_passes) * 1000) / 10 : 0
            enhanced.duel_success_rate = enhanced.duels_total > 0 ? Math.round((enhanced.duels_won / enhanced.duels_total) * 1000) / 10 : 0
            enhanced.shot_accuracy = enhanced.total_shots > 0 ? Math.round((enhanced.shots_on_target / enhanced.total_shots) * 1000) / 10 : 0
            enhanced.conversion_rate = enhanced.total_shots > 0 ? Math.round((enhanced.goals / enhanced.total_shots) * 1000) / 10 : 0
            enhanced.long_pass_accuracy = enhanced.long_passes > 0 ? Math.round((enhanced.long_passes_successful / enhanced.long_passes) * 1000) / 10 : 0
            enhanced.recovery_loss_ratio = enhanced.losses > 0 ? Math.round((enhanced.total_recoveries / enhanced.losses) * 100) / 100 : (enhanced.total_recoveries || 0)
            enhanced.defensive_duel_success = enhanced.defensive_duels > 0 ? Math.round((enhanced.defensive_duels_won / enhanced.defensive_duels) * 1000) / 10 : 0
            enhanced.aerial_win_rate = enhanced.aerial_duels > 0 ? Math.round((enhanced.aerial_duels_won / enhanced.aerial_duels) * 1000) / 10 : 0
            enhanced.tackle_success = enhanced.tackles > 0 ? Math.round((enhanced.tackles_won / enhanced.tackles) * 1000) / 10 : 0
            setData(enhanced)
          } else {
            setData(result)
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// All events for a specific match
export function useEvents(matchId, filters = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)

        // Fetch all data with pagination (Supabase limit is 1000 rows by default)
        let allData = []
        let from = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from('events')
            .select('*, players(first_name, last_name)')
            .range(from, from + pageSize - 1)

          if (matchId !== 'all') {
            query = query.eq('match_id', matchId)
          }

          if (filters.eventType) query = query.eq('event_type', filters.eventType)

          const { data: pageData, error } = await query.order('id', { ascending: true })
          if (error) throw error

          if (pageData && pageData.length > 0) {
            allData = [...allData, ...pageData]
            from += pageSize
            hasMore = pageData.length === pageSize
          } else {
            hasMore = false
          }
        }

        // Map player names and filter by player if needed
        let mappedData = allData.map(event => ({
          ...event,
          player: event.players ? `${event.players.first_name} ${event.players.last_name}`.trim() : 'Unknown'
        }))

        if (filters.player) {
          mappedData = mappedData.filter(e => e.player.toLowerCase().includes(filters.player.toLowerCase()))
        }

        setData(mappedData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId, filters.player, filters.eventType])

  return { data, loading, error }
}

// Shots for a specific match
export function useShots(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)

        // Shots are usually fewer, but we'll paginate to be safe
        let allData = []
        let from = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from('events')
            .select('*, players(first_name, last_name)')
            .eq('event_type', 'Shot')
            .range(from, from + pageSize - 1)

          if (matchId !== 'all') {
            query = query.eq('match_id', matchId)
          }

          const { data: pageData, error } = await query.order('id', { ascending: true })
          if (error) throw error

          if (pageData && pageData.length > 0) {
            allData = [...allData, ...pageData]
            from += pageSize
            hasMore = pageData.length === pageSize
          } else {
            hasMore = false
          }
        }

        // Map player names
        const mappedData = allData.map(event => ({
          ...event,
          player: event.players ? `${event.players.first_name} ${event.players.last_name}`.trim() : 'Unknown'
        }))

        setData(mappedData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// Zone pressure data
export function useZonePressure(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)

        // Paginate to get all defensive events
        let allData = []
        let from = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from('events')
            .select('zone_3x3')
            .in('event_type', ['Defensive Duel', 'Tackle', 'Recovery', 'Interception'])
            .range(from, from + pageSize - 1)

          if (matchId !== 'all') {
            query = query.eq('match_id', matchId)
          }

          const { data: pageData, error } = await query
          if (error) throw error

          if (pageData && pageData.length > 0) {
            allData = [...allData, ...pageData]
            from += pageSize
            hasMore = pageData.length === pageSize
          } else {
            hasMore = false
          }
        }

        // Count by zone
        const zones = ['R1C1', 'R1C2', 'R1C3', 'R2C1', 'R2C2', 'R2C3', 'R3C1', 'R3C2', 'R3C3']
        const counts = {}
        zones.forEach(z => {
          counts[z] = allData?.filter(e => e.zone_3x3 === z).length || 0
        })
        setData(counts)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// Timeline data for charts
export function useTimeline(matchId, interval = 5) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)

        // Paginate to get all events - fetch all columns to check for minute/minutes
        let allEvents = []
        let from = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from('events')
            .select('*')
            .range(from, from + pageSize - 1)

          if (matchId !== 'all') {
            query = query.eq('match_id', matchId)
          }

          const { data: pageData, error } = await query.order('id', { ascending: true })
          if (error) throw error

          if (pageData && pageData.length > 0) {
            allEvents = [...allEvents, ...pageData]
            from += pageSize
            hasMore = pageData.length === pageSize
          } else {
            hasMore = false
          }
        }

        // Check which minute column exists (minute or minutes)
        const getMinute = (e) => {
          if (e.minute !== undefined && e.minute !== null) return e.minute
          if (e.minutes !== undefined && e.minutes !== null) return e.minutes
          if (e.time !== undefined && e.time !== null) return e.time
          return null
        }

        // Group by intervals (0-90 minutes)
        const timeline = []

        for (let i = 0; i <= 90; i += interval) {
          const chunk = allEvents.filter(e => {
            const min = getMinute(e)
            return min !== null && min >= i && min < i + interval
          })
          const passes = chunk.filter(e => ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'].includes(e.event_type))
          const successPasses = passes.filter(e => ['Successful', 'Assist', 'Key Pass', 'Progressive Pass'].includes(e.outcome))
          const duels = chunk.filter(e => e.event_type?.includes('Duel'))
          const shots = chunk.filter(e => e.event_type === 'Shot')
          const recoveries = chunk.filter(e => ['Recovery', 'Interception'].includes(e.event_type))
          const losses = chunk.filter(e =>
            e.event_type === 'Loss' ||
            e.event_type === 'Ball Lost' ||
            e.outcome === 'Lost' ||
            (e.event_type === 'Pass' && e.outcome === 'Unsuccessful')
          )

          // Calculate xG for this interval
          const xg = shots.reduce((sum, e) => sum + (parseFloat(e.xg) || 0), 0)

          timeline.push({
            minute: i,
            minuteLabel: `${i}`,
            events: chunk.length,
            passes: passes.length,
            passesSuccessful: successPasses.length,
            passAccuracy: passes.length > 0 ? Math.round((successPasses.length / passes.length) * 100) : 0,
            duels: duels.length,
            duelsWon: duels.filter(e => e.outcome === 'Won').length,
            shots: shots.length,
            xg: Math.round(xg * 100) / 100,
            recoveries: recoveries.length,
            losses: losses.length
          })
        }
        setData(timeline)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId, interval])

  return { data, loading, error }
}

// Get top performers for a match
export function useTopPerformers(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)
        console.log('1')
        let query = supabase.from('player_stats').select('*, players(first_name, last_name)')

        if (matchId !== 'all') {
          query = query.eq('match_id', matchId)
        }

        const { data: rawData, error } = await query.order('total_actions', { ascending: false })

        if (error) throw error

        // Map player names
        const mappedData = rawData.map(stat => ({
          ...stat,
          player: stat.players ? `${stat.players.first_name} ${stat.players.last_name}`.trim() : 'Unknown'
        }))

        let finalData = mappedData

        if (matchId === 'all') {
          // Aggregate
          const aggregated = {}
          mappedData.forEach(stat => {
            const pid = stat.player_id
            if (!aggregated[pid]) {
              aggregated[pid] = { ...stat, total_actions: 0 }
            }
            aggregated[pid].total_actions += (stat.total_actions || 0)
          })
          finalData = Object.values(aggregated).sort((a, b) => b.total_actions - a.total_actions)
        }

        // Limit to top 3
        setData(finalData.slice(0, 3))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// Calculate all KPI stats from events table
export function useKPIStats(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)

        // Fetch all events with pagination
        let allEvents = []
        let from = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          let query = supabase
            .from('events')
            .select('*')
            .range(from, from + pageSize - 1)

          if (matchId !== 'all') {
            query = query.eq('match_id', matchId)
          }

          const { data: pageData, error } = await query.order('id', { ascending: true })
          if (error) throw error

          if (pageData && pageData.length > 0) {
            allEvents = [...allEvents, ...pageData]
            from += pageSize
            hasMore = pageData.length === pageSize
          } else {
            hasMore = false
          }
        }

        // Calculate all KPIs from events
        const stats = calculateKPIsFromEvents(allEvents)
        setData(stats)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  return { data, loading, error }
}

// Helper function to calculate all KPIs from raw events
function calculateKPIsFromEvents(events) {
  if (!events || events.length === 0) {
    return getEmptyKPIStats()
  }

  // ==================== SHOTS METRICS ====================
  const shots = events.filter(e => e.event_type === 'Shot')
  const total_shots = shots.length
  const goals = shots.filter(e => e.outcome === 'Goal').length
  const shots_on_target = shots.filter(e =>
    ['Goal', 'Saved', 'On Target'].includes(e.outcome)
  ).length
  const xg_total = shots.reduce((sum, e) => sum + (parseFloat(e.xg) || 0), 0)

  // Chances created = key passes + assists
  const keyPassEvents = events.filter(e =>
    e.outcome === 'Key Pass' || e.outcome === 'Assist'
  )
  const chances_created = keyPassEvents.length

  // Crosses
  const crossEvents = events.filter(e => e.event_type === 'Cross')
  const crosses = crossEvents.length
  const crosses_successful = crossEvents.filter(e =>
    e.outcome === 'Successful' || e.outcome === 'Assist'
  ).length

  // Shot accuracy & conversion rate
  const shot_accuracy = total_shots > 0 ? Math.round((shots_on_target / total_shots) * 1000) / 10 : 0
  const conversion_rate = total_shots > 0 ? Math.round((goals / total_shots) * 1000) / 10 : 0

  // ==================== PASS METRICS ====================
  const passEvents = events.filter(e =>
    ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'].includes(e.event_type)
  )
  const total_passes = passEvents.length
  const passes_successful = passEvents.filter(e =>
    ['Successful', 'Assist', 'Key Pass', 'Progressive Pass'].includes(e.outcome)
  ).length
  const pass_accuracy = total_passes > 0 ? Math.round((passes_successful / total_passes) * 1000) / 10 : 0

  // Progressive passes (passes that move the ball forward significantly)
  const progressive_passes = events.filter(e =>
    e.outcome === 'Progressive Pass' ||
    (e.event_type === 'Pass' && e.progressive === true)
  ).length

  // Long passes
  const longPassEvents = events.filter(e => e.event_type === 'Long Pass')
  const long_passes = longPassEvents.length
  const long_passes_successful = longPassEvents.filter(e =>
    ['Successful', 'Assist', 'Key Pass'].includes(e.outcome)
  ).length
  const long_pass_accuracy = long_passes > 0 ? Math.round((long_passes_successful / long_passes) * 1000) / 10 : 0

  // Key passes (passes leading to shots)
  const key_passes = events.filter(e => e.outcome === 'Key Pass').length

  // Assists
  const assists = events.filter(e => e.outcome === 'Assist').length

  // ==================== RECOVERY METRICS ====================
  const recoveryEvents = events.filter(e =>
    ['Recovery', 'Interception'].includes(e.event_type)
  )
  const total_recoveries = recoveryEvents.length

  // Controlled recoveries (maintained possession after recovery)
  const controlled_recoveries = recoveryEvents.filter(e =>
    e.outcome === 'Successful' || e.outcome === 'Controlled'
  ).length

  // Ball losses
  const lossEvents = events.filter(e =>
    e.event_type === 'Loss' ||
    e.event_type === 'Ball Lost' ||
    e.outcome === 'Lost' ||
    e.outcome === 'Unsuccessful'
  )
  const losses = lossEvents.length || events.filter(e =>
    e.event_type === 'Pass' && e.outcome === 'Unsuccessful'
  ).length

  // Dangerous losses (in own half or defensive third)
  const dangerous_losses = lossEvents.filter(e =>
    e.zone_3x3?.startsWith('R1') || e.pitch_zone === 'Defensive Third'
  ).length

  const recovery_loss_ratio = losses > 0 ? Math.round((total_recoveries / losses) * 100) / 100 : total_recoveries

  // ==================== DEFENSIVE METRICS ====================
  // Defensive duels
  const defensiveDuelEvents = events.filter(e =>
    e.event_type === 'Defensive Duel' || e.event_type === 'Ground Duel'
  )
  const defensive_duels = defensiveDuelEvents.length
  const defensive_duels_won = defensiveDuelEvents.filter(e => e.outcome === 'Won').length
  const defensive_duel_success = defensive_duels > 0 ? Math.round((defensive_duels_won / defensive_duels) * 1000) / 10 : 0

  // Aerial duels
  const aerialDuelEvents = events.filter(e =>
    e.event_type === 'Aerial Duel' || e.event_type === 'Header'
  )
  const aerial_duels = aerialDuelEvents.length
  const aerial_duels_won = aerialDuelEvents.filter(e => e.outcome === 'Won').length
  const aerial_win_rate = aerial_duels > 0 ? Math.round((aerial_duels_won / aerial_duels) * 1000) / 10 : 0

  // Tackles
  const tackleEvents = events.filter(e => e.event_type === 'Tackle')
  const tackles = tackleEvents.length
  const tackles_won = tackleEvents.filter(e =>
    e.outcome === 'Won' || e.outcome === 'Successful'
  ).length
  const tackle_success = tackles > 0 ? Math.round((tackles_won / tackles) * 1000) / 10 : 0

  // Clearances
  const clearances = events.filter(e => e.event_type === 'Clearance').length

  // Blocks
  const blocks = events.filter(e => e.event_type === 'Block').length

  // Fouls committed
  const fouls_committed = events.filter(e =>
    e.event_type === 'Foul' || e.event_type === 'Foul Committed'
  ).length

  // Interceptions
  const interceptions = events.filter(e => e.event_type === 'Interception').length

  // Total duels (for backwards compatibility)
  const allDuels = events.filter(e => e.event_type?.includes('Duel'))
  const duels_total = allDuels.length
  const duels_won = allDuels.filter(e => e.outcome === 'Won').length
  const duel_success_rate = duels_total > 0 ? Math.round((duels_won / duels_total) * 1000) / 10 : 0

  return {
    // Shots
    total_shots,
    goals,
    shots_on_target,
    xg_total,
    chances_created,
    crosses,
    crosses_successful,
    shot_accuracy,
    conversion_rate,
    // Passes
    total_passes,
    passes_successful,
    pass_accuracy,
    progressive_passes,
    long_passes,
    long_passes_successful,
    long_pass_accuracy,
    key_passes,
    assists,
    // Recoveries
    total_recoveries,
    controlled_recoveries,
    losses,
    dangerous_losses,
    recovery_loss_ratio,
    // Defensive
    defensive_duels,
    defensive_duels_won,
    defensive_duel_success,
    aerial_duels,
    aerial_duels_won,
    aerial_win_rate,
    tackles,
    tackles_won,
    tackle_success,
    clearances,
    blocks,
    fouls_committed,
    interceptions,
    // General
    duels_total,
    duels_won,
    duel_success_rate,
    total_events: events.length
  }
}

// Return empty stats object
function getEmptyKPIStats() {
  return {
    total_shots: 0, goals: 0, shots_on_target: 0, xg_total: 0,
    chances_created: 0, crosses: 0, crosses_successful: 0,
    shot_accuracy: 0, conversion_rate: 0,
    total_passes: 0, passes_successful: 0, pass_accuracy: 0,
    progressive_passes: 0, long_passes: 0, long_passes_successful: 0,
    long_pass_accuracy: 0, key_passes: 0, assists: 0,
    total_recoveries: 0, controlled_recoveries: 0,
    losses: 0, dangerous_losses: 0, recovery_loss_ratio: 0,
    defensive_duels: 0, defensive_duels_won: 0, defensive_duel_success: 0,
    aerial_duels: 0, aerial_duels_won: 0, aerial_win_rate: 0,
    tackles: 0, tackles_won: 0, tackle_success: 0,
    clearances: 0, blocks: 0, fouls_committed: 0, interceptions: 0,
    duels_total: 0, duels_won: 0, duel_success_rate: 0,
    total_events: 0
  }
}
