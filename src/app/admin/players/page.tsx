'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Save, UserPlus } from 'lucide-react'

export default function ManagePlayers() {
    const [players, setPlayers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function init() {
            const userStr = localStorage.getItem('user')
            if (!userStr || !JSON.parse(userStr).is_admin) {
                router.push('/')
                return
            }

            const { data } = await supabase
                .from('players')
                .select('*')
                .order('full_name', { ascending: true })
            setPlayers(data || [])
            setLoading(false)
        }
        init()
    }, [router])

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
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Gestionar Plantel</h2>
                </div>
            </div>

            <div className="space-y-3">
                {players.map(player => (
                    <div key={player.id} className="soccer-card !p-4 border-white/5 bg-black/40">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-accent-green">{player.full_name}</span>
                                <span className="text-[10px] text-gray-500 uppercase">{player.username}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Dorsal</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:border-accent-green outline-none"
                                        value={player.number || ''}
                                        placeholder="N°"
                                        onChange={(e) => handleUpdate(player.id, 'number', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Posición</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:border-accent-green outline-none"
                                        value={player.position || ''}
                                        placeholder="Ej: Defensor"
                                        onChange={(e) => handleUpdate(player.id, 'position', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
