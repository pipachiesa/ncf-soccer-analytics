import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTeamStats } from '../hooks/useFetchData'
import { useMatch } from '../App'

function PerformanceChart() {
  const { selectedMatchId } = useMatch()
  const { data: teamStats, loading, error } = useTeamStats(selectedMatchId)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Team Performance</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !teamStats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Team Performance</h3>
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    )
  }

  const chartData = [
    {
      name: 'Shots',
      NCF: teamStats.total_shots || 0,
    },
    {
      name: 'Passes',
      NCF: Math.round((teamStats.total_passes || 0) / 3),
    },
    {
      name: 'Duels Won',
      NCF: teamStats.duels_won || 0,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Team Performance</h3>
        <p className="text-sm text-gray-500">Key metrics overview</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar 
              dataKey="NCF" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="NCF"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PerformanceChart
