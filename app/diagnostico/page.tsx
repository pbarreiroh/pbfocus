'use client'

import { useState } from 'react'

type Answer = string | null

const SOLUTIONS: Record<string, Record<string, { title: string; steps: string[]; cta?: { text: string; href: string } }>> = {
  q1: {
    Instagram: { title: 'Configura One Sec para Instagram', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona Instagram', 'Configura 5 segundos de pausa de respiración', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } },
    TikTok: { title: 'Configura One Sec para TikTok', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona TikTok', 'Configura 5 segundos de pausa — suficiente para romper el impulso', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } },
    YouTube: { title: 'Configura One Sec para YouTube', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona YouTube', 'Configura 5 segundos de pausa de respiración', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } },
    'X (Twitter)': { title: 'Configura One Sec para X', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona X (Twitter)', 'Configura 5 segundos de pausa de respiración', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } },
    WhatsApp: { title: 'Reduce el tiempo en WhatsApp', steps: ['Desactiva todas las notificaciones excepto llamadas', 'Establece dos momentos fijos al día para revisar mensajes', 'Usa One Sec para añadir una pausa antes de abrirlo', 'Activa el modo No molestar durante tus bloques de trabajo'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } },
  },
  q2: {
    'No sé por dónde empezar': { title: 'La técnica de los 2 minutos', steps: ['Escribe la tarea más pequeña posible de lo que tienes que hacer', 'Comprométete a hacerla solo durante 2 minutos — luego puedes parar', 'El 90% de las veces seguirás. El inicio es el único obstáculo real', 'Usa el Pomodoro de pbfocus para estructurar el trabajo en bloques'] },
    'Me distraigo con el móvil': { title: 'El móvil fuera de la vista', steps: ['Pon el móvil en otra habitación o en un cajón antes de empezar', 'Activa el modo avión si necesitas el ordenador pero no el móvil', 'Usa One Sec para añadir fricción antes de abrirlo', 'Un móvil visible reduce la capacidad cognitiva incluso si no lo usas'] },
    'Me siento cansado / sin ganas': { title: 'Rutina de activación de 5 minutos', steps: ['Bebe un vaso de agua fría — la deshidratación leve causa fatiga mental', 'Haz 10 sentadillas o 2 minutos de movimiento — activa el sistema nervioso', 'Abre una ventana o sal 2 minutos al exterior si puedes', 'Pon una canción que te active y empieza antes de que termine'] },
  },
  q3: {
    'Empiezo con lo que más me apetece': { title: 'La técnica MIT — Most Important Task', steps: ['Cada mañana identifica UNA sola tarea que si la hicieras haría el día exitoso', 'Hazla primera, antes de mirar el móvil o el email', 'Lo que más apetece suele ser lo menos importante — es una trampa del cerebro', 'Las tareas difíciles se vuelven más fáciles con energía alta (mañana)'] },
    'No le doy importancia': { title: 'La lista de 3 tareas', steps: ['Cada noche escribe 3 tareas máximo para el día siguiente — no más', 'Ordénalas de más a menos importante', 'Si acabas las 3, es un día exitoso — todo lo demás es bonus', 'Esta limitación te fuerza a priorizar en vez de procrastinar con listas largas'] },
    'Empiezo con lo que lleva menos tiempo': { title: 'Eat the Frog — haz lo difícil primero', steps: ['Las tareas rápidas dan sensación de productividad pero no mueven lo importante', 'Identifica tu "rana" — la tarea que llevas posponiendo — y hazla primera', 'Después del primer bloque difícil, el resto del día se siente más ligero', 'Usa el Pomodoro para dedicarle 25 minutos sin interrupciones'] },
  },
  q4: {
    'Qué pereza, luego me pongo': { title: 'La regla de los 5 segundos', steps: ['Cuando sientas el impulso de empezar, cuenta 5-4-3-2-1 y actúa', 'La pereza no desaparece esperando — desaparece empezando', 'Prepara el entorno la noche anterior: libro abierto, documento listo', 'La motivación llega después de empezar, no antes — no la esperes'] },
    'Esto no me va a servir para nada': { title: 'Conecta la tarea con tu objetivo real', steps: ['Escribe: "¿Para qué sirve esto en mi vida en 6 meses?"', 'Si no encuentras respuesta, quizás no debería estar en tu lista', 'Si la encuentras, léela antes de empezar cada vez que tengas este pensamiento', 'El significado no se encuentra — se construye conectando tareas con metas'] },
    'Necesito estar más inspirado': { title: 'La acción crea la inspiración, no al revés', steps: ['La inspiración es un mito — los creadores profesionales trabajan sin ella', 'Empieza aunque sea mal. Un borrador horrible es mejor que nada', 'Crea un ritual de inicio: misma hora, mismo lugar, misma canción', 'Después de 10 minutos de trabajo, el estado mental cambia solo'] },
  },
  q5: {
    'Mirar el móvil (reels/TikTok)': { title: 'Los reels no son descanso real', steps: ['El scroll activa el mismo sistema de recompensa que el trabajo — no descansas', 'Un descanso real desconecta la atención: mira por la ventana, estira, respira', 'Prueba 5 minutos sin pantalla entre pomodoros — notarás la diferencia', 'Usa One Sec para añadir fricción al móvil durante los descansos también'] },
    'Comer algo': { title: 'Snacks inteligentes para mantener la energía', steps: ['Evita azúcar refinado en los descansos — causa pico y bajada de energía', 'Frutos secos, fruta o agua son mejores opciones para el foco', 'Come algo ligero — una comida pesada reduce el rendimiento', 'Hidratación: un vaso de agua en cada descanso mejora la concentración'] },
    'Nada, me quedo mirando al techo': { title: 'Esto está bien — añade respiración consciente', steps: ['Mirar al techo sin hacer nada es una forma válida de descanso activo', 'Añade 4 respiraciones profundas: inhala 4s, mantén 4s, exhala 6s', 'Esto activa el sistema parasimpático y reduce el cortisol', 'Tu cerebro procesa información en estos momentos — no los interrumpas'] },
  },
}

const QUESTIONS = [
  { id: 'q1', question: '¿Qué aplicación te roba más tiempo sin darte cuenta?', options: ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'WhatsApp'] },
  { id: 'q2', question: '¿Cuál es el mayor obstáculo al empezar a trabajar o estudiar?', options: ['No sé por dónde empezar', 'Me distraigo con el móvil', 'Me siento cansado / sin ganas'] },
  { id: 'q3', question: '¿Cómo decides qué es lo más importante que tienes que hacer hoy?', options: ['Empiezo con lo que más me apetece', 'No le doy importancia', 'Empiezo con lo que lleva menos tiempo'] },
  { id: 'q4', question: '¿Qué pensamiento aparece más cuando tienes que ponerte con una tarea?', options: ['Qué pereza, luego me pongo', 'Esto no me va a servir para nada', 'Necesito estar más inspirado'] },
  { id: 'q5', question: '¿Qué haces en tus momentos de descanso breve?', options: ['Mirar el móvil (reels/TikTok)', 'Comer algo', 'Nada, me quedo mirando al techo'] },
]

export default function Diagnostico() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({})

  const select = (qid: string, option: string) => {
    const isDeselect = answers[qid] === option
    setAnswers(prev => ({ ...prev, [qid]: isDeselect ? null : option }))
    if (!isDeselect) setOpenPanels(prev => ({ ...prev, [qid]: true }))
  }

  const togglePanel = (qid: string) => {
    setOpenPanels(prev => ({ ...prev, [qid]: !prev[qid] }))
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] font-sans">
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        <div className="border-b border-white/[0.05] pb-10 mb-4 flex items-end justify-between gap-8">
          <div className="flex-1">
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/28 mb-3">diagnóstico rápido</div>
            <h1 style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'clamp(32px,4vw,46px)', color:'white', lineHeight:1.05, letterSpacing:'-0.5px', marginBottom:'14px'}}>
              Tu primer paso<br />empieza aquí.
            </h1>
            <p className="text-white/42 text-sm leading-relaxed max-w-md">
              No vengo a darte la chapa. Responde estas preguntas, recibe una solución directa y ponla en práctica hoy. Fácil y sencillo, así es como se empieza.
            </p>
          </div>
          <div className="hidden md:flex flex-col gap-2 items-end shrink-0 pb-1">
            <div className="font-mono text-[9px] text-white/25"><span className="text-white/55">5</span> preguntas</div>
            <div className="font-mono text-[9px] text-white/25"><span className="text-white/55">5</span> soluciones</div>
            <div className="font-mono text-[9px] text-white/25"><span className="text-white/55">~3 min</span> para leerlo</div>
          </div>
        </div>

        {QUESTIONS.map((q, qi) => {
          const selected = answers[q.id]
          const solution = selected ? SOLUTIONS[q.id]?.[selected] : null
          const isOpen = openPanels[q.id]
          return (
            <div key={q.id} className="space-y-0">
              <div className="py-7 flex gap-6 items-start">
                <div className="font-mono text-[10px] text-white/20 min-w-[20px] pt-1">{String(qi + 1).padStart(2, '0')}</div>
                <div className="flex-1 space-y-3">
                  <h2 style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'19px', color:'rgba(255,255,255,0.88)', lineHeight:1.3}}>{q.question}</h2>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map(opt => (
                      <button key={opt} onClick={() => select(q.id, opt)}
                        className={`px-4 py-2 rounded-full border font-mono text-[9px] uppercase tracking-wider transition-all ${
                          selected === opt
                            ? 'border-white/40 bg-white/[0.06] text-white/90'
                            : 'border-white/[0.12] text-white/45 hover:border-white/25 hover:text-white/65'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {solution && (
                    <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01] mt-2">
                      <button onClick={() => togglePanel(q.id)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
                        <span style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'15px', color:'rgba(255,255,255,0.75)'}}>{solution.title}</span>
                        <span className="font-mono text-white/25 text-xs ml-4 shrink-0">{isOpen ? '↑' : '↓'}</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 border-t border-white/[0.05]">
                          <div className="space-y-2.5 pt-4">
                            {solution.steps.map((step, i) => (
                              <div key={i} className="flex gap-3">
                                <span className="font-mono text-[8px] text-white/22 shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                <span className="text-white/52 text-sm leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>
                          {solution.cta && (
                            <a href={solution.cta.href} target="_blank" rel="noreferrer"
                              className="inline-block border border-white/[0.12] text-white/45 hover:text-white hover:border-white/25 px-4 py-2 rounded text-xs font-mono transition-colors mt-4">
                              {solution.cta.text}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {qi < QUESTIONS.length - 1 && <div className="border-t border-white/[0.04]" />}
            </div>
          )
        })}

        <div className="pt-4 border-t border-white/[0.06] flex flex-col items-center gap-3 text-center">
          <p className="text-white/30 text-xs font-mono">¿Quieres un plan completo personalizado?</p>
          <a href="/chat" className="bg-white text-[#080808] font-medium px-8 py-3 text-xs tracking-wide rounded-md hover:bg-white/90 transition-colors">
            Crear mi planning con IA →
          </a>
        </div>
      </main>
    </div>
  )
}
