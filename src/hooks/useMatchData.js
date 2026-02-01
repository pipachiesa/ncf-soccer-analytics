import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Fetch match_info for selected match
export function useMatchInfo(matchId) {
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
                const { data: matchData, error: matchError } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('match_id', matchId)
                    .single()

                if (matchError && matchError.code !== 'PGRST116') throw matchError
                setData(matchData)
            } catch (err) {
                console.error('Error fetching match_info:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [matchId])

    return { data, loading, error }
}

// Fetch match_stats for selected match
export function useMatchStats(matchId) {
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
                const { data: statsData, error: statsError } = await supabase
                    .from('match_stats')
                    .select('*')
                    .eq('match_id', matchId)
                    .single()

                if (statsError && statsError.code !== 'PGRST116') throw statsError
                setData(statsData)
            } catch (err) {
                console.error('Error fetching match_stats:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [matchId])

    return { data, loading, error }
}

// Fetch lineups with full player data, minutes, goals, assists, cards
export function useMatchLineups(matchId) {
    const [homeLineup, setHomeLineup] = useState([])
    const [awayLineup, setAwayLineup] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchData() {
            if (!matchId || matchId === 'all') {
                setHomeLineup([])
                setAwayLineup([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)

                // 1. Fetch match_info to know home/away teams
                const { data: matchInfo } = await supabase
                    .from('matches')
                    .select('home_team, away_team')
                    .eq('match_id', matchId)
                    .single()

                // 2. Fetch match_lineups
                const { data: lineups, error: lineupsError } = await supabase
                    .from('match_lineups')
                    .select('*')
                    .eq('match_id', matchId)

                if (lineupsError) throw lineupsError
                if (!lineups || lineups.length === 0) {
                    setHomeLineup([])
                    setAwayLineup([])
                    setLoading(false)
                    return
                }

                const playerIds = lineups.map(l => l.player_id).filter(Boolean)

                // 3. Fetch players data
                const { data: playersData } = await supabase
                    .from('players')
                    .select('player_id, first_name, last_name, position')
                    .in('player_id', playerIds)

                const playersMap = {}
                playersData?.forEach(p => {
                    playersMap[p.player_id] = p
                })

                // 4. Fetch player_minutes
                const { data: minutesData } = await supabase
                    .from('player_minutes')
                    .select('*')
                    .eq('match_id', matchId)
                    .in('player_id', playerIds)

                const minutesMap = {}
                minutesData?.forEach(m => {
                    minutesMap[m.player_id] = m.minutes_played || 0
                })

                // 5. Fetch events for goals/assists
                const { data: eventsData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('match_id', matchId)
                    .in('player_id', playerIds)

                const statsMap = {}
                eventsData?.forEach(e => {
                    const pid = e.player_id
                    if (!statsMap[pid]) {
                        statsMap[pid] = { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
                    }

                    // Goals: Shot + Goal outcome
                    if (e.event_type === 'Shot' && e.outcome === 'Goal') {
                        statsMap[pid].goals += 1
                    }

                    // Assists
                    if (e.outcome === 'Assist') {
                        statsMap[pid].assists += 1
                    }

                    // Cards (multiple possible patterns)
                    if (e.outcome === 'Yellow Card' || e.yellow_card === true || e.card_type === 'Yellow') {
                        statsMap[pid].yellow_cards += 1
                    }
                    if (e.outcome === 'Red Card' || e.red_card === true || e.card_type === 'Red') {
                        statsMap[pid].red_cards += 1
                    }
                })

                // 6. Map all data together
                const enrichedLineups = lineups.map(lineup => {
                    const player = playersMap[lineup.player_id]
                    const stats = statsMap[lineup.player_id] || { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
                    const minutes = minutesMap[lineup.player_id] || 0

                    return {
                        ...lineup,
                        player_name: player ? `${player.first_name} ${player.last_name}`.trim() : 'Unknown',
                        position: player?.position || lineup.position_id || '-',
                        minutes,
                        ...stats
                    }
                })

                // 7. Separate home/away based on match_info teams
                // Assume if match_lineups has team info, use it; 
                // Otherwise infer: check if player's team matches home_team/away_team
                const { data: playersWithTeam } = await supabase
                    .from('players')
                    .select('player_id, team_id')
                    .in('player_id', playerIds)

                const teamMap = {}
                playersWithTeam?.forEach(p => {
                    teamMap[p.player_id] = p.team_id
                })

                const home = []
                const away = []

                enrichedLineups.forEach(item => {
                    const team = teamMap[item.player_id]
                    // Assuming NCF is always playing; check if team matches home or away
                    if (matchInfo) {
                        if (team === matchInfo.home_team || team === 'NCF' && matchInfo.home_team === 'NCF') {
                            home.push(item)
                        } else {
                            away.push(item)
                        }
                    } else {
                        // Fallback: all in home if we can't determine
                        home.push(item)
                    }
                })

                // Sort: starters first, then by position
                const sortLineup = (lineup) => {
                    return lineup.sort((a, b) => {
                        if (a.is_starter !== b.is_starter) return a.is_starter ? -1 : 1
                        return 0
                    })
                }

                setHomeLineup(sortLineup(home))
                setAwayLineup(sortLineup(away))

            } catch (err) {
                console.error('Error fetching lineups:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [matchId])

    return { homeLineup, awayLineup, loading, error }
}

// Fetch rival/opponent lineup from rivals_lineups table
export function useRivalsLineup(matchId) {
    const [rivalLineup, setRivalLineup] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchData() {
            if (!matchId || matchId === 'all') {
                setRivalLineup([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)

                const { data: rivalsData, error: rivalsError } = await supabase
                    .from('rivals_lineups')
                    .select('*')
                    .eq('match_id', matchId)

                if (rivalsError) throw rivalsError

                if (!rivalsData || rivalsData.length === 0) {
                    setRivalLineup([])
                    setLoading(false)
                    return
                }

                // Map to expected format for LineupsAndStatsRow
                const formattedLineup = rivalsData.map((player, idx) => ({
                    player_id: `rival_${matchId}_${idx}`,
                    player_name: player.player_name || 'Unknown',
                    position: player.position || '-',
                    minutes: parseInt(player.min, 10) || 0,
                    goals: parseInt(player.goals, 10) || 0,
                    assists: parseInt(player.assists, 10) || 0,
                    team: player.team
                }))

                // Sort by position: GK first, then DF, MF, FW
                const positionOrder = { 'GK': 0, 'DF': 1, 'MF': 2, 'FW': 3 }
                formattedLineup.sort((a, b) => {
                    const orderA = positionOrder[a.position] ?? 4
                    const orderB = positionOrder[b.position] ?? 4
                    return orderA - orderB
                })

                setRivalLineup(formattedLineup)

            } catch (err) {
                console.error('Error fetching rivals lineup:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [matchId])

    return { rivalLineup, loading, error }
}
