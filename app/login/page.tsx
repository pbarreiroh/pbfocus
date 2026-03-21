'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'register') {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } }
      })
      if (err) { setError(err.message); setLoading(false); return }
      router.push('/chat')
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError('Email o contraseña incorrectos.'); setLoading(false); return }
      router.push('/chat')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex items-center justify-center px-6">
      <style>{`
        @keyframes title-sweep { 0%,35%{background-position:160% center} 65%,100%{background-position:-60% center} }
        @keyframes title-pulse { 0%,100%{font-weight:300;letter-spacing:-0.5px} 50%{font-weight:500;letter-spacing:1px} }
      `}</style>

      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <button onClick={() => router.push('/')} style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: '28px',
            display: 'inline-block',
            background: 'linear-gradient(105deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,1) 38%, rgba(255,255,255,1) 45%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0.4) 100%)',
            backgroundSize: '400% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'title-sweep 9s ease-in-out infinite, title-pulse 6s ease-in-out infinite',
          }}>pbfocus</button>
          <p className="text-white/35 text-xs font-mono uppercase tracking-widest">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </p>
        </div>

        <div className="border border-white/[0.08] rounded-2xl p-8 bg-white/[0.02] space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
              />
            </div>
            {error && <p className="text-red-400/80 text-xs font-mono">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#080808] font-medium py-3 text-xs tracking-wide rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40 mt-2"
            >
              {loading ? '...' : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
            </button>
          </form>

          <div className="border-t border-white/[0.06] pt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-white/35 text-xs font-mono hover:text-white/60 transition-colors"
            >
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
