'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    class Particle {
      x: number
      y: number
      baseVx: number
      baseVy: number
      vx: number
      vy: number
      radius: number

      constructor(w: number, h: number) {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.baseVx = (Math.random() - 0.5) * 0.4
        this.baseVy = (Math.random() - 0.5) * 0.4
        this.vx = this.baseVx
        this.vy = this.baseVy
        this.radius = Math.random() * 0.5 + 1
      }

      update(w: number, h: number) {
        const dx = this.x - mouseX
        const dy = this.y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 120) {
          const force = 0.8
          const ease = (120 - dist) / 120
          const angle = Math.atan2(dy, dx)
          this.vx += Math.cos(angle) * force * ease * 0.1
          this.vy += Math.sin(angle) * force * ease * 0.1
        }

        this.vx += (this.baseVx - this.vx) * 0.05
        this.vy += (this.baseVy - this.vy) * 0.05

        this.x += this.vx
        this.y += this.vy

        // Wrap
        if (this.x < 0) this.x = w
        if (this.x > w) this.x = 0
        if (this.y < 0) this.y = h
        if (this.y > h) this.y = 0
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
        ctx.fill()
      }
    }

    let particles: Particle[] = []

    const initParticles = () => {
      const area = window.innerWidth * window.innerHeight
      const numParticles = Math.max(40, Math.min(80, Math.floor(area / 12000)))
      particles = Array.from({ length: numParticles }, () => new Particle(canvas.width, canvas.height))
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

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
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 100) * 0.35})`
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

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-90"
    />
  )
}

type Step = 'landing' | 'register' | 'onboarding' | 'app'

const QUESTIONS = [
  { id: 'wake', label: '¿A qué hora te levantas normalmente?' },
  { id: 'sleep', label: '¿A qué hora te acuestas?' },
  { id: 'study', label: '¿Cuántas horas al día dedicas a estudiar o trabajar?' },
  { id: 'sport', label: '¿Haces deporte? ¿Cuántos días a la semana?' },
  { id: 'problem', label: '¿Cuál es tu mayor problema de productividad ahora mismo?' },
  { id: 'habits', label: '¿Qué hábitos quieres construir o mejorar?' },
  { id: 'free', label: '¿Cuánto tiempo libre tienes al día aproximadamente?' },
  { id: 'goal', label: '¿Cuál es tu objetivo principal en los próximos 3 meses?' },
]

export default function Home() {
  const [step, setStep] = useState<Step>('landing')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('users_app')
      .insert({ nombre, email })
      .select()
      .single()
    if (err) {
      setError('Este email ya está registrado o hubo un error.')
      setLoading(false)
      return
    }
    setUserId(data.id)
    setLoading(false)
    setStep('onboarding')
  }

  const handleAnswer = (value: string) => {
    const q = QUESTIONS[currentQ]
    setAnswers(prev => ({ ...prev, [q.id]: value }))
  }

  const handleNext = async () => {
    if (!answers[QUESTIONS[currentQ].id]) return
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1)
      return
    }
    setLoading(true)
    await supabase.from('onboarding').insert({
      user_id: userId,
      respuestas: answers,
    })
    setLoading(false)
    setStep('app')
  }

  const progress = ((currentQ + 1) / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex flex-col font-sans relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleCanvas />
      </div>

      {/* Nav */}
      <nav className="bg-[rgba(8,8,8,0.85)] backdrop-blur border-b border-white/[0.04] fixed top-0 w-full z-50 px-6 py-5 flex items-center justify-between">
        <span className="font-mono text-white/55 text-sm tracking-wider">pbfocus</span>
        {step === 'landing' && (
          <button
            onClick={() => setStep('register')}
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            Empezar →
          </button>
        )}
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-12 z-10">

        {/* LANDING */}
        {step === 'landing' && (
          <div className="max-w-2xl w-full space-y-12">
            <div className="space-y-6">
              <div className="font-mono uppercase text-xs tracking-widest text-white/45">
                pbfocus — planificador personal
              </div>
              <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#e8e8e8] leading-none">
                Tu día,<br />
                <span className="text-white/40 italic">bien construido.</span>
              </h1>
              <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-lg">
                Responde unas preguntas sobre tu situación actual y recibe un planning semanal personalizado. Hábitos, estudio, deporte, descanso — todo en su lugar.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setStep('register')}
                className="bg-white text-[#080808] font-medium px-8 py-4 text-xs tracking-wide rounded hover:bg-white/90 transition-colors"
              >
                Empezar ahora
              </button>
              <div className="flex gap-3">
                <span className="border border-white/10 text-white/30 text-[9px] font-mono rounded-full uppercase tracking-wider px-3 py-1">Gratis</span>
                <span className="border border-white/10 text-white/30 text-[9px] font-mono rounded-full uppercase tracking-wider px-3 py-1">Sin anuncios</span>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {step === 'register' && (
          <div className="max-w-md w-full space-y-8 bg-[#0d0d0d] p-8 border border-white/[0.07] rounded-xl relative">
            <div className="space-y-2">
              <div className="font-mono uppercase text-xs tracking-widest text-white/45">Paso 1 de 3</div>
              <h2 className="text-2xl font-serif text-[#e8e8e8]">¿Cómo te llamas?</h2>
              <p className="text-white/40 text-sm">Solo necesitamos tu nombre y email para guardar tu planning.</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono uppercase text-xs tracking-widest text-white/45">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.07] rounded text-[#e8e8e8] placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono uppercase text-xs tracking-widest text-white/45">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.07] rounded text-[#e8e8e8] placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#080808] font-medium py-4 text-xs tracking-wide rounded hover:bg-white/90 transition-colors disabled:opacity-40"
              >
                {loading ? 'Guardando...' : 'Continuar →'}
              </button>
            </form>
          </div>
        )}

        {/* ONBOARDING */}
        {step === 'onboarding' && (
          <div className="max-w-md w-full space-y-8 bg-[#0d0d0d] p-8 border border-white/[0.07] rounded-xl relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-mono uppercase text-xs tracking-widest text-white/45">
                  Pregunta {currentQ + 1} de {QUESTIONS.length}
                </div>
                <div className="border border-white/10 text-white/30 text-[9px] font-mono rounded-full uppercase tracking-wider px-2 py-0.5">
                  {Math.round(progress)}%
                </div>
              </div>
              <div className="w-full bg-white/[0.06] h-px">
                <div
                  className="bg-white/40 h-px transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <h2 className="text-xl font-serif text-[#e8e8e8] pt-2">
                {QUESTIONS[currentQ].label}
              </h2>
            </div>
            <div className="space-y-4">
              <textarea
                value={answers[QUESTIONS[currentQ].id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={4}
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.07] rounded text-[#e8e8e8] placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm resize-none"
              />
              <button
                onClick={handleNext}
                disabled={!answers[QUESTIONS[currentQ].id] || loading}
                className="w-full bg-white text-[#080808] font-medium py-4 text-xs tracking-wide rounded hover:bg-white/90 transition-colors disabled:opacity-40"
              >
                {loading ? 'Guardando...' : currentQ < QUESTIONS.length - 1 ? 'Siguiente →' : 'Ver mi planning →'}
              </button>
              {currentQ > 0 && (
                <button
                  onClick={() => setCurrentQ(prev => prev - 1)}
                  className="w-full text-white/40 text-xs hover:text-white transition-colors py-2"
                >
                  ← Anterior
                </button>
              )}
            </div>
          </div>
        )}

        {/* APP */}
        {step === 'app' && (
          <div className="max-w-2xl w-full space-y-8 text-center relative">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full border border-white/[0.07] bg-white/[0.02] flex items-center justify-center mx-auto">
                <span className="text-white/60 text-lg">✓</span>
              </div>
              <h2 className="text-2xl font-serif text-[#e8e8e8]">Todo listo, {nombre}.</h2>
              <p className="text-white/45 text-sm max-w-sm mx-auto leading-relaxed">
                Tus respuestas han sido guardadas. En la próxima fase la IA generará tu planning personalizado aquí.
              </p>
            </div>
            <div className="p-6 border border-white/[0.07] rounded-xl bg-[#0d0d0d] text-left space-y-3">
              <div className="font-mono uppercase text-xs tracking-widest text-white/45">Próximamente</div>
              <p className="text-white/55 text-sm">Planning semanal · Chatbot · Calendario</p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
