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
      <header className="w-full py-5 md:py-6 flex flex-col items-center justify-center border-b-[3px] md:border-b-4 border-black/80 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0f0f0f 0, #0f0f0f 4px, #1a1a1a 4px, #1a1a1a 8px)' }}>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg flex items-center justify-center gap-2 flex-wrap text-center px-4">
          ULTIMATE <span className="text-accent-green">TEAM</span>
        </h1>
      </header>
    )
  }

  return (
    <header className="w-full py-5 md:py-6 flex flex-col items-center justify-center border-b-[3px] md:border-b-4 border-black/80 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-20"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #0f0f0f 0, #0f0f0f 4px, #1a1a1a 4px, #1a1a1a 8px)' }}>
      <h1 className="text-2xl sm:text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg text-center px-4 break-words max-w-full">
        {teamName}
      </h1>
    </header>
  )
}
