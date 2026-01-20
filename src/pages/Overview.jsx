import { useState } from 'react'
import { Target, TrendingUp, Activity, Shield } from 'lucide-react'
import { useKPIStats } from '../hooks/useFetchData'
import { useMatch } from '../App'
import MatchSelector from '../components/MatchSelector'
import GameInfoCard from '../components/GameInfoCard'
import KPICard from '../components/KPICard'
import OutcomesChart from '../components/OutcomesChart'
import PerformanceChart from '../components/PerformanceChart'
import ActivityHeatmap from '../components/ActivityHeatmap'

// KPI Options configurations
const SHOTS_OPTIONS = [
  { key: 'shots', label: 'Shots', field: 'total_shots', subtitle: (s) => `${s?.shots_on_target || 0} on target` },
  { key: 'goals', label: 'Goals', field: 'goals', subtitle: (s) => `${s?.xg_total?.toFixed(2) || 0} xG` },
  { key: 'xg', label: 'Expected Goals (xG)', field: 'xg_total', format: (v) => v?.toFixed(2) || '0.00', subtitle: (s) => `${s?.goals || 0} actual goals` },
  { key: 'chances', label: 'Chances Created', field: 'chances_created', subtitle: (s) => `${s?.key_passes || 0} key passes` },
  { key: 'crosses', label: 'Crosses', field: 'crosses', subtitle: (s) => `${s?.crosses_successful || 0} successful` },
  { key: 'shot_accuracy', label: 'Shot Accuracy', field: 'shot_accuracy', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.shots_on_target || 0}/${s?.total_shots || 0}` },
  { key: 'conversion', label: 'Conversion Rate', field: 'conversion_rate', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.goals || 0} goals from ${s?.total_shots || 0} shots` },
]

const PASSES_OPTIONS = [
  { key: 'passes', label: 'Passes Attempted', field: 'total_passes', subtitle: (s) => `${s?.pass_accuracy || 0}% acc.` },
  { key: 'pass_accuracy', label: 'Pass Accuracy', field: 'pass_accuracy', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.passes_successful || 0}/${s?.total_passes || 0}` },
  { key: 'progressive', label: 'Progressive Passes', field: 'progressive_passes', subtitle: () => 'forward progression' },
  { key: 'long_passes', label: 'Long Passes', field: 'long_passes', subtitle: (s) => `${s?.long_passes_successful || 0} successful` },
  { key: 'long_pass_acc', label: 'Long Pass Acc.', field: 'long_pass_accuracy', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.long_passes_successful || 0}/${s?.long_passes || 0}` },
  { key: 'key_passes', label: 'Key Passes', field: 'key_passes', subtitle: () => 'leading to shots' },
  { key: 'assists', label: 'Assists', field: 'assists', subtitle: (s) => `${s?.key_passes || 0} key passes` },
]

const RECOVERIES_OPTIONS = [
  { key: 'recoveries', label: 'Recoveries', field: 'total_recoveries', subtitle: (s) => `${s?.controlled_recoveries || 0} controlled` },
  { key: 'losses', label: 'Losses', field: 'losses', subtitle: (s) => `${s?.dangerous_losses || 0} dangerous` },
  { key: 'ratio', label: 'Recovery/Loss Ratio', field: 'recovery_loss_ratio', format: (v) => v?.toFixed(2) || '0.00', subtitle: (s) => `${s?.total_recoveries || 0} rec / ${s?.losses || 0} loss` },
  { key: 'controlled', label: 'Controlled Recoveries', field: 'controlled_recoveries', subtitle: () => 'maintained possession' },
  { key: 'dangerous_losses', label: 'Dangerous Losses', field: 'dangerous_losses', subtitle: () => 'in own half' },
]

