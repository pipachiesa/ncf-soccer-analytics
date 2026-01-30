// Data Verification Script for Soccer Dashboard
// Run this in browser console or import into a component to verify data

import { supabase } from '../lib/supabase'

export async function verifyDashboardData() {
  console.log('='.repeat(60))
  console.log('SOCCER DASHBOARD DATA VERIFICATION REPORT')
  console.log('='.repeat(60))

  const report = {
    matches: {},
    discrepancies: [],
    recommendations: []
  }

  try {
    // ==================== 1. BASIC DATABASE COUNTS ====================
    console.log('\n📊 1. DATABASE OVERVIEW')
    console.log('-'.repeat(40))

    // Total matches
    const { data: matches, error: matchErr } = await supabase
      .from('matches')
      .select('*')

    if (matchErr) throw matchErr
    console.log(`Total Matches: ${matches.length}`)
    matches.forEach(m => console.log(`  - ${m.match_id}: ${m.opponent || 'Unknown opponent'}`))

    // Total events per match
    const { data: allEvents, error: eventsErr } = await supabase
      .from('events')
      .select('*')

    if (eventsErr) throw eventsErr
    console.log(`\nTotal Events: ${allEvents.length}`)

    const eventsByMatch = {}
    allEvents.forEach(e => {
      if (!eventsByMatch[e.match_id]) eventsByMatch[e.match_id] = []
      eventsByMatch[e.match_id].push(e)
    })

    Object.keys(eventsByMatch).forEach(matchId => {
      console.log(`  - ${matchId}: ${eventsByMatch[matchId].length} events`)
    })

    // Total players
    const { data: players, error: playersErr } = await supabase
      .from('players')
      .select('*')

    if (playersErr) throw playersErr
    console.log(`\nTotal Players: ${players.length}`)

    // ==================== 2. PER-MATCH VERIFICATION ====================
    for (const matchId of Object.keys(eventsByMatch)) {
      console.log('\n' + '='.repeat(60))
      console.log(`📋 MATCH: ${matchId.toUpperCase()}`)
      console.log('='.repeat(60))

      const matchEvents = eventsByMatch[matchId]
      report.matches[matchId] = {}

      // --- SHOTS ---
      const shots = matchEvents.filter(e => e.event_type === 'Shot')
      const goals = shots.filter(e => e.outcome === 'Goal')
      const shotsOnTarget = shots.filter(e =>
        e.outcome === 'Goal' || e.outcome === 'Saved' || e.outcome === 'On Target'
      )

      console.log('\n🎯 SHOTS:')
      console.log(`  Total Shots: ${shots.length}`)
      console.log(`  Goals: ${goals.length}`)
      console.log(`  Shots on Target: ${shotsOnTarget.length}`)
      console.log(`  Shot Accuracy: ${shots.length > 0 ? ((shotsOnTarget.length / shots.length) * 100).toFixed(1) : 0}%`)

      report.matches[matchId].shots = {
        total: shots.length,
        goals: goals.length,
        onTarget: shotsOnTarget.length
      }

      // --- PASSES ---
      const passes = matchEvents.filter(e =>
        ['Pass', 'Long Pass', 'Short Pass', 'Through Pass', 'Cross'].includes(e.event_type)
      )
      const successfulPasses = passes.filter(e =>
        ['Successful', 'Assist', 'Key Pass', 'Progressive Pass'].includes(e.outcome)
      )

      console.log('\n⚽ PASSES:')
      console.log(`  Total Passes: ${passes.length}`)
      console.log(`  Successful Passes: ${successfulPasses.length}`)
      console.log(`  Pass Accuracy: ${passes.length > 0 ? ((successfulPasses.length / passes.length) * 100).toFixed(1) : 0}%`)

      report.matches[matchId].passes = {
        total: passes.length,
        successful: successfulPasses.length,
        accuracy: passes.length > 0 ? ((successfulPasses.length / passes.length) * 100).toFixed(1) : 0
      }

      // --- DUELS ---
      const duels = matchEvents.filter(e => e.event_type?.includes('Duel'))
      const duelsWon = duels.filter(e => e.outcome === 'Won')

      console.log('\n💪 DUELS:')
      console.log(`  Total Duels: ${duels.length}`)
      console.log(`  Duels Won: ${duelsWon.length}`)
      console.log(`  Duel Success Rate: ${duels.length > 0 ? ((duelsWon.length / duels.length) * 100).toFixed(1) : 0}%`)

      report.matches[matchId].duels = {
        total: duels.length,
        won: duelsWon.length
      }

      // --- RECOVERIES ---
      const recoveries = matchEvents.filter(e =>
        ['Recovery', 'Interception'].includes(e.event_type)
      )

      console.log('\n🔄 RECOVERIES:')
      console.log(`  Total Recoveries: ${recoveries.length}`)

      report.matches[matchId].recoveries = recoveries.length

      // --- LOSSES ---
      const losses = matchEvents.filter(e =>
        e.event_type === 'Loss' || e.event_type === 'Ball Lost' ||
        e.outcome === 'Lost' || e.outcome === 'Unsuccessful'
      )

      console.log('\n❌ LOSSES:')
      console.log(`  Total Losses: ${losses.length}`)

      report.matches[matchId].losses = losses.length

      // --- TACKLES ---
      const tackles = matchEvents.filter(e => e.event_type === 'Tackle')
      const tacklesWon = tackles.filter(e => e.outcome === 'Won' || e.outcome === 'Successful')

      console.log('\n🦵 TACKLES:')
      console.log(`  Total Tackles: ${tackles.length}`)
      console.log(`  Tackles Won: ${tacklesWon.length}`)

      // --- EVENT TYPE BREAKDOWN ---
      console.log('\n📈 EVENT TYPE BREAKDOWN:')
      const eventTypes = {}
      matchEvents.forEach(e => {
        const type = e.event_type || 'Unknown'
        eventTypes[type] = (eventTypes[type] || 0) + 1
      })
      Object.entries(eventTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`)
        })

      // --- TOP 5 PLAYERS BY ACTIONS ---
      console.log('\n🏆 TOP 5 PLAYERS BY ACTIONS:')
      const playerActions = {}
      matchEvents.forEach(e => {
        const playerId = e.player_id
        if (playerId) {
          playerActions[playerId] = (playerActions[playerId] || 0) + 1
        }
      })

      const topPlayers = Object.entries(playerActions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      // Get player names
      const topPlayerIds = topPlayers.map(p => p[0])
      const { data: topPlayerData } = await supabase
        .from('players')
        .select('player_id, first_name, last_name')
        .in('player_id', topPlayerIds)

      const playerNameMap = {}
      topPlayerData?.forEach(p => {
        playerNameMap[p.player_id] = `${p.first_name} ${p.last_name}`.trim()
      })

      topPlayers.forEach(([playerId, count], i) => {
        const name = playerNameMap[playerId] || playerId
        console.log(`  ${i + 1}. ${name}: ${count} actions`)
      })

      // --- ZONE DISTRIBUTION ---
      console.log('\n🗺️ ZONE DISTRIBUTION (3x3):')
      const zones = {}
      matchEvents.forEach(e => {
        if (e.zone_3x3) {
          zones[e.zone_3x3] = (zones[e.zone_3x3] || 0) + 1
        }
      })
      Object.entries(zones)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([zone, count]) => {
          console.log(`  ${zone}: ${count}`)
        })

      // --- COMPARE WITH TEAM_STATS TABLE ---
      console.log('\n📊 TEAM_STATS TABLE COMPARISON:')
      const { data: teamStats, error: tsErr } = await supabase
        .from('team_stats')
        .select('*')
        .eq('match_id', matchId)
        .single()

      if (tsErr && tsErr.code !== 'PGRST116') {
        console.log(`  Error fetching team_stats: ${tsErr.message}`)
      } else if (teamStats) {
        console.log(`  DB total_shots: ${teamStats.total_shots} | Calculated: ${shots.length}`)
        console.log(`  DB goals: ${teamStats.goals} | Calculated: ${goals.length}`)
        console.log(`  DB total_passes: ${teamStats.total_passes} | Calculated: ${passes.length}`)
        console.log(`  DB pass_accuracy: ${teamStats.pass_accuracy}% | Calculated: ${report.matches[matchId].passes.accuracy}%`)
        console.log(`  DB total_recoveries: ${teamStats.total_recoveries} | Calculated: ${recoveries.length}`)

        // Check for discrepancies
        if (teamStats.total_shots !== shots.length) {
          report.discrepancies.push({
            match: matchId,
            field: 'total_shots',
            dbValue: teamStats.total_shots,
            calculated: shots.length
          })
        }
        if (teamStats.goals !== goals.length) {
          report.discrepancies.push({
            match: matchId,
            field: 'goals',
            dbValue: teamStats.goals,
            calculated: goals.length
          })
        }
      } else {
        console.log(`  No team_stats record found for this match`)
      }

      // --- COMPARE WITH PLAYER_STATS TABLE ---
      console.log('\n👥 PLAYER_STATS TABLE SAMPLE:')
      const { data: playerStats } = await supabase
        .from('player_stats')
        .select('*, players(first_name, last_name)')
        .eq('match_id', matchId)
        .order('total_actions', { ascending: false })
        .limit(3)

      playerStats?.forEach(ps => {
        const name = ps.players ? `${ps.players.first_name} ${ps.players.last_name}` : 'Unknown'
        const calculatedActions = playerActions[ps.player_id] || 0
        console.log(`  ${name}:`)
        console.log(`    DB total_actions: ${ps.total_actions} | Events count: ${calculatedActions}`)
        console.log(`    DB passes: ${ps.passes}, shots: ${ps.shots}, goals: ${ps.goals}`)

        if (ps.total_actions !== calculatedActions) {
          report.discrepancies.push({
            match: matchId,
            player: name,
            field: 'total_actions',
            dbValue: ps.total_actions,
            calculated: calculatedActions
          })
        }
      })
    }

    // ==================== 3. DISCREPANCIES SUMMARY ====================
    console.log('\n' + '='.repeat(60))
    console.log('⚠️ DISCREPANCIES FOUND')
    console.log('='.repeat(60))

    if (report.discrepancies.length === 0) {
      console.log('No discrepancies found! Data appears consistent.')
    } else {
      report.discrepancies.forEach((d, i) => {
        console.log(`\n${i + 1}. ${d.match} - ${d.player || ''} ${d.field}:`)
        console.log(`   Database: ${d.dbValue}`)
        console.log(`   Calculated: ${d.calculated}`)
      })
    }

    // ==================== 4. COORDINATE VERIFICATION ====================
    console.log('\n' + '='.repeat(60))
    console.log('📍 COORDINATE VERIFICATION')
    console.log('='.repeat(60))

    const eventsWithCoords = allEvents.filter(e => e.x !== null && e.y !== null)
    const eventsWithoutCoords = allEvents.filter(e => e.x === null || e.y === null)

    console.log(`Events with coordinates: ${eventsWithCoords.length}`)
    console.log(`Events without coordinates: ${eventsWithoutCoords.length}`)

    // Check coordinate ranges
    const xValues = eventsWithCoords.map(e => e.x)
    const yValues = eventsWithCoords.map(e => e.y)

    console.log(`X range: ${Math.min(...xValues)} to ${Math.max(...xValues)}`)
    console.log(`Y range: ${Math.min(...yValues)} to ${Math.max(...yValues)}`)

    if (Math.max(...xValues) > 100 || Math.max(...yValues) > 100) {
      report.recommendations.push('Some coordinates exceed 100 - may need normalization')
    }

    // ==================== 5. RECOMMENDATIONS ====================
    console.log('\n' + '='.repeat(60))
    console.log('💡 RECOMMENDATIONS')
    console.log('='.repeat(60))

    if (report.recommendations.length === 0) {
      console.log('No issues found requiring action.')
    } else {
      report.recommendations.forEach((r, i) => {
        console.log(`${i + 1}. ${r}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('VERIFICATION COMPLETE')
    console.log('='.repeat(60))

    return report

  } catch (error) {
    console.error('Verification failed:', error)
    return { error: error.message }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.verifyDashboardData = verifyDashboardData
}
