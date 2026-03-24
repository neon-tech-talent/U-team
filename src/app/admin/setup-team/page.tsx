'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SHIRT_MODELS = [
    { id: 'solid', name: 'LISA' },
    { id: 'horizontal_band', name: 'FRANJA HORIZONTAL' },
    { id: 'hoops', name: 'RAYAS HORIZONTALES' },
    { id: 'halves', name: 'MITAD Y MITAD' },
    { id: 'diagonal', name: 'FRANJA DIAGONAL' },
    { id: 'center_stripe', name: 'FRANJA CENTRAL' },
    { id: 'quarters', name: 'CUARTERONES' },
    { id: 'chevron', name: 'CHEVRON (V)' },
    { id: 'thick_vertical_stripes', name: 'BASTONES' },
    { id: 'many_vertical_stripes', name: 'RAYAS VERTICALES' },
]

function JerseyIcon({ styleId, selected }: { styleId: string, selected: boolean }) {
    // Realistic base colors matching the screenshot exactly
    let primaryStr = '#8ba19e'; // Dusty cyan-grey
    const secondaryStr = '#202b3e'; // Dark navy

    // "Franja Horizontal" features a white base in the image
    if (styleId === 'horizontal_band') {
        primaryStr = '#e2e8f0'; 
    }

    // Advanced, realistic T-Shirt path with curved shoulders and dropped sleeves
    const shirtPath = "M35 12 C 45 20, 55 20, 65 12 L 88 20 L 80 45 L 72 40 L 72 88 C 60 92, 40 92, 28 88 L 28 40 L 20 45 L 12 20 Z";
    
    // Smooth trim for the neck and sleeves
    const trimColor = '#1f2937';

    const renderPattern = () => {
        switch (styleId) {
            case 'horizontal_band': return <rect y="40" width="100" height="25" fill={secondaryStr} />;
            case 'hoops': return (
                <>
                    <rect y="20" width="100" height="8" fill={secondaryStr} />
                    <rect y="38" width="100" height="8" fill={secondaryStr} />
                    <rect y="56" width="100" height="8" fill={secondaryStr} />
                    <rect y="74" width="100" height="8" fill={secondaryStr} />
                    <rect y="92" width="100" height="8" fill={secondaryStr} />
                </>
            );
            case 'halves': return <rect width="50" height="100" fill={secondaryStr} />;
            case 'diagonal': return <polygon points="-20,0 25,0 120,100 75,100" fill={secondaryStr} />;
            case 'center_stripe': return <rect x="35" width="30" height="100" fill={secondaryStr} />;
            case 'quarters': return (
                <>
                    <rect width="50" height="50" fill={secondaryStr} />
                    <rect x="50" y="50" width="50" height="100" fill={secondaryStr} />
                </>
            );
            case 'chevron': return <polygon points="-10,35 50,65 110,35 110,55 50,85 -10,55" fill={secondaryStr} />;
            case 'thick_vertical_stripes': return (
                <>
                    <rect x="25" width="15" height="100" fill={secondaryStr} />
                    <rect x="60" width="15" height="100" fill={secondaryStr} />
                </>
            );
            case 'many_vertical_stripes': return (
                <>
                    <rect x="15" width="5" height="100" fill={secondaryStr} />
                    <rect x="25" width="5" height="100" fill={secondaryStr} />
                    <rect x="35" width="5" height="100" fill={secondaryStr} />
                    <rect x="45" width="5" height="100" fill={secondaryStr} />
                    <rect x="55" width="5" height="100" fill={secondaryStr} />
                    <rect x="65" width="5" height="100" fill={secondaryStr} />
                    <rect x="75" width="5" height="100" fill={secondaryStr} />
                    <rect x="85" width="5" height="100" fill={secondaryStr} />
                </>
            );
            default: return null; 
        }
    };

    return (
        <svg viewBox="0 0 100 100" className={`w-14 h-14 md:w-20 md:h-20 mx-auto transition-transform ${selected ? 'scale-105' : 'opacity-90'}`}>
            <defs>
                <clipPath id={"shirtClip-" + styleId}>
                    <path d={shirtPath} />
                </clipPath>
                
                {/* Internal 3D Shading for volume */}
                <linearGradient id="shading-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
                    <stop offset="25%" stopColor="#fff" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#fff" stopOpacity="0.25" />
                    <stop offset="75%" stopColor="#000" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
                </linearGradient>
                
                {/* Vertical crease shading */}
                <linearGradient id="shading-crease" x1="30%" y1="0%" x2="40%" y2="0%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.0" />
                    <stop offset="50%" stopColor="#000" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.0" />
                </linearGradient>
            </defs>
            
            {/* Outline & Drop Shadow layer inside the SVG frame */}
            <path d={shirtPath} fill="none" stroke="#000" strokeWidth="8" className="opacity-40" transform="translate(0, 3)" />
            
            {/* Base Color Fill */}
            <path d={shirtPath} fill={primaryStr} />
            
            {/* Clip Group for patterns to stay inside the shirt bounds */}
            <g clipPath={`url(#shirtClip-${styleId})`}>
                {renderPattern()}
                
                {/* 3D Overlays (Applies to both base and pattern) */}
                <rect width="100" height="100" fill="url(#shading-shadow)" pointerEvents="none" />
                <rect width="100" height="100" fill="url(#shading-crease)" pointerEvents="none" />
                
                {/* Neck and sleeve trims for realism */}
                <path d="M 35 12 C 45 20, 55 20, 65 12" fill="none" stroke={trimColor} strokeWidth="4" />
                <line x1="12" y1="20" x2="20" y2="45" stroke={trimColor} strokeWidth="3" />
                <line x1="88" y1="20" x2="80" y2="45" stroke={trimColor} strokeWidth="3" />
            </g>
            
            {/* Outer border for sharpness */}
            <path d={shirtPath} fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    )
}

export default function SetupTeamPage() {
    const [teamName, setTeamName] = useState('')
    const [shirtStyle, setShirtStyle] = useState('chevron')
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
                        <label className="block text-xs font-bold mb-4 uppercase tracking-widest text-[#a8b3ac] text-center">Diseño de Camiseta</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto px-2 py-2 select-none custom-scrollbar">
                            {SHIRT_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => setShirtStyle(model.id)}
                                    className={`relative p-3 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                                        shirtStyle === model.id 
                                            ? 'bg-[#182613] text-white' 
                                            : 'bg-transparent border border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5'
                                    }`}
                                    style={{
                                        boxShadow: shirtStyle === model.id ? 'inset 0 0 0 2px #a3e635, 0 0 20px rgba(163,230,53,0.15)' : 'none'
                                    }}
                                    title={model.name}
                                >
                                    {/* Green Checkmark for selected item */}
                                    {shirtStyle === model.id && (
                                        <div className="absolute top-0 right-0 bg-[#a3e635] text-[#1a2e05] rounded-bl-xl rounded-tr-lg p-1.5 shadow-md z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    )}

                                    <JerseyIcon styleId={model.id} selected={shirtStyle === model.id} />
                                    <span className="text-[9px] font-black uppercase text-center leading-tight min-h-[24px] flex items-center">{model.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-danger-red text-sm font-bold bg-danger-red/10 p-2 rounded">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading || !teamName.trim()}
                        className="w-full py-4 bg-[#eab308] text-black font-black rounded-lg hover:brightness-110 transition-all disabled:opacity-50 uppercase tracking-widest text-sm mt-4 shadow-lg shadow-black/50"
                    >
                        {loading ? 'Guardando...' : 'Guardar y Continuar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
