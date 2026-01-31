import React from 'react'
import { Calendar, MapPin, Flag } from 'lucide-react'

function MatchInfoBox({ matchInfo }) {
    if (!matchInfo) return null

    // Parse score string "1-3" -> [1, 3]
    const parseScore = (scoreStr) => {
        if (!scoreStr || typeof scoreStr !== 'string') return ['-', '-']
        const parts = scoreStr.split('-').map(s => s.trim())
        return parts.length === 2 ? parts : ['-', '-']
    }

    const [homeScore, awayScore] = parseScore(matchInfo.score)

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).toUpperCase()
    }

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            {/* Score Line */}
            <div className="flex items-center justify-center gap-6 mb-3">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                    {matchInfo.home_team || 'HOME'}
                </h2>

                <div className="bg-gray-900 text-white px-6 py-2 rounded-full font-bold text-xl tracking-wider">
                    {homeScore} — {awayScore}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                    {matchInfo.away_team || 'AWAY'}
                </h2>
            </div>

            {/* Match Details */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 font-medium mt-4">
                {matchInfo.date && (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(matchInfo.date)}</span>
                    </div>
                )}

                {matchInfo.stadium && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{matchInfo.stadium}</span>
                    </div>
                )}

                {matchInfo.ref && (
                    <div className="flex items-center gap-2">
                        {/* Whistle icon substitute */}
                        <Flag className="w-4 h-4 text-gray-400" />
                        <span>Ref: {matchInfo.ref}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MatchInfoBox
