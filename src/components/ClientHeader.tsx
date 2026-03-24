'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'

export default function ClientHeader() {
  const [teamName, setTeamName] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    async function fetchTeam() {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setTeamName(null)
        return
      }
      
      try {
        const user = JSON.parse(userStr)
        if (user.team_id) {
          const { data } = await supabase.from('teams').select('name').eq('id', user.team_id).single()
          if (data) {
            setTeamName(data.name)
          } else {
            setTeamName(null)
          }
        } else {
          setTeamName(null)
        }
      } catch (e) {
        setTeamName(null)
      }
    }
    fetchTeam()
  }, [pathname])

  if (!teamName) {
    return (
      <header className="pitch-header flex flex-col items-center gap-3">
        <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase">
          Ultimate <span className="text-accent-green">Team</span>
        </h1>
      </header>
    )
  }

  return (
    <header className="pitch-header flex flex-col items-center gap-3">
      <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-white">
        {teamName}
      </h1>
    </header>
  )
}
