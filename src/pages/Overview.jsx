import { useState, useEffect } from 'react'
import Per90Toggle from '../components/Per90Toggle'
import BigNumber from 'bignumber.js'
import { Target, TrendingUp, Activity, Shield } from 'lucide-react'
import { useTeamStats, useEvents } from '../hooks/useFetchData'
import { useMatchInfo, useMatchStats, useMatchLineups, useRivalsLineup } from '../hooks/useMatchData'
import { useMatch } from '../App'
import MatchSelector from '../components/MatchSelector'
import MatchInfoBox from '../components/Overview/MatchInfoBox'
import LineupsAndStatsRow from '../components/Overview/LineupsAndStatsRow'
import ShotMap from '../components/Overview/ShotMap'
import KPICard from '../components/KPICard'
import PerformanceChart from '../components/PerformanceChart'
import ActivityHeatmap from '../components/ActivityHeatmap'

// KPI Options configurations
const SHOTS_OPTIONS = [
  { key: 'shots', label: 'Shots', field: 'total_shots', subtitle: (s) => `${new BigNumber(s?.shots_on_target || 0).dp(1).toNumber()} on target` },
  { key: 'goals', label: 'Goals', field: 'goals', subtitle: (s) => `${new BigNumber(s?.xg_total || 0).dp(1).toNumber()} xG` },
  { key: 'xg', label: 'Expected Goals (xG)', field: 'xg_total', format: (v) => new BigNumber(v || 0).dp(2).toNumber(), subtitle: (s) => `${new BigNumber(s?.goals || 0).dp(1).toNumber()} actual goals` },
  { key: 'chances', label: 'Chances Created', field: 'chances_created', subtitle: (s) => `${new BigNumber(s?.key_passes || 0).dp(1).toNumber()} key passes` },
  { key: 'crosses', label: 'Crosses', field: 'crosses', subtitle: (s) => `${new BigNumber(s?.crosses_successful || 0).dp(1).toNumber()} successful` },
  { key: 'shot_accuracy', label: 'Shot Accuracy', field: 'shot_accuracy', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.shots_on_target || 0).dp(1).toNumber()}/${new BigNumber(s?.total_shots || 0).dp(1).toNumber()}` },
  { key: 'conversion', label: 'Conversion Rate', field: 'conversion_rate', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.goals || 0).dp(1).toNumber()} goals from ${new BigNumber(s?.total_shots || 0).dp(1).toNumber()} shots` },
]

const PASSES_OPTIONS = [
  { key: 'passes', label: 'Passes Attempted', field: 'total_passes', subtitle: (s) => `${new BigNumber(s?.pass_accuracy || 0).dp(1).toNumber()}% acc.` },
  { key: 'pass_accuracy', label: 'Pass Accuracy', field: 'pass_accuracy', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.passes_successful || 0).dp(1).toNumber()}/${new BigNumber(s?.total_passes || 0).dp(1).toNumber()}` },
  { key: 'progressive', label: 'Progressive Passes', field: 'progressive_passes', subtitle: () => 'forward progression' },
  { key: 'long_passes', label: 'Long Passes', field: 'long_passes', subtitle: (s) => `${new BigNumber(s?.long_passes_successful || 0).dp(1).toNumber()} successful` },
  { key: 'long_pass_acc', label: 'Long Pass Acc.', field: 'long_pass_accuracy', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.long_passes_successful || 0).dp(1).toNumber()}/${new BigNumber(s?.long_passes || 0).dp(1).toNumber()}` },
  { key: 'key_passes', label: 'Key Passes', field: 'key_passes', subtitle: () => 'leading to shots' },
  { key: 'assists', label: 'Assists', field: 'assists', subtitle: (s) => `${new BigNumber(s?.key_passes || 0).dp(1).toNumber()} key passes` },
]

const RECOVERIES_OPTIONS = [
  { key: 'recoveries', label: 'Recoveries', field: 'total_recoveries', subtitle: (s) => `${new BigNumber(s?.controlled_recoveries || 0).dp(1).toNumber()} controlled` },
  { key: 'losses', label: 'Losses', field: 'losses', subtitle: (s) => `${new BigNumber(s?.dangerous_losses || 0).dp(1).toNumber()} dangerous` },
  { key: 'ratio', label: 'Recovery/Loss Ratio', field: 'recovery_loss_ratio', format: (v) => new BigNumber(v || 0).dp(2).toNumber(), subtitle: (s) => `${new BigNumber(s?.total_recoveries || 0).dp(1).toNumber()} rec / ${new BigNumber(s?.losses || 0).dp(1).toNumber()} loss` },
  { key: 'controlled', label: 'Controlled Recoveries', field: 'controlled_recoveries', subtitle: () => 'maintained possession' },
  { key: 'dangerous_losses', label: 'Dangerous Losses', field: 'dangerous_losses', subtitle: () => 'in own half' },
]

