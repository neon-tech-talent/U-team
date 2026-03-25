'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, UserPlus, Shield, Pause, Play, Trash2 } from 'lucide-react'

export default function SuperadminDashboard() {
    const [admins, setAdmins] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
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
                <div className="soccer-card border-white/10">
                    <h3 className="font-bold uppercase tracking-widest text-sm mb-6 border-b border-white/10 pb-4 text-gray-400">
                        Administradores Activos
                    </h3>
                    
                    <div className="space-y-3">
                        {admins.length === 0 ? (
                            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest text-center py-8">No hay administradores</p>
                        ) : (
                            admins.map(admin => (
                                <div key={admin.id} className={`bg-black/20 border p-3 rounded flex justify-between items-center transition-all ${admin.is_active === false ? 'border-danger-red/30 opacity-60' : 'border-white/5'}`}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm tracking-tight">{admin.full_name}</p>
                                            {admin.is_active === false && (
                                                <span className="text-[8px] bg-danger-red/20 text-danger-red px-1.5 py-0.5 rounded font-black uppercase">Pausado</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-accent-green tracking-widest uppercase">@{admin.username}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
