import { useState, useEffect, useMemo } from 'react'
import { useMatch } from '../App'
import { usePlayerStats, usePlayerEvents, usePlayerAllMatches } from '../hooks/useFetchData'
import MatchSelector from '../components/MatchSelector'
import PlayerSelector from '../components/PlayerSelector'
import PlayerInfoCard from '../components/PlayerInfoCard'
import PlayerHeatmap from '../components/PlayerHeatmap'
import PlayerTouchMap from '../components/PlayerTouchMap'
import PlayerRadarChart from '../components/PlayerRadarChart'
import PlayerEventsTable from '../components/PlayerEventsTable'

function PlayerAnalysis() {
  const { selectedMatchId, setSelectedMatchId } = useMatch()
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Get all player stats for the selected match
  const { data: allPlayerStats, loading: playersLoading } = usePlayerStats(selectedMatchId)

  // Get events for selected player (for current match)
  const { data: playerEvents, loading: eventsLoading } = usePlayerEvents(selectedMatchId, selectedPlayer)

  // Find the selected player's stats from the allPlayerStats
  const selectedPlayerStats = useMemo(() => {
    if (!allPlayerStats || !selectedPlayer) return null
    return allPlayerStats.find(p => p.player?.toUpperCase() === selectedPlayer.toUpperCase())
  }, [allPlayerStats, selectedPlayer])



  // Set default player when data loads (player with most total_actions)
  useEffect(() => {
    if (allPlayerStats && allPlayerStats.length > 0 && !selectedPlayer) {
      // Sort by total_actions and pick the top performer
      const sortedPlayers = [...allPlayerStats].sort((a, b) =>
        (b.total_actions || 0) - (a.total_actions || 0)
      )
      setSelectedPlayer(sortedPlayers[0]?.player)
    }
  }, [allPlayerStats, selectedPlayer])

  // Reset selected player when match changes
  useEffect(() => {
    setSelectedPlayer(null)
  }, [selectedMatchId])

  const handleMatchClick = (matchId) => {
    setSelectedMatchId(matchId)
  }

  const isLoading = playersLoading || eventsLoading

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Player Analysis</h1>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <PlayerSelector
              players={allPlayerStats}
              selectedPlayer={selectedPlayer}
              onPlayerChange={setSelectedPlayer}
              loading={playersLoading}
            />
          </div>
          <div className="w-48">
            <MatchSelector />
          </div>
        </div>
      </div>

      {/* Player Info Card */}
      <PlayerInfoCard
        player={selectedPlayerStats}
        loading={playersLoading && !selectedPlayerStats}
      />

      {/* Middle Section - Heatmap and Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Compact Player Heatmap */}
        <div className="min-h-[300px]">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex items-center justify-center">
              <p className="text-gray-500">Loading heatmap...</p>
            </div>
          ) : (
            <PlayerHeatmap
              events={playerEvents}
              title="Player Activity"
              showDropdown={false}
              compact={true}
            />
          )}
        </div>

        {/* Right - Radar Chart */}
        <div className="min-h-[300px]">
          <PlayerRadarChart
            playerStats={selectedPlayerStats}
            allPlayersStats={allPlayerStats}
          />
        </div>
      </div>

      {/* Bottom Section - Full Width Touch Map with Dropdown */}
      <div className="min-h-[350px]">
        <PlayerTouchMap
          events={playerEvents}
          loading={isLoading}
        />
      </div>

      {/* Events Summary Table - Aggregated stats for selected match */}
      <PlayerEventsTable
        events={playerEvents}
        loading={eventsLoading}
      />
    </div>
  )
}

export default PlayerAnalysis