const DEFENSIVE_OPTIONS = [
  { key: 'def_duels', label: 'Defensive Duels', field: 'defensive_duels', subtitle: (s) => `${new BigNumber(s?.defensive_duel_success || 0).dp(1).toNumber()}% won` },
  { key: 'def_duel_success', label: 'Def. Duel Success', field: 'defensive_duel_success', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.defensive_duels_won || 0).dp(1).toNumber()}/${new BigNumber(s?.defensive_duels || 0).dp(1).toNumber()}` },
  { key: 'aerial', label: 'Aerial Duels', field: 'aerial_duels', subtitle: (s) => `${new BigNumber(s?.aerial_duels_won || 0).dp(1).toNumber()} won` },
  { key: 'aerial_rate', label: 'Aerial Win Rate', field: 'aerial_win_rate', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.aerial_duels_won || 0).dp(1).toNumber()}/${new BigNumber(s?.aerial_duels || 0).dp(1).toNumber()}` },
  { key: 'tackles', label: 'Tackles', field: 'tackles', subtitle: (s) => `${new BigNumber(s?.tackle_success || 0).dp(1).toNumber()}% success` },
  { key: 'tackle_success', label: 'Tackle Success', field: 'tackle_success', format: (v) => `${new BigNumber(v || 0).dp(1).toNumber()}%`, subtitle: (s) => `${new BigNumber(s?.tackles_won || 0).dp(1).toNumber()}/${new BigNumber(s?.tackles || 0).dp(1).toNumber()}` },
  { key: 'clearances', label: 'Clearances', field: 'clearances', subtitle: () => 'defensive clearances' },
  { key: 'blocks', label: 'Blocks', field: 'blocks', subtitle: () => 'shots/passes blocked' },
  { key: 'fouls', label: 'Fouls Committed', field: 'fouls_committed', subtitle: () => 'team fouls' },
]

