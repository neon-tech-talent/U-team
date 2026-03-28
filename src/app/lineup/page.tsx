'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Download, Users, CheckCircle2, Circle } from 'lucide-react'
import { FORMATIONS } from '@/lib/lineup-utils'
import { getPlayers } from '@/lib/db'
import { toJpeg } from 'html-to-image'
import download from 'downloadjs'

import { JerseyIcon } from '@/components/JerseyIcon'

type Player = {
    id: string
    full_name: string
    number: number
    position: string
}

type FormationKey = keyof typeof FORMATIONS

export default function LineupGenerator() {
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [formation, setFormation] = useState<FormationKey>('2-3-1')
    const [footballType, setFootballType] = useState(7)
    const [teamName, setTeamName] = useState('Ultimate Team')
    const [teamSettings, setTeamSettings] = useState({ shirt_style: 'solid', primary_color: '#ffffff', secondary_color: '#000000' })
    const [loading, setLoading] = useState(true)
    const pitchRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        async function fetchPlayers() {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                router.push('/login')
                return
            }
            const user = JSON.parse(userStr)

            if (user.team_id) {
                const { data: tData } = await supabase.from('teams').select('name, shirt_style, primary_color, secondary_color, football_type').eq('id', user.team_id).single()
                if (tData) {
                    setTeamName(tData.name)
                    const fType = tData.football_type || 7
                    setFootballType(fType)
                    
                    // Set default formation based on football type
                    if (fType === 9) setFormation('3-3-2')
                    else if (fType === 11) setFormation('4-4-2')
                    else setFormation('2-3-1')

                    setTeamSettings({
                        shirt_style: tData.shirt_style || 'solid',
                        primary_color: tData.primary_color || '#7b8c94',
                        secondary_color: tData.secondary_color || '#1d2834'
                    })
                }
            }

            const { data } = await getPlayers(user.team_id)
            setPlayers(data || [])
            setLoading(false)
        }
        fetchPlayers()
    }, [router])

    const togglePlayer = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(v => v !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleDownload = async () => {
        if (pitchRef.current === null) return

        const dataUrl = await toJpeg(pitchRef.current, { quality: 0.95, backgroundColor: '#2d5a27' })
        const date = new Date().toISOString().split('T')[0]
        download(dataUrl, `formacion_deportivonp_${date}.jpg`)
    }

    if (loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando plantel...</div>

    const starters = selectedIds.slice(0, footballType)
    const subs = selectedIds.slice(footballType)
    const formationCoords = FORMATIONS[formation]

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-tight text-white">Generador de Alineación</h2>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={selectedIds.length === 0}
                    className="flex items-center gap-2 bg-accent-green text-black px-4 py-2 rounded-lg font-black text-xs uppercase hover:brightness-110 disabled:opacity-50 transition-all shadow-lg"
                >
                    <Download size={16} /> Finalizar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Selection & Settings */}
                <div className="space-y-6">
                    <section className="soccer-card border-white/10 bg-black/40">
                        <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Táctica</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(FORMATIONS) as FormationKey[]).map(f => {
                                // Simple check to show only relevant formations if possible, 
                                // but we'll show all and then let the user choose (some might be compatible)
                                const playerCount = FORMATIONS[f].length
                                if (playerCount !== footballType) return null
                                
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setFormation(f)}
                                        className={`py-2 px-4 rounded border font-black text-xs uppercase transition-all ${formation === f
                                            ? 'bg-accent-green border-accent-green text-black'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <section className="soccer-card border-white/10 bg-black/40 overflow-hidden">
                        <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">
                            Convocados ({selectedIds.length})
                        </h3>
                        <div className="max-height-[400px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                            {players.map(player => {
                                const isSelected = selectedIds.includes(player.id)
                                const index = selectedIds.indexOf(player.id)
                                return (
                                    <button
                                        key={player.id}
                                        onClick={() => togglePlayer(player.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all border ${isSelected
                                            ? 'bg-accent-green/10 border-accent-green/30 text-white'
                                            : 'bg-black/20 border-transparent text-gray-400 hover:bg-black/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            {isSelected ? <CheckCircle2 size={18} className="text-accent-green" /> : <Circle size={18} />}
                                            <div>
                                                <p className="font-bold text-sm leading-none">{player.full_name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase mt-1">N° {player.number} • {player.position}</p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded">
                                                {index === 0 ? 'GK' : index < footballType ? 'TIT' : 'SUP'}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                </div>

                {/* Right Panel: Pitch Visualization */}
                <div className="lg:col-span-2 flex flex-col items-center">
                    <div ref={pitchRef} className="pitch-container">
                        <div className="pitch-line-center"></div>
                        <div className="pitch-circle"></div>
                        <div className="pitch-box pitch-box-top"></div>
                        <div className="pitch-box pitch-box-bottom"></div>

                        {/* Team Info Overlay */}
                        <div className="absolute top-4 right-4 text-right z-20 pointer-events-none">
                            <h4 className="text-xl font-black italic text-white leading-none uppercase">{teamName}</h4>
                            <p className="text-[10px] text-accent-green font-bold tracking-[0.2em]">{formation}</p>
                        </div>

                        {/* Players on pitch */}
                        {starters.map((id, index) => {
                            const player = players.find(p => p.id === id)
                            if (!player) return null
                            const coords = formationCoords[index]
                            const lastName = player.full_name.split(' ').pop()

                            // Goalkeeper wears a different color usually, but let's just make it a distinct solid color (e.g., bright yellow) if no custom handling
                            const isGK = index === 0;
                            const pStyle = isGK ? 'solid' : teamSettings.shirt_style;
                            const pPrimary = isGK ? '#facc15' : teamSettings.primary_color;
                            const pSecondary = isGK ? '#000000' : teamSettings.secondary_color;

                            return (
                                <div
                                    key={player.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                                    style={{ top: coords.top, left: coords.left }}
                                >
                                    <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                                        <JerseyIcon 
                                            styleId={pStyle}
                                            primaryColor={pPrimary}
                                            secondaryColor={pSecondary}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center pt-2 text-[10px] md:text-sm font-black text-white" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                                            {player.number}
                                        </span>
                                    </div>
                                    <div className="bg-white/95 text-black text-[8px] md:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow mt-1">
                                        {lastName}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Substitutes Box on Pitch (Optional) */}
                        {subs.length > 0 && (
                            <div className="absolute bottom-4 left-4 bg-black/60 p-2 rounded border border-white/20 z-20 backdrop-blur-sm">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 border-b border-white/10 pb-1">Suplentes</p>
                                <div className="flex flex-wrap gap-x-2 gap-y-1 max-w-[150px]">
                                    {subs.map(id => {
                                        const player = players.find(p => p.id === id)
                                        return (
                                            <span key={id} className="text-[9px] text-white font-bold uppercase truncate">
                                                {player?.full_name.split(' ').pop()}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-gray-500 text-[10px] mt-4 uppercase font-bold tracking-[0.3em]">Vista Previa de Alineación</p>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--accent-green);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
