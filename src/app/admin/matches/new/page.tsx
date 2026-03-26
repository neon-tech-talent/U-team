'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPlayers } from '@/lib/db'
import { Save, ChevronLeft, Plus, Trophy } from 'lucide-react'

export default function NewMatch() {
    const [loading, setLoading] = useState(true)
    const [players, setPlayers] = useState<any[]>([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [rival, setRival] = useState('')
    const [goalsOwn, setGoalsOwn] = useState(0)
    const [goalsRival, setGoalsRival] = useState(0)
    const [playerStats, setPlayerStats] = useState<any>({})
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [teamName, setTeamName] = useState('UT')
    const [matchDuration, setMatchDuration] = useState(350)
    const [individualLimit, setIndividualLimit] = useState(50)

    // Tournament state
    const [tournaments, setTournaments] = useState<any[]>([])
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('') // existing
    const [newTournamentName, setNewTournamentName] = useState('')
    const [isCurrent, setIsCurrent] = useState(false)
    const [isNewTournament, setIsNewTournament] = useState(false)

    const router = useRouter()

    useEffect(() => {
        async function init() {
            const userStr = localStorage.getItem('user')
            if (!userStr) { router.push('/login'); return }
            const user = JSON.parse(userStr)
            if (user.role !== 'admin') { router.push('/'); return }
            setCurrentUser(user)

            const { data } = await getPlayers(user.team_id)
            if (data) {
                setPlayers(data)
                const initialStats = {} as any
                data.forEach((p: any) => {
                    initialStats[p.id] = { played: false, minutes: 0, goals: 0, assists: 0, yellow_cards: 0, red_card: false }
                })
                setPlayerStats(initialStats)
            }

            // Fetch team settings
            const { data: teamData } = await supabase.from('teams').select('name, match_duration').eq('id', user.team_id).single()
            if (teamData) {
                setTeamName(teamData.name)
                if (teamData.match_duration) {
                    const baseVal = teamData.match_duration
                    const playerLimit = baseVal <= 100 ? baseVal : Math.floor(baseVal / 7)
                    const teamLimit = baseVal <= 100 ? baseVal * 7 : baseVal
                    setIndividualLimit(playerLimit)
                    setMatchDuration(teamLimit)
                }
            }

            // Fetch tournaments
            const { data: tData } = await supabase
                .from('tournaments')
                .select('*')
                .eq('team_id', user.team_id)
                .order('created_at', { ascending: false })
            
            if (tData && tData.length > 0) {
                setTournaments(tData)
                const current = tData.find((t: any) => t.is_current)
                if (current) {
                    setSelectedTournamentId(current.id)
                    setIsCurrent(true)
                } else {
                    setSelectedTournamentId(tData[0].id)
                }
            } else {
                // No tournaments yet, force new tournament creation
                setIsNewTournament(true)
                setIsCurrent(true)
            }

            setLoading(false)
        }
        init()
    }, [router])

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
            [playerId]: { ...prev[playerId], [stat]: value }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const totalMinutes = Object.values(playerStats).reduce((acc: number, stat: any) => acc + (stat.minutes || 0), 0)
        if (totalMinutes > matchDuration) {
            alert(`El total de minutos (${totalMinutes}) no puede superar los ${matchDuration} minutos configurados para el equipo.`)
            return
        }

        if (isNewTournament && !newTournamentName.trim()) {
            alert('Por favor, ingresa el nombre del torneo.')
            return
        }

        setLoading(true)

        let tournamentId = selectedTournamentId

        // Handle tournament creation or current flag update
        if (isNewTournament) {
            // If marking as current, un-mark all others first
            if (isCurrent) {
                await supabase.from('tournaments').update({ is_current: false }).eq('team_id', currentUser.team_id)
            }
            const { data: newT } = await supabase.from('tournaments')
                .insert([{ name: newTournamentName.trim(), team_id: currentUser.team_id, is_current: isCurrent }])
                .select().single()
            if (newT) tournamentId = newT.id
        } else if (isCurrent) {
            // Update current flag
            await supabase.from('tournaments').update({ is_current: false }).eq('team_id', currentUser.team_id)
            await supabase.from('tournaments').update({ is_current: true }).eq('id', tournamentId)
        }

        // Create Match
        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert([{ match_date: date, rival, goals_own: goalsOwn, goals_rival: goalsRival, team_id: currentUser?.team_id, tournament_id: tournamentId || null }])
            .select().single()

        if (matchError) {
            alert('Error al crear partido: ' + matchError.message)
            setLoading(false)
            return
        }

        // Insert Player Stats
        const statsToInsert = Object.entries(playerStats).map(([playerId, stats]: [string, any]) => ({
            match_id: matchData.id, player_id: playerId, ...stats
        }))

        const { error: statsError } = await supabase.from('match_stats').insert(statsToInsert)

        if (statsError) {
            alert('Error al guardar estadísticas: ' + statsError.message)
        } else {
            router.push('/')
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
                <h2 className="text-2xl font-bold uppercase tracking-tight">Nuevo Partido</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tournament Selector */}
                <div className="soccer-card border-white/10 bg-black/40 space-y-3">
                    <h3 className="font-bold uppercase flex items-center gap-2 text-accent-green text-sm">
                        <Trophy size={16} /> Campeonato / Torneo
                    </h3>

                    {/* Toggle new vs existing */}
                    {tournaments.length > 0 && (
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsNewTournament(false)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${!isNewTournament ? 'bg-accent-green text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                Seleccionar existente
                            </button>
                            <button type="button" onClick={() => setIsNewTournament(true)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${isNewTournament ? 'bg-accent-green text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                + Nuevo torneo
                            </button>
                        </div>
                    )}

                    {isNewTournament ? (
                        <input
                            type="text"
                            placeholder="Ej: Clausura 2025"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-accent-green outline-none text-sm"
                            value={newTournamentName}
                            onChange={(e) => setNewTournamentName(e.target.value)}
                        />
                    ) : (
                        <select
                            className="w-full bg-black/20 border border-white/10 rounded p-2 focus:border-accent-green outline-none text-sm"
                            value={selectedTournamentId}
                            onChange={(e) => setSelectedTournamentId(e.target.value)}
                        >
                            {tournaments.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' ★' : ''}</option>
                            ))}
                        </select>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="accent-accent-green w-4 h-4"
                            checked={isCurrent}
                            onChange={(e) => setIsCurrent(e.target.checked)}
                        />
                        <span className="text-xs text-gray-300 font-bold uppercase">Marcar como Torneo Actual</span>
                    </label>
                </div>

                {/* Match General Info */}
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
                            <label className="block text-xs text-gray-400 uppercase mb-1">Goles {teamName}</label>
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
                        <h3 className="font-bold uppercase flex items-center gap-2 text-accent-green">
                            <Plus size={18} /> Estadísticas de Jugadores
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${Object.values(playerStats).reduce((acc: number, s: any) => acc + (s.minutes || 0), 0) > matchDuration
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
                                        <span className="font-bold flex-grow">{player.full_name}</span>
                                    </div>
                                    {playerStats[player.id]?.played && (
                                        <div className="flex items-center gap-2 bg-black/40 rounded px-2 py-1">
                                            <span className="text-[10px] text-gray-400 uppercase">Minutos:</span>
                                            <input
                                                type="number"
                                                className="w-12 bg-transparent text-center focus:outline-none"
                                                value={playerStats[player.id]?.minutes || 0}
                                                onChange={(e) => handleStatChange(player.id, 'minutes', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {playerStats[player.id]?.played && (
                                    <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/5">
                                        <div className="text-center">
                                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase mb-1">Goles</p>
                                            <input type="number"
                                                className="w-full bg-black/40 text-center rounded text-xs py-1.5"
                                                value={playerStats[player.id]?.goals || 0}
                                                onChange={(e) => handleStatChange(player.id, 'goals', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase mb-1">Asist.</p>
                                            <input type="number"
                                                className="w-full bg-black/40 text-center rounded text-xs py-1.5"
                                                value={playerStats[player.id]?.assists || 0}
                                                onChange={(e) => handleStatChange(player.id, 'assists', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase mb-1">Amar.</p>
                                            <select
                                                className="w-full bg-black/40 text-center rounded text-xs py-1.5 appearance-none"
                                                value={playerStats[player.id]?.yellow_cards}
                                                onChange={(e) => handleStatChange(player.id, 'yellow_cards', parseInt(e.target.value))}
                                            >
                                                <option value="0">0</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase mb-1">Roja</p>
                                            <input type="checkbox"
                                                className="accent-danger-red w-5 h-5"
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
                    className="fixed bottom-6 right-6 left-6 md:relative md:bottom-0 md:right-0 md:left-0 py-3 md:px-10 bg-accent-green text-black font-black uppercase text-base rounded-xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all md:w-fit mx-auto"
                >
                    <Save size={24} /> Guardar Partido
                </button>
            </form>
        </div>
    )
}
