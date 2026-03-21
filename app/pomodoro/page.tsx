'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'focus' | 'short' | 'long'

const MODES = {
  focus: { label: 'Foco', minutes: 25 },
  short: { label: 'Descanso corto', minutes: 5 },
  long: { label: 'Descanso largo', minutes: 15 },
}

export default function Pomodoro() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('focus')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [session, setSession] = useState(1)
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean }[]>([])
  const [newTask, setNewTask] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSeconds(MODES[mode].minutes * 60)
    setRunning(false)
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') setSession(s => s + 1)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
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
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8] flex flex-col font-sans">

      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[rgba(8,8,8,0.9)] backdrop-blur border-b border-white/[0.05] flex items-center justify-between">
        <button onClick={() => router.push('/')} className="font-mono text-white/50 text-sm tracking-wider hover:text-white transition-colors">
          ← pbfocus
        </button>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">pomodoro</span>
        <span className="font-mono text-[9px] text-white/25">sesión {session}</span>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center pt-16 px-6 pb-12 gap-10">

        {/* Timer */}
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">

          {/* Modos */}
          <div className="flex gap-2">
            {(Object.keys(MODES) as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border transition-all ${
                  mode === m
                    ? 'border-white/30 text-white/80 bg-white/[0.06]'
                    : 'border-white/[0.08] text-white/30 hover:border-white/20'
                }`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Círculo de progreso */}
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/>
              <circle
                cx="50" cy="50" r="46" fill="none"
                stroke="rgba(255,255,255,0.7)" strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-5xl text-white tracking-tight">{mins}:{secs}</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">{MODES[mode].label}</span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-3">
            <button
              onClick={() => setRunning(r => !r)}
              className="bg-white text-[#080808] font-medium px-10 py-3 text-xs tracking-wide rounded-md hover:bg-white/90 transition-colors"
            >
              {running ? 'Pausar' : seconds === MODES[mode].minutes * 60 ? 'Comenzar' : 'Continuar'}
            </button>
            <button
              onClick={reset}
              className="border border-white/[0.10] text-white/40 px-4 py-3 text-xs rounded-md hover:border-white/20 hover:text-white/60 transition-colors font-mono"
            >
              ↺
            </button>
          </div>

          <div className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
            {mode === 'focus' ? '¡Hora de concentrarse!' : mode === 'short' ? 'Respira, estira, hidratate.' : 'Buen trabajo. Descansa bien.'}
          </div>
        </div>

        {/* Tareas */}
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Tareas</span>
            {tasks.length > 0 && (
              <span className="font-mono text-[9px] text-white/20">{tasks.filter(t => t.done).length}/{tasks.length}</span>
            )}
          </div>

          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 border border-white/[0.08] rounded-xl bg-white/[0.01] group"
              >
                <button onClick={() => toggleTask(task.id)} className="shrink-0">
                  <div className={`w-4 h-4 rounded border transition-all ${
                    task.done ? 'bg-white/80 border-white/80' : 'border-white/20 hover:border-white/40'
                  }`}>
                    {task.done && <span className="flex items-center justify-center text-[#080808] text-[10px] font-bold">✓</span>}
                  </div>
                </button>
                <span className={`flex-1 text-sm transition-all ${task.done ? 'text-white/25 line-through' : 'text-white/70'}`}>
                  {task.text}
                </span>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-white/15 hover:text-white/40 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                >
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
              className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/15 transition-colors text-sm"
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="bg-white/[0.06] border border-white/[0.08] text-white/50 px-4 py-2.5 rounded-xl text-sm hover:bg-white/[0.10] transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
