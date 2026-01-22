import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BigNumber from 'bignumber.js'

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
              aggregated[pid] = { ...stat, shots: 0, goals: 0, xG: 0, assists: 0, passes: 0, pass_success: 0, minutes_played: 0, total_actions: 0 }
            }
            aggregated[pid].shots += (stat.shots || 0)
            aggregated[pid].goals += (stat.goals || 0)
            aggregated[pid].xG += (stat.xG || 0)
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
            agg.pass_accuracy = agg.total_passes > 0 ? new BigNumber(agg.passes_successful).dividedBy(agg.total_passes).multipliedBy(100).dp(1).toNumber() : 0
            agg.duel_success_rate = agg.duels_total > 0 ? new BigNumber(agg.duels_won).dividedBy(agg.duels_total).multipliedBy(100).dp(1).toNumber() : 0
            agg.shot_accuracy = agg.total_shots > 0 ? new BigNumber(agg.shots_on_target).dividedBy(agg.total_shots).multipliedBy(100).dp(1).toNumber() : 0
            agg.conversion_rate = agg.total_shots > 0 ? new BigNumber(agg.goals).dividedBy(agg.total_shots).multipliedBy(100).dp(1).toNumber() : 0
            agg.long_pass_accuracy = agg.long_passes > 0 ? new BigNumber(agg.long_passes_successful).dividedBy(agg.long_passes).multipliedBy(100).dp(1).toNumber() : 0
            agg.recovery_loss_ratio = agg.losses > 0 ? new BigNumber(agg.total_recoveries).dividedBy(agg.losses).dp(1).toNumber() : agg.total_recoveries
            agg.defensive_duel_success = agg.defensive_duels > 0 ? new BigNumber(agg.defensive_duels_won).dividedBy(agg.defensive_duels).multipliedBy(100).dp(1).toNumber() : 0
            agg.aerial_win_rate = agg.aerial_duels > 0 ? new BigNumber(agg.aerial_duels_won).dividedBy(agg.aerial_duels).multipliedBy(100).dp(1).toNumber() : 0
            agg.tackle_success = agg.tackles > 0 ? new BigNumber(agg.tackles_won).dividedBy(agg.tackles).multipliedBy(100).dp(1).toNumber() : 0

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
            enhanced.pass_accuracy = enhanced.total_passes > 0 ? new BigNumber(enhanced.passes_successful).dividedBy(enhanced.total_passes).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.duel_success_rate = enhanced.duels_total > 0 ? new BigNumber(enhanced.duels_won).dividedBy(enhanced.duels_total).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.shot_accuracy = enhanced.total_shots > 0 ? new BigNumber(enhanced.shots_on_target).dividedBy(enhanced.total_shots).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.conversion_rate = enhanced.total_shots > 0 ? new BigNumber(enhanced.goals).dividedBy(enhanced.total_shots).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.long_pass_accuracy = enhanced.long_passes > 0 ? new BigNumber(enhanced.long_passes_successful).dividedBy(enhanced.long_passes).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.recovery_loss_ratio = enhanced.losses > 0 ? new BigNumber(enhanced.total_recoveries).dividedBy(enhanced.losses).dp(1).toNumber() : (enhanced.total_recoveries || 0)
            enhanced.defensive_duel_success = enhanced.defensive_duels > 0 ? new BigNumber(enhanced.defensive_duels_won).dividedBy(enhanced.defensive_duels).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.aerial_win_rate = enhanced.aerial_duels > 0 ? new BigNumber(enhanced.aerial_duels_won).dividedBy(enhanced.aerial_duels).multipliedBy(100).dp(1).toNumber() : 0
            enhanced.tackle_success = enhanced.tackles > 0 ? new BigNumber(enhanced.tackles_won).dividedBy(enhanced.tackles).multipliedBy(100).dp(1).toNumber() : 0
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
          const xg = shots.reduce((sum, e) => sum + (parseFloat(e.xG) || 0), 0)

          timeline.push({
            minute: i,
            minuteLabel: `${i}`,
            events: chunk.length,
            passes: passes.length,
            passesSuccessful: successPasses.length,
            passAccuracy: passes.length > 0 ? new BigNumber(successPasses.length).dividedBy(passes.length).multipliedBy(100).dp(1).toNumber() : 0,
            duels: duels.length,
            duelsWon: duels.filter(e => e.outcome === 'Won').length,
            shots: shots.length,
            xg: new BigNumber(xg).dp(1).toNumber(),
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
  const xg_total = shots.reduce((sum, e) => new BigNumber(sum).plus(parseFloat(e.xG) || 0).toNumber(), 0)

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
  const shot_accuracy = total_shots > 0 ? new BigNumber(shots_on_target).dividedBy(total_shots).multipliedBy(100).dp(1).toNumber() : 0
  const conversion_rate = total_shots > 0 ? new BigNumber(goals).dividedBy(total_shots).multipliedBy(100).dp(1).toNumber() : 0

  // ==================== PASS METRICS ====================
  const passEvents = events.filter(e =>
    ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'].includes(e.event_type)
  )
  const total_passes = passEvents.length
  const passes_successful = passEvents.filter(e =>
    ['Successful', 'Assist', 'Key Pass', 'Progressive Pass'].includes(e.outcome)
  ).length
  const pass_accuracy = total_passes > 0 ? new BigNumber(passes_successful).dividedBy(total_passes).multipliedBy(100).dp(1).toNumber() : 0

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
  const long_pass_accuracy = long_passes > 0 ? new BigNumber(long_passes_successful).dividedBy(long_passes).multipliedBy(100).dp(1).toNumber() : 0

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

  const recovery_loss_ratio = losses > 0 ? new BigNumber(total_recoveries).dividedBy(losses).dp(1).toNumber() : total_recoveries

  // ==================== DEFENSIVE METRICS ====================
  // Defensive duels
  const defensiveDuelEvents = events.filter(e =>
    e.event_type === 'Defensive Duel' || e.event_type === 'Ground Duel'
  )
  const defensive_duels = defensiveDuelEvents.length
  const defensive_duels_won = defensiveDuelEvents.filter(e => e.outcome === 'Won').length
  const defensive_duel_success = defensive_duels > 0 ? new BigNumber(defensive_duels_won).dividedBy(defensive_duels).multipliedBy(100).dp(1).toNumber() : 0

  // Aerial duels
  const aerialDuelEvents = events.filter(e =>
    e.event_type === 'Aerial Duel' || e.event_type === 'Header'
  )
  const aerial_duels = aerialDuelEvents.length
  const aerial_duels_won = aerialDuelEvents.filter(e => e.outcome === 'Won').length
  const aerial_win_rate = aerial_duels > 0 ? new BigNumber(aerial_duels_won).dividedBy(aerial_duels).multipliedBy(100).dp(1).toNumber() : 0

  // Tackles
  const tackleEvents = events.filter(e => e.event_type === 'Tackle')
  const tackles = tackleEvents.length
  const tackles_won = tackleEvents.filter(e =>
    e.outcome === 'Won' || e.outcome === 'Successful'
  ).length
  const tackle_success = tackles > 0 ? new BigNumber(tackles_won).dividedBy(tackles).multipliedBy(100).dp(1).toNumber() : 0

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

// Outcomes data for bar chart (Pass Outcomes, Shot Outcomes, Event Types, Zones)
export function useOutcomesData(matchId) {
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

        // Calculate outcomes data
        const outcomes = calculateOutcomesFromEvents(allEvents)
        setData(outcomes)
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

// Helper function to calculate outcomes data from events
function calculateOutcomesFromEvents(events) {
  if (!events || events.length === 0) {
    return getEmptyOutcomesData()
  }

  // ==================== PASS OUTCOMES ====================
  const passEvents = events.filter(e =>
    ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'].includes(e.event_type)
  )
  const passesSuccessful = passEvents.filter(e =>
    ['Successful', 'Assist', 'Key Pass', 'Progressive Pass'].includes(e.outcome)
  ).length
  const passesUnsuccessful = passEvents.filter(e =>
    e.outcome === 'Unsuccessful' || e.outcome === 'Lost'
  ).length
  const keyPasses = events.filter(e => e.outcome === 'Key Pass').length
  const progressivePasses = events.filter(e =>
    e.outcome === 'Progressive Pass' || (e.event_type === 'Pass' && e.progressive === true)
  ).length
  const assists = events.filter(e => e.outcome === 'Assist').length

  // ==================== SHOT OUTCOMES ====================
  const shotEvents = events.filter(e => e.event_type === 'Shot')
  const goals = shotEvents.filter(e => e.outcome === 'Goal').length
  const shotsOnTarget = shotEvents.filter(e =>
    ['Goal', 'Saved', 'On Target'].includes(e.outcome)
  ).length
  const shotsBlocked = shotEvents.filter(e => e.outcome === 'Blocked').length
  const shotsOffTarget = shotEvents.filter(e =>
    e.outcome === 'Off Target' || e.outcome === 'Wide' || e.outcome === 'Over'
  ).length

  // ==================== EVENT TYPES ====================
  const totalPasses = passEvents.length
  const aerialDuels = events.filter(e =>
    e.event_type === 'Aerial Duel' || e.event_type === 'Header'
  ).length
  const offensiveDuels = events.filter(e =>
    e.event_type === 'Offensive Duel' || e.event_type === 'Attack Duel'
  ).length
  const defensiveDuels = events.filter(e =>
    e.event_type === 'Defensive Duel' || e.event_type === 'Ground Duel'
  ).length
  const longPasses = events.filter(e => e.event_type === 'Long Pass').length
  const crosses = events.filter(e => e.event_type === 'Cross').length
  const tackles = events.filter(e => e.event_type === 'Tackle').length
  const losses = events.filter(e =>
    e.event_type === 'Loss' ||
    e.event_type === 'Ball Lost' ||
    e.outcome === 'Lost' ||
    (e.event_type === 'Pass' && e.outcome === 'Unsuccessful')
  ).length
  const clearances = events.filter(e => e.event_type === 'Clearance').length
  const totalRecoveries = events.filter(e =>
    ['Recovery', 'Interception'].includes(e.event_type)
  ).length

  // ==================== ZONES ====================
  // Try to determine zone from zone_3x3 or pitch_zone
  const defensiveThird = events.filter(e =>
    e.zone_3x3?.startsWith('R1') || e.pitch_zone === 'Defensive Third'
  ).length
  const middleThird = events.filter(e =>
    e.zone_3x3?.startsWith('R2') || e.pitch_zone === 'Middle Third'
  ).length
  const attackingThird = events.filter(e =>
    e.zone_3x3?.startsWith('R3') || e.pitch_zone === 'Attacking Third'
  ).length

  return {
    // Pass outcomes
    passesSuccessful,
    passesUnsuccessful,
    keyPasses,
    progressivePasses,
    assists,
    // Shot outcomes
    goals,
    shotsOnTarget,
    shotsBlocked,
    shotsOffTarget,
    // Event types
    totalPasses,
    aerialDuels,
    offensiveDuels,
    defensiveDuels,
    longPasses,
    crosses,
    tackles,
    losses,
    clearances,
    totalRecoveries,
    // Zones
    defensiveThird,
    middleThird,
    attackingThird
  }
}

// Return empty outcomes data object
function getEmptyOutcomesData() {
  return {
    // Pass outcomes
    passesSuccessful: 0,
    passesUnsuccessful: 0,
    keyPasses: 0,
    progressivePasses: 0,
    assists: 0,
    // Shot outcomes
    goals: 0,
    shotsOnTarget: 0,
    shotsBlocked: 0,
    shotsOffTarget: 0,
    // Event types
    totalPasses: 0,
    aerialDuels: 0,
    offensiveDuels: 0,
    defensiveDuels: 0,
    longPasses: 0,
    crosses: 0,
    tackles: 0,
    losses: 0,
    clearances: 0,
    totalRecoveries: 0,
    // Zones
    defensiveThird: 0,
    middleThird: 0,
    attackingThird: 0
  }
}

// Heatmap data for activity visualization
export function useHeatmapData(matchId, eventTypes = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Convert array to string for stable dependency
  const eventTypesKey = eventTypes.join(',')

  useEffect(() => {
    async function fetchData() {
      if (!matchId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)

        // Fetch all events first, then filter in JS to avoid complex query issues
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

          const { data: pageData, error: queryError } = await query.order('id', { ascending: true })
          if (queryError) throw queryError

          if (pageData && pageData.length > 0) {
            allEvents = [...allEvents, ...pageData]
            from += pageSize
            hasMore = pageData.length === pageSize
          } else {
            hasMore = false
          }
        }

        // Filter events by type in JavaScript
        const typesToFilter = eventTypesKey.split(',').filter(t => t)
        let filteredEvents = allEvents

        if (typesToFilter.length > 0) {
          filteredEvents = allEvents.filter(e => {
            // Check event type match
            if (typesToFilter.includes(e.event_type)) return true

            // For Loss heatmap, also include events with Lost/Unsuccessful outcome
            if (typesToFilter.includes('Loss') || typesToFilter.includes('Ball Lost')) {
              if (e.outcome === 'Lost' || e.outcome === 'Unsuccessful') return true
            }

            return false
          })
        }

        // Process events into heatmap points
        const heatmapPoints = processEventsToHeatmap(filteredEvents)
        setData(heatmapPoints)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId, eventTypesKey])

  return { data, loading, error }
}

// Process events into heatmap coordinate points
function processEventsToHeatmap(events) {
  if (!events || events.length === 0) return []

  // Group events by grid cells (10x10 grid)
  const gridSize = 10
  const grid = {}

  events.forEach(event => {
    // Try different coordinate field names
    let x = event.x ?? event.start_x ?? event.location_x
    let y = event.y ?? event.start_y ?? event.location_y

    // Skip if no valid coordinates
    if (x === null || x === undefined || y === null || y === undefined) return

    // Normalize coordinates to 0-100 range if needed
    if (x > 100) x = (x / 120) * 100 // Some data uses 0-120 for pitch length
    if (y > 100) y = (y / 80) * 100  // Some data uses 0-80 for pitch width

    // Clamp values
    x = Math.max(0, Math.min(100, x))
    y = Math.max(0, Math.min(100, y))

    // Calculate grid cell
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
}

// Match lineup for formation display
export function useMatchLineup(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId || matchId === 'all') {
        setData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Step 1: Get lineup entries for this match
        const { data: lineupData, error: lineupError } = await supabase
          .from('match_lineups')
          .select('*')
          .eq('match_id', matchId)

        if (lineupError) throw lineupError
        if (!lineupData || lineupData.length === 0) {
          setData([])
          setLoading(false)
          return
        }

        // Step 2: Get player details for all player_ids in the lineup
        const playerIds = lineupData.map(item => item.player_id)

        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('player_id, first_name, last_name, shirt_number')
          .in('player_id', playerIds)

        if (playersError) throw playersError

        // Create a map for quick player lookup
        const playerMap = {}
          ; (playersData || []).forEach(p => {
            playerMap[p.player_id] = p
          })

        // Map to the format expected by LineupFormation
        const mappedLineup = lineupData.map(item => {
          const player = playerMap[item.player_id]
          return {
            position: item.position_id,
            number: player?.shirt_number || '?',
            name: player ? `${player.first_name} ${player.last_name}`.trim() : 'Unknown'
          }
        })

        setData(mappedLineup)
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
