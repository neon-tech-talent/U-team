'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SHIRT_MODELS = [
    { id: 'solid', name: 'Lisa' },
    { id: 'horizontal_band', name: 'Franja Horizontal' },
    { id: 'hoops', name: 'Rayas Horizontales' },
    { id: 'halves', name: 'Mitad y Mitad' },
    { id: 'diagonal', name: 'Franja Diagonal' },
    { id: 'center_stripe', name: 'Franja Central' },
    { id: 'quarters', name: 'Cuartos' },
    { id: 'chevron', name: 'Chevron (V)' },
    { id: 'thick_vertical_stripes', name: 'Bastones' },
    { id: 'many_vertical_stripes', name: 'Rayas Verticales' },
]

function JerseyIcon({ styleId, selected }: { styleId: string, selected: boolean }) {
    const primaryStr = selected ? '#a3e635' : '#374151'; 
    const secondaryStr = selected ? '#1a2e05' : '#111827'; 
    
    // Shirt path coordinates
    const shirtPath = "M35 15 Q 50 30 65 15 L 90 25 L 80 50 L 70 40 L 75 95 L 25 95 L 30 40 L 20 50 L 10 25 Z";

    const renderPattern = () => {
        switch (styleId) {
            case 'horizontal_band': return <rect y="45" width="100" height="20" fill={secondaryStr} />;
            case 'hoops': return (
                <>
                    <rect y="25" width="100" height="10" fill={secondaryStr} />
                    <rect y="45" width="100" height="10" fill={secondaryStr} />
                    <rect y="65" width="100" height="10" fill={secondaryStr} />
                    <rect y="85" width="100" height="10" fill={secondaryStr} />
                </>
            );
            case 'halves': return <rect width="50" height="100" fill={secondaryStr} />;
            case 'diagonal': return <polygon points="-20,0 20,0 120,100 80,100" fill={secondaryStr} />;
            case 'center_stripe': return <rect x="35" width="30" height="100" fill={secondaryStr} />;
            case 'quarters': return (
                <>
                    <rect width="50" height="50" fill={secondaryStr} />
                    <rect x="50" y="50" width="50" height="100" fill={secondaryStr} />
                </>
            );
            case 'chevron': return <polygon points="0,35 50,65 100,35 100,60 50,90 0,60" fill={secondaryStr} />;
            case 'thick_vertical_stripes': return (
                <>
                    <rect x="25" width="15" height="100" fill={secondaryStr} />
                    <rect x="60" width="15" height="100" fill={secondaryStr} />
                </>
            );
            case 'many_vertical_stripes': return (
                <>
                    <rect x="15" width="8" height="100" fill={secondaryStr} />
                    <rect x="35" width="8" height="100" fill={secondaryStr} />
                    <rect x="55" width="8" height="100" fill={secondaryStr} />
                    <rect x="75" width="8" height="100" fill={secondaryStr} />
                </>
            );
            default: return null; 
        }
    };

    return (
        <svg viewBox="0 0 100 100" className={`w-14 h-14 md:w-16 md:h-16 mx-auto transition-transform ${selected ? 'scale-110 drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]' : 'opacity-70'}`}>
            <defs>
                <clipPath id={"shirtClip-" + styleId}>
                    <path d={shirtPath} />
                </clipPath>
            </defs>
            <path d={shirtPath} fill={primaryStr} stroke={selected ? '#fff' : '#4b5563'} strokeWidth="2" strokeLinejoin="round" />
            <g clipPath={`url(#shirtClip-${styleId})`}>
                {renderPattern()}
            </g>
            <path d={shirtPath} fill="none" stroke={selected ? '#fff' : '#4b5563'} strokeWidth="2" strokeLinejoin="round" />
        </svg>
    )
}

export default function SetupTeamPage() {
    const [teamName, setTeamName] = useState('')
    const [shirtStyle, setShirtStyle] = useState('solid')
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
            .insert([{ name: teamName, admin_id: user.id, shirt_style: shirtStyle }])
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

                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-xs font-bold mb-4 uppercase tracking-widest text-gray-400 text-center">Diseño de Camiseta</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-[250px] overflow-y-auto px-1 custom-scrollbar">
                            {SHIRT_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => setShirtStyle(model.id)}
                                    className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        shirtStyle === model.id 
                                            ? 'bg-accent-green/10 border-accent-green text-white' 
                                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                    title={model.name}
                                >
                                    <JerseyIcon styleId={model.id} selected={shirtStyle === model.id} />
                                    <span className="text-[9px] font-black uppercase text-center leading-tight h-6 flex items-center">{model.name}</span>
                                </button>
                            ))}
                        </div>
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
