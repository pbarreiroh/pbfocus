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
      x: number; y: number; z: number
      baseVx: number; baseVy: number; baseVz: number
      vx: number; vy: number; vz: number

      constructor(w: number, h: number) {
        this.x = (Math.random() - 0.5) * w * 2
        this.y = (Math.random() - 0.5) * h * 2
        this.z = Math.random() * 1000
        this.baseVx = (Math.random() - 0.5) * 0.08
        this.baseVy = (Math.random() - 0.5) * 0.08
        this.baseVz = (Math.random() - 0.5) * 0.3
        this.vx = this.baseVx
        this.vy = this.baseVy
        this.vz = this.baseVz
      }

      project(w: number, h: number) {
        const fov = 600
        const scale = fov / (fov + this.z)
        return {
          sx: this.x * scale + w / 2,
          sy: this.y * scale + h / 2,
          scale,
        }
      }

      update(w: number, h: number) {
        this.vx += (this.baseVx - this.vx) * 0.05
        this.vy += (this.baseVy - this.vy) * 0.05
        this.vz += (this.baseVz - this.vz) * 0.05
        this.x += this.vx
        this.y += this.vy
        this.z += this.vz
        if (this.z > 1000) this.z = 0
        if (this.z < 0) this.z = 1000
        if (this.x < -w) this.x = w
        if (this.x > w) this.x = -w
        if (this.y < -h) this.y = h
        if (this.y > h) this.y = -h
      }

      draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const { sx, sy, scale } = this.project(w, h)
        if (sx < 0 || sx > w || sy < 0 || sy > h) return
        const radius = scale * 1.5
        const opacity = scale * 0.9
        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(0.3, radius), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
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
        const pi = particles[i].project(canvas.width, canvas.height)
        if (pi.sx < 0 || pi.sx > canvas.width || pi.sy < 0 || pi.sy > canvas.height) continue
        particles[i].draw(ctx, canvas.width, canvas.height)
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j].project(canvas.width, canvas.height)
          if (pj.sx < 0 || pj.sx > canvas.width || pj.sy < 0 || pj.sy > canvas.height) continue
          const dx = pi.sx - pj.sx
          const dy = pi.sy - pj.sy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const avgScale = (pi.scale + pj.scale) / 2
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 100) * 0.35 * avgScale})`
            ctx.lineWidth = avgScale
            ctx.moveTo(pi.sx, pi.sy)
            ctx.lineTo(pj.sx, pj.sy)
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
        <span className="font-mono text-white/70 text-sm tracking-wider">pbfocus</span>
        
        {step === 'landing' && (
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('ia')?.scrollIntoView({ behavior: 'smooth' })} className="font-mono text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-colors">
              Inteligencia artificial
            </button>
            <button onClick={() => document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' })} className="font-mono text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-colors">
              Diagnóstico rápido
            </button>
            <button onClick={() => document.getElementById('articulos')?.scrollIntoView({ behavior: 'smooth' })} className="font-mono text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-colors">
              Artículos
            </button>
          </div>
        )}

        {step === 'landing' && (
          <button
            onClick={() => setStep('register')}
            className="text-[10px] uppercase tracking-widest text-white/80 hover:text-white transition-colors"
          >
            Empezar →
          </button>
        )}
      </nav>

      <main className={`flex-1 z-10 ${step === 'landing' ? 'w-full block' : 'flex items-center justify-center min-h-screen px-6'}`}>

        {/* LANDING */}
        {step === 'landing' && (
          <div className="w-full">
            {/* HEROS SECCIÓN 1 */}
            <section className="min-h-screen flex items-center">
              <div className="w-full px-12 md:px-20 pt-28 pb-20">
                <style>{`
                  @keyframes title-float {
                    0%, 100% { transform: translateY(0px) skewX(0deg); opacity: 1; }
                    25% { transform: translateY(-6px) skewX(-0.5deg); opacity: 0.85; }
                    75% { transform: translateY(3px) skewX(0.3deg); opacity: 0.9; }
                  }
                `}</style>
                <h1
                  className="font-serif italic text-white leading-none"
                  style={{
                    fontSize: 'clamp(80px, 12vw, 160px)',
                    animation: 'title-float 6s ease-in-out infinite',
                    display: 'inline-block',
                  }}
                >
                  pbfocus
                </h1>
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/25 mt-5 mb-12">
                  planificador personal · productividad · hábitos
                </div>
                <p
                  className="font-serif italic text-white/50 leading-loose"
                  style={{
                    fontSize: 'clamp(15px, 1.6vw, 20px)',
                    maxWidth: '72ch',
                    letterSpacing: '0.01em',
                  }}
                >
                  Actualmente vivimos en una era de distracciones y estímulos que nos limitan diariamente.
                  A muchos de mis amigos y a mí incluido nos pasa que no tenemos toda la energía que nos
                  gustaría tener, o no productivizamos nuestros días tanto como quisiéramos. Pero creo en
                  una serie de hábitos y pequeñas conductas que pueden cambiar esto.{' '}
                  <span className="text-white/75">
                    Te dejo que explores esta web y que te esfuerces en ser mañana un poquito mejor que hoy.
                  </span>
                </p>
                <div className="font-mono text-[9px] text-white/18 uppercase tracking-widest mt-20 animate-bounce">
                  scroll ↓
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: IA */}
            <section id="ia" className="px-8 md:px-16 py-32 border-t border-white/[0.10]">
              <div className="max-w-3xl mx-auto border border-white/35 rounded-2xl p-12 bg-white/[0.02] flex flex-col items-center text-center">
                <div className="font-mono uppercase text-[10px] tracking-widest text-white/45 mb-6">
                  inteligencia artificial
                </div>
                <h2 className="font-serif text-4xl text-white mb-5">
                  Tu planning semanal, generado por IA
                </h2>
                <p className="text-white/55 text-sm leading-relaxed max-w-md mb-8">
                  Responde 8 preguntas sobre tu rutina actual y recibe un planning semanal completamente personalizado. Horas de estudio, deporte, descanso, hábitos — todo estructurado según tu situación real.
                </p>
                <div className="font-mono text-[9px] text-white/45 tracking-widest mb-10">
                  8 preguntas · planning 7 días · 3 hábitos clave
                </div>
                <button
                  onClick={() => setStep('register')}
                  className="bg-white text-[#080808] font-medium px-16 py-4 text-sm tracking-wide rounded-md hover:bg-white/90 transition-colors"
                >
                  Crear mi planning →
                </button>
              </div>
            </section>

            {/* SECCIÓN 3: TEST INTERACTIVO */}
            <section id="diagnostico" className="max-w-4xl mx-auto px-8 md:px-16 py-32">
              <div className="font-mono uppercase text-[10px] tracking-widest text-white/45 mb-12">
                diagnóstico rápido
              </div>
              <h2 className="font-serif text-3xl text-white mb-16">
                ¿Cuánto te roban tu atención y tu energía?
              </h2>

              <div className="space-y-16">
                {/* Pregunta 1 */}
                <div className="space-y-6">
                  <h3 className="text-white/70 text-sm font-medium">¿Cuántas horas pierdes al día con el móvil?</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['1 – 2h', '2 – 3h', '4h o más'].map((opcion) => (
                      <button
                        key={opcion}
                        onClick={() => setHorasMobil(prev => prev === opcion ? null : opcion)}
                        className={`py-4 rounded-xl border text-sm transition-all ${horasMobil === opcion
                            ? 'border-white/20 bg-white/[0.04] text-white/90'
                            : 'border-white/[0.10] bg-white/[0.01] text-white/55 hover:bg-white/[0.02]'
                          }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>

                  {horasMobil && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 mt-6 border border-white/[0.12] rounded-xl p-6 bg-white/[0.02]">
                      <h4 className="text-white/80 font-serif text-lg mb-2">
                        {horasMobil === '1 – 2h' && 'Buen control'}
                        {horasMobil === '2 – 3h' && 'Zona de riesgo'}
                        {horasMobil === '4h o más' && 'El móvil te está ganando'}
                      </h4>
                      <p className="text-white/55 text-sm leading-relaxed">
                        {horasMobil === '1 – 2h' && 'Estás por debajo de la media. Con pequeños ajustes puedes optimizar ese tiempo restante y convertirlo en energía real.'}
                        {horasMobil === '2 – 3h' && 'Ese tiempo equivale a casi un mes entero al año. No es poco. Un par de cambios de hábito pueden recuperar horas valiosas cada semana.'}
                        {horasMobil === '4h o más' && 'Más de 4 horas diarias es el principal ladrón de energía y foco. La buena noticia: es el hábito más fácil de cambiar con las herramientas correctas.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pregunta 2 */}
                <div className="space-y-6">
                  <h3 className="text-white/70 text-sm font-medium">¿Qué app te consume más tiempo?</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['Instagram', 'TikTok', 'X (Twitter)'].map((opcion) => (
                      <button
                        key={opcion}
                        onClick={() => setAppConsumo(prev => prev === opcion ? null : opcion)}
                        className={`py-4 rounded-xl border text-sm transition-all ${appConsumo === opcion
                            ? 'border-white/20 bg-white/[0.04] text-white/90'
                            : 'border-white/[0.10] bg-white/[0.01] text-white/55 hover:bg-white/[0.02]'
                          }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>

                  {appConsumo && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 mt-6 border border-white/[0.12] rounded-xl p-8 bg-white/[0.02] space-y-8">
                      <div>
                        <h4 className="text-white/80 font-serif text-xl mb-2">Configura One Sec como yo lo tengo</h4>
                        <p className="text-white/55 text-sm">One Sec añade una pausa de respiración antes de abrir apps adictivas. Así de simple, así de efectivo.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Paso 1 */}
                        <div className="space-y-3">
                          <div className="font-mono text-white/20 text-xs">01</div>
                          <div className="aspect-video bg-white/[0.03] border border-white/[0.12] rounded-xl flex items-center justify-center">
                            <span className="font-mono text-white/15 text-[9px]">captura · próximamente</span>
                          </div>
                          <h5 className="text-white/70 text-sm font-medium">Descarga One Sec</h5>
                          <p className="text-white/55 text-xs leading-relaxed">Disponible gratis en App Store y Google Play. Busca 'One Sec' o usa el enlace directo.</p>
                        </div>
                        {/* Paso 2 */}
                        <div className="space-y-3">
                          <div className="font-mono text-white/20 text-xs">02</div>
                          <div className="aspect-video bg-white/[0.03] border border-white/[0.12] rounded-xl flex items-center justify-center">
                            <span className="font-mono text-white/15 text-[9px]">captura · próximamente</span>
                          </div>
                          <h5 className="text-white/70 text-sm font-medium">Añade tus apps</h5>
                          <p className="text-white/55 text-xs leading-relaxed">Abre One Sec → Apps → selecciona {appConsumo}. El proceso es el mismo para las tres.</p>
                        </div>
                        {/* Paso 3 */}
                        <div className="space-y-3">
                          <div className="font-mono text-white/20 text-xs">03</div>
                          <div className="aspect-video bg-white/[0.03] border border-white/[0.12] rounded-xl flex items-center justify-center">
                            <span className="font-mono text-white/15 text-[9px]">captura · próximamente</span>
                          </div>
                          <h5 className="text-white/70 text-sm font-medium">Configura la pausa</h5>
                          <p className="text-white/55 text-xs leading-relaxed">Yo lo tengo en 5 segundos de respiración. Es suficiente para romper el impulso automático.</p>
                        </div>
                        {/* Paso 4 */}
                        <div className="space-y-3">
                          <div className="font-mono text-white/20 text-xs">04</div>
                          <div className="aspect-video bg-white/[0.03] border border-white/[0.12] rounded-xl flex items-center justify-center">
                            <span className="font-mono text-white/15 text-[9px]">captura · próximamente</span>
                          </div>
                          <h5 className="text-white/70 text-sm font-medium">Activa los límites</h5>
                          <p className="text-white/55 text-xs leading-relaxed">En ajustes del sistema, da permisos de Screen Time a One Sec. Sin esto no funciona.</p>
                        </div>
                      </div>

                      <a href="https://one-sec.app" target="_blank" rel="noreferrer" className="inline-block border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 px-5 py-2.5 rounded text-xs font-mono transition-colors">
                        Descargar One Sec →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: ARTÍCULOS */}
            <section id="articulos" className="max-w-4xl mx-auto px-8 md:px-16 py-32 border-t border-white/[0.10]">
              <div className="font-mono uppercase text-[10px] tracking-widest text-white/45 mb-6">artículos</div>
              <h2 className="font-serif text-3xl text-white mb-4">Reflexiones sobre productividad</h2>
              <p className="text-white/35 text-sm mb-12">
                Comparto reflexiones y experiencias sobre productividad, energía y desarrollo personal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-white/[0.12] rounded-xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="font-mono text-[9px] text-white/25 uppercase tracking-wider mb-3">próximamente</div>
                  <h3 className="text-white/50 text-sm font-medium mb-2">Por qué dormir 8 horas lo cambia todo</h3>
                  <p className="text-white/25 text-xs leading-relaxed">Artículo en preparación.</p>
                </div>
                <div className="border border-white/[0.12] rounded-xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="font-mono text-[9px] text-white/25 uppercase tracking-wider mb-3">próximamente</div>
                  <h3 className="text-white/50 text-sm font-medium mb-2">Cómo dejé de mirar el móvil al despertar</h3>
                  <p className="text-white/25 text-xs leading-relaxed">Artículo en preparación.</p>
                </div>
                <div className="border border-white/[0.12] rounded-xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="font-mono text-[9px] text-white/25 uppercase tracking-wider mb-3">próximamente</div>
                  <h3 className="text-white/50 text-sm font-medium mb-2">El hábito más pequeño con mayor impacto</h3>
                  <p className="text-white/25 text-xs leading-relaxed">Artículo en preparación.</p>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="py-16 border-t border-white/[0.04] text-center">
              <div className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
                pbfocus © 2026 · based on my purpose
              </div>
            </footer>
          </div>
        )}

        {/* REGISTER */}
        {step === 'register' && (
          <div className="max-w-md w-full space-y-8 bg-[#0d0d0d] p-8 border border-white/[0.07] rounded-xl relative">
            <button
              onClick={() => setStep('landing')}
              className="absolute top-4 right-4 text-white/30 hover:text-white/80 transition-colors text-lg font-light"
            >
              ✕
            </button>
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
