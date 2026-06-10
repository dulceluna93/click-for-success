import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { playSound } from '../sounds'

const Timer = forwardRef(function Timer({ mode, running, onRunningChange, onReset }, ref) {
  const [time, setTime] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return undefined
    }

    intervalRef.current = setInterval(() => {
      setTime(current => {
        if (mode === 'up') return current + 1

        if (current <= 1) {
          onRunningChange(false)
          playSound('timeover')
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [mode, onRunningChange, running])

  useImperativeHandle(ref, () => ({
    addTenMinutes: () => setTime(current => current + 600),
    subOneMinute: () => setTime(current => Math.max(0, current - 60)),
    start: () => {
      if (mode === 'down' && time <= 0) {
        alert('请先增加时间再开始倒计时')
        return false
      }

      onRunningChange(true)
      return true
    },
    reset: () => {
      onRunningChange(false)
      setTime(0)
      onReset?.()
    }
  }), [mode, onReset, onRunningChange, time])

  return (
    <div className="timer">
      <div className="time-display">
        {new Date(time * 1000).toISOString().substr(11, 8)}
      </div>
    </div>
  )
})

export default Timer
