import React, { useEffect, useRef, useState } from 'react'
import Paper from './components/Paper'
import Keyboard from './components/Keyboard'
import Timer from './components/Timer'
import { playCelebration } from './celebrations/index'
import { playSound, setSoundVolume } from './sounds'

const STORAGE_KEY = 'cfs_history_v1'
const EMOJI_CONFETTI_KEY = 'cfs_emoji_confetti_v1'
const SOUND_VOLUME_KEY = 'cfs_sound_volume_v1'
const CELEBRATION_KEY = 'cfs_celebration_v1'
const TIMER_MODE_KEY = 'cfs_timer_mode_v1'
const HISTORY_MAX = 50
const DEFAULT_EMOJI_CONFETTI = ['\u2B50', '\u2728']
const DEFAULT_CELEBRATION = 'emojiConfetti'
const DEFAULT_TIMER_MODE = 'up'
const STAGE_WIDTH = 1060
const STAGE_HEIGHT = 760
const STAGE_MARGIN = 8
const MIN_STAGE_SCALE = 0.16
const MIN_WINDOW_WIDTH = 180
const MIN_WINDOW_HEIGHT = 135
const RESIZE_EDGES = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left'
]

function loadCelebrationPreference() {
  const saved = localStorage.getItem(CELEBRATION_KEY)
  return saved === 'confetti' || saved === 'emojiConfetti' ? saved : DEFAULT_CELEBRATION
}

function loadTimerModePreference() {
  const saved = localStorage.getItem(TIMER_MODE_KEY)
  return saved === 'down' || saved === 'up' ? saved : DEFAULT_TIMER_MODE
}

