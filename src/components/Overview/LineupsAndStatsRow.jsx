import React from 'react'

function LineupsAndStatsRow({ homeLineup, awayLineup, matchStats, matchInfo }) {
    // Parse score for stats table
    const parseScore = (scoreStr) => {
        if (!scoreStr || typeof scoreStr !== 'string') return ['-', '-']
        const parts = scoreStr.split('-').map(s => s.trim())
        return parts.length === 2 ? parts : ['-', '-']
    }

    const [homeScore, awayScore] = matchInfo?.score ? parseScore(matchInfo.score) : ['-', '-']

    const StatRow = ({ label, homeVal, awayVal, isScore }) => (
        <div className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 ${isScore ? 'bg-gray-50 font-bold' : ''}`}>
            <span className={`w-12 text-center font-bold text-gray-900 ${isScore ? 'text-base' : 'text-sm'}`}>
                {homeVal ?? '-'}
            </span>
            <span className="flex-1 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                {label}
            </span>
            <span className={`w-12 text-center font-bold text-gray-900 ${isScore ? 'text-base' : 'text-sm'}`}>
                {awayVal ?? '-'}
            </span>
        </div>
    )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* HOME LINEUP */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">Home Lineup</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    {homeLineup && homeLineup.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                                    <th className="py-2 px-3 text-left">Player</th>
                                    <th className="py-2 px-2 text-center w-12">POS</th>
                                    <th className="py-2 px-2 text-center w-12">MIN</th>
                                    <th className="py-2 px-2 text-center w-10">G</th>
                                    <th className="py-2 px-2 text-center w-10">A</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeLineup.map((player, idx) => (
                                    <tr key={player.player_id || idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-sm font-medium text-gray-900">
                                            {player.player_name || 'Unknown'}
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs font-semibold text-gray-600">
                                            {player.position || '-'}
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs text-gray-600 font-mono">
                                            {player.minutes || 0}'
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs font-bold text-gray-900">
                                            {player.goals || 0}
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs text-gray-700">
                                            {player.assists || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm italic">
                            No lineup data
                        </div>
                    )}
                </div>
            </div>

            {/* MATCH STATS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-center uppercase text-xs tracking-wider border-b border-gray-200 pb-3">
                    Match Stats
                </h3>
                <div className="space-y-0">
                    <StatRow label="Score" homeVal={homeScore} awayVal={awayScore} isScore />
                    <StatRow label="Shots" homeVal={matchStats?.h_shots} awayVal={matchStats?.a_shots} />
                    <StatRow label="On Target" homeVal={matchStats?.h_sot} awayVal={matchStats?.a_sot} />
                    <StatRow label="Saves" homeVal={matchStats?.h_saves} awayVal={matchStats?.a_saves} />
                    <StatRow label="Fouls" homeVal={matchStats?.h_fouls} awayVal={matchStats?.a_fouls} />
                    <StatRow label="Cards" homeVal={matchStats?.h_cards} awayVal={matchStats?.a_cards} />
                    <StatRow label="Offsides" homeVal={matchStats?.h_offsides} awayVal={matchStats?.a_offsides} />
                    <StatRow label="Corners" homeVal={matchStats?.h_corners} awayVal={matchStats?.a_corners} />
                </div>
            </div>

            {/* AWAY LINEUP */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">Away Lineup</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    {awayLineup && awayLineup.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                                    <th className="py-2 px-3 text-left">Player</th>
                                    <th className="py-2 px-2 text-center w-12">POS</th>
                                    <th className="py-2 px-2 text-center w-12">MIN</th>
                                    <th className="py-2 px-2 text-center w-10">G</th>
                                    <th className="py-2 px-2 text-center w-10">A</th>
                                </tr>
                            </thead>
                            <tbody>
                                {awayLineup.map((player, idx) => (
                                    <tr key={player.player_id || idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-sm font-medium text-gray-900">
                                            {player.player_name || 'Unknown'}
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs font-semibold text-gray-600">
                                            {player.position || '-'}
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs text-gray-600 font-mono">
                                            {player.minutes || 0}'
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs font-bold text-gray-900">
                                            {player.goals || 0}
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs text-gray-700">
                                            {player.assists || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm italic">
                            No lineup data
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LineupsAndStatsRow
