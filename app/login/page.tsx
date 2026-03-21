'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animationFrameId: number
    let mouseX = -1000, mouseY = -1000
    const handleMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY }
    const handleMouseLeave = () => { mouseX = -1000; mouseY = -1000 }
    class Particle {
      x: number; y: number; baseVx: number; baseVy: number; vx: number; vy: number; radius: number
      constructor(w: number, h: number) {
        this.x = Math.random() * w; this.y = Math.random() * h
        this.baseVx = (Math.random() - 0.5) * 0.08; this.baseVy = (Math.random() - 0.5) * 0.08
        this.vx = this.baseVx; this.vy = this.baseVy
        this.radius = Math.random() * 0.5 + 1
      }
      update(w: number, h: number) {
        const dx = this.x - mouseX, dy = this.y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120 * 0.8
          this.vx += (dx / dist) * force * 0.3
          this.vy += (dy / dist) * force * 0.3
        }
        this.vx += (this.baseVx - this.vx) * 0.05
        this.vy += (this.baseVy - this.vy) * 0.05
        this.x += this.vx; this.y += this.vy
        if (this.x < 0) this.x = w; if (this.x > w) this.x = 0
        if (this.y < 0) this.y = h; if (this.y > h) this.y = 0
      }
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`
        ctx.fill()
      }
    }
    let particles: Particle[] = []
    const initParticles = () => {
      const area = window.innerWidth * window.innerHeight
      const n = Math.max(40, Math.min(80, Math.floor(area / 12000)))
      particles = Array.from({ length: n }, () => new Particle(canvas.width, canvas.height))
    }
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles() }
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    resize()
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(canvas.width, canvas.height)
        particles[i].draw(ctx)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 100) * 0.35})`
            ctx.lineWidth = 1
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-90" />
}

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
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleCanvas />
      </div>
      <style>{`
        @keyframes title-sweep { 0%,35%{background-position:160% center} 65%,100%{background-position:-60% center} }
        @keyframes title-pulse { 0%,100%{font-weight:300;letter-spacing:-0.5px} 50%{font-weight:500;letter-spacing:1px} }
      `}</style>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="space-y-2 text-center">
          <p className="text-white/80 text-base font-mono uppercase tracking-widest">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </p>
        </div>

        <div className="border border-white/[0.30] rounded-2xl p-10 bg-white/[0.04] space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-widest text-white/80">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  className="w-full px-4 py-4 bg-white/[0.06] border border-white/[0.25] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="font-mono text-xs uppercase tracking-widest text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-4 bg-white/[0.06] border border-white/[0.25] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-xs uppercase tracking-widest text-white/80">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-4 bg-white/[0.06] border border-white/[0.25] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base"
              />
            </div>
            {error && <p className="text-red-400/80 text-xs font-mono">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#080808] font-medium py-4 text-sm tracking-wide rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40 mt-2"
            >
              {loading ? '...' : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
            </button>
          </form>

          <div className="border-t border-white/[0.12] pt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-white/65 text-sm font-mono hover:text-white/80 transition-colors"
            >
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
