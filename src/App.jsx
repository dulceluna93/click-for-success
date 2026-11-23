import React, { useEffect, useRef, useState } from 'react'
import Paper from './components/Paper'
import Keyboard from './components/Keyboard'
import Timer from './components/Timer'
import { playCelebration } from './celebrations/index'
import { playSound, setSoundVolume } from './sounds'
import { formatStepDuration, getHistorySteps, HISTORY_LIMITS } from './history'

const STORAGE_KEY = 'cfs_history_v1'
const CURRENT_TASK_KEY = 'cfs_current_task_v1'
const EMOJI_CONFETTI_KEY = 'cfs_emoji_confetti_v1'
const SOUND_VOLUME_KEY = 'cfs_sound_volume_v1'
const CELEBRATION_KEY = 'cfs_celebration_v1'
const TIMER_MODE_KEY = 'cfs_timer_mode_v1'
const POMODORO_KEY = 'cfs_pomodoro_v1'
const DEFAULT_POMODORO = { focus: 25, break: 5, taskSections: 5, historyLimit: 200 }
const MAX_POMODORO_MINUTES = 180
const DEFAULT_SOUND_VOLUME = 0.6
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

function validPomodoroMinutes(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_POMODORO_MINUTES
}

function validTaskSections(value) {
  return Number.isSafeInteger(value) && value >= 1
}

function loadPomodoroSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(POMODORO_KEY))
    return {
      focus: validPomodoroMinutes(saved?.focus) ? saved.focus : DEFAULT_POMODORO.focus,
      break: validPomodoroMinutes(saved?.break) ? saved.break : DEFAULT_POMODORO.break,
      taskSections: validTaskSections(saved?.taskSections) ? saved.taskSections : DEFAULT_POMODORO.taskSections,
      historyLimit: HISTORY_LIMITS.includes(saved?.historyLimit) ? saved.historyLimit : DEFAULT_POMODORO.historyLimit
    }
  } catch {
    return DEFAULT_POMODORO
  }
}

function createIdleTask(sections, celebration) {
  return {
    id: null,
    title: '',
    sections,
    progress: 0,
    status: 'idle',
    celebration,
    createdAt: null,
    stepCompletedAtMs: []
  }
}

function loadCurrentTask(sections, celebration) {
  const defaultTask = createIdleTask(sections, celebration)
  try {
    const saved = JSON.parse(localStorage.getItem(CURRENT_TASK_KEY))
    if (typeof saved?.title !== 'string' || !validTaskSections(saved.sections)) return defaultTask
    if (saved.status === 'idle') return { ...defaultTask, title: saved.title, sections: saved.sections }
    if (saved.status !== 'generated' && saved.status !== 'completed') return defaultTask
    if (typeof saved.id !== 'string' || !saved.id || !Number.isFinite(Date.parse(saved.createdAt))) return defaultTask
    if (!Number.isSafeInteger(saved.progress) || saved.progress < 0 || saved.progress > saved.sections) return defaultTask
    if ((saved.status === 'completed') !== (saved.progress === saved.sections)) return defaultTask
    if (!Array.isArray(saved.stepCompletedAtMs) || saved.stepCompletedAtMs.length !== saved.progress ||
        getHistorySteps(saved).length !== saved.progress) return defaultTask
    return {
      ...defaultTask,
      ...saved,
      celebration: ['confetti', 'emojiConfetti'].includes(saved.celebration) ? saved.celebration : celebration
    }
  } catch {
    return defaultTask
  }
}

