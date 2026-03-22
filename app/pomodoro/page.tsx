'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'focus' | 'short' | 'long'

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

export default function Pomodoro() {
  const router = useRouter()
  const [customFocus, setCustomFocus] = useState(50)
  const [customShort, setCustomShort] = useState(5)
  const [customLong, setCustomLong] = useState(15)
  const [editing, setEditing] = useState(false)

  const MODES = {
    focus: { label: 'Foco', minutes: customFocus },
    short: { label: 'Descanso corto', minutes: customShort },
    long: { label: 'Descanso largo', minutes: customLong },
  }

  const [mode, setMode] = useState<Mode>('focus')
  const [seconds, setSeconds] = useState(50 * 60)
  const [running, setRunning] = useState(false)
  const [session, setSession] = useState(1)
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean }[]>([])
  const [newTask, setNewTask] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRunning(false)
    const mins = mode === 'focus' ? customFocus : mode === 'short' ? customShort : customLong
    setSeconds(mins * 60)
  }, [mode, customFocus, customShort, customLong])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setRunning(false)
          if (mode === 'focus') setSession(s => s + 1)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, mode])

  const reset = () => {
    setRunning(false)
    setSeconds(MODES[mode].minutes * 60)
  }

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), done: false }])
    setNewTask('')
  }

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const removeTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const progress = 1 - seconds / (MODES[mode].minutes * 60)

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex flex-col font-sans relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleCanvas />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center pt-16 px-6 pb-12 gap-10 z-10">

        {/* Timer */}
        <div className="border border-white/[0.18] rounded-2xl p-8 bg-white/[0.02] flex flex-col items-center gap-8 w-full max-w-sm">

          {/* Modos */}
          <div className="flex gap-2">
            {(Object.keys(MODES) as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border transition-all ${mode === m
                  ? 'border-white/30 text-white/90 bg-white/[0.06]'
                  : 'border-white/[0.15] text-white/50 hover:border-white/30'
                  }`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Círculo de progreso */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
              <circle
                cx="50" cy="50" r="46" fill="none"
                stroke="rgba(255,255,255,0.9)" strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-6xl text-white tracking-tight">{mins}:{secs}</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">{MODES[mode].label}</span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setRunning(r => !r)}
              className="bg-white text-[#080808] font-medium px-14 py-4 text-sm tracking-wide rounded-md hover:bg-white/90 transition-colors"
            >
              {running ? 'Pausar' : seconds === MODES[mode].minutes * 60 ? 'Comenzar' : 'Continuar'}
            </button>
            <button
              onClick={reset}
              className="border border-white/[0.10] text-white/40 px-4 py-3 text-xs rounded-md hover:border-white/20 hover:text-white/60 transition-colors font-mono"
            >
              ↺
            </button>
            <button
              onClick={() => setEditing(e => !e)}
              className="border border-white/[0.10] text-white/40 px-4 py-3 text-xs rounded-md hover:border-white/20 hover:text-white/60 transition-colors font-mono"
            >
              ⚙
            </button>
          </div>

          {editing && (
            <div className="w-full max-w-sm border border-white/[0.10] rounded-xl p-5 bg-white/[0.02] space-y-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">Personalizar tiempos</div>
              {[
                { label: 'Foco', value: customFocus, set: setCustomFocus },
                { label: 'Descanso corto', value: customShort, set: setCustomShort },
                { label: 'Descanso largo', value: customLong, set: setCustomLong },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-white/50 text-xs font-mono">{label}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { set(v => Math.max(1, v - 1)); setSeconds(MODES[mode].minutes * 60) }} className="w-6 h-6 border border-white/[0.10] rounded text-white/40 text-xs hover:border-white/25 transition-colors">−</button>
                    <span className="font-mono text-white/70 text-sm w-8 text-center">{value}</span>
                    <button onClick={() => { set(v => Math.min(90, v + 1)); setSeconds(MODES[mode].minutes * 60) }} className="w-6 h-6 border border-white/[0.10] rounded text-white/40 text-xs hover:border-white/25 transition-colors">+</button>
                    <span className="font-mono text-white/25 text-[9px]">min</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="font-mono text-[9px] text-white/60 uppercase tracking-widest text-center">
            {mode === 'focus' ? '¡Hora de concentrarse!' : mode === 'short' ? 'Respira, estira, hidratate.' : 'Buen trabajo. Descansa bien.'}
          </div>
        </div>

        {/* Tareas */}
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/60">Tareas</span>
            {tasks.length > 0 && (
              <span className="font-mono text-[9px] text-white/40">{tasks.filter(t => t.done).length}/{tasks.length}</span>
            )}
          </div>

          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3 border border-white/[0.08] rounded-xl bg-white/[0.01] group transition-all">
                <button onClick={() => toggleTask(task.id)} className="shrink-0">
                  <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${task.done ? 'bg-transparent border-green-400/60' : 'border-white/20 hover:border-white/40'
                    }`}>
                    {task.done && <span className="text-green-400 text-[10px]">✓</span>}
                  </div>
                </button>
                <span className={`flex-1 text-sm transition-all ${task.done ? 'text-white/25 line-through decoration-white/30' : 'text-white/80'
                  }`}>
                  {task.text}
                </span>
                <button onClick={() => removeTask(task.id)} className="text-white/15 hover:text-white/40 transition-colors opacity-0 group-hover:opacity-100 text-xs">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Añadir tarea..."
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask() }}
              className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.14] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors text-sm"
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="bg-white/[0.06] border border-white/[0.14] text-white/50 px-4 py-2.5 rounded-xl text-sm hover:bg-white/[0.10] transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
