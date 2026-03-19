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
  const [horasMobil, setHorasMobil] = useState<string | null>(null)
  const [appConsumo, setAppConsumo] = useState<string | null>(null)
  const [testAbierto, setTestAbierto] = useState(false)

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
          <div className="flex gap-7">
            <a href="#diag" className="font-mono text-[9px] uppercase tracking-widest text-white/35 hover:text-white/70 transition-colors">diagnóstico rápido</a>
            <a href="#ia" className="font-mono text-[9px] uppercase tracking-widest text-white/35 hover:text-white/70 transition-colors">inteligencia artificial</a>
            <a href="#art" className="font-mono text-[9px] uppercase tracking-widest text-white/35 hover:text-white/70 transition-colors">artículos</a>
          </div>
        )}
        {step !== 'landing' && (
          <button onClick={() => setStep('register')} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            Empezar →
          </button>
        )}
      </nav>

      <main className={`flex-1 z-10 ${step === 'landing' ? 'w-full block' : 'flex items-center justify-center min-h-screen px-6'}`}>

        {/* LANDING */}
        {step === 'landing' && (
          <div className="w-full">
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% center; }
                100% { background-position: -200% center; }
              }
              @keyframes bouncey {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(6px); }
              }
              .shimmer-text {
                background: linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,1) 40%, rgba(255,255,255,1) 60%, rgba(255,255,255,0.25) 100%);
                background-size: 250% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: shimmer 4s linear infinite;
              }
              .shimmer-scroll {
                background: linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0.8) 60%, rgba(255,255,255,0.2) 100%);
                background-size: 250% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: shimmer 4s linear infinite, bouncey 1.6s ease-in-out infinite;
                display: inline-block;
              }
            `}</style>

            {/* HERO */}
            <section className="w-full pt-20 pb-16 px-8 md:px-12">
              <h1 className="shimmer-text font-serif italic text-5xl md:text-6xl leading-[1.15] block mb-3">pbfocus</h1>
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/28 mb-7">
                planificador personal · productividad · hábitos
              </div>
              <p className="font-serif italic text-white/45 text-base md:text-lg leading-relaxed max-w-4xl">
                "Actualmente vivimos en una era de distracciones y estímulos que nos limitan diariamente.
                A muchos de mis amigos y a mí incluido nos pasa que no tenemos toda la energía que nos
                gustaría tener, o no productivizamos nuestros días tanto como quisiéramos. Pero creo en
                una serie de hábitos y pequeñas conductas que pueden cambiar esto. Te dejo que explores
                esta web y que te esfuerces en ser mañana un poquito mejor que hoy."
              </p>
              <div className="flex justify-center mt-14">
                <span className="shimmer-scroll font-mono text-[9px] uppercase tracking-widest">scroll ↓</span>
              </div>
            </section>

            <div className="border-t border-white/[0.04]" />

            {/* IA */}
            <section id="ia" className="px-8 md:px-12 py-20">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-6">inteligencia artificial</div>
              <div className="border border-white/[0.15] rounded-xl px-10 py-10 bg-white/[0.02]">
                <h2 className="font-serif text-2xl text-white mb-3">Tu planning semanal, generado por IA</h2>
                <p className="font-sans text-white/40 text-sm leading-relaxed max-w-lg mb-6">
                  Responde 8 preguntas sobre tu rutina actual y recibe un planning semanal completamente
                  personalizado. Horas de estudio, deporte, descanso, hábitos — todo estructurado según tu situación real.
                </p>
                <div className="flex flex-col gap-2 mb-10">
                  <div className="font-mono text-[9px] text-white/30"><span className="text-white/50 mr-2">·</span>8 preguntas sobre tu rutina, objetivos y problemas actuales</div>
                  <div className="font-mono text-[9px] text-white/30"><span className="text-white/50 mr-2">·</span>Planning 7 días con bloques horarios personalizados</div>
                  <div className="font-mono text-[9px] text-white/30"><span className="text-white/50 mr-2">·</span>3 hábitos clave según tu situación</div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setStep('register')}
                    className="bg-white text-[#080808] font-sans font-medium px-12 py-3.5 text-xs tracking-wide rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Crear mi planning →
                  </button>
                </div>
              </div>
            </section>

            <div className="border-t border-white/[0.04]" />

            {/* DIAGNÓSTICO */}
            <section id="diag" className="px-8 md:px-12 py-20">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-6">diagnóstico rápido</div>
              <div className="flex justify-center">
                <div className="border border-white/10 rounded-xl p-8 max-w-lg w-full text-center">
                  <h2 className="font-serif text-xl text-white/80 mb-3">¿Cuánto control tienes sobre tu atención?</h2>
                  <p className="font-sans text-white/35 text-xs leading-relaxed mb-6">
                    Dos preguntas rápidas para saber dónde estás ahora mismo y qué puedes hacer hoy.
                  </p>
                  <button
                    onClick={() => setTestAbierto(true)}
                    className="border border-white/25 rounded-lg font-mono text-[10px] uppercase tracking-widest text-white/70 hover:text-white hover:border-white/60 px-7 py-2.5 transition-colors"
                  >
                    Hacer el diagnóstico →
                  </button>
                </div>
              </div>

              {testAbierto && (
                <div className="mt-6 border border-white/[0.08] rounded-xl px-10 py-9">

                  {/* Pregunta 1 */}
                  <div className="mb-8">
                    <p className="font-sans italic text-white/42 text-xs mb-4">¿Cuántas horas pierdes al día con el móvil?</p>
                    <div className="flex gap-3 flex-wrap">
                      {['1 – 2h', '2 – 3h', '4h o más'].map((op) => (
                        <button
                          key={op}
                          onClick={() => setHorasMobil(op)}
                          className={`px-5 py-2.5 border rounded-lg font-sans text-xs transition-colors ${
                            horasMobil === op
                              ? 'border-white/35 text-white/90 bg-white/[0.04]'
                              : 'border-white/[0.08] text-white/40 hover:border-white/25 hover:text-white/70'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                    {horasMobil && (
                      <div className="mt-4 border border-white/[0.06] rounded-xl px-5 py-4 bg-white/[0.02]">
                        <div className="font-serif text-white/75 text-base mb-1">
                          {horasMobil === '1 – 2h' && 'Buen control'}
                          {horasMobil === '2 – 3h' && 'Zona de riesgo'}
                          {horasMobil === '4h o más' && 'El móvil te está ganando'}
                        </div>
                        <p className="font-sans text-white/35 text-xs leading-relaxed">
                          {horasMobil === '1 – 2h' && 'Estás por debajo de la media. Con pequeños ajustes puedes optimizar ese tiempo y convertirlo en energía real.'}
                          {horasMobil === '2 – 3h' && 'Ese tiempo equivale a casi un mes entero al año. Un par de cambios de hábito pueden recuperar horas valiosas.'}
                          {horasMobil === '4h o más' && 'Más de 4 horas diarias es el principal ladrón de energía. La buena noticia: es el hábito más fácil de cambiar.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pregunta 2 */}
                  <div>
                    <p className="font-sans italic text-white/42 text-xs mb-4">¿Qué app te consume más tiempo?</p>
                    <div className="flex gap-3 flex-wrap">
                      {['Instagram', 'TikTok', 'X (Twitter)'].map((op) => (
                        <button
                          key={op}
                          onClick={() => setAppConsumo(op)}
                          className={`px-5 py-2.5 border rounded-lg font-sans text-xs transition-colors ${
                            appConsumo === op
                              ? 'border-white/35 text-white/90 bg-white/[0.04]'
                              : 'border-white/[0.08] text-white/40 hover:border-white/25 hover:text-white/70'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                    {appConsumo && (
                      <div className="mt-4 border border-white/[0.06] rounded-xl px-5 py-6 bg-white/[0.02]">
                        <div className="font-serif text-white/72 text-base mb-1">Configura One Sec como yo lo tengo</div>
                        <p className="font-sans text-white/28 text-xs mb-6">One Sec añade una pausa de respiración antes de abrir apps adictivas. Así de simple, así de efectivo.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                          {[
                            { n: '01', t: 'Descarga One Sec', d: 'Gratis en App Store y Google Play.' },
                            { n: '02', t: 'Añade tus apps', d: `One Sec → Apps → ${appConsumo}.` },
                            { n: '03', t: 'Configura la pausa', d: '5 segundos de respiración. Suficiente para romper el impulso.' },
                            { n: '04', t: 'Activa los límites', d: 'Da permisos de Screen Time a One Sec.' },
                          ].map((s) => (
                            <div key={s.n}>
                              <div className="font-mono text-white/20 text-[8px] mb-2">{s.n}</div>
                              <div className="aspect-video bg-white/[0.02] border border-white/[0.05] rounded-lg flex items-center justify-center mb-2">
                                <span className="font-mono text-white/15 text-[7px]">próximamente</span>
                              </div>
                              <div className="font-sans text-white/55 text-[11px] font-medium mb-1">{s.t}</div>
                              <div className="font-sans text-white/28 text-[10px] leading-relaxed">{s.d}</div>
                            </div>
                          ))}
                        </div>
                        
                        <a
                          href="https://one-sec.app"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block border border-white/[0.08] text-white/38 hover:text-white/70 hover:border-white/20 px-4 py-2 rounded-lg font-mono text-[9px] transition-colors"
                        >
                          Descargar One Sec →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <div className="border-t border-white/[0.04]" />

            {/* ARTÍCULOS */}
            <section id="art" className="px-8 md:px-12 py-20">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-4">artículos</div>
              <p className="font-sans text-white/35 text-sm mb-8">Escribo sobre hábitos, energía y desarrollo personal. Sin fórmulas mágicas.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  'Por qué dormir 8 horas lo cambia todo',
                  'Cómo dejé de mirar el móvil al despertar',
                  'El hábito más pequeño con mayor impacto',
                ].map((titulo) => (
                  <div key={titulo} className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                    <div className="font-mono text-[8px] uppercase tracking-widest text-white/22 mb-3">próximamente</div>
                    <div className="font-sans text-white/48 text-xs font-medium leading-relaxed mb-2">{titulo}</div>
                    <div className="font-sans text-white/22 text-[10px]">Artículo en preparación.</div>
                  </div>
                ))}
              </div>
            </section>

            {/* FOOTER */}
            <footer className="py-10 border-t border-white/[0.04] text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/18">pbfocus © 2026 · hecho con intención</span>
            </footer>
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
