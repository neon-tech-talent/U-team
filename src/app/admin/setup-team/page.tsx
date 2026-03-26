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

const TEAM_COLORS = [
    '#ffffff', // White
    '#e2e8f0', // Light Grey
    '#7b8c94', // Dusty Slate
    '#1d2834', // Navy
    '#000000', // Black
    '#7f1d1d', // Dark Red
    '#dc2626', // Red
    '#ea580c', // Orange
    '#fbbf24', // Yellow
    '#16a34a', // Green
    '#065f46', // Dark Green
    '#0891b2', // Cyan
    '#2563eb', // Royal Blue
    '#1e3a8a', // Dark Blue
    '#4c1d95', // Indigo/Purple
    '#db2777'  // Pink
]

import { JerseyIcon } from '@/components/JerseyIcon'

export default function SetupTeamPage() {
    const [teamName, setTeamName] = useState('')
    const [shirtStyle, setShirtStyle] = useState('horizontal_band')
    const [primaryColor, setPrimaryColor] = useState(TEAM_COLORS[1]) // Light Grey
    const [secondaryColor, setSecondaryColor] = useState(TEAM_COLORS[3]) // Navy
    const [activeColorSelector, setActiveColorSelector] = useState<'primary' | 'secondary'>('primary')
    const [matchDuration, setMatchDuration] = useState(50)
    
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

        const finalSecondaryColor = shirtStyle === 'solid' ? primaryColor : secondaryColor

        // 1. Create the team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert([{ 
                name: teamName, 
                admin_id: user.id, 
                shirt_style: shirtStyle,
                primary_color: primaryColor,
                secondary_color: finalSecondaryColor,
                match_duration: matchDuration
            }])
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

    const toggleInvertColors = () => {
        const temp = primaryColor
        setPrimaryColor(secondaryColor)
        setSecondaryColor(temp)
    }

    if (!user) return null

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[80vh]">
            <div className="mb-4 text-center">
                <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
                    ¡Bienvenido <span className="text-accent-green">Admin</span>!
                </h1>
                <p className="text-gray-500 uppercase text-xs tracking-widest mt-2">Configuración inicial requerida</p>
            </div>
            <div className="soccer-card w-full max-w-lg border-white/5 bg-[#121413]/90 backdrop-blur shadow-2xl">
                <h2 className="text-lg font-black mb-2 text-center text-white uppercase tracking-widest">
                    Registra tu Equipo
                </h2>
                <p className="text-gray-400 text-xs mb-6 text-center">
                    Antes de comenzar a cargar partidos y jugadores, debes asignar un nombre a tu club o equipo.
                </p>
                
                <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-[#8ba19e]">Nombre del Equipo / Club</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green text-sm font-bold text-white transition-colors"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Ej: Los Leones FC"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <label className="block text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-[#8ba19e]">Duración total del partido (sumando los dos tiempos)</label>
                        <input
                            type="number"
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-accent-green text-sm font-bold text-white transition-colors"
                            value={matchDuration}
                            onChange={(e) => setMatchDuration(parseInt(e.target.value))}
                            placeholder="50"
                            required
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">El valor total se calculará multiplicando esto por los 7 titulares (ej: 50 min x 7 = 350 min).</p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="block text-[10px] font-black mb-4 uppercase tracking-[0.2em] text-[#8ba19e] text-center">Diseño de Camiseta</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 max-h-[280px] md:max-h-[380px] overflow-y-auto pr-2 pb-2 select-none custom-scrollbar">
                            {SHIRT_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => setShirtStyle(model.id)}
                                    className={`relative p-2 rounded-xl flex flex-col items-center justify-between transition-all aspect-[3/4] overflow-hidden ${
                                        shirtStyle === model.id 
                                            ? 'text-white' 
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                    style={{
                                        boxShadow: shirtStyle === model.id ? 'inset 0 0 0 2px #a3e635, 0 0 15px rgba(163,230,53,0.3)' : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                                        background: shirtStyle === model.id 
                                            ? 'linear-gradient(180deg, rgba(24,38,19,0.95) 0%, rgba(16,24,14,0.95) 100%)' 
                                            : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                    }}
                                    title={model.name}
                                >
                                    {/* Green Checkmark for selected item */}
                                    {shirtStyle === model.id && (
                                        <div className="absolute top-0 right-0 bg-[#a3e635] text-[#1a2e05] rounded-bl-xl p-1 shadow-md z-10 w-6 h-6 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    )}

                                    <JerseyIcon styleId={model.id} primaryColor={primaryColor} secondaryColor={secondaryColor} className={`w-full max-h-[70%] mt-2 transition-transform ${shirtStyle === model.id ? 'scale-105' : 'opacity-90'}`} />
                                    <span className="text-[9px] font-black uppercase text-center leading-tight mb-2 flex-grow flex items-end justify-center w-full px-1">{model.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8ba19e]">Colores del Equipo</label>
                            {shirtStyle !== 'solid' && (
                                <button
                                    type="button"
                                    onClick={toggleInvertColors}
                                    className="text-[10px] font-bold text-accent-green hover:text-white flex items-center gap-1 transition-colors uppercase"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
                                    Invertir
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 mb-3">
                            <button
                                type="button"
                                onClick={() => setActiveColorSelector('primary')}
                                className={`flex-1 p-2 md:p-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-all ${activeColorSelector === 'primary' ? 'border-accent-green bg-accent-green/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                            >
                                <div className="w-5 h-5 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: primaryColor }} />
                                <span className={`text-[9px] md:text-[10px] font-bold uppercase ${activeColorSelector === 'primary' ? 'text-white' : 'text-gray-400'}`}>
                                    {shirtStyle === 'solid' ? 'Color' : 'Base'}
                                </span>
                            </button>

                            {shirtStyle !== 'solid' && (
                                <button
                                    type="button"
                                    onClick={() => setActiveColorSelector('secondary')}
                                    className={`flex-1 p-2 md:p-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-all ${activeColorSelector === 'secondary' ? 'border-accent-green bg-accent-green/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="w-5 h-5 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: secondaryColor }} />
                                    <span className={`text-[9px] md:text-[10px] font-bold uppercase ${activeColorSelector === 'secondary' ? 'text-white' : 'text-gray-400'}`}>Secundario</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-8 gap-1.5 md:gap-2 p-3 bg-black/40 rounded-xl border border-white/5 mx-auto max-w-sm">
                            {TEAM_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                        if (activeColorSelector === 'primary') setPrimaryColor(color)
                                        else setSecondaryColor(color)
                                    }}
                                    className="w-full aspect-square rounded-full transition-all relative overflow-hidden shadow-inner border border-white/10 hover:scale-110"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                >
                                    {(activeColorSelector === 'primary' ? primaryColor === color : secondaryColor === color) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <svg className="w-4 h-4 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-danger-red text-xs font-black bg-danger-red/10 px-4 py-3 rounded-xl uppercase tracking-wider">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading || !teamName.trim()}
                        className="w-full py-4 bg-[#eab308] text-black font-black rounded-xl hover:bg-[#facc15] hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50 uppercase tracking-widest text-sm mt-4"
                    >
                        {loading ? 'Guardando...' : 'Guardar y Continuar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
