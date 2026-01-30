import { useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import TeamAnalysis from './pages/TeamAnalysis'
import PlayerAnalysis from './pages/PlayerAnalysis'
import { useMatches } from './hooks/useFetchData'

// Context for selected match
export const MatchContext = createContext()

export const useMatch = () => useContext(MatchContext)

function AppContent() {
  const { data: matches, loading: matchesLoading } = useMatches()
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  // Set default match when matches load
  if (!selectedMatchId && matches?.length > 0) {
    setSelectedMatchId(matches[0].match_id)
  }

  const selectedMatch = matches?.find(m => m.match_id === selectedMatchId)

  return (
    <MatchContext.Provider value={{ 
      matches, 
      selectedMatchId, 
      setSelectedMatchId, 
      selectedMatch,
      matchesLoading 
    }}>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/team-analysis" element={<TeamAnalysis />} />
            <Route path="/players" element={<PlayerAnalysis />} />
          </Routes>
        </main>
      </div>
    </MatchContext.Provider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
