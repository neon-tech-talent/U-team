'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SetupTeamPage() {
    const [teamName, setTeamName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) {
            router.push('/login')
            return
        }
        const currentUser = JSON.parse(userStr)
        if (currentUser.role !== 'admin') {
            router.push('/')
            return
        }
        if (currentUser.team_id) {
            router.push('/') // Already set up
            return
        }
        setUser(currentUser)
    }, [router])

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!teamName.trim()) return
        
        setLoading(true)
        setError(null)

        // 1. Create the team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert([{ name: teamName, admin_id: user.id }])
            .select()
            .single()

        if (teamError || !teamData) {
            setError(teamError?.message || 'Error al crear el equipo')
            setLoading(false)
            return
        }

        // 2. Update the admin's player record with the new team_id
        const { error: updateError } = await supabase
            .from('players')
            .update({ team_id: teamData.id })
            .eq('id', user.id)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        // 3. Update local storage and redirect
        const updatedUser = { ...user, team_id: teamData.id }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        router.push('/')
    }

    if (!user) return null

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[80vh]">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
                    ¡Bienvenido <span className="text-accent-green">Admin</span>!
                </h1>
                <p className="text-gray-500 uppercase text-xs tracking-widest mt-2">Configuración inicial requerida</p>
            </div>
            <div className="soccer-card w-full max-w-md border-warning-yellow/30 bg-black/60">
                <h2 className="text-xl font-bold mb-4 text-center text-white uppercase tracking-wider">
                    Registra tu Equipo
                </h2>
                <p className="text-gray-400 text-sm mb-6 text-center">
                    Antes de comenzar a cargar partidos y jugadores, debes asignar un nombre a tu club o equipo.
                </p>
                
                <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-400">Nombre del Equipo / Club</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-warning-yellow text-lg font-bold"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Ej: Los Leones FC"
                            required
                        />
                    </div>
                    {error && <p className="text-danger-red text-sm font-bold bg-danger-red/10 p-2 rounded">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading || !teamName.trim()}
                        className="w-full py-4 bg-warning-yellow text-black font-black rounded-lg hover:brightness-110 transition-all disabled:opacity-50 uppercase tracking-widest text-sm mt-4"
                    >
                        {loading ? 'Guardando...' : 'Guardar y Continuar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
