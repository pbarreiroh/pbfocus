'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex flex-col">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[rgba(8,8,8,0.85)] backdrop-blur border-b border-white/[0.04] flex items-center justify-between">
        <span className="font-mono text-white/60 text-sm tracking-wider">pbfocus</span>
        {step === 'landing' && (
          <button
            onClick={() => setStep('register')}
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            Empezar →
          </button>
        )}
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 pt-20 pb-12">

        {/* LANDING */}
        {step === 'landing' && (
          <div className="max-w-2xl w-full space-y-12">
            <div className="space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                pbfocus — planificador personal
              </div>
              <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-white leading-none">
                Tu día,<br />
                <span className="text-white/35 italic">bien construido.</span>
              </h1>
              <p className="text-white/45 text-sm md:text-base leading-relaxed max-w-lg">
                Responde unas preguntas sobre tu situación actual y recibe un planning semanal personalizado. Hábitos, estudio, deporte, descanso — todo en su lugar.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setStep('register')}
                className="bg-white text-[#080808] font-medium px-6 py-3 text-xs tracking-wide rounded-md hover:bg-white/90 transition-colors"
              >
                Empezar ahora
              </button>
              <div className="flex gap-6 text-[10px] text-white/25 font-mono">
                <span>✓ Gratis</span>
                <span>✓ Sin anuncios</span>
                <span>✓ Tu información es tuya</span>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {step === 'register' && (
          <div className="max-w-md w-full space-y-8">
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">Paso 1 de 3</div>
              <h2 className="text-2xl font-serif text-white">¿Cómo te llamas?</h2>
              <p className="text-white/40 text-sm">Solo necesitamos tu nombre y email para guardar tu planning.</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase tracking-wider">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#080808] font-medium py-3 text-xs tracking-wide rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
              >
                {loading ? 'Guardando...' : 'Continuar →'}
              </button>
            </form>
          </div>
        )}

        {/* ONBOARDING */}
        {step === 'onboarding' && (
          <div className="max-w-md w-full space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                  Pregunta {currentQ + 1} de {QUESTIONS.length}
                </div>
                <div className="font-mono text-[10px] text-white/20">
                  {Math.round(progress)}%
                </div>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-px">
                <div
                  className="bg-white/40 h-px rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <h2 className="text-xl font-serif text-white pt-2">
                {QUESTIONS[currentQ].label}
              </h2>
            </div>
            <div className="space-y-4">
              <textarea
                value={answers[QUESTIONS[currentQ].id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={4}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm resize-none"
              />
              <button
                onClick={handleNext}
                disabled={!answers[QUESTIONS[currentQ].id] || loading}
                className="w-full bg-white text-[#080808] font-medium py-3 text-xs tracking-wide rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
              >
                {loading ? 'Guardando...' : currentQ < QUESTIONS.length - 1 ? 'Siguiente →' : 'Ver mi planning →'}
              </button>
              {currentQ > 0 && (
                <button
                  onClick={() => setCurrentQ(prev => prev - 1)}
                  className="w-full text-white/30 text-xs hover:text-white/60 transition-colors py-1"
                >
                  ← Anterior
                </button>
              )}
            </div>
          </div>
        )}

        {/* APP — placeholder Fase 2 */}
        {step === 'app' && (
          <div className="max-w-2xl w-full space-y-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto">
                <span className="text-white/60 text-lg">✓</span>
              </div>
              <h2 className="text-2xl font-serif text-white">Todo listo, {nombre}.</h2>
              <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                Tus respuestas han sido guardadas. En la próxima fase la IA generará tu planning personalizado aquí.
              </p>
            </div>
            <div className="p-6 border border-white/[0.06] rounded-2xl bg-white/[0.02] text-left space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">Próximamente</div>
              <p className="text-white/50 text-sm">Planning semanal · Chatbot · Calendario</p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
