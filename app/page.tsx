'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex flex-col font-sans relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleCanvas />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-4 bg-[rgba(8,8,8,0.85)] backdrop-blur border-b border-white/[0.05] flex items-center justify-between">
        <style>{`
          @keyframes title-sweep { 0%,35%{background-position:160% center} 65%,100%{background-position:-60% center} }
          @keyframes title-pulse { 0%,100%{font-weight:300;letter-spacing:-0.5px} 50%{font-weight:500;letter-spacing:1px} }
        `}</style>
        <span style={{
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
        }}>pbfocus</span>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => router.push('/chat')} className="font-mono text-[9px] uppercase tracking-widest text-white/60 hover:text-white transition-colors">IA</button>
          <button onClick={() => {}} className="font-mono text-[9px] uppercase tracking-widest text-white/60 hover:text-white transition-colors">Diagnóstico</button>
          <button onClick={() => {}} className="font-mono text-[9px] uppercase tracking-widest text-white/60 hover:text-white transition-colors">Artículos</button>
          <button onClick={() => {}} className="font-mono text-[9px] uppercase tracking-widest text-white/60 hover:text-white transition-colors">Pomodoro</button>
        </div>
        <button onClick={() => router.push('/chat')} className="font-mono text-[9px] uppercase tracking-widest text-white/60 hover:text-white transition-colors">
          Empezar →
        </button>
      </nav>

      {/* Main — todo centrado en pantalla */}
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-8 gap-10 z-10 pt-16">

        {/* Hero IA */}
        <div className="flex flex-col items-center text-center gap-3 max-w-xl">
          <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">inteligencia artificial</div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(36px, 5vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-1px',
            color: 'white',
          }}>
            Tu planning semanal,<br />generado por IA
          </h1>
          <p className="text-white/42 text-sm leading-relaxed max-w-md">
            Responde unas preguntas sobre tu rutina y recibe un planning completamente personalizado. Hábitos, estudio, deporte, descanso.
          </p>
          <div className="font-mono text-[8px] text-white/28 tracking-widest">
            8 preguntas · planning 7 días · 3 hábitos clave
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="mt-2 bg-white text-[#080808] font-medium px-10 py-3 text-xs tracking-wide rounded-md hover:bg-white/90 transition-colors"
          >
            Crear mi planning →
          </button>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
          <div className="border border-white/[0.08] rounded-xl p-5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.16] transition-all cursor-pointer flex flex-col gap-2">
            <div className="text-white/40 text-sm">◎</div>
            <div className="text-white/75 text-sm font-medium">Diagnóstico rápido</div>
            <div className="text-white/32 text-xs leading-relaxed">Descubre cuánto tiempo pierdes con el móvil y cómo recuperarlo.</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-white/20 mt-1">test interactivo</div>
          </div>
          <div className="border border-white/[0.08] rounded-xl p-5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.16] transition-all cursor-pointer flex flex-col gap-2">
            <div className="text-white/40 text-sm">◷</div>
            <div className="text-white/75 text-sm font-medium">Pomodoro</div>
            <div className="text-white/32 text-xs leading-relaxed">Temporizador de estudio con bloques de foco y descanso.</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-white/20 mt-1">próximamente</div>
          </div>
          <div className="border border-white/[0.08] rounded-xl p-5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.16] transition-all cursor-pointer flex flex-col gap-2">
            <div className="text-white/40 text-sm">✦</div>
            <div className="text-white/75 text-sm font-medium">Artículos</div>
            <div className="text-white/32 text-xs leading-relaxed">Reflexiones sobre hábitos, energía y desarrollo personal.</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-white/20 mt-1">próximamente</div>
          </div>
        </div>

      </main>
    </div>
  )
}
