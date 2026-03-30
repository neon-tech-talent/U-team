'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Star, Trophy, Users } from 'lucide-react'

export default function MatchDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [match, setMatch] = useState<any>(null)
    const [stats, setStats] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [userVotes, setUserVotes] = useState<any[]>([])
    const [allVotes, setAllVotes] = useState<any[]>([])
    const [votedScores, setVotedScores] = useState<any>({})
    const [isSavingVotes, setIsSavingVotes] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) setUser(JSON.parse(userStr))

        async function fetchData() {
            setLoading(true)
            const { data: matchData } = await supabase
                .from('matches')
                .select('*, teams(name)')
                .eq('id', id)
                .single()

            const { data: statsData } = await supabase
                .from('match_stats')
                .select('*, players(*)')
                .eq('match_id', id)

            const { data: allVotesData } = await supabase
                .from('votes')
                .select('*')
                .eq('match_id', id)

            setMatch(matchData)
            setStats(statsData || [])
            setAllVotes(allVotesData || [])

            if (userStr) {
                const u = JSON.parse(userStr)
                const uVotes = allVotesData?.filter(v => v.voter_id === u.id) || []
                setUserVotes(uVotes)

                // Initialize votedScores with existing votes OR default 10 for all participants
                const initialScores: any = {}

                // 1. Set default 10 for everyone who played (except self)
                statsData?.filter((s: any) => s.played && s.player_id !== u.id).forEach((s: any) => {
                    initialScores[s.player_id] = 10
                })

                // 2. Overwrite with existing votes if any
                uVotes.forEach(v => {
                    initialScores[v.voted_id] = v.score
                })

                setVotedScores(initialScores)
            }

            setLoading(false)
        }
        fetchData()
    }, [id])

    const handleSaveAllVotes = async () => {
        if (!user) return
        setIsSavingVotes(true)

        const votesToUpsert = Object.entries(votedScores).map(([targetPlayerId, score]) => ({
            match_id: id,
            voter_id: user.id,
            voted_id: targetPlayerId,
            score: score
        }))

        if (votesToUpsert.length === 0) {
            alert('Por favor, califica al menos a un jugador antes de guardar.')
            setIsSavingVotes(false)
            return
        }

        const { error } = await supabase
            .from('votes')
            .upsert(votesToUpsert, { onConflict: 'match_id,voter_id,voted_id' })

        if (error) {
            alert('Error al guardar votos: ' + error.message)
        } else {
            window.location.reload()
        }
        setIsSavingVotes(false)
    }

    if (loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>
    if (!match) return <div className="p-8 text-center uppercase font-bold tracking-widest text-danger-red">Partido no encontrado</div>

    const playedPlayers = stats.filter(s => s.played)
    const isWinner = match.goals_own > match.goals_rival
    const isDraw = match.goals_own === match.goals_rival

    // Voting thresholds and expiration
    const uniqueVotersCount = new Set(allVotes.map(v => v.voter_id)).size
    const showScores = uniqueVotersCount >= 5
    const creationTime = new Date(match.created_at || Date.now()).getTime()
    const votingExpired = (Date.now() - creationTime) > (2 * 24 * 60 * 60 * 1000)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full">
                    <ChevronLeft />
                </button>
                <h2 className="text-xl font-bold uppercase tracking-tight">Detalles del Partido</h2>
            </div>

            {/* Score Card */}
            <div className="soccer-card bg-gradient-to-b from-pitch-dark to-black border-accent-green/30 text-center relative overflow-hidden px-4 md:px-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent-green opacity-50"></div>
                <p className="text-[10px] md:text-xs text-gray-400 uppercase mb-4">{new Date(match.match_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                {/* Match MVP Badge */}
                {showScores && allVotes.length > 0 && (
                    <div className="mb-6 inline-flex items-center gap-2 bg-warning-yellow/20 text-warning-yellow px-4 py-1.5 rounded-full border border-warning-yellow/30 animate-pulse">
                        <Trophy size={14} />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                            MVP: {(() => {
                                const playerGroup = {} as any
                                allVotes.forEach(v => {
                                    if (!playerGroup[v.voted_id]) playerGroup[v.voted_id] = { sum: 0, count: 0 }
                                    playerGroup[v.voted_id].sum += v.score
                                    playerGroup[v.voted_id].count++
                                })
                                const averages = Object.entries(playerGroup).map(([pid, data]: [string, any]) => ({
                                    playerId: pid,
                                    avg: data.sum / data.count
                                }))
                                if (averages.length === 0) return 'Pendiente'
                                const winnerId = averages.reduce((a, b) => a.avg > b.avg ? a : b).playerId
                                return stats.find(s => s.player_id === winnerId)?.players.full_name || 'Calculando...'
                            })()}
                        </span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                    <div className="flex-1 order-2 md:order-1 text-center md:text-right">
                        <p className="text-xl md:text-2xl font-black mb-1">{match.teams?.name?.toUpperCase() || 'MI EQUIPO'}</p>
                        {isWinner && <span className="text-[10px] bg-accent-green text-black px-2 py-0.5 font-bold rounded uppercase">Ganador</span>}
                    </div>
                    <div className="flex flex-col items-center order-1 md:order-2">
                        <div className="flex items-center gap-4">
                            <span className={`text-4xl md:text-6xl font-black ${isWinner ? 'text-accent-green' : ''}`}>{match.goals_own}</span>
                            <span className="text-gray-600 text-3xl font-black">-</span>
                            <span className={`text-4xl md:text-6xl font-black ${!isWinner && !isDraw ? 'text-danger-red' : ''}`}>{match.goals_rival}</span>
                        </div>
                    </div>
                    <div className="flex-1 order-3 text-center md:text-left">
                        <p className="text-xl md:text-2xl font-black text-gray-500 mb-1">{match.rival.toUpperCase()}</p>
                    </div>
                </div>
            </div>

            {/* Player Stats Table */}
            <section>
                <h3 className="text-lg font-bold mb-4 uppercase flex items-center gap-2">
                    <Users className="text-accent-green" size={20} /> Estadísticas Individuales
                </h3>
                <div className="table-container soccer-card !p-0 border-white/5">
                    <table className="w-full text-left border-collapse min-w-[500px] md:min-w-0">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase border-b border-white/10">
                                <th className="py-2 px-3">Jugador</th>
                                <th className="py-2 px-3 text-center">Min</th>
                                <th className="py-2 px-3 text-center">G</th>
                                <th className="py-2 px-3 text-center">A</th>
                                <th className="py-2 px-3 text-center">T</th>
                                <th className="py-2 px-3 text-center text-warning-yellow">AVG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {playedPlayers.map(s => {
                                const playerVotes = allVotes?.filter((v: any) => v.voted_id === s.players.id) || [];
                                const avg = playerVotes.length > 0
                                    ? playerVotes.reduce((acc: number, v: any) => acc + v.score, 0) / playerVotes.length
                                    : 0;

                                return (
                                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-3 font-semibold text-sm">{s.players.full_name}</td>
                                        <td className="py-3 px-3 text-center text-gray-400 text-sm">{s.minutes}'</td>
                                        <td className="py-3 px-3 text-center font-bold text-accent-green text-sm">{s.goals > 0 ? s.goals : '-'}</td>
                                        <td className="py-3 px-3 text-center text-accent-green text-sm">{s.assists > 0 ? s.assists : '-'}</td>
                                        <td className="py-3 px-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                {Array.from({ length: s.yellow_cards }).map((_, i) => (
                                                    <div key={i} className="w-2 h-3 bg-warning-yellow rounded-[1px]"></div>
                                                ))}
                                                {s.red_card && <div className="w-2 h-3 bg-danger-red rounded-[1px]"></div>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center font-black text-warning-yellow text-sm">
                                            {showScores ? (avg > 0 ? avg.toFixed(1) : '-') : '???'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Voting Section */}
            <section className="soccer-card border-warning-yellow/30 bg-warning-yellow/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold uppercase flex items-center gap-2 text-warning-yellow">
                        <Star size={20} fill="currentColor" /> {votingExpired ? 'Votación Finalizada' : 'Calificar Jugadores'}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                        {userVotes.length > 0 && (
                            <span className="text-[10px] bg-warning-yellow/20 text-warning-yellow px-2 py-1 rounded font-black uppercase">
                                Ya calificado
                            </span>
                        )}
                        {!showScores && !votingExpired && (
                            <span className="text-[8px] text-gray-500 uppercase font-bold">
                                Faltan {5 - uniqueVotersCount} votos para ver promedios
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {votingExpired ? (
                        <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-white/10 text-gray-400 italic text-sm">
                            El periodo de votación (48h) ha finalizado para este partido.
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-300">Califica a tus compañeros (1-10) para elegir al MVP del partido:</p>
                            <div className="space-y-3">
                                {playedPlayers
                                    .filter(s => s.players.id !== user?.id) // Cannot vote for self
                                    .map(s => {
                                        const existingVote = userVotes?.find((v: any) => v.voted_id === s.players.id);
                                        const playerVotes = allVotes?.filter((v: any) => v.voted_id === s.players.id) || [];
                                        const avg = playerVotes.length > 0
                                            ? playerVotes.reduce((acc: number, v: any) => acc + v.score, 0) / playerVotes.length
                                            : 0;

                                        return (
                                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5 gap-3">
                                                <div className="flex-grow">
                                                    <p className="font-bold">{s.players.full_name}</p>
                                                    {showScores && avg > 0 && (
                                                        <p className="text-[10px] text-warning-yellow uppercase font-bold">Promedio: {avg.toFixed(1)} ⭐</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="range" min="1" max="10"
                                                        className="accent-warning-yellow w-32"
                                                        value={votedScores[s.players.id] || existingVote?.score || 10}
                                                        onChange={(e) => setVotedScores({ ...votedScores, [s.players.id]: parseInt(e.target.value) })}
                                                    />
                                                    <span className="font-black text-warning-yellow w-6 text-center">{votedScores[s.players.id] || existingVote?.score || 10}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>

                            <div className="pt-4 border-t border-white/10 mt-6">
                                <button
                                    onClick={handleSaveAllVotes}
                                    disabled={isSavingVotes || Object.keys(votedScores).length === 0}
                                    className="w-full py-4 bg-warning-yellow text-black font-black uppercase rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSavingVotes ? 'Guardando...' : (
                                        <>
                                            <Star size={20} fill="currentColor" />
                                            Confirmar Todas las Calificaciones
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}
