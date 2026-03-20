'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  { id: 'wake', question: '¿A qué hora te levantas y te acuestas normalmente?' },
  { id: 'study', question: '¿Cuántas horas al día dedicas a estudiar o trabajar?' },
  { id: 'sport', question: '¿Haces deporte? ¿Cuántos días a la semana?' },
  { id: 'problem', question: '¿Cuál es tu mayor problema de productividad ahora mismo?' },
  { id: 'habits', question: '¿Qué hábitos quieres construir o mejorar?' },
  { id: 'free', question: '¿Cuánto tiempo libre tienes al día aproximadamente?' },
  { id: 'goal', question: '¿Cuál es tu objetivo principal en los próximos 3 meses?' },
]

const ACTIONS = [
  { id: 'pdf', label: 'Crear rutina PDF', icon: '↓' },
  { id: 'calendar', label: 'Crear calendario', icon: '◫' },
  { id: 'habits', label: 'Analizar hábitos', icon: '◎' },
  { id: 'plan', label: 'Sugerir plan semanal', icon: '▦' },
]

type Message = { role: 'user' | 'assistant', content: string }
type Phase = 'welcome' | 'onboarding' | 'chat'

export default function Chat() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('welcome')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [inputVal, setInputVal] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase, currentQ])

  useEffect(() => {
    if (phase === 'onboarding') inputRef.current?.focus()
  }, [currentQ, phase])

  const startOnboarding = (name: string) => {
    setNombre(name)
    setPhase('onboarding')
  }

  const handleAnswer = async () => {
    if (!inputVal.trim()) return
    const answer = inputVal.trim()
    setInputVal('')
    const q = QUESTIONS[currentQ]
    const newAnswers = { ...answers, [q.id]: answer }
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1)
      return
    }

    // Todas las preguntas respondidas — ir a chat con contexto
    const context = QUESTIONS.map((q, i) => `${q.question}: ${newAnswers[q.id]}`).join('\n')
    const initialMessages: Message[] = [
      { role: 'user', content: `Aquí está mi situación actual:\n${context}\n\nGenera mi planning semanal personalizado.` }
    ]
    setMessages(initialMessages)
    setPhase('chat')
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: initialMessages }),
    })
    const data = await res.json()
    setMessages([...initialMessages, { role: 'assistant', content: data.content }])
    setLoading(false)
  }

  const sendMessage = async (text?: string) => {
    const content = text || inputVal.trim()
    if (!content) return
    setInputVal('')
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })
    const data = await res.json()
    setMessages([...newMessages, { role: 'assistant', content: data.content }])
    setLoading(false)
  }

  const progress = Math.round(((currentQ) / QUESTIONS.length) * 100)

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex flex-col font-sans">
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[rgba(8,8,8,0.9)] backdrop-blur border-b border-white/[0.05] flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="font-mono text-white/50 text-sm tracking-wider hover:text-white transition-colors"
        >
          ← pbfocus
        </button>
        {phase === 'onboarding' && (
          <div className="flex items-center gap-3">
            <div className="w-32 bg-white/[0.06] h-px rounded-full">
              <div className="bg-white/40 h-px rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-[9px] text-white/30">{currentQ}/{QUESTIONS.length}</span>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col pt-16">

        {/* WELCOME */}
        {phase === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 animate-in fade-in duration-700">
            <div className="w-full max-w-xl space-y-10 text-center">
              <div className="space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">pbfocus IA</div>
                <h1 className="font-serif italic text-4xl md:text-5xl text-white">
                  Hola, ¿cómo te llamas?
                </h1>
                <p className="text-white/40 text-sm leading-relaxed">
                  Voy a hacerte unas preguntas para crear tu planning semanal personalizado.
                </p>
              </div>
              <div className="flex gap-3 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Tu nombre..."
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && inputVal.trim()) startOnboarding(inputVal.trim()); setInputVal('') }}
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.10] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors text-sm"
                  autoFocus
                />
                <button
                  onClick={() => { if (inputVal.trim()) { startOnboarding(inputVal.trim()); setInputVal('') }}}
                  className="bg-white text-[#080808] px-5 py-3 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONBOARDING */}
        {phase === 'onboarding' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <div className="w-full max-w-xl space-y-8">
              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                  Pregunta {currentQ + 1} de {QUESTIONS.length}
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-white leading-snug">
                  {QUESTIONS[currentQ].question}
                </h2>
              </div>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tu respuesta..."
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAnswer() }}
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.10] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors text-sm"
                />
                <button
                  onClick={handleAnswer}
                  disabled={!inputVal.trim()}
                  className="bg-white text-[#080808] px-5 py-3 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30"
                >
                  →
                </button>
              </div>
              {currentQ > 0 && (
                <button
                  onClick={() => setCurrentQ(prev => prev - 1)}
                  className="text-white/25 text-xs font-mono hover:text-white/50 transition-colors"
                >
                  ← anterior
                </button>
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {phase === 'chat' && (
          <div className="flex-1 flex flex-col">
            
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 max-w-2xl w-full mx-auto">
              {messages.filter(m => m.role === 'assistant' || (m.role === 'user' && !m.content.startsWith('Aquí está mi situación'))).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mr-3 mt-1 shrink-0">
                      <span className="font-mono text-[8px] text-white/60">pb</span>
                    </div>
                  )}
                  <div className={`max-w-lg text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-white/[0.06] border border-white/[0.10] rounded-2xl rounded-tr-sm px-4 py-3 text-white/80'
                      : 'text-white/75'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mr-3 mt-1 shrink-0">
                    <span className="font-mono text-[8px] text-white/60">pb</span>
                  </div>
                  <div className="flex gap-1 items-center pt-2">
                    <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-6 pb-8 max-w-2xl w-full mx-auto space-y-3">
              
              {/* Acciones rápidas */}
              <div className="flex gap-2 flex-wrap">
                {ACTIONS.map(action => (
                  <button
                    key={action.id}
                    onClick={() => sendMessage(action.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.10] rounded-full text-[10px] font-mono text-white/45 hover:text-white/70 hover:border-white/20 transition-colors"
                  >
                    <span className="text-white/30 text-xs">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-3 items-end">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage() }}
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.10] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-sm"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !inputVal.trim()}
                  className="bg-white text-[#080808] px-5 py-3 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
