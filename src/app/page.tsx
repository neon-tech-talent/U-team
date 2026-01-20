'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Trophy, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      router.push('/login')
    } else {
      const u = JSON.parse(savedUser)
      setUser(u)

      const fetchData = async () => {
        const { data } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false })
        setMatches(data || [])
        setLoading(false)
      }
      fetchData()
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user || loading) return <div className="p-8 text-center uppercase font-bold tracking-widest text-accent-green">Cargando...</div>

  const stats = matches.reduce((acc, m) => {
    acc.pj++
    if (m.goals_own > m.goals_rival) acc.pg++
    else if (m.goals_own < m.goals_rival) acc.pp++
    else acc.pe++
    return acc
  }, { pj: 0, pg: 0, pe: 0, pp: 0 })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-full border border-accent-green shadow-lg" />
          <div>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Bienvenido,</p>
            <h2 className="text-xl font-bold">{user.full_name}</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Statistics Summary */}
        <div className="soccer-card bg-gradient-to-br from-pitch-dark to-black border-accent-green/20">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-warning-yellow" />
            <h3 className="font-bold uppercase tracking-tight">Estadísticas Equipo</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-black/40 rounded-lg">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Partidos</p>
              <p className="stat-value">{stats.pj}</p>
            </div>
            <div className="text-center p-3 bg-black/40 rounded-lg">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ganados</p>
              <p className="stat-value text-accent-green">{stats.pg}</p>
            </div>
          </div>
          <Link
            href="/team-stats"
            className="flex items-center justify-between mt-4 text-xs text-accent-green hover:underline uppercase font-bold tracking-tighter"
          >
            Ver tabla completa <ChevronRight size={14} />
          </Link>
        </div>

        {/* Individual Profile Link */}
        <div className="soccer-card border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-accent-green" />
            <h3 className="font-bold uppercase tracking-tight">Mi Perfil</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Goles, asistencias y tarjetas de la temporada.</p>
          <Link
            href="/profile"
            className="w-full block py-3 bg-white/5 text-center rounded-lg hover:bg-white/10 transition-colors uppercase text-xs font-black tracking-widest"
          >
            Ver mis estadísticas
          </Link>
        </div>
      </div>

      {/* Admin Quick Actions */}
      {user.is_admin && (
        <div className="soccer-card border-warning-yellow/30 bg-warning-yellow/5">
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard className="text-warning-yellow" />
            <h3 className="font-bold uppercase tracking-tight">Panel Admin</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/matches/new"
              className="p-3 bg-warning-yellow text-black text-center rounded-lg font-black text-xs uppercase hover:brightness-110 shadow-lg"
            >
              Nuevo Partido
            </Link>
            <Link
              href="/admin/matches"
              className="p-3 bg-black/40 text-warning-yellow text-center border border-warning-yellow/50 rounded-lg font-black text-xs uppercase hover:bg-black/60"
            >
              Partidos
            </Link>
            <Link
              href="/admin/players"
              className="p-3 bg-black/40 text-white/70 text-center border border-white/10 rounded-lg font-black text-xs uppercase hover:bg-black/60 md:col-span-2"
            >
              Gestionar Plantel
            </Link>
          </div>
        </div>
      )}

      {/* Recent Matches */}
      <section>
        <h3 className="text-lg font-black mb-4 uppercase flex items-center gap-2 tracking-tighter">
          <span className="w-1.5 h-6 bg-accent-green inline-block"></span>
          Partidos Recientes
        </h3>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center p-8 bg-black/20 rounded-xl border border-dashed border-white/10 text-gray-500 uppercase text-xs font-bold tracking-widest">
              No hay partidos registrados
            </div>
          ) : (
            matches.map(match => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="block soccer-card !p-4 border-white/5 hover:border-accent-green/50 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{new Date(match.match_date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg">NP {match.goals_own}</span>
                      <span className="text-gray-600 font-bold">-</span>
                      <span className="font-bold text-gray-400">{match.goals_rival} {match.rival}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-full group-hover:bg-accent-green group-hover:text-black transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
