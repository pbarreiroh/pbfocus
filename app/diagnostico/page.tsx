'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  {
    id: 'q1',
    question: '¿Qué aplicación te roba más tiempo sin darte cuenta?',
    options: [
      { label: 'Instagram', micro: 'Instagram está diseñado para que no puedas parar. No es falta de voluntad, es ingeniería. La solución no es borrarlo, es ponerle fricción.', panel: { title: 'Configura One Sec para Instagram', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona Instagram', 'Configura 5 segundos de pausa de respiración', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } } },
      { label: 'TikTok', micro: 'TikTok es el más agresivo. El scroll infinito está optimizado para engancharte en menos de tres segundos. Necesitas un sistema que te haga parar antes de entrar.', panel: { title: 'Configura One Sec para TikTok', steps: ['Descarga One Sec gratis en App Store o Google Play', 'Abre One Sec → Apps → selecciona TikTok', 'Configura 5 segundos de pausa — suficiente para romper el impulso', 'En Ajustes del sistema da permisos de Screen Time a One Sec'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } } },
      { label: 'YouTube', micro: 'YouTube tiene un problema distinto: empiezas con intención y acabas dos horas después sin saber cómo. La clave es separar el uso con propósito del uso automático.', panel: { title: 'Elimina las recomendaciones de YouTube', steps: ['Instala la extensión Unhook en Chrome o Firefox — es gratis', 'Desactiva el feed de inicio, los vídeos relacionados y los shorts', 'Activa el modo restringido en Ajustes de YouTube', 'Usa YouTube solo con búsqueda directa, nunca desde el inicio'], cta: { text: 'Instalar Unhook →', href: 'https://unhook.app' } } },
      { label: 'X (Twitter)', micro: 'Twitter engancha por el debate y la actualidad constante. Siempre hay algo nuevo, y eso hace que nunca sea buen momento para salir.', panel: { title: 'Configura One Sec para X + usa listas', steps: ['Descarga One Sec y añade X (Twitter) con 5s de pausa', 'Crea una lista en Twitter solo con las cuentas que realmente te importan', 'Usa esa lista como punto de entrada en vez del timeline general', 'Desactiva todas las notificaciones excepto menciones directas'], cta: { text: 'Descargar One Sec →', href: 'https://one-sec.app' } } },
      { label: 'WhatsApp', micro: 'WhatsApp es el más difícil porque tiene componente social. Revisar el móvil cada diez minutos no es estar disponible, es estar distraído constantemente.', panel: { title: 'Revisa WhatsApp por bloques, no en tiempo real', steps: ['Desactiva todas las notificaciones de grupos', 'Mantén solo las notificaciones de chats individuales importantes', 'Define dos momentos fijos al día para revisar: mediodía y tarde', 'Activa No molestar en el sistema durante tus bloques de trabajo'] } },
    ]
  },
  {
    id: 'q2',
    question: '¿Cuál es el mayor obstáculo al empezar a trabajar o estudiar?',
    options: [
      { label: 'No sé por dónde empezar', micro: 'Esa parálisis tiene nombre: exceso de opciones. Cuando todo parece importante, el cerebro se bloquea. La solución es reducir: una sola tarea, la más importante, antes de abrir nada más.', panel: null },
      { label: 'Me distraigo con el móvil', micro: 'El móvil cerca es una distracción aunque no lo toques. No se trata de tener fuerza de voluntad, se trata de no depender de ella.', panel: { title: 'Tres ajustes para el móvil', steps: ['Pon el móvil boca abajo fuera de tu campo visual — no en el bolsillo', 'Activa el modo No molestar antes de empezar cualquier bloque de trabajo', 'Desactiva las notificaciones de redes sociales de forma permanente', 'Si usas el móvil para música, ponlo en modo avión'] } },
      { label: 'Me siento cansado / sin ganas', micro: 'Esperar a tener ganas es la trampa más común. La motivación no aparece antes de empezar, aparece después. Dos minutos. Solo eso. Empieza durante dos minutos y decide luego si paras.', panel: null },
    ]
  },
  {
    id: 'q3',
    question: '¿Cómo decides qué es lo más importante que tienes que hacer hoy?',
    options: [
      { label: 'Empiezo con lo que más me apetece', micro: 'Casi siempre lo que más apetece es lo menos importante. Acabas el día con sensación de haber hecho mucho sin haber avanzado en lo que realmente importa.', panel: null },
      { label: 'No le doy importancia, voy haciendo', micro: 'Sin criterio, el día lo decide el azar. No tienes que planificar cada hora, pero sí saber cada mañana cuál es la única cosa que, si la haces, el día habrá valido la pena.', panel: null },
      { label: 'Anoto todo y priorizo', micro: 'Ese hábito ya te pone por delante de la mayoría. El siguiente nivel es revisar si lo que priorizas de verdad avanza tus objetivos o solo te mantiene ocupado.', panel: null },
    ]
  },
  {
    id: 'q4',
    question: '¿Cuánto tiempo pasa desde que decides ponerte a trabajar hasta que realmente lo haces?',
    options: [
      { label: 'Me pongo casi enseguida', micro: 'Eso es más valioso de lo que parece. La fricción de inicio es uno de los mayores ladrones de tiempo y tú ya la tienes resuelta. Sigue así y afina en qué dedicas ese arranque.', panel: null },
      { label: 'Entre 15 y 30 minutos', micro: 'Ese margen tiene solución concreta: un ritual de inicio. Puede ser tan simple como abrir el documento, poner un temporizador de 25 minutos y apagar el wifi.', panel: { title: 'Crea tu ritual de inicio con Pomodoro', steps: ['Decide la tarea antes de sentarte — no cuando ya estás delante', 'Abre el documento o herramienta sin mirar el móvil ni el email', 'Pon un temporizador de 25 minutos (usa el Pomodoro de pbfocus)', 'Apaga el wifi si no lo necesitas para la tarea'] } },
      { label: 'Más de una hora, o no me pongo', micro: 'Cuanto más lo piensas, más grande se vuelve. El truco es no decidir si te pones: simplemente abres lo que toca y empiezas por cualquier parte, aunque sea mal.', panel: { title: 'El método de los dos minutos', steps: ['Reduce la tarea a su versión más pequeña posible', 'Comprométete solo a hacerla durante dos minutos — luego puedes parar', 'El 90% de las veces seguirás. El inicio es el único obstáculo real', 'Prepara el entorno la noche anterior: documento abierto, herramienta lista'] } },
    ]
  },
  {
    id: 'q5',
    question: '¿Cómo sueles terminar el día?',
    options: [
      { label: 'Habiendo hecho lo que tocaba', micro: 'Ese es el objetivo. La siguiente pregunta es si lo que hacías era lo que realmente tenías que hacer, o solo lo urgente.', panel: null },
      { label: 'Con sensación de haber perdido el tiempo', micro: 'Esa sensación es información, no un juicio. Con una revisión de cinco minutos al final del día esa brecha se reduce rápido.', panel: { title: 'Revisión diaria de 5 minutos', steps: ['¿Qué hice hoy que avanzó mis objetivos?', '¿Qué no hice y por qué? — sin juzgar, solo observar', '¿Qué hago mañana primero? — escríbelo antes de cerrar el ordenador', 'Hazlo cada día a la misma hora, mejor al final de la jornada'] } },
      { label: 'Sin saber bien qué hice', micro: 'Si el día se va sin que recuerdes cómo, el problema es la falta de intención al empezar. Con definir dos o tres cosas que tienen que pasar, ya cambia todo.', panel: { title: 'Planificación diaria en 5 minutos', steps: ['Cada mañana, antes de abrir el móvil, escribe 3 tareas máximo', 'Ordénalas: la más importante primero, siempre', 'Si acabas las 3, el día fue exitoso — todo lo demás es bonus', 'Usa papel, Notion o las notas del móvil — lo que uses siempre'] } },
    ]
  },
]

