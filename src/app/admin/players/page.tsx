'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, UserPlus } from 'lucide-react'

export default function ManagePlayers() {
    const [players, setPlayers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    
    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState({ text: '', type: '' })

    const router = useRouter()

    useEffect(() => {
        async function init() {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                router.push('/login')
                return
            }
            const user = JSON.parse(userStr)
            if (user.role !== 'admin' || !user.team_id) {
                router.push('/')
                return
            }
            setCurrentUser(user)

            const { data } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', user.team_id)
                .eq('role', 'player')
                .order('full_name', { ascending: true })
            setPlayers(data || [])
            setLoading(false)
        }
        init()
    }, [router])

    const handleCreatePlayer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!firstName || !lastName || !username || !password) {
            setMessage({ text: 'Todos los campos son obligatorios', type: 'error' })
            return
        }

        setMessage({ text: 'Creando jugador...', type: 'info' })

        const fullName = `${firstName.trim()} ${lastName.trim()}`

        const { data, error } = await supabase
            .from('players')
            .insert([
                {
                    full_name: fullName,
                    username: username.trim(),
                    password: password.trim(),
                    role: 'player',
                    team_id: currentUser.team_id
                }
            ])
            .select()

        if (error) {
            setMessage({ text: 'Error: ' + (error.message.includes('unique') ? 'El usuario ya existe' : error.message), type: 'error' })
        } else if (data) {
            setMessage({ text: 'Jugador creado con éxito', type: 'success' })
            setPlayers([...players, data[0]].sort((a, b) => a.full_name.localeCompare(b.full_name)))
            setFirstName('')
            setLastName('')
            setUsername('')
            setPassword('')
        }
    }

    const handleUpdate = async (id: string, field: string, value: any) => {
        const { error } = await supabase
            .from('players')
            .update({ [field]: value })
            .eq('id', id)

        if (error) alert('Error: ' + error.message)
        else {
            setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p))
        }
    }

    if (loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>

    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Gestionar Plantel</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulario de Alta */}
                <div className="md:col-span-1 soccer-card border-accent-green/30 h-fit">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <UserPlus className="text-accent-green" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Alta de Jugador</h3>
                    </div>
                    
                    <form onSubmit={handleCreatePlayer} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-widest">Nombre</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-accent-green outline-none"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-widest">Apellido</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-accent-green outline-none"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-widest">Usuario</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-accent-green outline-none"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-widest">Contraseña</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:border-accent-green outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        {message.text && (
                            <p className={`text-[10px] p-2 rounded font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-danger-red/20 text-danger-red' : message.type === 'success' ? 'bg-accent-green/20 text-accent-green' : 'text-gray-400'}`}>
                                {message.text}
                            </p>
                        )}

                        <button type="submit" className="w-full bg-accent-green text-black font-black uppercase tracking-widest p-3 rounded hover:brightness-110 transition-all text-[10px] mt-4 shadow-lg shadow-accent-green/20">
                            Crear Jugador
                        </button>
                    </form>
                </div>

                {/* Lista de Jugadores */}
                <div className="md:col-span-2 space-y-3">
                    <h3 className="font-bold uppercase tracking-widest text-sm text-gray-400 mb-2">Lista del Equipo</h3>
                    {players.length === 0 ? (
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-widest text-center py-8">No hay jugadores registrados</p>
                    ) : (
                        players.map(player => (
                            <div key={player.id} className="soccer-card !p-4 border-white/5 bg-black/40">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-accent-green uppercase">{player.full_name}</span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">@{player.username}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] text-gray-400 uppercase mb-1 font-bold tracking-widest">Dorsal</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:border-accent-green outline-none placeholder:text-gray-600"
                                                value={player.number || ''}
                                                placeholder="N°"
                                                onChange={(e) => handleUpdate(player.id, 'number', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-400 uppercase mb-1 font-bold tracking-widest">Posición</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:border-accent-green outline-none placeholder:text-gray-600"
                                                value={player.position || ''}
                                                placeholder="Ej: Defensor"
                                                onChange={(e) => handleUpdate(player.id, 'position', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
