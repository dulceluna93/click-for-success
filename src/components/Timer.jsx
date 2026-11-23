import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { playSound } from '../sounds'

const TIME_FIELDS = [
  { label: '小时', unit: 3600, max: 99 },
  { label: '分钟', unit: 60, max: 59 },
  { label: '秒', unit: 1, max: 59 }
]

const STOPPED_CLOCK = { valueMs: 0, startedAt: null }

function readClock(clock, mode, now) {
  if (clock.startedAt === null) return clock.valueMs
  const elapsed = Math.max(0, now - clock.startedAt)
  return mode === 'up' ? clock.valueMs + elapsed : Math.max(0, clock.valueMs - elapsed)
}

function TimeField({ label, value, onEdit }) {
  const [draft, setDraft] = useState(null)
  const display = String(value).padStart(2, '0')

  return (
    <input
      className="timer-input"
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={draft ?? display}
      onFocus={event => event.currentTarget.select()}
      onChange={event => {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 2)
        setDraft(digits)
        onEdit(Number(digits))
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
    />
  )
}

const Timer = forwardRef(function Timer({ mode, status, onStatusChange, nextPomodoroSeconds }, ref) {
  const [manualClock, setManualClock] = useState(STOPPED_CLOCK)
  const [pomodoroClock, setPomodoroClock] = useState(STOPPED_CLOCK)
  const [now, setNow] = useState(Date.now)
  const isPomodoro = mode === 'pomodoro'
  const clock = isPomodoro ? pomodoroClock : manualClock
  const setClock = isPomodoro ? setPomodoroClock : setManualClock
  const timeMs = readClock(clock, mode, now)

  useEffect(() => {
    if (status !== 'running') return undefined

    const refreshClock = () => setNow(Date.now())
    const interval = setInterval(refreshClock, 200)
    document.addEventListener('visibilitychange', refreshClock)
    window.addEventListener('focus', refreshClock)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshClock)
      window.removeEventListener('focus', refreshClock)
    }
  }, [status])

  useEffect(() => {
    if (status !== 'running' || mode === 'up' || timeMs !== 0) return
    setClock(STOPPED_CLOCK)
    onStatusChange('idle')
    playSound('timeover')
  }, [mode, onStatusChange, setClock, status, timeMs])

  useImperativeHandle(ref, () => {
    function startClock(valueMs) {
      const startedAt = Date.now()
      setNow(startedAt)
      setClock({ valueMs, startedAt })
      onStatusChange('running')
    }

    function adjustManualClock(deltaMs) {
      if (isPomodoro) return
      const changedAt = Date.now()
      setNow(changedAt)
      setManualClock(current => ({
        valueMs: Math.max(0, readClock(current, mode, changedAt) + deltaMs),
        startedAt: status === 'running' ? changedAt : null
      }))
    }

    return {
      addTenMinutes: () => adjustManualClock(600000),
      subOneMinute: () => adjustManualClock(-60000),
      startPomodoro: seconds => startClock(seconds * 1000),
      start: () => {
        if (mode === 'down' && clock.valueMs <= 0) {
          alert('请先设置时间再开始倒计时')
          return
        }
        startClock(clock.valueMs)
      },
      pause: () => {
        const valueMs = readClock(clock, mode, Date.now())
        setClock({ valueMs, startedAt: null })
        if (mode !== 'up' && valueMs === 0) {
          onStatusChange('idle')
          playSound('timeover')
        } else {
          onStatusChange('paused')
        }
      },
      resume: () => startClock(clock.valueMs),
      stop: () => {
        if (clock.startedAt !== null) {
          setClock({ valueMs: readClock(clock, mode, Date.now()), startedAt: null })
        }
        onStatusChange('idle')
      },
      reset: () => {
        onStatusChange('idle')
        setClock(STOPPED_CLOCK)
      }
    }
  }, [clock, isPomodoro, mode, onStatusChange, setClock, status])

  const canEdit = status === 'idle' && !isPomodoro
  const displayTime = isPomodoro && status === 'idle'
    ? nextPomodoroSeconds
    : mode === 'up' ? Math.floor(timeMs / 1000) : Math.ceil(timeMs / 1000)
  const fields = TIME_FIELDS.map(({ unit, max }) => {
    const value = Math.floor(displayTime / unit)
    return max === 99 ? value : value % 60
  })

  return (
    <div className="timer">
      <div className="time-display" role="group" aria-label={canEdit ? '设置计时时间' : '当前计时'}>
        {TIME_FIELDS.map(({ label, unit, max }, index) => (
          <React.Fragment key={label}>
            {index > 0 && <span aria-hidden="true">:</span>}
            {!canEdit ? (
              <span>{String(fields[index]).padStart(2, '0')}</span>
            ) : (
              <TimeField
                key={mode}
                label={label}
                value={fields[index]}
                onEdit={value => {
                  const next = displayTime + (Math.min(max, value) - fields[index]) * unit
                  setManualClock({ valueMs: next * 1000, startedAt: null })
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
})

export default Timer
