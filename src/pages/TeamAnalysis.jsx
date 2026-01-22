import { useState } from 'react'
import BigNumber from 'bignumber.js'
import { useMatch } from '../App'
import { useKPIStats } from '../hooks/useFetchData'
import MatchSelector from '../components/MatchSelector'
import LineupFormation from '../components/LineupFormation'
import MetricBox from '../components/MetricBox'
import TeamHeatmap from '../components/TeamHeatmap'

// Metric configurations for the 6 boxes
const METRICS_CONFIG = [
  {
    id: 'passes',
    title: 'Passes',
    primaryField: 'total_passes',
    secondaryField: 'pass_accuracy',
    secondaryFormat: (v) => `${v || 0}% accuracy`,
    color: 'primary',
    expandedDetails: [
      { label: 'Progressive Passes', field: 'progressive_passes' },
      { label: 'Long Passes', field: 'long_passes' },
      { label: 'Key Passes', field: 'key_passes' },
      { label: 'Assists', field: 'assists' },
    ]
  },
  {
    id: 'shots',
    title: 'Shots',
    primaryField: 'total_shots',
    secondaryField: 'shots_on_target',
    secondaryFormat: (v) => `${v || 0} on target`,
    color: 'green',
    expandedDetails: [
      { label: 'Goals', field: 'goals' },
      { label: 'xG per Shot', field: 'xg_total', format: (v, stats) => stats?.total_shots > 0 ? new BigNumber(v).dividedBy(stats.total_shots).dp(2).toNumber() : '0.00' },
      { label: 'Conversion Rate', field: 'conversion_rate', format: (v) => `${v || 0}%` },
      { label: 'Chances Created', field: 'chances_created' },
    ]
  },
  {
    id: 'duels',
    title: 'Duels',
    primaryField: 'duels_won',
    secondaryField: 'duel_success_rate',
    secondaryFormat: (v) => `${v || 0}% success`,
    color: 'orange',
    expandedDetails: [
      { label: 'Defensive Duels Won', field: 'defensive_duels_won' },
      { label: 'Aerial Duels Won', field: 'aerial_duels_won' },
      { label: 'Tackles Won', field: 'tackles_won' },
      { label: 'Total Duels', field: 'duels_total' },
    ]
  },
  {
    id: 'recoveries',
    title: 'Recoveries',
    primaryField: 'total_recoveries',
    secondaryField: 'controlled_recoveries',
    secondaryFormat: (v) => `${v || 0} controlled`,
    color: 'purple',
    expandedDetails: [
      { label: 'Controlled Recoveries', field: 'controlled_recoveries' },
      { label: 'Interceptions', field: 'interceptions' },
      { label: 'Recovery/Loss Ratio', field: 'recovery_loss_ratio', format: (v) => new BigNumber(v || 0).dp(2).toNumber() },
    ]
  },
  {
    id: 'xg',
    title: 'Expected Goals',
    primaryField: 'xg_total',
    primaryFormat: (v) => new BigNumber(v || 0).dp(2).toNumber(),
    secondaryField: 'goals',
    secondaryFormat: (v) => `${v || 0} actual goals`,
    color: 'green',
    expandedDetails: [
      { label: 'Goals Scored', field: 'goals' },
      { label: 'xG Difference', field: 'xg_total', format: (v, stats) => new BigNumber(stats?.goals || 0).minus(v || 0).dp(2).toNumber() },
      { label: 'Shots', field: 'total_shots' },
      { label: 'Shots on Target', field: 'shots_on_target' },
    ]
  },
  {
    id: 'losses',
    title: 'Losses',
    primaryField: 'losses',
    secondaryField: 'dangerous_losses',
    secondaryFormat: (v) => `${v || 0} dangerous`,
    color: 'orange',
    expandedDetails: [
      { label: 'Dangerous Losses', field: 'dangerous_losses' },
      { label: 'Recovery/Loss Ratio', field: 'recovery_loss_ratio', format: (v) => new BigNumber(v || 0).dp(2).toNumber() },
      { label: 'Total Recoveries', field: 'total_recoveries' },
    ]
  },
]

function TeamAnalysis() {
  const { matchesLoading, selectedMatchId } = useMatch()
  const { data: teamStats, loading, error } = useKPIStats(selectedMatchId)

  // State for expanded metric card
  const [expandedCard, setExpandedCard] = useState(null)

  // Helper to get primary value
  const getPrimaryValue = (stats, metric) => {
    if (!stats) return 0
    const rawValue = stats[metric.primaryField]
    if (metric.primaryFormat) {
      return metric.primaryFormat(rawValue)
    }
    return rawValue || 0
  }

  // Helper to get secondary value
  const getSecondaryValue = (stats, metric) => {
    if (!stats) return ''
    const rawValue = stats[metric.secondaryField]
    if (metric.secondaryFormat) {
      return metric.secondaryFormat(rawValue)
    }
    return rawValue || ''
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
          <h1 className="text-2xl font-bold text-gray-900">Team Analysis</h1>
          <p className="text-gray-500">Formation and performance metrics</p>
        </div>
        <div className="w-72">
          <MatchSelector />
        </div>
      </div>

      {/* Main Content Grid - Lineup (left) + Metrics (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
        {/* Lineup Formation - 2/5 width on xl */}
        <div className="xl:col-span-2">
          <LineupFormation matchId={selectedMatchId} loading={matchesLoading} />
        </div>

        {/* 6 Metric Boxes - 3x2 grid, 3/5 width on xl */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full content-start">
            {METRICS_CONFIG.map((metric) => (
              <MetricBox
                key={metric.id}
                title={metric.title}
                primaryValue={getPrimaryValue(teamStats, metric)}
                secondaryValue={getSecondaryValue(teamStats, metric)}
                color={metric.color}
                isExpanded={expandedCard === metric.id}
                onToggle={() => setExpandedCard(expandedCard === metric.id ? null : metric.id)}
                expandedContent={metric.expandedDetails}
                stats={teamStats}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="w-full">
        <TeamHeatmap />
      </div>
    </div>
  )
}

export default TeamAnalysis