export default function App() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [preferredCelebration, setPreferredCelebration] = useState(loadCelebrationPreference)
  const [pomodoroSettings, setPomodoroSettings] = useState(loadPomodoroSettings)
  const [task, setTask] = useState(() => loadCurrentTask(pomodoroSettings.taskSections, preferredCelebration))
  const [history, setHistory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return Array.isArray(saved) ? saved.filter(item => item && typeof item === 'object') : []
    } catch (e) {
      return []
    }
  })
  const [paperView, setPaperView] = useState(null)
  const [showKeyHints, setShowKeyHints] = useState(false)
  const [emojiConfettiFillers, setEmojiConfettiFillers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(EMOJI_CONFETTI_KEY)) || DEFAULT_EMOJI_CONFETTI
    } catch (e) {
      return DEFAULT_EMOJI_CONFETTI
    }
  })
  const recordedTaskId = useRef(null)
  const timerRef = useRef(null)
  const generateTimeoutRef = useRef(null)
  const isMousePassthrough = useRef(false)
  const isWindowResizing = useRef(false)
  const [timerMode, setTimerMode] = useState(loadTimerModePreference)
  const [timerStatus, setTimerStatus] = useState('idle')
  const timerActive = timerStatus !== 'idle'
  const timerRunning = timerStatus === 'running'
  const timerPlaybackLabel = timerRunning ? '暂停计时' : timerActive ? '继续计时' : '开始计时'
  const [pomodoroPhase, setPomodoroPhase] = useState(null)
  const nextPomodoroPhase = pomodoroPhase === 'focus' ? 'break' : 'focus'
  const nextPomodoroSeconds = pomodoroSettings[nextPomodoroPhase] * 60
  const [compactMode, setCompactMode] = useState(false)
  const [minimalMode, setMinimalMode] = useState(false)
  const switchingMinimalMode = useRef(false)
  const [soundVolume, setSoundVolumeState] = useState(() => {
    const stored = localStorage.getItem(SOUND_VOLUME_KEY)
    const saved = Number(stored)
    return stored !== null && stored.trim() !== '' && Number.isFinite(saved)
      ? Math.min(1, Math.max(0, saved))
      : DEFAULT_SOUND_VOLUME
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

    function handleMouseLeave() {
      if (!isWindowResizing.current) setPassthrough(true)
    }

    window.addEventListener('mousemove', updateMousePassthrough)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', updateMousePassthrough)
      window.removeEventListener('mouseleave', handleMouseLeave)
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
    localStorage.setItem(CURRENT_TASK_KEY, JSON.stringify(task))
  }, [task])

  useEffect(() => () => clearTimeout(generateTimeoutRef.current), [])

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
    if (timerMode !== 'pomodoro') localStorage.setItem(TIMER_MODE_KEY, timerMode)
  }, [timerMode])

  useEffect(() => {
    if (task.status !== 'completed' || recordedTaskId.current === task.id || history.some(item => item.id === task.id)) return
    recordedTaskId.current = task.id
    const completedAtMs = task.stepCompletedAtMs.at(-1)
    const entry = {
      id: task.id,
      title: task.title,
      sections: task.sections,
      createdAt: task.createdAt,
      completedAt: new Date(completedAtMs).toISOString(),
      stepCompletedAtMs: task.stepCompletedAtMs,
      durationMs: completedAtMs - Date.parse(task.createdAt),
      celebration: task.celebration
    }

    setHistory(current => [entry, ...current].slice(0, pomodoroSettings.historyLimit))

    playSound('taskComplete')
      .then(() => playSound('celebrate'))
      .then(() => playCelebration(task.celebration, { emojis: emojiConfettiFillers }))
  }, [task, history, emojiConfettiFillers, pomodoroSettings.historyLimit])

  function updateTask(up) {
    setTask(t => {
      const allowedUpdate = { ...up }
      if (t.status !== 'idle') delete allowedUpdate.sections

      return { ...t, ...allowedUpdate }
    })
  }

  function completeTaskStep() {
    if (task.status !== 'generated') return
    playSound('spacePress')
    const pressedAtMs = Date.now()
    setTask(t => {
      if (t.status !== 'generated' || t.progress >= t.sections) return t

      const previousMs = t.stepCompletedAtMs.at(-1) ?? Date.parse(t.createdAt)
      const completedAtMs = Math.max(pressedAtMs, previousMs)
      const progress = t.progress + 1
      return {
        ...t,
        progress,
        status: progress === t.sections ? 'completed' : t.status,
        stepCompletedAtMs: [...t.stepCompletedAtMs, completedAtMs]
      }
    })
  }

  function selectCelebration(celebration) {
    setPreferredCelebration(celebration)
    setPaperView(null)
    updateTask({ celebration })
  }

  function togglePaperView(view) {
    setPaperView(current => current === view ? null : view)
  }

  function onGenerate() {
    if (task.status !== 'idle' || generateTimeoutRef.current !== null) return

    playSound('generate')
    generateTimeoutRef.current = setTimeout(() => {
      generateTimeoutRef.current = null
      const createdAt = new Date()
      setTask(t => ({
        ...t,
        id: 'task-' + createdAt.getTime(),
        status: 'generated',
        createdAt: createdAt.toISOString()
      }))
    }, 500)
  }

  function onResetTask() {
    clearTimeout(generateTimeoutRef.current)
    generateTimeoutRef.current = null
    setTask(createIdleTask(pomodoroSettings.taskSections, preferredCelebration))
    setPaperView(null)
  }

  function onSaveEmojiConfetti(nextEmojis) {
    const cleaned = nextEmojis.map(item => item.trim()).filter(Boolean)
    setEmojiConfettiFillers(cleaned.length ? cleaned : DEFAULT_EMOJI_CONFETTI)
    setPaperView(null)
  }

  function savePomodoroSettings(settings) {
    if (!validPomodoroMinutes(settings.focus) || !validPomodoroMinutes(settings.break) ||
        !validTaskSections(settings.taskSections) || !HISTORY_LIMITS.includes(settings.historyLimit)) return
    localStorage.setItem(POMODORO_KEY, JSON.stringify(settings))
    if (settings.taskSections !== pomodoroSettings.taskSections) {
      setTask(current => current.status === 'idle' ? { ...current, sections: settings.taskSections } : current)
    }
    setPomodoroSettings(settings)
    setPaperView(null)
  }

  function selectTimerMode(mode) {
    if (mode === 'pomodoro' && timerMode === mode) return
    timerRef.current?.stop()
    setPomodoroPhase(null)
    setTimerMode(mode)
  }

  function toggleDrawer() {
    setCompactMode(value => !value)
  }

  async function toggleMinimalMode() {
    if (switchingMinimalMode.current) return
    switchingMinimalMode.current = true
    const next = !minimalMode
    try {
      const desktop = window.cfsDesktop
      setMinimalMode(desktop?.setMinimalMode ? await desktop.setMinimalMode(next) : next)
    } finally {
      switchingMinimalMode.current = false
    }
  }

  function startTimer() {
    if (timerMode === 'pomodoro') {
      setPomodoroPhase(nextPomodoroPhase)
      timerRef.current?.startPomodoro(nextPomodoroSeconds)
    } else {
      timerRef.current?.start()
    }
  }

  function onToggleTimerKnob() {
    if (timerActive) timerRef.current?.reset()
    else startTimer()
  }

  function toggleTimerPlayback() {
    if (!timerActive) startTimer()
    else if (timerRunning) timerRef.current?.pause()
    else timerRef.current?.resume()
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

  function formatHistoryDate(value, includeSeconds = false) {
    if (value == null || value === '') return '时间未记录'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value || '时间未记录').replace(/:\d{2}(?=\s|$)/, '')

    const pad = number => String(number).padStart(2, '0')
    const minutes = `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    return includeSeconds ? `${minutes}:${pad(date.getSeconds())}` : minutes
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

  async function exportHistory(includeSteps) {
    const content = history.map(item => {
      const lines = [
        `${item.title || '无题任务'} ${item.sections ?? '-'}`,
        formatHistoryDate(item.createdAt),
        `用时 ${formatHistoryDuration(item.durationMs)}`
      ]
      if (includeSteps) {
        const steps = getHistorySteps(item)
        if (!steps.length) lines.push('逐步用时未记录')
        steps.forEach(({ time, duration }, index) => {
          lines.push(`第 ${index + 1} 步：用时 ${formatStepDuration(duration)}，完成于 ${formatHistoryDate(time, true)}`)
        })
      }
      return lines.join('\r\n')
    }).join('\r\n\r\n')
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
    <div className={`app-root${minimalMode ? ' app-root-minimal' : ''}`}>
      {window.cfsDesktop && !minimalMode && RESIZE_EDGES.map(edge => (
        <div
          key={edge}
          className={`window-resize-handle window-resize-${edge}`}
          aria-hidden="true"
          onMouseDown={(event) => startWindowResize(edge, event)}
        />
      ))}
      <div className={`printer ${compactMode ? 'printer-compact' : ''} ${minimalMode ? 'printer-minimal' : ''} ${showKeyHints ? 'printer-key-hints' : ''}`}>
        <div className="rear-backplate" aria-hidden="true" />
        <div className="gold-arch gold-arch-left" aria-hidden="true" />
        <div className="gold-arch gold-arch-right" aria-hidden="true" />
        <div className="carriage-crossbar" aria-hidden="true" />
        <button
          type="button"
          className={`record-wheel ${compactMode ? 'record-wheel-retracted' : ''}`}
          aria-label={compactMode ? 'Expand keyboard' : 'Retract keyboard'}
          aria-pressed={compactMode}
          title="抽屉模式（键盘映射：~）"
          onKeyDown={suppressButtonKeyboard}
          onClick={toggleDrawer}
        />
        <button
          type="button"
          className={`right-knob ${timerActive ? 'timer-knob-running' : ''}`}
          aria-label={timerActive ? '计时归零' : '开始计时'}
          title="计时开关（键盘映射：Ctrl）"
          onKeyDown={suppressButtonKeyboard}
          onClick={onToggleTimerKnob}
        />
        {showKeyHints && (
          <>
            <span className="mechanical-control-hint drawer-control-hint"><span>抽屉模式</span><span>~</span></span>
            <span className="mechanical-control-hint timer-control-hint"><span>计时开关</span><span>ctrl</span></span>
          </>
        )}
        <div className="paper-bail" aria-hidden="true">
          <span className="paper-bail-block paper-bail-block-left" />
          <span className="paper-bail-block paper-bail-block-right" />
        </div>
        <Paper
          task={task}
          history={history}
          showHistory={paperView === 'history'}
          showEmojiSettings={paperView === 'emoji'}
          showManual={paperView === 'manual'}
          showVolumeSettings={paperView === 'volume'}
          showPomodoroSettings={paperView === 'pomodoro'}
          pomodoroSettings={pomodoroSettings}
          maxPomodoroMinutes={MAX_POMODORO_MINUTES}
          onSavePomodoroSettings={savePomodoroSettings}
          onClosePomodoroSettings={() => setPaperView(null)}
          soundVolume={soundVolume}
          emojiConfettiFillers={emojiConfettiFillers}
          onUpdate={updateTask}
          onSaveEmojiConfetti={onSaveEmojiConfetti}
          onChangeSoundVolume={setSoundVolumeState}
          onExportHistory={exportHistory}
          formatHistoryDate={formatHistoryDate}
          formatHistoryDuration={formatHistoryDuration}
        />
        <div className="body">
          {minimalMode ? (
            <div className="minimal-task">
              <span className="minimal-task-title" title={task.title || undefined}>
                {task.title || (task.status === 'idle' ? '暂无当前任务' : '无题任务')}
              </span>
              <button
                type="button"
                className="minimal-progress"
                disabled={task.status !== 'generated'}
                onClick={completeTaskStep}
                aria-label={`任务进度 ${task.progress} / ${task.sections}${task.status === 'generated' ? '，点击完成一步' : ''}`}
                title={task.status === 'generated' ? '完成一步' : undefined}
              >
                {task.progress}/{task.sections}
              </button>
            </div>
          ) : (
            <div className="logo">ClickforSuccess</div>
          )}
          <div className="timer-controls">
            <div className="timer-button-control">
              <button
                type="button"
                className="minimal-mode-toggle"
                aria-label="极简模式"
                aria-pressed={minimalMode}
                title={minimalMode ? '恢复打字机' : '进入极简模式'}
                onClick={event => {
                  if (event.detail > 0) event.currentTarget.blur()
                  toggleMinimalMode()
                }}
              />
              {showKeyHints && <span className="mechanical-control-hint timer-button-hint minimal-mode-hint">极简模式</span>}
            </div>
            <div className="timer-area">
              <Timer
                ref={timerRef}
                mode={timerMode}
                status={timerStatus}
                onStatusChange={setTimerStatus}
                nextPomodoroSeconds={nextPomodoroSeconds}
              />
            </div>
            <div className="timer-button-control">
              <button
                type="button"
                className={`timer-pause-button${timerRunning ? ' is-running' : ''}`}
                aria-label={timerPlaybackLabel}
                title={`${timerPlaybackLabel}（键盘映射：Caps Lock）`}
                onClick={event => {
                  if (minimalMode && event.detail > 0) event.currentTarget.blur()
                  toggleTimerPlayback()
                }}
              />
              {showKeyHints && <span className="mechanical-control-hint timer-button-hint">Caps</span>}
            </div>
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
            minimalMode={minimalMode}
            showKeyHints={showKeyHints}
            task={task}
            onUpdate={updateTask}
            onCompleteStep={completeTaskStep}
            onGenerate={onGenerate}
            onReset={onResetTask}
            onToggleHistory={() => togglePaperView('history')}
            onToggleManual={() => togglePaperView('manual')}
            onToggleVolume={() => togglePaperView('volume')}
            onToggleEmojiSettings={() => togglePaperView('emoji')}
            onTogglePomodoroSettings={() => togglePaperView('pomodoro')}
            onSelectCelebration={selectCelebration}
            showEmojiSettings={paperView === 'emoji'}
            showPomodoroSettings={paperView === 'pomodoro'}
            timerRef={timerRef}
            timerMode={timerMode}
            onToggleTimer={onToggleTimerKnob}
            onToggleTimerPlayback={toggleTimerPlayback}
            onToggleDrawer={toggleDrawer}
            onSelectTimerMode={selectTimerMode}
          />
        </div>
      </div>
    </div>
  )
}
