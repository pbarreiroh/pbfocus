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
        this.baseVx = (Math.random() - 0.5) * 0.08
        this.baseVy = (Math.random() - 0.5) * 0.08
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
  const [aiLoading, setAiLoading] = useState(false)
  const [planning, setPlanning] = useState<any>(null)
  const [diaActivo, setDiaActivo] = useState('Lunes')

  useEffect(() => {
    if (step !== 'app') return
    setAiLoading(true)
    fetch('/api/planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respuestas: answers, nombre }),
    })
      .then(r => r.json())
      .then(data => { setPlanning(data.planning); setAiLoading(false) })
      .catch(() => setAiLoading(false))
  }, [step])

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

      <main className="flex-1 flex items-center justify-center min-h-screen px-6 z-10">

        {/* LANDING */}
        {step === 'landing' && (
          <div className="max-w-xl w-full text-center space-y-10">
            <div className="space-y-6">
              <div className="font-mono uppercase text-xs tracking-widest text-white/45">
                pbfocus — planificador personal
              </div>
              <h1 className="leading-none flex flex-col items-center">
                <span className="font-serif text-6xl md:text-7xl text-white">Tu día,</span>
                <span className="font-serif italic text-6xl md:text-7xl text-white/35">bien construido.</span>
              </h1>
              <p className="text-white/45 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Responde unas preguntas sobre tu situación actual y recibe un planning semanal personalizado. Hábitos, estudio, deporte, descanso — todo en su lugar.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setStep('register')}
                className="inline-block bg-white text-[#080808] font-medium px-8 py-4 text-xs tracking-wide rounded hover:bg-white/90 transition-colors"
              >
                Empezar ahora
              </button>
              <div className="flex justify-center gap-3">
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
          <div className="max-w-2xl w-full space-y-10">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center gap-6 py-20">
                <p className="font-serif italic text-white/40 text-xl">Generando tu planning...</p>
                <div className="w-64 bg-white/10 rounded-full h-px overflow-hidden">
                  <div className="bg-white/40 h-px rounded-full animate-[grow_8s_ease-in-out_forwards]" style={{ width: '100%', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'grow 8s ease-in-out forwards' }} />
                </div>
                <style>{`@keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
              </div>
            ) : planning ? (
              <div className="space-y-12">
                <div className="space-y-3">
                  <h2 className="font-serif text-3xl text-white">Hola, {nombre}.</h2>
                  <p className="text-white/45 text-sm leading-relaxed">{planning.resumen}</p>
                </div>

                <div className="space-y-4">
                  <div className="font-mono uppercase text-[10px] tracking-widest text-white/30">Tu semana</div>
                  <div className="flex gap-2 flex-wrap">
                    {planning.dias.map((d: any) => (
                      <button
                        key={d.dia}
                        onClick={() => setDiaActivo(d.dia)}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-colors ${diaActivo === d.dia
                            ? 'border-white/30 text-white/80 bg-white/[0.06]'
                            : 'border-white/[0.08] text-white/30 hover:text-white/50'
                          }`}
                      >
                        {d.dia}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3 pt-2">
                    {planning.dias.find((d: any) => d.dia === diaActivo)?.bloques.map((b: any, i: number) => {
                      const colores: Record<string, string> = {
                        morning: 'bg-amber-400',
                        work: 'bg-blue-400',
                        rest: 'bg-green-400',
                        sport: 'bg-orange-400',
                        night: 'bg-purple-400',
                      }
                      const fondos: Record<string, string> = {
                        morning: 'bg-amber-500/10',
                        work: 'bg-blue-500/10',
                        rest: 'bg-green-500/10',
                        sport: 'bg-orange-500/10',
                        night: 'bg-purple-500/10',
                      }
                      return (
                        <div key={i} className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.05] ${fondos[b.tipo]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colores[b.tipo]}`} />
                          <span className="font-mono text-white/30 text-xs w-12 shrink-0">{b.hora}</span>
                          <span className="text-white/70 text-sm">{b.actividad}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-mono uppercase text-[10px] tracking-widest text-white/30">Hábitos clave</div>
                  <div className="flex flex-wrap gap-2">
                    {planning.habitos.map((h: string, i: number) => (
                      <span key={i} className="border border-white/[0.08] rounded-full px-3 py-1 text-xs text-white/50 font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-mono uppercase text-[10px] tracking-widest text-white/30">Consejo</div>
                  <div className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.02]">
                    <p className="text-white/50 text-sm leading-relaxed italic font-serif">{planning.consejo}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/30 text-sm font-mono">Error generando el planning. Recarga la página.</p>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