export default function App() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [preferredCelebration, setPreferredCelebration] = useState(loadCelebrationPreference)
  const [task, setTask] = useState(() => ({
    id: null,
    title: '',
    sections: 10,
    progress: 0,
    status: 'idle',
    celebration: loadCelebrationPreference(),
    createdAt: null
  }))
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch (e) {
      return []
    }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [showEmojiSettings, setShowEmojiSettings] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [showVolumeSettings, setShowVolumeSettings] = useState(false)
  const [showCelebrationRequired, setShowCelebrationRequired] = useState(false)
  const [showKeyHints, setShowKeyHints] = useState(false)
  const [emojiConfettiFillers, setEmojiConfettiFillers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(EMOJI_CONFETTI_KEY)) || DEFAULT_EMOJI_CONFETTI
    } catch (e) {
      return DEFAULT_EMOJI_CONFETTI
    }
  })
  const lockedCelebration = useRef(preferredCelebration)
  const recordedCompletions = useRef(new Set())
  const timerRef = useRef(null)
  const generateTimeoutRef = useRef(null)
  const isMousePassthrough = useRef(false)
  const isWindowResizing = useRef(false)
  const [timerMode, setTimerMode] = useState(loadTimerModePreference)
  const [timerRunning, setTimerRunning] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [soundVolume, setSoundVolumeState] = useState(() => {
    const saved = Number(localStorage.getItem(SOUND_VOLUME_KEY))
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 1
  })

  async function startWindowResize(edge, event) {
    const desktop = window.cfsDesktop
    if (!desktop?.getWindowBounds || !desktop?.setWindowBounds || event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const startX = event.screenX
    const startY = event.screenY
    const startBounds = await desktop.getWindowBounds()
    if (!startBounds) return

    isWindowResizing.current = true
    desktop.setIgnoreMouseEvents(false)

    function updateWindowBounds(moveEvent) {
      const deltaX = moveEvent.screenX - startX
      const deltaY = moveEvent.screenY - startY
      const nextBounds = { ...startBounds }

      if (edge.includes('right')) {
        nextBounds.width = Math.max(MIN_WINDOW_WIDTH, startBounds.width + deltaX)
      }
      if (edge.includes('bottom')) {
        nextBounds.height = Math.max(MIN_WINDOW_HEIGHT, startBounds.height + deltaY)
      }
      if (edge.includes('left')) {
        nextBounds.width = Math.max(MIN_WINDOW_WIDTH, startBounds.width - deltaX)
        nextBounds.x = startBounds.x + startBounds.width - nextBounds.width
      }
      if (edge.includes('top')) {
        nextBounds.height = Math.max(MIN_WINDOW_HEIGHT, startBounds.height - deltaY)
        nextBounds.y = startBounds.y + startBounds.height - nextBounds.height
      }

      desktop.setWindowBounds(nextBounds)
    }

    function stopWindowResize() {
      isWindowResizing.current = false
      window.removeEventListener('mousemove', updateWindowBounds)
      window.removeEventListener('mouseup', stopWindowResize)
    }

    window.addEventListener('mousemove', updateWindowBounds)
    window.addEventListener('mouseup', stopWindowResize)
  }

  useEffect(() => {
    const desktop = window.cfsDesktop
    if (!desktop) return

    desktop.getAlwaysOnTop().then(setAlwaysOnTop)

    const interactiveSelector = [
      'button',
      'input',
      '.paper',
      '.body',
      '.timer-area',
      '.typewriter-base',
      '.rear-backplate',
      '.gold-arch',
      '.carriage-crossbar',
      '.record-wheel',
      '.right-knob',
      '.paper-bail',
      '.desktop-note-controls',
      '.base-bottom-drag-area',
      '.window-resize-handle'
    ].join(',')

    function setPassthrough(nextValue) {
      if (isMousePassthrough.current === nextValue) return
      isMousePassthrough.current = nextValue
      desktop.setIgnoreMouseEvents(nextValue)
    }

    function updateMousePassthrough(event) {
      if (isWindowResizing.current) {
        setPassthrough(false)
        return
      }

      const target = document.elementFromPoint(event.clientX, event.clientY)
      const isOverInteractiveArea = Boolean(target?.closest(interactiveSelector))
      setPassthrough(!isOverInteractiveArea)
    }

    window.addEventListener('mousemove', updateMousePassthrough)
    window.addEventListener('mouseleave', () => {
      if (!isWindowResizing.current) setPassthrough(true)
    })

    return () => {
      window.removeEventListener('mousemove', updateMousePassthrough)
      setPassthrough(false)
    }
  }, [])

  useEffect(() => {
    function updateStageScale() {
      const scale = Math.min(
        1.5,
        (window.innerWidth - STAGE_MARGIN) / STAGE_WIDTH,
        (window.innerHeight - STAGE_MARGIN) / STAGE_HEIGHT
      )

      document.documentElement.style.setProperty('--stage-scale', Math.max(MIN_STAGE_SCALE, scale).toString())
    }

    updateStageScale()
    window.addEventListener('resize', updateStageScale)
    return () => window.removeEventListener('resize', updateStageScale)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem(EMOJI_CONFETTI_KEY, JSON.stringify(emojiConfettiFillers))
  }, [emojiConfettiFillers])

  useEffect(() => {
    localStorage.setItem(SOUND_VOLUME_KEY, String(soundVolume))
    setSoundVolume(soundVolume)
  }, [soundVolume])

  useEffect(() => {
    localStorage.setItem(CELEBRATION_KEY, preferredCelebration)
  }, [preferredCelebration])

  useEffect(() => {
    localStorage.setItem(TIMER_MODE_KEY, timerMode)
  }, [timerMode])

  useEffect(() => {
    if (task.status !== 'completed' || !task.id) return
    if (recordedCompletions.current.has(task.id)) return

    recordedCompletions.current.add(task.id)

    const completedAt = new Date()
    const createdAt = task.createdAt ? new Date(task.createdAt) : null
    const entry = {
      id: task.id,
      title: task.title,
      sections: task.sections,
      createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : completedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.max(0, completedAt.getTime() - createdAt.getTime())
        : null,
      celebration: task.celebration || lockedCelebration.current
    }

    setHistory(h => {
      if (h.some(item => item.id === entry.id)) return h
      return [entry, ...h].slice(0, HISTORY_MAX)
    })

    const effect = task.celebration || lockedCelebration.current
    if (effect) {
      playSound('taskComplete')
        .then(() => playSound('celebrate'))
        .then(() => playCelebration(effect, { emojis: emojiConfettiFillers }))
    }
  }, [task.status, task.id, task.title, task.sections, task.celebration, task.createdAt, emojiConfettiFillers])

  function updateTask(up) {
    setTask(t => {
      const allowedUpdate = { ...up }
      if (t.status !== 'idle') delete allowedUpdate.sections

      const newTask = { ...t, ...allowedUpdate }
      if (newTask.progress >= newTask.sections && t.status !== 'completed' && newTask.status === 'generated') {
        newTask.status = 'completed'
      }
      return newTask
    })
  }

  function selectCelebration(celebration) {
    lockedCelebration.current = celebration
    setPreferredCelebration(celebration)
    setShowEmojiSettings(false)
    setShowHistory(false)
    setShowManual(false)
    setShowVolumeSettings(false)
    setShowCelebrationRequired(false)
    updateTask({ celebration })
  }

  function toggleEmojiSettings() {
    setShowHistory(false)
    setShowManual(false)
    setShowVolumeSettings(false)
    setShowEmojiSettings(s => !s)
  }

  function toggleManual() {
    setShowHistory(false)
    setShowEmojiSettings(false)
    setShowVolumeSettings(false)
    setShowManual(s => !s)
  }

  function toggleVolumeSettings() {
    setShowHistory(false)
    setShowEmojiSettings(false)
    setShowManual(false)
    setShowVolumeSettings(s => !s)
  }

  function onGenerate() {
    if (task.status !== 'idle') return

    if (!task.celebration && !lockedCelebration.current) {
      setShowEmojiSettings(false)
      setShowHistory(false)
      setShowManual(false)
      setShowVolumeSettings(false)
      setShowCelebrationRequired(true)
      return
    }

    playSound('generate')
    setShowCelebrationRequired(false)

    clearTimeout(generateTimeoutRef.current)
    generateTimeoutRef.current = setTimeout(() => {
      setTask(t => ({
        ...t,
        id: t.id || 'task-' + Date.now(),
        status: 'generated',
        createdAt: t.createdAt || new Date().toISOString()
      }))
    }, 500)
  }

  function onResetTask() {
    clearTimeout(generateTimeoutRef.current)
    setTask({ id: null, title: '', sections: 10, progress: 0, status: 'idle', celebration: preferredCelebration, createdAt: null })
    setShowEmojiSettings(false)
    setShowHistory(false)
    setShowManual(false)
    setShowVolumeSettings(false)
    setShowCelebrationRequired(false)
    lockedCelebration.current = preferredCelebration
  }

  function onSaveEmojiConfetti(nextEmojis) {
    const cleaned = nextEmojis.map(item => item.trim()).filter(Boolean)
    setEmojiConfettiFillers(cleaned.length ? cleaned : DEFAULT_EMOJI_CONFETTI)
    setShowEmojiSettings(false)
  }

  function selectTimerMode(mode) {
    setTimerMode(mode)
    setTimerRunning(false)
  }

  function onToggleTimerKnob() {
    if (timerRunning) {
      timerRef.current?.reset()
    } else {
      timerRef.current?.start()
    }
  }

  function suppressButtonKeyboard(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function toggleAlwaysOnTop() {
    const desktop = window.cfsDesktop
    if (!desktop) {
      setAlwaysOnTop(value => !value)
      return
    }

    desktop.toggleAlwaysOnTop().then(setAlwaysOnTop)
  }

  function formatHistoryDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value || '时间未记录').replace(/:\d{2}(?=\s|$)/, '')

    const pad = number => String(number).padStart(2, '0')
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  function formatHistoryDuration(durationMs) {
    if (!Number.isFinite(durationMs)) return '未记录'

    const totalMinutes = Math.floor(durationMs / 60000)
    if (totalMinutes < 1) return '不足1分钟'

    const days = Math.floor(totalMinutes / 1440)
    const hours = Math.floor((totalMinutes % 1440) / 60)
    const minutes = totalMinutes % 60
    return [
      days ? `${days}天` : '',
      hours ? `${hours}小时` : '',
      minutes ? `${minutes}分钟` : ''
    ].filter(Boolean).join('')
  }

  async function exportHistory() {
    const content = history.map(item => [
      `${item.title || '无题任务'} ${item.sections ?? '-'}`,
      formatHistoryDate(item.createdAt),
      `用时 ${formatHistoryDuration(item.durationMs)}`
    ].join('\r\n')).join('\r\n\r\n')
    const now = new Date()
    const pad = number => String(number).padStart(2, '0')
    const fileName = `Click-for-Success-完成记录-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.txt`
    const payload = { content: `\uFEFF${content}`, fileName }

    if (window.cfsDesktop?.exportHistory) {
      await window.cfsDesktop.exportHistory(payload)
      return
    }

    const url = URL.createObjectURL(new Blob([payload.content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div className="app-root">
      {window.cfsDesktop && RESIZE_EDGES.map(edge => (
        <div
          key={edge}
          className={`window-resize-handle window-resize-${edge}`}
          aria-hidden="true"
          onMouseDown={(event) => startWindowResize(edge, event)}
        />
      ))}
      <div className={`printer ${compactMode ? 'printer-compact' : ''} ${showKeyHints ? 'printer-key-hints' : ''}`}>
        <div className="rear-backplate" aria-hidden="true" />
        <div className="gold-arch gold-arch-left" aria-hidden="true" />
        <div className="gold-arch gold-arch-right" aria-hidden="true" />
        <div className="carriage-crossbar" aria-hidden="true" />
        <button
          type="button"
          className={`record-wheel ${compactMode ? 'record-wheel-retracted' : ''}`}
          aria-label={compactMode ? 'Expand keyboard' : 'Retract keyboard'}
          aria-pressed={compactMode}
          onKeyDown={suppressButtonKeyboard}
          onClick={() => setCompactMode(value => !value)}
        />
        <button
          type="button"
          className={`right-knob ${timerRunning ? 'timer-knob-running' : ''}`}
          aria-label={timerRunning ? 'Reset timer' : 'Start timer'}
          onKeyDown={suppressButtonKeyboard}
          onClick={onToggleTimerKnob}
        />
        {showKeyHints && (
          <>
            <span className="mechanical-control-hint drawer-control-hint">抽屉模式</span>
            <span className="mechanical-control-hint timer-control-hint">计时器开关</span>
          </>
        )}
        <div className="paper-bail" aria-hidden="true">
          <span className="paper-bail-block paper-bail-block-left" />
          <span className="paper-bail-block paper-bail-block-right" />
        </div>
        <Paper
          task={task}
          history={history}
          showHistory={showHistory}
          showEmojiSettings={showEmojiSettings}
          showManual={showManual}
          showVolumeSettings={showVolumeSettings}
          soundVolume={soundVolume}
          showCelebrationRequired={showCelebrationRequired}
          emojiConfettiFillers={emojiConfettiFillers}
          onUpdate={updateTask}
          onSaveEmojiConfetti={onSaveEmojiConfetti}
          onChangeSoundVolume={setSoundVolumeState}
          onExportHistory={exportHistory}
          formatHistoryDate={formatHistoryDate}
          formatHistoryDuration={formatHistoryDuration}
        />
        <div className="body">
          <div className="logo">ClickforSuccess</div>
          <div className="timer-area">
            <Timer
              ref={timerRef}
              mode={timerMode}
              running={timerRunning}
              onRunningChange={setTimerRunning}
            />
          </div>
        </div>

        <div className="desktop-note-controls" aria-label="窗口控制">
          <button
            type="button"
            className={`desktop-note-button desktop-note-help ${showKeyHints ? 'active' : ''}`}
            onClick={() => setShowKeyHints(value => !value)}
            onKeyDown={suppressButtonKeyboard}
            title="按键提示"
            aria-pressed={showKeyHints}
          >
            ?
          </button>
          <button
            type="button"
            className={`desktop-note-button desktop-note-pin ${alwaysOnTop ? 'active' : ''}`}
            onClick={toggleAlwaysOnTop}
            onKeyDown={suppressButtonKeyboard}
            title="置顶"
          >
            Pin
          </button>
          <button
            type="button"
            className="desktop-note-button desktop-note-minimize"
            onClick={() => window.cfsDesktop?.minimize()}
            onKeyDown={suppressButtonKeyboard}
            title="最小化"
          >
            Min
          </button>
          <button
            type="button"
            className="desktop-note-button desktop-note-close"
            onClick={() => window.cfsDesktop?.close()}
            onKeyDown={suppressButtonKeyboard}
            title="关闭"
          >
            X
          </button>
        </div>

        <div className={`typewriter-base ${compactMode ? 'typewriter-base-compact' : ''}`}>
          <div className="base-bottom-drag-area" aria-hidden="true">
            <span className="base-drag-rail" />
            <span
              className="base-resize-grip base-resize-bottom"
              onMouseDown={(event) => startWindowResize('bottom', event)}
            />
            <span
              className="base-resize-grip base-resize-corner"
              onMouseDown={(event) => startWindowResize('bottom-right', event)}
            />
          </div>
          <Keyboard
            compactMode={compactMode}
            showKeyHints={showKeyHints}
            task={task}
            onUpdate={updateTask}
            onGenerate={onGenerate}
            onReset={onResetTask}
            onToggleHistory={() => { setShowEmojiSettings(false); setShowManual(false); setShowHistory(s => !s) }}
            onToggleManual={toggleManual}
            onToggleVolume={toggleVolumeSettings}
            onToggleEmojiSettings={toggleEmojiSettings}
            onSelectCelebration={selectCelebration}
            showEmojiSettings={showEmojiSettings}
            showVolumeSettings={showVolumeSettings}
            timerRef={timerRef}
            timerMode={timerMode}
            onSelectTimerMode={selectTimerMode}
            soundVolume={soundVolume}
            onChangeSoundVolume={setSoundVolumeState}
          />
        </div>
      </div>
    </div>
  )
}
