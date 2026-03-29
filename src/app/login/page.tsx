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
            .ilike('username', username)
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

        // Bloqueo en cascada para JUGADORES (si su administrador está pausado/eliminado)
        if (data.role === 'player' && data.team_id) {
            const { data: teamData } = await supabase
                .from('teams')
                .select('admin_id')
                .eq('id', data.team_id)
                .single()
            
            if (teamData && teamData.admin_id) {
                const { data: adminData } = await supabase
                    .from('players')
                    .select('is_active')
                    .eq('id', teamData.admin_id)
                    .single()
                
                if (!adminData || adminData.is_active === false) {
                    setError('Tu EQUIPO ha sido suspendido por el Super Administrador. Contacta a tu delegado.')
                    setLoading(false)
                    return
                }
            } else if (!teamData) {
                // Si el equipo no existe (fue borrado)
                setError('Tu equipo ya no existe en el sistema.')
                setLoading(false)
                return
            }
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
            // No cambiamos setLoading a false para que se mantenga en "Entrando..." mientras carga la página
            return
        } else {
            setError('Contraseña incorrecta')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-[#0a110d] font-sans">
            
            {/* --- FONDO ESTADIO CSS --- */}
            {/* Gradiente base oscuro */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a110d] via-[#11231a] to-[#0a1a10] z-0"></div>
            
            {/* Focos de luz izquierda */}
            <div className="absolute top-[20%] left-[5%] grid grid-cols-4 gap-3 opacity-70 mix-blend-screen blur-[6px] transform -rotate-12 scale-110 z-0 drop-shadow-[0_0_15px_rgba(255,255,255,1)]">
                {Array.from({length: 16}).map((_, i) => (
                    <div key={`l-${i}`} className="w-8 h-8 bg-[#fdffff] rounded-full shadow-[0_0_20px_#fff]"></div>
                ))}
            </div>
            
            {/* Focos de luz derecha */}
            <div className="absolute top-[30%] right-[2%] grid grid-cols-4 gap-4 opacity-60 mix-blend-screen blur-[8px] transform rotate-12 scale-150 z-0 drop-shadow-[0_0_20px_rgba(255,255,255,1)]">
                {Array.from({length: 12}).map((_, i) => (
                    <div key={`r-${i}`} className="w-10 h-10 bg-[#e6f4f1] rounded-full shadow-[0_0_30px_#fff]"></div>
                ))}
            </div>
            
            {/* Luz ambiental central e inferior (Césped) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle,#ffffff15_0%,transparent_60%)] z-0 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(ellipse_at_top,#1f4a25_0%,transparent_70%)] opacity-90 z-0 pointer-events-none border-t border-white/5"></div>
            
            {/* Líneas falsas de la cancha */}
            <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[300px] border-t-2 border-white/10 rounded-[50%] z-0" style={{ transform: 'perspective(500px) rotateX(75deg)' }}></div>

            {/* --- HEADER (Fibra de Carbono) --- */}
            <div className="absolute top-0 left-0 w-full py-8 flex flex-col items-center justify-center z-20 border-b-4 border-black/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                 style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0f0f0f 0, #0f0f0f 4px, #1a1a1a 4px, #1a1a1a 8px)' }}>
                <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg flex items-center gap-2">
                    ULTIMATE <span className="text-accent-green">TEAM</span>
                </h1>
                <p className="text-gray-400/80 uppercase text-[10px] md:text-xs tracking-[0.4em] font-bold mt-2">Gestión de Plantel v2.0</p>
            </div>

            {/* --- LOGIN BOX (Glassmorphism) --- */}
            <div className="relative z-30 mt-16 w-[90%] max-w-sm rounded-[2rem] p-8 md:p-10 backdrop-blur-xl bg-black/40 border-[1.5px] border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.15)] overflow-hidden">
                {/* Resplandor interior */}
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(255,255,255,0.08)] pointer-events-none rounded-[2rem]"></div>
                
                <div className="flex items-center justify-center gap-3 mb-8 relative z-10">
                    <h2 className="text-2xl font-black text-[#8fe48f] uppercase tracking-wide drop-shadow-[0_0_10px_rgba(143,228,143,0.3)]">
                        Iniciar Sesión
                    </h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm text-gray-200 mb-2 font-medium">Usuario</label>
                        <input
                            type="text"
                            className="w-full p-3.5 bg-[#171717]/90 border border-transparent rounded-xl focus:outline-none focus:border-[#8fe48f] focus:ring-1 focus:ring-[#8fe48f] text-white placeholder:text-gray-600 transition-all font-medium text-sm shadow-inner"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tu nombre de usuario"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-200 mb-2 font-medium">Contraseña</label>
                        <input
                            type="password"
                            className="w-full p-3.5 bg-[#171717]/90 border border-transparent rounded-xl focus:outline-none focus:border-[#8fe48f] focus:ring-1 focus:ring-[#8fe48f] text-white placeholder:text-gray-600 transition-all font-medium text-sm tracking-widest shadow-inner"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {error && <p className="text-red-400 text-xs font-bold text-center bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-gradient-to-b from-[#94df94] to-[#60b360] text-[#0a2e0a] font-black rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest shadow-[0_0_20px_rgba(96,179,96,0.5)]"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
