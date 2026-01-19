import { Target, TrendingUp, Shield, ArrowUpRight } from 'lucide-react'
import { useTeamStats } from '../hooks/useFetchData'
import { useMatch } from '../App'
import MatchSelector from '../components/MatchSelector'
import KPICard from '../components/KPICard'
import TopPerformers from '../components/TopPerformers'
import PerformanceChart from '../components/PerformanceChart'
import ZoneHeatmap from '../components/ZoneHeatmap'

function Overview() {
  const { selectedMatchId } = useMatch()
  const { data: teamStats, loading, error } = useTeamStats(selectedMatchId)

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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Match Performance Report</h1>
        <p className="text-gray-500">Comprehensive overview of team performance metrics</p>
      </div>

      {/* Match Selector */}
      <div className="mb-6 max-w-md">
        <MatchSelector />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Shots"
          value={loading ? '-' : teamStats?.total_shots || 0}
          subtitle={`${teamStats?.shots_on_target || 0} on target`}
          icon={Target}
          color="primary"
        />
        <KPICard
          title="Pass Accuracy"
          value={loading ? '-' : `${teamStats?.pass_accuracy || 0}%`}
          subtitle={`${teamStats?.passes_successful || 0}/${teamStats?.total_passes || 0}`}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="Duels Won"
          value={loading ? '-' : teamStats?.duels_won || 0}
          subtitle={`${teamStats?.duel_success_rate || 0}% success rate`}
          icon={Shield}
          color="orange"
        />
        <KPICard
          title="Recoveries"
          value={loading ? '-' : teamStats?.total_recoveries || 0}
          subtitle="ball recoveries"
          icon={ArrowUpRight}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PerformanceChart />
        <TopPerformers />
      </div>

      {/* Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoneHeatmap 
          title="Defensive Activity Zones" 
          subtitle="Tackles, recoveries & interceptions by area" 
        />
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium"></p>
            <p className="text-sm"></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
