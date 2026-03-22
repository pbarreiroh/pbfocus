'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function GlobalNav() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <style>{`
        @keyframes title-sweep { 0%,35%{background-position:160% center} 65%,100%{background-position:-60% center} }
        @keyframes title-pulse { 0%,100%{font-weight:300;letter-spacing:-0.5px} 50%{font-weight:500;letter-spacing:1px} }
      `}</style>
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-4 bg-[rgba(8,8,8,0.9)] backdrop-blur border-b border-white/[0.06] flex items-center justify-between">
        <button onClick={() => router.push('/')} style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '22px',
          display: 'inline-block',
          background: 'linear-gradient(105deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,1) 38%, rgba(255,255,255,1) 45%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0.4) 100%)',
          backgroundSize: '400% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'title-sweep 9s ease-in-out infinite, title-pulse 6s ease-in-out infinite',
          border: 'none',
          cursor: 'pointer',
        }}>pbfocus</button>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => router.push('/chat')} className="font-mono text-[11px] uppercase tracking-widest text-white/70 hover:text-white transition-colors">IA</button>
          <button onClick={() => router.push('/diagnostico')} className="font-mono text-[11px] uppercase tracking-widest text-white/70 hover:text-white transition-colors">Diagnóstico</button>
          <button onClick={() => router.push('/pomodoro')} className="font-mono text-[11px] uppercase tracking-widest text-white/70 hover:text-white transition-colors">Pomodoro</button>
          <button onClick={() => router.push('/articulos')} className="font-mono text-[11px] uppercase tracking-widest text-white/70 hover:text-white transition-colors">Artículos</button>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-white/45 uppercase tracking-widest">
              {user.user_metadata?.nombre || user.email?.split('@')[0]}
            </span>
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null) }}
              className="font-mono text-[10px] uppercase tracking-widest text-white/45 hover:text-white transition-colors"
            >
              Salir
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="font-mono text-[11px] uppercase tracking-widest text-white/80 hover:text-white transition-colors border border-white/30 hover:border-white/60 px-4 py-1.5 rounded-full"
          >
            Iniciar sesión →
          </button>
        )}
      </nav>
    </>
  )
}
