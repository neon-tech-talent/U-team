'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, UserPlus, Shield, Pause, Play, Trash2, Search, Key } from 'lucide-react'

const SubscriptionDateSelector = ({ 
    subscriptionUntil, 
    adminId, 
    onUpdate 
}: { 
    subscriptionUntil: string | null, 
    adminId: string, 
    onUpdate: (id: string, newDate: string | null) => void 
}) => {
    const days = Array.from({length: 31}, (_, i) => (i + 1).toString())
    const months = Array.from({length: 12}, (_, i) => (i + 1).toString())
    const years = ['2026', '2027', '2028', '2029', '2030']

    const dateStr = subscriptionUntil ? subscriptionUntil.substring(0,10) : ''
    const [cYear, cMonth, cDay] = dateStr ? dateStr.split('-') : ['', '', '']

    const handleDateChange = (type: string, val: string) => {
        let y = cYear || '2026'
        let m = cMonth || '01'
        let d = cDay || '01'

        if (type === 'year') y = val
        else if (type === 'month') m = val.padStart(2, '0')
        else if (type === 'day') d = val.padStart(2, '0')

        onUpdate(adminId, `${y}-${m}-${d}`)
    }

    return (
        <div className="flex items-center gap-1 mt-1">
            <select 
                className="bg-black/40 border border-white/10 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-accent-green cursor-pointer"
                value={cDay ? parseInt(cDay, 10).toString() : ''}
                onChange={(e) => handleDateChange('day', e.target.value)}
            >
                <option value="" disabled>Día</option>
                {days.map(d => <option key={`d-${d}`} value={d}>{d}</option>)}
            </select>
            
            <select 
                className="bg-black/40 border border-white/10 rounded p-1 text-xs text-white outline-none focus:border-accent-green cursor-pointer"
                value={cMonth ? parseInt(cMonth, 10).toString() : ''}
                onChange={(e) => handleDateChange('month', e.target.value)}
            >
                <option value="" disabled>Mes</option>
                {months.map(m => <option key={`m-${m}`} value={m}>{m}</option>)}
            </select>
            
            <select 
                className="bg-black/40 border border-white/10 rounded p-1 text-xs text-white outline-none focus:border-accent-green cursor-pointer"
                value={cYear}
                onChange={(e) => handleDateChange('year', e.target.value)}
            >
                <option value="" disabled>Año</option>
                {years.map(y => <option key={`y-${y}`} value={y}>{y}</option>)}
            </select>

            {dateStr && (
                <button 
                    onClick={() => onUpdate(adminId, null)}
                    className="ml-1 p-1 text-danger-red hover:bg-danger-red/20 rounded transition-colors"
                    title="Borrar fecha"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    )
}

export default function SuperadminDashboard() {
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [message, setMessage] = useState({ text: '', type: '' })
    const router = useRouter()

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) {
            router.push('/login')
            return
        }
        const user = JSON.parse(userStr)
        if (user.role !== 'superadmin') {
            router.push('/') // Redirect unauthorized users
            return
        }
        fetchAdmins()
    }, [router])

    const fetchAdmins = async () => {
        const { data } = await supabase
            .from('players')
            .select('*')
            .eq('role', 'admin')
            .order('created_at', { ascending: false })
        setAdmins(data || [])
        setLoading(false)
    }

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ text: 'Creando administrador...', type: 'info' })

        // Validaciones básicas
        if (!name || !username || !password) {
            setMessage({ text: 'Todos los campos son obligatorios', type: 'error' })
            return
        }

        const { error } = await supabase
            .from('players')
            .insert([
                {
                    full_name: name,
                    username,
                    password,
                    phone: phone || null,
                    role: 'admin',
                    is_admin: true,
                    is_active: true
                }
            ])

        if (error) {
            setMessage({ text: 'Error al crear: ' + (error.message.includes('unique') ? 'El usuario ya existe' : error.message), type: 'error' })
        } else {
            setMessage({ text: 'Administrador creado con éxito', type: 'success' })
            setName('')
            setUsername('')
            setPassword('')
            setPhone('')
            fetchAdmins()
        }
    }

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('players')
            .update({ is_active: !currentStatus })
            .eq('id', id)
        
        if (error) {
            alert('Error al actualizar: ' + error.message)
        } else {
            fetchAdmins()
        }
    }

    const handleUpdateSubscription = async (id: string, newDate: string | null) => {
        const { error } = await supabase
            .from('players')
            .update({ subscription_until: newDate || null })
            .eq('id', id)
        
        if (error) {
            alert('Error al actualizar fecha: ' + error.message)
        } else {
            fetchAdmins()
        }
    }

    const handleResetPassword = async (id: string, adminUsername: string) => {
        const newPassword = window.prompt(`Ingresa la nueva contraseña para el administrador @${adminUsername}:`)
        if (!newPassword || newPassword.trim() === '') return // Canceló o dejó vacío

        const { error } = await supabase
            .from('players')
            .update({ password: newPassword.trim() })
            .eq('id', id)
        
        if (error) {
            alert('Error al restablecer contraseña: ' + error.message)
        } else {
            alert(`¡Contraseña actualizada exitosamente para @${adminUsername}!`)
        }
    }

    const handleDeleteAdmin = async (id: string, adminName: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al administrador "${adminName}"? Esta acción no se puede deshacer.`)) return

        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id)
        
        if (error) {
            alert('Error al eliminar: ' + error.message)
        } else {
            fetchAdmins()
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        router.push('/login')
    }

    const filteredAdmins = admins.filter(admin => 
        admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        admin.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="p-8 text-center uppercase font-bold text-accent-green tracking-widest">Cargando...</div>

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 pt-8">
            <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <Shield className="text-accent-green" size={32} />
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Panel de Control</p>
                        <h2 className="text-xl font-bold uppercase">Super Administrador</h2>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-danger-red transition-colors"
                    title="Cerrar Sesión"
                >
                    <LogOut size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulario de creación */}
                <div className="soccer-card border-accent-green/30">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                        <UserPlus className="text-accent-green" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Nuevo Administrador</h3>
                    </div>
                    
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-1 font-bold tracking-widest">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-accent-green outline-none"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-1 font-bold tracking-widest">Usuario</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-accent-green outline-none"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Ej: admin_juan"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-1 font-bold tracking-widest">Contraseña</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-accent-green outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Contraseña de acceso"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-1 font-bold tracking-widest">Teléfono (Opcional)</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-accent-green outline-none"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Ej: +54 9 11 1234-5678"
                            />
                        </div>
                        
                        {message.text && (
                            <p className={`text-xs p-2 rounded ${message.type === 'error' ? 'bg-danger-red/20 text-danger-red' : message.type === 'success' ? 'bg-accent-green/20 text-accent-green' : 'text-gray-400'}`}>
                                {message.text}
                            </p>
                        )}

                        <button type="submit" className="w-full bg-accent-green text-black font-black uppercase tracking-widest p-3 rounded hover:brightness-110 transition-all text-sm mt-4">
                            Crear Administrador
                        </button>
                    </form>
                </div>

                {/* Lista de Administradores */}
                <div className="soccer-card border-white/10 flex flex-col h-full">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                        <h3 className="font-bold uppercase tracking-widest text-sm text-gray-400">
                            Administradores Activos
                        </h3>
                        {/* Buscador */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <input
                                type="text"
                                placeholder="Buscar admin..."
                                className="w-full bg-black/40 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs focus:border-accent-green outline-none focus:ring-1 focus:ring-accent-green/50 transition-all font-bold tracking-widest uppercase text-white placeholder:text-gray-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                        {filteredAdmins.length === 0 ? (
                            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest text-center py-8">
                                {admins.length === 0 ? "No hay administradores" : "No se encontraron resultados"}
                            </p>
                        ) : (
                            filteredAdmins.map(admin => {
                                const isExpired = admin.subscription_until && new Date(admin.subscription_until) < new Date();
                                
                                return (
                                <div key={admin.id} className={`bg-black/20 border p-3 rounded flex flex-col gap-3 transition-all relative overflow-hidden ${admin.is_active === false ? 'border-danger-red/30 opacity-60' : 'border-white/5'} ${isExpired ? '!border-danger-red/50' : ''}`}>
                                    {isExpired && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-danger-red"></div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm tracking-tight">{admin.full_name}</p>
                                                {admin.is_active === false && (
                                                    <span className="text-[8px] bg-danger-red/20 text-danger-red px-1.5 py-0.5 rounded font-black uppercase">Pausado</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-accent-green tracking-widest uppercase">@{admin.username}</p>
                                            {admin.phone && <p className="text-[10px] text-gray-400 mt-1 font-mono">📱 {admin.phone}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleResetPassword(admin.id, admin.username)}
                                                className="p-2 bg-black/40 text-gray-400 hover:text-accent-green hover:bg-accent-green/10 rounded-lg transition-all"
                                                title="Restablecer Contraseña"
                                            >
                                                <Key size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(admin.id, admin.is_active !== false)}
                                                className={`p-2 rounded-lg transition-colors ${admin.is_active === false ? 'bg-accent-green text-black hover:brightness-110' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                                                title={admin.is_active === false ? 'Reactivar' : 'Pausar'}
                                            >
                                                {admin.is_active === false ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                                                className="p-2 bg-black/40 text-gray-400 hover:text-danger-red hover:bg-danger-red/10 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Panel de Suscripción */}
                                    <div className="mt-1 pt-3 border-t border-white/5 flex flex-col gap-3">
                                        <div className="flex flex-col">
                                            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Pago Hasta</p>
                                            <SubscriptionDateSelector 
                                                subscriptionUntil={admin.subscription_until} 
                                                adminId={admin.id} 
                                                onUpdate={handleUpdateSubscription} 
                                            />
                                        </div>
                                        {isExpired && (
                                            <div className="w-full bg-danger-red/10 border border-danger-red/20 rounded py-2 text-center">
                                                <p className="text-[10px] text-danger-red font-black uppercase tracking-widest">
                                                    ⚠️ Licencia Vencida
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