const DEFENSIVE_OPTIONS = [
  { key: 'def_duels', label: 'Defensive Duels', field: 'defensive_duels', subtitle: (s) => `${s?.defensive_duel_success || 0}% won` },
  { key: 'def_duel_success', label: 'Def. Duel Success', field: 'defensive_duel_success', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.defensive_duels_won || 0}/${s?.defensive_duels || 0}` },
  { key: 'aerial', label: 'Aerial Duels', field: 'aerial_duels', subtitle: (s) => `${s?.aerial_duels_won || 0} won` },
  { key: 'aerial_rate', label: 'Aerial Win Rate', field: 'aerial_win_rate', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.aerial_duels_won || 0}/${s?.aerial_duels || 0}` },
  { key: 'tackles', label: 'Tackles', field: 'tackles', subtitle: (s) => `${s?.tackle_success || 0}% success` },
  { key: 'tackle_success', label: 'Tackle Success', field: 'tackle_success', format: (v) => `${v || 0}%`, subtitle: (s) => `${s?.tackles_won || 0}/${s?.tackles || 0}` },
  { key: 'clearances', label: 'Clearances', field: 'clearances', subtitle: () => 'defensive clearances' },
  { key: 'blocks', label: 'Blocks', field: 'blocks', subtitle: () => 'shots/passes blocked' },
  { key: 'fouls', label: 'Fouls Committed', field: 'fouls_committed', subtitle: () => 'team fouls' },
]

function Overview() {
  const { selectedMatch, matchesLoading, selectedMatchId } = useMatch()
  const { data: teamStats, loading, error } = useKPIStats(selectedMatchId)

  // State for selected KPI options
  const [shotsOption, setShotsOption] = useState(SHOTS_OPTIONS[0])
  const [passesOption, setPassesOption] = useState(PASSES_OPTIONS[0])
  const [recoveriesOption, setRecoveriesOption] = useState(RECOVERIES_OPTIONS[0])
  const [defensiveOption, setDefensiveOption] = useState(DEFENSIVE_OPTIONS[0])

  // Helper to get value from stats based on option
  const getValue = (stats, option) => {
    if (!stats) return 0
    const rawValue = stats[option.field]
    if (option.format) {
      return option.format(rawValue)
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
    <div className="p-8">
      {/* Page Header with Match Selector */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">??</h1>
          <p className="text-gray-500">Season performance summary</p>
        </div>
        <div className="w-72">
          <MatchSelector />
        </div>
      </div>

      {/* Game Info Card */}
      <div className="mb-6">
        <GameInfoCard match={selectedMatch} loading={matchesLoading} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Shots"
          value={getValue(teamStats, shotsOption)}
          subtitle={getSubtitle(teamStats, shotsOption)}
          icon={Target}
          color="primary"
          loading={loading}
          options={SHOTS_OPTIONS}
          selectedOption={shotsOption}
          onOptionChange={setShotsOption}
        />
        <KPICard
          title="Passes Attempted"
          value={getValue(teamStats, passesOption)}
          subtitle={getSubtitle(teamStats, passesOption)}
          icon={TrendingUp}
          color="green"
          loading={loading}
          options={PASSES_OPTIONS}
          selectedOption={passesOption}
          onOptionChange={setPassesOption}
        />
        <KPICard
          title="Recoveries"
          value={getValue(teamStats, recoveriesOption)}
          subtitle={getSubtitle(teamStats, recoveriesOption)}
          icon={Activity}
          color="orange"
          loading={loading}
          options={RECOVERIES_OPTIONS}
          selectedOption={recoveriesOption}
          onOptionChange={setRecoveriesOption}
        />
        <KPICard
          title="Defensive Duels"
          value={getValue(teamStats, defensiveOption)}
          subtitle={getSubtitle(teamStats, defensiveOption)}
          icon={Shield}
          color="purple"
          loading={loading}
          options={DEFENSIVE_OPTIONS}
          selectedOption={defensiveOption}
          onOptionChange={setDefensiveOption}
        />
      </div>

      {/* Charts Row - Left: xG & Shots + Pass Outcomes stacked (smaller), Right: Heatmap (wider) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Left column - two stacked charts (2/5 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <PerformanceChart />
          <OutcomesChart />
        </div>
        {/* Right column - tall heatmap (3/5 width) */}
        <div className="lg:col-span-3 h-full">
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  )
}

export default Overview
