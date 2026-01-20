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

        // Checking fixed/initial password logic as requested
        // Note: This is simplified. Normally we would hash and use Supabase Auth.
        // The requirement says admin password is 'Nhaojant8.' and players '1234'
        const isAdmin = data.is_admin
        const expectedPassword = isAdmin ? 'Nhaojant8.' : '1234'

        if (password === expectedPassword || (data.password && password === data.password)) {
            // Set session/cookie logic here or just redirect for demo
            localStorage.setItem('user', JSON.stringify(data))
            router.push('/')
        } else {
            setError('Contraseña incorrecta')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[80vh]">
            <div className="mb-8 text-center">
                <img src="/logo.jpg" alt="Escudo" className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-accent-green mx-auto mb-4 shadow-2xl" />
                <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
                    Deportivo <span className="text-accent-green">NP</span>
                </h1>
                <p className="text-gray-500 uppercase text-[10px] tracking-widest font-bold">Gestión de Plantel</p>
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
