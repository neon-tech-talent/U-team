'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, User } from 'lucide-react'
import ClientHeader from '@/components/ClientHeader'

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLogin = pathname === '/login'

    if (isLogin) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen flex flex-col">
          <ClientHeader />
          
          <main className="flex-grow container-responsive pb-32 md:pb-8">
            {children}
          </main>

          <nav className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-white/10 flex justify-around items-center p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md md:static md:bg-transparent md:border-none md:p-6 z-50">
            <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-accent-green transition-colors">
              <Trophy size={20} />
              <span className="text-[10px] uppercase font-bold">Inicio</span>
            </Link>
            <Link href="/team-stats" className="flex flex-col items-center gap-1 text-gray-400 hover:text-accent-green transition-colors">
              <Users size={20} />
              <span className="text-[10px] uppercase font-bold">Equipo</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-accent-green transition-colors">
              <User size={20} />
              <span className="text-[10px] uppercase font-bold">Perfil</span>
            </Link>
          </nav>

          <footer className="p-8 text-center text-gray-500 text-sm hidden md:block">
            &copy; {new Date().getFullYear()} Ultimate Team - Gestión de Equipo
          </footer>
        </div>
    )
}