function Overview() {
  const { selectedMatch, matchesLoading, selectedMatchId, matches } = useMatch()
  const { data: teamStats, loading, error } = useTeamStats(selectedMatchId)

  // Match-specific data (only when single match selected)
  const { data: matchInfo, loading: matchInfoLoading } = useMatchInfo(selectedMatchId)
  const { data: matchStats, loading: matchStatsLoading } = useMatchStats(selectedMatchId)
  const { awayLineup, loading: lineupsLoading } = useMatchLineups(selectedMatchId)
  const { rivalLineup, loading: rivalsLoading } = useRivalsLineup(selectedMatchId)
  const { data: events, loading: eventsLoading } = useEvents(selectedMatchId)

  // State for display mode
  const [isPer90, setIsPer90] = useState(false)
  const isAllGames = selectedMatchId === 'all' || !selectedMatchId

  // Reset per90 when switching off all games
  useEffect(() => {
    if (!isAllGames) {
      setIsPer90(false)
    }
  }, [isAllGames])

  // State for selected KPI options
  const [shotsOption, setShotsOption] = useState(SHOTS_OPTIONS[0])
  const [passesOption, setPassesOption] = useState(PASSES_OPTIONS[0])
  const [recoveriesOption, setRecoveriesOption] = useState(RECOVERIES_OPTIONS[0])
  const [defensiveOption, setDefensiveOption] = useState(DEFENSIVE_OPTIONS[0])

  // Calculate stats based on mode
  const getDisplayStats = () => {
    if (!teamStats) return null
    if (!isPer90 || !isAllGames) return teamStats

    const matchCount = matches?.length || 1
    if (matchCount === 0) return teamStats

    // Create a copy to modify
    const per90Stats = { ...teamStats }

    // List of fields to divide by match count (count stats)
    const countFields = [
      'total_shots', 'goals', 'shots_on_target', 'xg_total', 'chances_created',
      'crosses', 'crosses_successful',
      'total_passes', 'passes_successful', 'progressive_passes',
      'long_passes', 'long_passes_successful', 'key_passes', 'assists',
      'total_recoveries', 'controlled_recoveries', 'losses', 'dangerous_losses',
      'defensive_duels', 'defensive_duels_won', 'aerial_duels', 'aerial_duels_won',
      'tackles', 'tackles_won', 'clearances', 'blocks', 'fouls_committed'
    ]

    countFields.forEach(field => {
      if (per90Stats[field] !== undefined) {
        per90Stats[field] = new BigNumber(per90Stats[field]).dividedBy(matchCount).dp(1).toNumber()
      }
    })

    return per90Stats
  }

  const displayStats = getDisplayStats()
  const matchCount = matches?.length || 0

  // Helper to get value from stats based on option
  const getValue = (stats, option) => {
    if (!stats) return 0
    const rawValue = stats[option.field]
    if (option.format) {
      return option.format(rawValue)
    }
    if (typeof rawValue === 'number' && !Number.isInteger(rawValue) && rawValue !== 0) {
      return new BigNumber(rawValue).dp(1).toNumber()
    }
    return rawValue || 0
  }

  // Helper to get subtitle from stats based on option
  const getSubtitle = (stats, option) => {
    if (!stats) return ''

    if (typeof option.subtitle === 'function') {
      return option.subtitle(stats)
    }
    return option.subtitle || ''
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-red-800 font-semibold">Error loading data</h2>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Page Header with Match Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
          <p className="text-gray-500">
            {isAllGames
              ? `Season Summary • ${matchCount} Matches`
              : 'Match Performance Analysis'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Per 90 Toggle - Only visible in All Games mode */}
          {isAllGames && (
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <Per90Toggle isOn={isPer90} onToggle={() => setIsPer90(!isPer90)} />
            </div>
          )}

          <div className="w-56">
            <MatchSelector />
          </div>
        </div>
      </div>

      {/* Match Info Box. Full width, only for single match */}
      {!isAllGames && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <MatchInfoBox matchInfo={matchInfo} />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Shots"
          value={getValue(displayStats, shotsOption)}
          subtitle={getSubtitle(displayStats, shotsOption)}
          icon={Target}
          color="primary"
          loading={loading}
          options={SHOTS_OPTIONS}
          selectedOption={shotsOption}
          onOptionChange={setShotsOption}
        />
        <KPICard
          title="Passes Attempted"
          value={getValue(displayStats, passesOption)}
          subtitle={getSubtitle(displayStats, passesOption)}
          icon={TrendingUp}
          color="green"
          loading={loading}
          options={PASSES_OPTIONS}
          selectedOption={passesOption}
          onOptionChange={setPassesOption}
        />
        <KPICard
          title="Recoveries"
          value={getValue(displayStats, recoveriesOption)}
          subtitle={getSubtitle(displayStats, recoveriesOption)}
          icon={Activity}
          color="orange"
          loading={loading}
          options={RECOVERIES_OPTIONS}
          selectedOption={recoveriesOption}
          onOptionChange={setRecoveriesOption}
        />
        <KPICard
          title="Defensive Duels"
          value={getValue(displayStats, defensiveOption)}
          subtitle={getSubtitle(displayStats, defensiveOption)}
          icon={Shield}
          color="purple"
          loading={loading}
          options={DEFENSIVE_OPTIONS}
          selectedOption={defensiveOption}
          onOptionChange={setDefensiveOption}
        />
      </div>

      {/* Lineups and Match Stats - Only for single match */}
      {!isAllGames && (
        <LineupsAndStatsRow
          homeLineup={rivalLineup}
          awayLineup={awayLineup}
          matchStats={matchStats}
          matchInfo={matchInfo}
        />
      )}

      {/* Visualizations Section */}
      <div className="space-y-6">
        {/* Single Match: Shot Map + Performance Chart */}
        {!isAllGames && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex justify-center xl:justify-start">
              <div className="w-full max-w-[500px]">
                <ShotMap shots={events} />
              </div>
            </div>
            <PerformanceChart />
          </div>
        )}

        {/* All Games: Just performance chart */}
        {isAllGames && (
          <PerformanceChart />
        )}

        {/* Heatmap Section (both modes) */}
        <div className="animate-in zoom-in-95 duration-500">
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  )
}

export default Overview
