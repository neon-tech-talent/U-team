'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Trophy, Users, ShieldAlert } from 'lucide-react'

export default function TeamStats() {
    const [loading, setLoading] = useState(true)
    const [playerStats, setPlayerStats] = useState<any[]>([])
    const [matches, setMatches] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        async function fetchData() {
            const { data: pData } = await supabase.from('players').select('*')
            const { data: sData } = await supabase.from('match_stats').select('*').eq('played', true)
            const { data: mData } = await supabase.from('matches').select('*')
            const { data: vData } = await supabase.from('votes').select('*')

            if (pData && sData) {
                const statsMap = pData.map(p => {
                    const stats = sData.filter(s => s.player_id === p.id)
                    const mvpCount = vData ? calculateMVPs(vData, p.id, mData || []) : 0

                    const totalMinutes = stats.reduce((acc, curr) => acc + (curr.minutes || 0), 0)
                    const totalGoals = stats.reduce((acc, curr) => acc + curr.goals, 0)
                    const totalAssists = stats.reduce((acc, curr) => acc + curr.assists, 0)

                    // Global Average Rating
                    const playerVotes = vData?.filter(v => v.voted_id === p.id) || []
                    const globalAvg = playerVotes.length > 0
                        ? playerVotes.reduce((acc, v) => acc + v.score, 0) / playerVotes.length
                        : 0

                    return {
                        ...p,
                        pj: stats.length,
                        minutos: totalMinutes,
                        goles: totalGoals,
                        asistencias: totalAssists,
                        amarillas: stats.reduce((acc, curr) => acc + curr.yellow_cards, 0),
                        rojas: stats.reduce((acc, curr) => acc + (curr.red_card ? 1 : 0), 0),
                        mvp: mvpCount,
                        globalAvg: globalAvg,
                        minPerGoal: totalGoals > 0 ? (totalMinutes / totalGoals).toFixed(0) : '-',
                        minPerAssist: totalAssists > 0 ? (totalMinutes / totalAssists).toFixed(0) : '-'
                    }
                })
                setPlayerStats(statsMap.sort((a, b) => b.goles - a.goles || b.asistencias - a.asistencias))
            }
            setMatches(mData || [])
            setLoading(false)
        }
        fetchData()
    }, [])

    const calculateMVPs = (votes: any[], playerId: string, matchesArr: any[]) => {
        let mvpWins = 0
        matchesArr.forEach(m => {
            const matchVotes = votes.filter(v => v.match_id === m.id)
            if (matchVotes.length === 0) return

            const playerGroup = {} as any
            matchVotes.forEach(v => {
                if (!playerGroup[v.voted_id]) playerGroup[v.voted_id] = { sum: 0, count: 0 }
                playerGroup[v.voted_id].sum += v.score
                playerGroup[v.voted_id].count++
            })

            const averages = Object.entries(playerGroup).map(([pid, data]: [string, any]) => ({
                playerId: pid,
                avg: data.sum / data.count
            }))

            if (averages.length === 0) return

            const winner = averages.reduce((a, b) => a.avg > b.avg ? a : b).playerId
            if (winner === playerId) mvpWins++
        })
        return mvpWins
    }

    if (loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>

    const teamTotals = matches.reduce((acc, m) => {
        if (m.goals_own > m.goals_rival) acc.pg++
        else if (m.goals_own < m.goals_rival) acc.pp++
        else acc.pe++
        acc.gf += m.goals_own
        acc.gc += m.goals_rival
        return acc
    }, { pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 })

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full">
                    <ChevronLeft />
                </button>
                <h2 className="text-xl font-bold uppercase tracking-tight">Estadísticas del Equipo</h2>
            </div>

            {/* Team Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="soccer-card bg-black/40 border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Puntos</p>
                    <p className="text-3xl font-black text-white">{teamTotals.pg * 3 + teamTotals.pe}</p>
                </div>
                <div className="soccer-card bg-black/40 border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Goles Favor</p>
                    <p className="text-3xl font-black text-accent-green">{teamTotals.gf}</p>
                </div>
                <div className="soccer-card bg-black/40 border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Goles Contra</p>
                    <p className="text-3xl font-black text-danger-red">{teamTotals.gc}</p>
                </div>
                <div className="soccer-card bg-black/40 border-white/5 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Efectividad</p>
                    <p className="text-3xl font-black text-sky-400">
                        {matches.length > 0 ? Math.round(((teamTotals.pg * 3 + teamTotals.pe) / (matches.length * 3)) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Top Scorers / Leaderboard */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black uppercase flex items-center gap-2">
                        <Trophy className="text-warning-yellow" size={20} /> Goleadores y Figuras
                    </h3>
                    <span className="text-[8px] text-gray-500 uppercase font-black md:hidden animate-pulse">Desliza para ver más →</span>
                </div>
                <div className="table-container soccer-card !p-0 border-white/10">
                    <table className="w-full text-left min-w-[650px] md:min-w-0">
                        <thead className="bg-white/5 text-[10px] text-gray-400 uppercase">
                            <tr>
                                <th className="py-3 px-4">Jugador</th>
                                <th className="py-3 px-2 text-center">PJ</th>
                                <th className="py-3 px-2 text-center text-accent-green">G</th>
                                <th className="py-3 px-2 text-center text-accent-green/60">Min/G</th>
                                <th className="py-3 px-2 text-center text-sky-400">A</th>
                                <th className="py-3 px-2 text-center text-sky-400/60">Min/A</th>
                                <th className="py-3 px-2 text-center text-warning-yellow">AVG</th>
                                <th className="py-3 px-2 text-center text-warning-yellow">MVP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {playerStats.map((p, i) => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4 font-bold flex items-center gap-3 text-sm">
                                        <span className="text-[10px] text-gray-500">{i + 1}.</span>
                                        {p.full_name}
                                    </td>
                                    <td className="py-4 px-2 text-center text-gray-400 text-sm">{p.pj}</td>
                                    <td className="py-4 px-2 text-center font-black text-accent-green text-sm">{p.goles}</td>
                                    <td className="py-4 px-2 text-center text-gray-400 text-sm italic">{p.minPerGoal}'</td>
                                    <td className="py-4 px-2 text-center font-bold text-sky-400 text-sm">{p.asistencias}</td>
                                    <td className="py-4 px-2 text-center text-gray-400 text-sm italic">{p.minPerAssist}'</td>
                                    <td className="py-4 px-2 text-center font-black text-warning-yellow text-sm">
                                        {p.globalAvg > 0 ? p.globalAvg.toFixed(1) : '-'}
                                    </td>
                                    <td className="py-4 px-2 text-center">
                                        {p.mvp > 0 ? (
                                            <span className="inline-flex items-center gap-1 bg-warning-yellow/20 text-warning-yellow px-2 py-0.5 rounded-full text-xs font-bold">
                                                {p.mvp} <Trophy size={10} />
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Rivals Summary */}
            <section>
                <h3 className="text-lg font-black mb-4 uppercase flex items-center gap-2">
                    <Users className="text-accent-green" size={20} /> Historial por Rival
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(matches.reduce((acc: any, m) => {
                        const r = m.rival.toUpperCase()
                        if (!acc[r]) acc[r] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 }
                        acc[r].pj++
                        if (m.goals_own > m.goals_rival) acc[r].pg++
                        else if (m.goals_own < m.goals_rival) acc[r].pp++
                        else acc[r].pe++
                        acc[r].gf += m.goals_own
                        acc[r].gc += m.goals_rival
                        return acc
                    }, {})).map(([rival, s]: [string, any]) => (
                        <div key={rival} className="soccer-card !p-4 border-white/5 bg-black/40">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-black text-sm">{rival}</h4>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-bold uppercase">{s.pj} PJ</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex gap-2">
                                    <span className="text-accent-green font-bold">{s.pg}G</span>
                                    <span className="text-gray-400">{s.pe}E</span>
                                    <span className="text-danger-red font-bold">{s.pp}P</span>
                                </div>
                                <div className="text-gray-500 font-medium">
                                    {s.gf} - {s.gc} Goles
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Cards Table */}
            <section>
                <h3 className="text-lg font-black mb-4 uppercase flex items-center gap-2">
                    <ShieldAlert className="text-danger-red" size={20} /> Fair Play
                </h3>
                <div className="table-container soccer-card !p-0 border-white/10">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] text-gray-400 uppercase">
                            <tr>
                                <th className="py-3 px-4">Jugador</th>
                                <th className="py-3 px-2 text-center">Amarillas</th>
                                <th className="py-3 px-2 text-center">Rojas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {playerStats
                                .filter(p => p.amarillas > 0 || p.rojas > 0)
                                .sort((a, b) => b.rojas - a.rojas || b.amarillas - a.amarillas)
                                .map(p => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 font-bold text-sm">{p.full_name}</td>
                                        <td className="py-3 px-2 text-center font-bold text-warning-yellow">{p.amarillas}</td>
                                        <td className="py-3 px-2 text-center font-bold text-danger-red">{p.rojas}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {playerStats.filter(p => p.amarillas > 0 || p.rojas > 0).length === 0 && (
                        <div className="p-8 text-center text-gray-500 italic text-sm">Todo limpio por ahora</div>
                    )}
                </div>
            </section>
        </div>
    )
}
