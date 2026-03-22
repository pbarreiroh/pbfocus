'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PanelData = {
  title: string
  steps: string[]
  cta?: { text: string; href: string }
} | null

const QUESTIONS = [
  {
    id: 'q1',
    question: '¿Qué aplicación te roba más tiempo sin darte cuenta?',
    options: [
      { label: 'Instagram', micro: 'Instagram está diseñado para que no puedas parar. No es falta de voluntad, es ingeniería. La solución no es borrarlo, es ponerle fricción.', panel: { title: 'Configura One Sec para Instagram', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona Instagram', 'Configura 5 segundos de pausa de respiración', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } } },
      { label: 'TikTok', micro: 'TikTok es el más agresivo de todos. El scroll infinito está optimizado para engancharte en menos de tres segundos. Necesitas un sistema que te haga parar antes de entrar.', panel: { title: 'Configura One Sec para TikTok', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona TikTok', 'Configura 5 segundos de pausa — suficiente para romper el impulso', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } } },
      { label: 'X (Twitter)', micro: 'Twitter engancha por el debate y la actualidad constante. Siempre hay algo nuevo, y eso hace que nunca sea buen momento para salir.', panel: { title: 'Configura One Sec para X + usa listas', steps: ['Descarga One Sec y añade X (Twitter) con 5s de pausa', 'Crea una lista en Twitter solo con las cuentas que realmente te importan', 'Usa esa lista como punto de entrada en vez del timeline general', 'Desactiva todas las notificaciones excepto menciones directas'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } } },
      { label: 'WhatsApp', micro: 'WhatsApp es el más difícil porque tiene componente social. Pero revisar el móvil cada diez minutos no es estar disponible, es estar distraído constantemente.', panel: { title: 'Revisa WhatsApp por bloques, no en tiempo real', steps: ['Ve a Ajustes → Notificaciones → desactiva todas las notificaciones de grupos', 'Mantén solo las notificaciones de chats individuales importantes', 'Define dos momentos fijos al día para revisar: mediodía y tarde', 'Activa "No molestar" en el sistema durante tus bloques de trabajo'], cta: undefined } },
    ]
  },
  {
    id: 'q2',
    question: '¿Cuál es el mayor obstáculo al empezar a trabajar o estudiar?',
    options: [
      { label: 'No sé por dónde empezar', micro: 'Esa parálisis tiene nombre: exceso de opciones. Cuando todo parece importante, el cerebro se bloquea. La solución es reducir: una sola tarea, la más importante, antes de abrir nada más.', panel: null },
      { label: 'Me distraigo con el móvil', micro: 'El móvil cerca es una distracción aunque no lo toques. No se trata de tener fuerza de voluntad, se trata de no depender de ella.', panel: { title: 'Tres ajustes para el móvil', steps: ['Pon el móvil boca abajo fuera de tu campo visual — no en el bolsillo', 'Activa el modo No molestar antes de empezar cualquier bloque de trabajo', 'Desactiva las notificaciones de redes sociales de forma permanente', 'Si usas el móvil para música, ponlo en modo avión'], cta: undefined } },
      { label: 'Me siento cansado / sin ganas', micro: 'Esperar a tener ganas es la trampa más común. La motivación no aparece antes de empezar, aparece después. Dos minutos. Solo eso. Empieza durante dos minutos y decide luego si paras.', panel: null },
    ]
  },
  {
    id: 'q3',
    question: '¿Cómo decides qué es lo más importante que tienes que hacer hoy?',
    options: [
      { label: 'Empiezo con lo que más me apetece', micro: 'Tiene lógica, pero casi siempre lo que más apetece es lo menos importante. Acabas el día con sensación de haber hecho mucho sin haber avanzado en lo que realmente importa.', panel: null },
      { label: 'No le doy importancia, voy haciendo', micro: 'Sin criterio, el día lo decide el azar. No tienes que planificar cada hora, pero sí saber cada mañana cuál es la única cosa que, si la haces, el día habrá valido la pena.', panel: null },
      { label: 'Anoto todo y priorizo', micro: 'Ese hábito ya te pone por delante de la mayoría. El siguiente nivel es revisar si lo que priorizas de verdad avanza tus objetivos o solo te mantiene ocupado.', panel: null },
    ]
  },
  {
    id: 'q4',
    question: '¿Cuánto tiempo pasa desde que decides ponerte a trabajar hasta que realmente lo haces?',
    options: [
      { label: 'Me pongo casi enseguida', micro: 'Eso es más valioso de lo que parece. La fricción de inicio es uno de los mayores ladrones de tiempo y tú ya la tienes resuelta. Sigue así y afina en qué dedicas ese arranque.', panel: null },
      { label: 'Entre 15 y 30 minutos', micro: 'Ese margen tiene solución concreta: un ritual de inicio. Puede ser tan simple como abrir el documento, poner un temporizador de 25 minutos y apagar el wifi.', panel: { title: 'Crea tu ritual de inicio con Pomodoro', steps: ['Decide la tarea antes de sentarte — no cuando ya estás delante', 'Abre el documento o herramienta sin mirar el móvil ni el email', 'Pon un temporizador de 25 minutos (usa el Pomodoro de pbfocus)', 'Apaga el wifi si no lo necesitas para la tarea'], cta: undefined } },
      { label: 'Más de una hora, o no me pongo', micro: 'Cuanto más lo piensas, más grande se vuelve. El truco es no decidir si te pones: simplemente abres lo que toca y empiezas por cualquier parte, aunque sea mal.', panel: { title: 'El método de los dos minutos', steps: ['Reduce la tarea a su versión más pequeña posible', 'Comprométete solo a hacerla durante dos minutos — luego puedes parar', 'El 90% de las veces seguirás. El inicio es el único obstáculo real', 'Prepara el entorno la noche anterior: documento abierto, herramienta lista'], cta: undefined } },
    ]
  },
  {
    id: 'q5',
    question: '¿Cómo sueles terminar el día?',
    options: [
      { label: 'Habiendo hecho lo que tocaba', micro: 'Ese es el objetivo. La siguiente pregunta es si lo que hacías era lo que realmente tenías que hacer, o solo lo urgente.', panel: null },
      { label: 'Con sensación de haber perdido el tiempo', micro: 'Esa sensación es información, no un juicio. Significa que hubo una distancia entre lo que querías hacer y lo que hiciste. Con una revisión de cinco minutos al final del día esa brecha se reduce rápido.', panel: { title: 'Revisión diaria de 5 minutos', steps: ['¿Qué hice hoy que avanzó mis objetivos?', '¿Qué no hice y por qué? — sin juzgar, solo observar', '¿Qué hago mañana primero? — escríbelo antes de cerrar el ordenador', 'Hazlo cada día a la misma hora, mejor al final de la jornada'], cta: undefined } },
      { label: 'Sin saber bien qué hice', micro: 'Si el día se va sin que recuerdes cómo, el problema es la falta de intención al empezar. Con definir cada mañana las dos o tres cosas que tienen que pasar, ya cambia todo.', panel: { title: 'Planificación diaria en 5 minutos', steps: ['Cada mañana, antes de abrir el móvil, escribe 3 tareas máximo', 'Ordénalas: la más importante primero, siempre', 'Si acabas las 3, el día fue exitoso — todo lo demás es bonus', 'Usa papel, Notion o las notas del móvil — lo que uses siempre'], cta: undefined } },
    ]
  },
]

export default function Diagnostico() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [openQ, setOpenQ] = useState<string | null>(null)
  const [panelData, setPanelData] = useState<{title:string; steps:string[]; cta?:{text:string;href:string}} | null>(null)

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] font-sans relative">

      <main className="max-w-5xl mx-auto px-12 md:px-20 py-10 space-y-8">

        {/* Hero */}
        <div className="space-y-3 pt-8">
          <div className="font-mono text-[9px] uppercase tracking-widest text-white/28">diagnóstico rápido</div>
          <h1 style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'clamp(36px,5vw,58px)', color:'white', lineHeight:1.05}}>
            Tu primer paso empieza aquí.
          </h1>
          <p className="text-white/45 text-base leading-relaxed max-w-xl">
            No vengo a darte la chapa. Responde estas preguntas, recibe una solución directa y ponla en práctica hoy. Fácil y sencillo, así es como se empieza.
          </p>
        </div>

        {/* Grid de preguntas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUESTIONS.map((q, qi) => {
            const selected = answers[q.id]
            return (
              <div key={q.id} className="space-y-0">
                <div
                  onClick={() => setOpenQ(openQ === q.id ? null : q.id)}
                  className="border border-white/[0.08] rounded-xl p-6 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.18] transition-all cursor-pointer flex flex-col gap-3 h-full"
                >
                  <div className="font-mono text-[10px] text-white/22">{String(qi + 1).padStart(2, '0')}</div>
                  <div style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'17px', color:'rgba(255,255,255,0.85)', lineHeight:1.3}}>{q.question}</div>
                  {selected ? (
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                      <span className="font-mono text-[9px] text-white/55 uppercase tracking-wider">{selected}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {q.options.slice(0, 3).map(o => (
                        <span key={o.label} className="font-mono text-[8px] text-white/28 border border-white/[0.07] rounded-full px-2 py-0.5">{o.label.length > 18 ? o.label.slice(0, 18) + '…' : o.label}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opciones desplegables inline */}
                {openQ === q.id && (
                  <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01] -mt-1 z-10 relative">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.label
                      return (
                        <div key={opt.label}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAnswers(prev => ({...prev, [q.id]: isSelected ? '' : opt.label})) }}
                            className={`w-full text-left px-5 py-3.5 border-b border-white/[0.05] last:border-0 transition-all text-sm ${isSelected ? 'text-white/90 bg-white/[0.04]' : 'text-white/55 hover:text-white/75 hover:bg-white/[0.02]'}`}
                          >
                            {opt.label}
                          </button>
                          {isSelected && (
                            <div className="px-5 py-4 border-t border-white/[0.05] space-y-3 bg-white/[0.02]">
                              <p className="text-white/52 text-sm leading-relaxed italic font-serif">{opt.micro}</p>
                              {opt.panel && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPanelData(opt.panel) }}
                                  className="font-mono text-[9px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded"
                                >
                                  Ver guía completa →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          
          <div
            onClick={() => router.push('/chat')}
            className="border border-white/[0.05] rounded-xl p-6 bg-white/[0.005] hover:bg-white/[0.02] transition-all cursor-pointer flex items-center justify-center min-h-[120px]"
          >
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">¿Quieres un plan completo? → IA</span>
          </div>
        </div>

      </main>

      {/* Panel overlay - Modal para la guía completa */}
      {panelData && (
        <div className="fixed inset-0 bg-[#080808]/95 backdrop-blur z-50 flex items-start justify-center overflow-y-auto">
          <div className="max-w-xl w-full mx-auto px-6 py-12 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'24px', color:'white', lineHeight:1.2}}>{panelData.title}</div>
              <button onClick={() => setPanelData(null)}
                className="border border-white/[0.12] text-white/40 hover:text-white hover:border-white/30 w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm transition-colors shrink-0">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {panelData.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="font-mono text-[9px] text-white/22 shrink-0 pt-1">{String(i+1).padStart(2,'0')}</span>
                  <span className="text-white/60 text-sm leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
            {panelData.cta && (
              <a href={panelData.cta.href} target="_blank" rel="noreferrer"
                className="inline-block border border-white/[0.15] text-white/55 hover:text-white hover:border-white/30 px-5 py-2.5 rounded text-xs font-mono transition-colors">
                {panelData.cta.text}
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
