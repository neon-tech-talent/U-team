'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, LogOut, User, Target, Zap, Award } from 'lucide-react'

export default function Profile() {
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const savedUser = localStorage.getItem('user')
        if (!savedUser) {
            router.push('/login')
            return
        }
        const u = JSON.parse(savedUser)
        setUser(u)

        async function fetchStats() {
            const { data } = await supabase
                .from('match_stats')
                .select('*, matches(*)')
                .eq('player_id', u.id)
                .eq('played', true)

            setStats(data || [])
            setLoading(false)
        }
        fetchStats()
    }, [router])

    if (loading || !user) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>

    const totals = stats.reduce((acc, curr) => ({
        matches: acc.matches + 1,
        goals: acc.goals + curr.goals,
        assists: acc.assists + curr.assists,
        yellow: acc.yellow + curr.yellow_cards,
        red: acc.red + (curr.red_card ? 1 : 0),
        minutes: acc.minutes + curr.minutes
    }), { matches: 0, goals: 0, assists: 0, yellow: 0, red: 0, minutes: 0 })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Mi Perfil</h2>
                </div>
            </div>

            {/* Profile Header */}
            <div className="soccer-card bg-gradient-to-tr from-pitch-dark to-black border-accent-green/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 md:gap-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-accent-green rounded-full overflow-hidden border-2 border-accent-green shrink-0">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase text-white">{user.full_name}</h3>
                    <p className="text-accent-green font-bold text-xs md:text-sm tracking-widest uppercase">{user.position || 'JUGADOR'}</p>
                </div>
            </div>

            {/* Totals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Partidos', value: totals.matches, icon: <Zap className="text-warning-yellow" /> },
                    { label: 'Goles', value: totals.goals, icon: <Target className="text-accent-green" /> },
                    { label: 'Asistencias', value: totals.assists, icon: <Zap className="text-sky-400" /> },
                    { label: 'Amarillas', value: totals.yellow, icon: <div className="w-3 h-4 bg-warning-yellow rounded-[1px]"></div> },
                    { label: 'Rojas', value: totals.red, icon: <div className="w-3 h-4 bg-danger-red rounded-[1px]"></div> },
                    { label: 'Minutos', value: totals.minutes, icon: <Zap className="text-gray-400" /> },
                ].map((stat, i) => (
                    <div key={i} className="soccer-card !p-4 border-white/5 bg-black/40 text-center">
                        <div className="flex justify-center mb-2">{stat.icon}</div>
                        <p className="text-3xl font-black">{stat.value}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Advanced Stats */}
            <section className="soccer-card border-white/10">
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Promedios</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/20 p-4 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-gray-300">Minutos por Gol</span>
                        <span className="font-bold text-accent-green">{totals.goals > 0 ? (totals.minutes / totals.goals).toFixed(1) : '-'}</span>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-gray-300">Minutos por Asistencia</span>
                        <span className="font-bold text-accent-green">{totals.assists > 0 ? (totals.minutes / totals.assists).toFixed(1) : '-'}</span>
                    </div>
                </div>
            </section>

            {/* Password Change */}
            <section className="soccer-card border-white/10">
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Ajustes de Cuenta</h3>
                <div className="space-y-4">
                    <p className="text-[10px] text-gray-500 uppercase">Cambiar Contraseña</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            className="flex-grow bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-accent-green outline-none"
                            id="new-password"
                        />
                        <button
                            onClick={async () => {
                                const pass = (document.getElementById('new-password') as HTMLInputElement).value
                                if (!pass) return alert('Ingresa una contraseña')
                                const { error } = await supabase
                                    .from('players')
                                    .update({ password: pass })
                                    .eq('id', user.id)
                                if (error) alert('Error: ' + error.message)
                                else {
                                    alert('Contraseña actualizada')
                                    const newUser = { ...user, password: pass }
                                    localStorage.setItem('user', JSON.stringify(newUser))
                                    setUser(newUser)
                                }
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded transition-colors uppercase"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
            </section>

            {/* Match History Small List */}
            <section>
                <h3 className="text-lg font-bold mb-4 uppercase flex items-center gap-2">
                    <Award className="text-accent-green" size={20} /> Historial de Partidos
                </h3>
                <div className="space-y-2">
                    {stats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">No hay historial registrado</div>
                    ) : (
                        stats.map(s => (
                            <div key={s.id} className="soccer-card !p-3 border-white/5 bg-black/20 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400">{new Date(s.matches.match_date).toLocaleDateString()}</p>
                                    <p className="font-bold">vs {s.matches.rival}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-accent-green font-bold">{s.goals}G / {s.assists}A</p>
                                    <p className="text-[10px] text-gray-500">{s.minutes} min</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}
