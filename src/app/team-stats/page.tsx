'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPlayers } from '@/lib/db'
import { ChevronLeft, Trophy, Users, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export default function TeamStats() {
    const [loading, setLoading] = useState(true)
    const [playerStats, setPlayerStats] = useState<any[]>([])
    const [allMatches, setAllMatches] = useState<any[]>([])
    const [allPlayerStats, setAllPlayerStats] = useState<any[]>([])
    const [allMatchStats, setAllMatchStats] = useState<any[]>([])
    const [allVotes, setAllVotes] = useState<any[]>([])
    const [tournaments, setTournaments] = useState<any[]>([])
    const [selectedTournament, setSelectedTournament] = useState<string>('ALL')
    const [players, setPlayers] = useState<any[]>([])
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'goles', direction: 'desc' })
    const router = useRouter()

    useEffect(() => {
        async function fetchData() {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                router.push('/login')
                return
            }
            const user = JSON.parse(userStr)

            const { data: mData } = await supabase.from('matches').select('*').eq('team_id', user.team_id)
            const matchIds = mData?.map(m => m.id) || []

            const { data: pData } = await getPlayers(user.team_id)
            const { data: sData } = matchIds.length > 0
                ? await supabase.from('match_stats').select('*').in('match_id', matchIds).eq('played', true)
                : { data: [] }
            const { data: vData } = matchIds.length > 0
                ? await supabase.from('votes').select('*').in('match_id', matchIds)
                : { data: [] }

            if (pData) setPlayers(pData)
            setAllMatches(mData || [])
            setAllMatchStats(sData || [])
            setAllVotes(vData || [])

            // Fetch tournaments
            const { data: tData } = await supabase
                .from('tournaments')
                .select('*')
                .eq('team_id', user.team_id)
                .order('created_at', { ascending: false })
            if (tData) {
                setTournaments(tData)
                const current = tData.find((t: any) => t.is_current)
                if (current) setSelectedTournament(current.id)
            }

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

    // Filter by tournament
    const matches = selectedTournament === 'ALL'
        ? allMatches
        : allMatches.filter(m => m.tournament_id === selectedTournament)
    const filteredMatchIds = new Set(matches.map((m: any) => m.id))
    const filteredStats = allMatchStats.filter(s => filteredMatchIds.has(s.match_id))
    const filteredVotes = allVotes.filter(v => filteredMatchIds.has(v.match_id))

    // Recalculate player stats for filtered matches
    const displayPlayerStats = players.map(p => {
        const stats = filteredStats.filter(s => s.player_id === p.id)
        const mvpCount = calculateMVPs(filteredVotes, p.id, matches)
        const totalMinutes = stats.reduce((acc, curr) => acc + (curr.minutes || 0), 0)
        const totalGoals = stats.reduce((acc, curr) => acc + curr.goals, 0)
        const totalAssists = stats.reduce((acc, curr) => acc + curr.assists, 0)
        const playerVotes = filteredVotes.filter(v => v.voted_id === p.id)
        const globalAvg = playerVotes.length > 0 ? playerVotes.reduce((acc, v) => acc + v.score, 0) / playerVotes.length : 0
        return {
            ...p,
            pj: stats.length,
            minutos: totalMinutes,
            goles: totalGoals,
            asistencias: totalAssists,
            amarillas: stats.reduce((acc, curr) => acc + curr.yellow_cards, 0),
            rojas: stats.reduce((acc, curr) => acc + (curr.red_card ? 1 : 0), 0),
            mvp: mvpCount,
            globalAvg,
            minPerGoal: totalGoals > 0 ? (totalMinutes / totalGoals).toFixed(0) : '-',
            minPerAssist: totalAssists > 0 ? (totalMinutes / totalAssists).toFixed(0) : '-'
        }
    }).sort((a, b) => {
        const { key, direction } = sortConfig
        let valA = a[key]
        let valB = b[key]

        // Special handling for strings/numbers/formatting
        if (typeof valA === 'string' && !isNaN(Number(valA))) valA = Number(valA)
        if (typeof valB === 'string' && !isNaN(Number(valB))) valB = Number(valB)

        if (valA < valB) return direction === 'asc' ? -1 : 1
        if (valA > valB) return direction === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown size={12} className="ml-1 opacity-30" />
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-accent-green" /> : <ArrowDown size={12} className="ml-1 text-accent-green" />
    }

    const teamTotals = matches.reduce((acc, m) => {
        if (m.goals_own > m.goals_rival) acc.pg++
        else if (m.goals_own < m.goals_rival) acc.pp++
        else acc.pe++
        acc.gf += m.goals_own
        acc.gc += m.goals_rival
        return acc
    }, { pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 })

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full">
                    <ChevronLeft />
                </button>
                <h2 className="text-xl font-bold uppercase tracking-tight">Estadísticas del Equipo</h2>
            </div>

            {/* Tournament Filter */}
            {tournaments.length > 0 && (
                <div className="soccer-card !p-3 border-white/10 bg-black/40 flex items-center gap-3">
                    <Trophy size={16} className="text-accent-green shrink-0" />
                    <select
                        className="flex-1 bg-transparent text-sm font-bold focus:outline-none"
                        value={selectedTournament}
                        onChange={(e) => setSelectedTournament(e.target.value)}
                    >
                        <option value="ALL">TOTAL (Todos los torneos)</option>
                        {tournaments.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' ★' : ''}</option>
                        ))}
                    </select>
                </div>
            )}

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

    {/* Top Scorers / Leaderboard */ }
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
                        <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('full_name')}>
                            <div className="flex items-center">Jugador <SortIcon colKey="full_name" /></div>
                        </th>
                        <th className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pj')}>
                            <div className="flex items-center justify-center">PJ <SortIcon colKey="pj" /></div>
                        </th>
                        <th className="py-3 px-2 text-center text-accent-green cursor-pointer hover:brightness-125 transition-colors" onClick={() => handleSort('goles')}>
                            <div className="flex items-center justify-center">G <SortIcon colKey="goles" /></div>
                        </th>
                        <th className="py-3 px-2 text-center text-accent-green/60 cursor-pointer hover:brightness-125 transition-colors" onClick={() => handleSort('minPerGoal')}>
                            <div className="flex items-center justify-center">Min/G <SortIcon colKey="minPerGoal" /></div>
                        </th>
                        <th className="py-3 px-2 text-center text-sky-400 cursor-pointer hover:brightness-125 transition-colors" onClick={() => handleSort('asistencias')}>
                            <div className="flex items-center justify-center">A <SortIcon colKey="asistencias" /></div>
                        </th>
                        <th className="py-3 px-2 text-center text-sky-400/60 cursor-pointer hover:brightness-125 transition-colors" onClick={() => handleSort('minPerAssist')}>
                            <div className="flex items-center justify-center">Min/A <SortIcon colKey="minPerAssist" /></div>
                        </th>
                        <th className="py-3 px-2 text-center text-warning-yellow cursor-pointer hover:brightness-125 transition-colors" onClick={() => handleSort('globalAvg')}>
                            <div className="flex items-center justify-center">AVG <SortIcon colKey="globalAvg" /></div>
                        </th>
                        <th className="py-3 px-2 text-center text-warning-yellow cursor-pointer hover:brightness-125 transition-colors" onClick={() => handleSort('mvp')}>
                            <div className="flex items-center justify-center">MVP <SortIcon colKey="mvp" /></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {displayPlayerStats.map((p, i) => (
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

    {/* Rivals Summary */ }
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

    {/* Cards Table */ }
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
