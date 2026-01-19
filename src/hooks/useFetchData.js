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

// Player stats for a specific match
export function usePlayerStats(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('player_stats')
          .select('*')
          .eq('match_id', matchId)
          .order('total_actions', { ascending: false })
        if (error) throw error
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

// Team stats for a specific match
export function useTeamStats(matchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('team_stats')
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
        const { data, error } = await supabase
          .from('events')
          .select('zone_3x3')
          .eq('match_id', matchId)
          .in('event_type', ['Defensive Duel', 'Tackle', 'Recovery', 'Interception'])
        if (error) throw error
        
        // Count by zone
        const zones = ['R1C1', 'R1C2', 'R1C3', 'R2C1', 'R2C2', 'R2C3', 'R3C1', 'R3C2', 'R3C3']
        const counts = {}
        zones.forEach(z => {
          counts[z] = data?.filter(e => e.zone_3x3 === z).length || 0
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
        const { data, error } = await supabase
          .from('player_stats')
          .select('*, players!player_id(player_id, first_name)')
          .eq('match_id', matchId)
          .order('total_actions', { ascending: false })
          .limit(3)
        if (error) throw error
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
