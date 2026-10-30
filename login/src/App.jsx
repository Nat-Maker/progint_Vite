import { useEffect, useRef, useState } from 'react'

const MODES = {
  focus: { label: 'Enfoque', message: 'Una sola cosa a la vez' },
  short: { label: 'Descanso corto', message: 'Estira las piernas y toma agua' },
  long: { label: 'Descanso largo', message: 'Desconéctate un rato' },
}

const DEFAULT_DURATIONS = { focus: 25, short: 5, long: 15 }
const SESSIONS_BEFORE_LONG = 4

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
      ;[0, 0.25, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.2)
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + 0.22)
      })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    /* el navegador bloqueó el audio: no pasa nada */
  }
}

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

/* Dial tipo temporizador de cocina: la cuña muestra el tiempo que falta */
function Dial({ fraction }) {
  const R = 78
  const cx = 100
  const cy = 100
  const angle = Math.min(Math.max(fraction, 0), 1) * 2 * Math.PI

  let wedge = null
  if (fraction >= 0.9999) {
    wedge = <circle className="dial-wedge" cx={cx} cy={cy} r={R} />
  } else if (fraction > 0) {
    const x = cx + R * Math.sin(angle)
    const y = cy - R * Math.cos(angle)
    const large = angle > Math.PI ? 1 : 0
    wedge = (
      <path
        className="dial-wedge"
        d={`M ${cx} ${cy} L ${cx} ${cy - R} A ${R} ${R} 0 ${large} 1 ${x} ${y} Z`}
      />
    )
  }

  return (
    <svg className="dial" viewBox="0 0 200 200" role="img" aria-label="Tiempo restante">
      <circle className="dial-face" cx={cx} cy={cy} r="96" />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0
        const a = (i * 6 * Math.PI) / 180
        const r1 = major ? 85 : 89
        const r2 = 93
        return (
          <line
            key={i}
            className={major ? 'tick tick-major' : 'tick'}
            x1={cx + r1 * Math.sin(a)}
            y1={cy - r1 * Math.cos(a)}
            x2={cx + r2 * Math.sin(a)}
            y2={cy - r2 * Math.cos(a)}
          />
        )
      })}
      {wedge}
      <circle className="dial-cap" cx={cx} cy={cy} r="5" />
    </svg>
  )
}

export default function App() {
  const [durations, setDurations] = useState(DEFAULT_DURATIONS)
  const [mode, setMode] = useState('focus')
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [autoStart, setAutoStart] = useState(false)
  const [task, setTask] = useState('')
  const endRef = useRef(0)

  const total = durations[mode] * 60

  /* Cuenta regresiva basada en la hora real, así no se desfasa si la pestaña queda en segundo plano */
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)))
    }, 250)
    return () => clearInterval(id)
  }, [running])

  /* Cuando llega a cero: avisar y pasar al siguiente modo */
  useEffect(() => {
    if (!running || remaining > 0) return
    setRunning(false)
    beep()

    let next = 'focus'
    if (mode === 'focus') {
      const n = completed + 1
      setCompleted(n)
      next = n % SESSIONS_BEFORE_LONG === 0 ? 'long' : 'short'
    }

    const secs = durations[next] * 60
    setMode(next)
    setRemaining(secs)
    if (autoStart) {
      endRef.current = Date.now() + secs * 1000
      setRunning(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running])

  /* Título de la pestaña con el tiempo */
  useEffect(() => {
    document.title = `${formatTime(remaining)} · ${MODES[mode].label}`
  }, [remaining, mode])

  const start = () => {
    endRef.current = Date.now() + remaining * 1000
    setRunning(true)
  }
  const pause = () => setRunning(false)

  const reset = () => {
    setRunning(false)
    setRemaining(total)
  }

  const changeMode = (m) => {
    setRunning(false)
    setMode(m)
    setRemaining(durations[m] * 60)
  }

  const updateDuration = (key, value) => {
    const minutes = Math.min(120, Math.max(1, Math.floor(Number(value)) || 1))
    setDurations((d) => ({ ...d, [key]: minutes }))
    if (key === mode) {
      setRunning(false)
      setRemaining(minutes * 60)
    }
  }

  const cycleDots = completed % SESSIONS_BEFORE_LONG

  return (
    <div className="app" data-mode={mode}>
      <main className="pomodoro">
        <h1 className="visually-hidden">Temporizador Pomodoro</h1>

        <div className="tabs" role="tablist" aria-label="Modo del temporizador">
          {Object.entries(MODES).map(([key, { label }]) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              className="tab"
              onClick={() => changeMode(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <Dial fraction={remaining / total} />

        <p className="time" aria-live="off">
          {formatTime(remaining)}
        </p>
        <p className="message">{MODES[mode].message}</p>

        <div className="controls">
          {running ? (
            <button className="btn btn-primary" onClick={pause}>
              Pausar
            </button>
          ) : (
            <button className="btn btn-primary" onClick={start}>
              {remaining === total ? 'Iniciar' : 'Continuar'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={reset}>
            Reiniciar
          </button>
        </div>

        <label className="task">
          <span>¿En qué te vas a enfocar?</span>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Escribe tu tarea"
            maxLength={80}
          />
        </label>

        <div className="sessions">
          <div className="dots" aria-hidden="true">
            {Array.from({ length: SESSIONS_BEFORE_LONG }, (_, i) => (
              <span key={i} className={i < cycleDots ? 'dot dot-on' : 'dot'} />
            ))}
          </div>
          <p>
            {completed === 1 ? '1 pomodoro completado' : `${completed} pomodoros completados`}
          </p>
        </div>

        <details className="settings">
          <summary>Ajustes</summary>
          <div className="settings-grid">
            {Object.entries(MODES).map(([key, { label }]) => (
              <label key={key}>
                <span>{label} (min)</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={durations[key]}
                  onChange={(e) => updateDuration(key, e.target.value)}
                />
              </label>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
              />
              <span>Iniciar el siguiente tramo automáticamente</span>
            </label>
          </div>
        </details>
      </main>
    </div>
  )
}