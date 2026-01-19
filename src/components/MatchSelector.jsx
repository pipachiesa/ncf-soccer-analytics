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
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-gray-500">Loading matches...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Select Match
      </label>
      <div className="relative">
        <select
          value={selectedMatchId || ''}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-gray-400 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {matches?.map((match) => (
            <option key={match.match_id} value={match.match_id}>
              {getMatchLabel(match)}
            </option>
          ))}
        </select>
        <ChevronDown 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
          size={20} 
        />
      </div>
    </div>
  )
}

export default MatchSelector
