'use client'

// Deployment trigger: 2026-01-22

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Trophy, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [allMatches, setAllMatches] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      router.push('/login')
    } else {
      const u = JSON.parse(savedUser)
      
      if (u.role === 'superadmin') {
        router.push('/superadmin')
        return
      }
      if (u.role === 'admin' && !u.team_id) {
        router.push('/admin/setup-team')
        return
      }

      setUser(u)

      const fetchData = async () => {
        let query = supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false })
        
        if (u.team_id) {
          query = query.eq('team_id', u.team_id)
        }

        const { data } = await query
        setAllMatches(data || [])

        // Fetch tournaments
        if (u.team_id) {
          const { data: tData } = await supabase
            .from('tournaments')
            .select('*')
            .eq('team_id', u.team_id)
            .order('created_at', { ascending: false })
          if (tData) {
            setTournaments(tData)
            const current = tData.find((t: any) => t.is_current)
            if (current) setSelectedTournament(current.id)
          }
        }

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

  // Filter matches by tournament
  const matches = selectedTournament === 'ALL'
    ? allMatches
    : allMatches.filter(m => m.tournament_id === selectedTournament)

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
      {user.role === 'admin' && (
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
              className="p-3 bg-black/40 text-white/70 text-center border border-white/10 rounded-lg font-black text-xs uppercase hover:bg-black/60 col-span-2"
            >
              Gestionar Plantel
            </Link>
          </div>
        </div>
      )}

      {/* Team Tools (Available for all roles including players) */}
      <div className="soccer-card border-accent-green/30">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-bold uppercase tracking-tight text-accent-green">Herramientas del Equipo</h3>
        </div>
        <Link
          href="/lineup"
          className="block w-full p-3 bg-white/10 text-white text-center rounded-lg font-black text-xs uppercase hover:bg-accent-green hover:text-black transition-colors"
        >
          Armar Pizarra Táctica
        </Link>
      </div>

      {/* Recent Matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter">
            <span className="w-1.5 h-6 bg-accent-green inline-block"></span>
            Partidos Recientes
          </h3>
          {tournaments.length > 0 && (
            <select
              className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-accent-green"
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {tournaments.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' ★' : ''}</option>
              ))}
            </select>
          )}
        </div>
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
                      <span className="font-black text-lg">UT {match.goals_own}</span>
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
