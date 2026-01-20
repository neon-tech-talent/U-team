'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Trash2, Edit, Plus } from 'lucide-react'
import Link from 'next/link'

export default function AdminMatches() {
    const [matches, setMatches] = useState<any[]>([])
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
                .from('matches')
                .select('*')
                .order('match_date', { ascending: false })
            setMatches(data || [])
            setLoading(false)
        }
        init()
    }, [router])

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este partido? Se borrarán todas las estadísticas asociadas.')) return

        const { error } = await supabase.from('matches').delete().eq('id', id)
        if (error) alert('Error: ' + error.message)
        else setMatches(matches.filter(m => m.id !== id))
    }

    if (loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Gestionar Partidos</h2>
                </div>
                <Link
                    href="/admin/matches/new"
                    className="p-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-1 text-xs uppercase"
                >
                    <Plus size={16} /> Nuevo
                </Link>
            </div>

            <div className="space-y-3">
                {matches.map(match => (
                    <div key={match.id} className="soccer-card !p-4 border-white/5 flex items-center justify-between group">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">{new Date(match.match_date).toLocaleDateString()}</p>
                            <h3 className="font-bold">vs {match.rival} ({match.goals_own}-{match.goals_rival})</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/admin/matches/${match.id}`}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title="Editar"
                            >
                                <Edit size={18} />
                            </Link>
                            <button
                                onClick={() => handleDelete(match.id)}
                                className="p-2 text-gray-400 hover:text-danger-red transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {matches.length === 0 && (
                    <div className="text-center py-12 text-gray-500 uppercase text-xs font-bold tracking-widest">
                        No hay partidos para gestionar
                    </div>
                )}
            </div>
        </div>
    )
}
