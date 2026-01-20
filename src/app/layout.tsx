import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Trophy, Users, User } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deportivo NP - Team Manager",
  description: "App de registro de partidos y estadísticas del equipo Deportivo NP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="pitch-header flex flex-col items-center gap-3">
            <img src="/logo.jpg" alt="Logo Deportivo NP" className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-accent-green shadow-lg" />
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase">
              Deportivo <span className="text-accent-green">NP</span>
            </h1>
          </header>
          <main className="flex-grow container-responsive pb-32 md:pb-8">
            {children}
          </main>

          <nav className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-white/10 flex justify-around items-center p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md md:static md:bg-transparent md:border-none md:p-6">
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
            &copy; {new Date().getFullYear()} Deportivo NP - Gestión de Equipo
          </footer>
        </div>
      </body>
    </html>
  );
}