type PanelData = { title: string; steps: string[]; cta?: { text: string; href: string } }

export default function Diagnostico() {
  const router = useRouter()
  const [openQ, setOpenQ] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [panel, setPanel] = useState<PanelData | null>(null)

  const toggleQ = (id: string) => {
    setOpenQ(prev => prev === id ? null : id)
  }

  const selectOpt = (qid: string, opt: { label: string; micro: string; panel: PanelData | null }) => {
    setAnswers(prev => ({ ...prev, [qid]: opt.label }))
    setPanel({ title: opt.label, steps: [], ...opt.panel, micro: opt.micro } as any)
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] font-sans">
      <main className="max-w-5xl mx-auto px-8 md:px-16 py-10 space-y-8">

        <div className="space-y-3 pt-4">
          <div className="font-mono text-[9px] uppercase tracking-widest text-white/28">diagnóstico rápido</div>
          <h1 style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'clamp(32px,4.5vw,52px)', color:'white', lineHeight:1.05}}>
            Tu primer paso empieza aquí.
          </h1>
          <p className="text-white/44 text-base leading-relaxed max-w-xl">
            No vengo a darte la chapa. Responde estas preguntas, recibe una solución directa y ponla en práctica hoy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col">
              <button
                onClick={() => toggleQ(q.id)}
                className={`text-left p-6 border rounded-xl transition-all ${
                  openQ === q.id
                    ? 'border-white/[0.14] bg-white/[0.03] rounded-b-none'
                    : 'border-white/[0.08] bg-white/[0.01] hover:border-white/[0.18] hover:bg-white/[0.025]'
                }`}
              >
                <div style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'20px', color:'rgba(255,255,255,0.88)', lineHeight:1.35, marginBottom:'10px'}}>
                  {q.question}
                </div>
                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                  {answers[q.id]
                    ? <span className="text-white/55">✓ {answers[q.id]}</span>
                    : 'toca para responder'
                  }
                </div>
              </button>

              {openQ === q.id && (
                <div className="border border-t-0 border-white/[0.08] rounded-b-xl overflow-hidden">
                  {q.options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => selectOpt(q.id, opt)}
                      className={`w-full text-left px-6 py-5 border-b border-white/[0.05] last:border-0 transition-all text-base ${
                        answers[q.id] === opt.label
                          ? 'bg-white/[0.05] text-white/90'
                          : 'text-white/55 hover:bg-white/[0.025] hover:text-white/78'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => router.push('/chat')}
            className="border border-white/[0.05] rounded-xl p-6 bg-white/[0.005] hover:bg-white/[0.02] transition-all flex items-center justify-center"
          >
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">¿Quieres un plan completo? → IA</span>
          </button>
        </div>

      </main>

      {panel && (
        <div className="fixed inset-0 bg-[#080808] z-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 space-y-8">

            {/* Header con X bien separada */}
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                solución
              </div>
              <button
                onClick={() => setPanel(null)}
                className="border border-white/[0.20] text-white/50 hover:text-white hover:border-white/50 w-10 h-10 rounded-lg flex items-center justify-center font-mono text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Título simple */}
            <h2 style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontStyle:'italic',
              fontSize:'clamp(20px,2.5vw,28px)',
              color:'rgba(255,255,255,0.6)',
              lineHeight:1.2,
              fontWeight:300,
            }}>
              {panel.title}
            </h2>

            {/* Texto intro — grande y llamativo */}
            <p style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontStyle:'italic',
              fontSize:'clamp(22px,3.5vw,40px)',
              color:'white',
              lineHeight:1.25,
              letterSpacing:'-0.3px',
            }}>
              {(panel as any).micro}
            </p>

            {/* Guía detallada — solo si hay pasos */}
            {panel.steps && panel.steps.length > 0 && (
              <div className="border border-white/[0.25] rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-6">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  guía paso a paso
                </div>
                <div className="space-y-5">
                  {panel.steps.map((step, i) => (
                    <div key={i} className="flex gap-5">
                      <span className="font-mono text-[10px] text-white/25 shrink-0 pt-1 min-w-[20px]">
                        {String(i+1).padStart(2,'0')}
                      </span>
                      <span className="text-white/65 text-base leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
                {panel.cta && (
                  <a
                    href={panel.cta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block border border-white/[0.25] text-white/60 hover:text-white hover:border-white/50 px-6 py-3 rounded-lg text-xs font-mono transition-colors mt-2"
                  >
                    {panel.cta.text}
                  </a>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
