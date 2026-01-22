import { useMatch } from '../App'
import { ChevronDown } from 'lucide-react'

function MatchSelector() {
  const { matches, selectedMatchId, setSelectedMatchId, matchesLoading } = useMatch()

  const getMatchLabel = (match) => {
    const id = match.match_id
    if (id === 'ncf_ave_maria') return 'NCF vs Ave Maria'
    if (id === 'ncf_scad') return 'NCF vs SCAD'
    if (id === 'ncf_fl_memorial') return 'NCF vs FL Memorial'
    // Default: capitalize and format
    return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (matchesLoading) {
    return (
      <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  const matchCount = matches?.length || 0

  return (
    <div className="relative">
      <select
        value={selectedMatchId || 'all'}
        onChange={(e) => setSelectedMatchId(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <option value="all" className="font-semibold">All Games ({matchCount})</option>
        <optgroup label="Matches">
          {matches?.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {getMatchLabel(match)}
            </option>
          ))}
        </optgroup>
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        size={16}
      />
    </div>
  )
}

export default MatchSelector
