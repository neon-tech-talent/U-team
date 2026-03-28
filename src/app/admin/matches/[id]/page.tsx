'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPlayers } from '@/lib/db'
import { Save, ChevronLeft, Trash2 } from 'lucide-react'

export default function EditMatch({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [players, setPlayers] = useState<any[]>([])
    const [date, setDate] = useState('')
    const [rival, setRival] = useState('')
    const [goalsOwn, setGoalsOwn] = useState(0)
    const [goalsRival, setGoalsRival] = useState(0)
    const [matchDuration, setMatchDuration] = useState(350)
    const [individualLimit, setIndividualLimit] = useState(50)
    const [playerStats, setPlayerStats] = useState<any>({})
    const router = useRouter()

    useEffect(() => {
        async function init() {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                router.push('/login')
                return
            }
            const user = JSON.parse(userStr)
            if (user.role !== 'admin') {
                router.push('/')
                return
            }

            // Fetch Match
            const { data: match } = await supabase.from('matches').select('*').eq('id', id).single()
            if (match) {
                setDate(new Date(match.match_date).toISOString().split('T')[0])
                setRival(match.rival)
                setGoalsOwn(match.goals_own)
                setGoalsRival(match.goals_rival)
            }
            
            // Fetch team settings
            const { data: teamData } = await supabase.from('teams').select('match_duration, football_type').eq('id', user.team_id).single()
            if (teamData) {
                const fType = teamData.football_type || 7
                if (teamData.match_duration) {
                    const baseVal = teamData.match_duration
                    const playerLimit = baseVal <= 100 ? baseVal : Math.floor(baseVal / fType)
                    const teamLimit = baseVal <= 100 ? baseVal * fType : baseVal
                    setIndividualLimit(playerLimit)
                    setMatchDuration(teamLimit)
                }
            }

            // Fetch Players and existing stats
            const { data: pData } = await getPlayers(user.team_id)
            const { data: sData } = await supabase.from('match_stats').select('*').eq('match_id', id)

            if (pData) {
                setPlayers(pData)
                const statsObj = {} as any
                pData.forEach((p: any) => {
                    const existing = sData?.find(s => s.player_id === p.id)
                    statsObj[p.id] = existing || {
                        played: false,
                        minutes: 0,
                        goals: 0,
                        assists: 0,
                        yellow_cards: 0,
                        red_card: false
                    }
                })
                setPlayerStats(statsObj)
            }
            setLoading(false)
        }
        init()
    }, [id, router])

    const handleStatChange = (playerId: string, stat: string, value: any) => {
        if (stat === 'minutes') {
            const mins = parseInt(value) || 0
            if (mins > individualLimit) {
                alert(`Un jugador no puede jugar más de ${individualLimit} minutos (duración del partido).`)
                return
            }
        }
        setPlayerStats((prev: any) => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [stat]: value
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation: Total minutes <= matchDuration
        const totalMinutes = Object.values(playerStats).reduce((acc: number, stat: any) => acc + (stat.minutes || 0), 0)
        if (totalMinutes > matchDuration) {
            alert(`El total de minutos (${totalMinutes}) no puede superar los ${matchDuration} minutos.`)
            return
        }

        setLoading(true)

        // 1. Update Match
        const { error: matchError } = await supabase
            .from('matches')
            .update({ match_date: date, rival, goals_own: goalsOwn, goals_rival: goalsRival })
            .eq('id', id)

        if (matchError) {
            alert('Error: ' + matchError.message)
            setLoading(false)
            return
        }

        // 2. Upsert Player Stats
        const statsToUpsert = Object.entries(playerStats).map(([playerId, stats]: [string, any]) => ({
            match_id: id,
            player_id: playerId,
            ...stats
        }))

        const { error: statsError } = await supabase
            .from('match_stats')
            .upsert(statsToUpsert, { onConflict: 'match_id,player_id' })

        if (statsError) {
            alert('Error en stats: ' + statsError.message)
        } else {
            router.push('/admin/matches')
        }
        setLoading(false)
    }

    if (loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full">
                    <ChevronLeft />
                </button>
                <h2 className="text-xl font-bold uppercase tracking-tight">Editar Partido</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="soccer-card grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase mb-1">Fecha</label>
                        <input
                            type="date"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-accent-green outline-none"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase mb-1">Rival</label>
                        <input
                            type="text"
                            placeholder="Nombre del rival"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-accent-green outline-none"
                            value={rival}
                            onChange={(e) => setRival(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 uppercase mb-1">Goles UT</label>
                            <input
                                type="number"
                                className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-accent-green outline-none"
                                value={goalsOwn}
                                onChange={(e) => setGoalsOwn(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 uppercase mb-1">Goles Rival</label>
                            <input
                                type="number"
                                className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-accent-green outline-none"
                                value={goalsRival}
                                onChange={(e) => setGoalsRival(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold uppercase text-accent-green text-sm">Estadísticas de Jugadores</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${Object.values(playerStats).reduce((acc: number, s: any) => acc + (s.minutes || 0), 0) > matchDuration
                            ? 'bg-danger-red text-white animate-pulse'
                            : 'bg-white/10 text-gray-400'
                            }`}>
                            Total: {Object.values(playerStats).reduce((acc: number, s: any) => acc + (s.minutes || 0), 0)} / {matchDuration} Min
                        </div>
                    </div>
                    <div className="space-y-2">
                        {players.map(player => (
                            <div key={player.id} className={`soccer-card !p-3 transition-colors ${playerStats[player.id]?.played ? 'border-accent-green/50 bg-accent-green/5' : 'opacity-60'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-accent-green"
                                            checked={playerStats[player.id]?.played}
                                            onChange={(e) => handleStatChange(player.id, 'played', e.target.checked)}
                                        />
                                        <span className="font-bold text-sm">{player.full_name}</span>
                                    </div>
                                    {playerStats[player.id]?.played && (
                                        <div className="flex items-center gap-2 bg-black/40 rounded px-2 py-1">
                                            <span className="text-[10px] text-gray-400 uppercase">Minutos:</span>
                                            <input
                                                type="number"
                                                className="w-10 bg-transparent text-center focus:outline-none text-xs"
                                                value={playerStats[player.id]?.minutes || 0}
                                                onChange={(e) => handleStatChange(player.id, 'minutes', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {playerStats[player.id]?.played && (
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-400 uppercase">Goles</p>
                                            <input type="number"
                                                className="w-full bg-black/40 text-center rounded text-xs py-1"
                                                value={playerStats[player.id]?.goals || 0}
                                                onChange={(e) => handleStatChange(player.id, 'goals', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-400 uppercase">Asist.</p>
                                            <input type="number"
                                                className="w-full bg-black/40 text-center rounded text-xs py-1"
                                                value={playerStats[player.id]?.assists || 0}
                                                onChange={(e) => handleStatChange(player.id, 'assists', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-400 uppercase">Amarillas</p>
                                            <select
                                                className="w-full bg-[#121415] text-center rounded text-xs py-1 text-white"
                                                value={playerStats[player.id]?.yellow_cards}
                                                onChange={(e) => handleStatChange(player.id, 'yellow_cards', parseInt(e.target.value))}
                                            >
                                                <option value="0">0</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                            </select>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-400 uppercase">Roja</p>
                                            <input type="checkbox"
                                                className="accent-danger-red w-4 h-4 mt-1"
                                                checked={playerStats[player.id]?.red_card}
                                                onChange={(e) => handleStatChange(player.id, 'red_card', e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="fixed bottom-6 right-6 left-6 md:relative md:bottom-0 md:right-0 md:left-0 py-4 bg-accent-green text-black font-black uppercase text-lg rounded-xl shadow-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                >
                    <Save size={24} /> {loading ? 'Actualizando...' : 'Actualizar Partido'}
                </button>
            </form>
        </div>
    )
}
