'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Simplified auth for this specific requirement using the players table
        // In a real app, use Supabase Auth for security
        const { data, error: dbError } = await supabase
            .from('players')
            .select('*')
            .eq('username', username)
            .single()

        if (dbError || !data) {
            setError('Usuario no encontrado')
            setLoading(false)
            return
        }

        // Bloqueo si el usuario está pausado
        if (data.is_active === false) {
            setError('Tu usuario ha sido PAUSADO por el Super Administrador. Contacta soporte.')
            setLoading(false)
            return
        }

        if (data.password && password === data.password) {
            localStorage.setItem('user', JSON.stringify(data))
            
            // Redirigir según el rol
            if (data.role === 'superadmin') {
                router.push('/superadmin')
            } else if (data.role === 'admin') {
                // Verificar si tiene equipo configurado
                if (!data.team_id) {
                    router.push('/admin/setup-team')
                } else {
                    router.push('/')
                }
            } else {
                router.push('/')
            }
        } else {
            setError('Contraseña incorrecta')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[80vh]">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
                    Ultimate <span className="text-accent-green">Team</span>
                </h1>
                <p className="text-gray-500 uppercase text-[10px] tracking-widest font-bold">Gestión de Plantel v2.0</p>
            </div>
            <div className="soccer-card w-full max-w-md">
                <h2 className="text-xl font-bold mb-6 text-center text-accent-green uppercase tracking-wider">
                    Iniciar Sesión
                </h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Usuario</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-accent-green"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tu nombre de usuario"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contraseña</label>
                        <input
                            type="password"
                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-accent-green"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {error && <p className="text-danger-red text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-accent-green text-black font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 uppercase"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
