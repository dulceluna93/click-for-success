import React, { useEffect, useRef, useState } from 'react'

function suppressKeyboardActivation(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
  }
}

const KEY_HINTS = {
  Q: '🍅',
  W: '设置',
  U: '+10min',
  I: '-1min',
  O: '正计时',
  P: '倒计时'
}

const PHYSICAL_CODE_TO_KEY = {
  Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
  Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
  Minus: '-', Equal: '+', Comma: ',', Period: '.', Slash: '/', Space: 'Space',
  Enter: 'CL', NumpadEnter: 'CL', ShiftLeft: 'SET', ShiftRight: 'SET',
  Numpad0: '0', Numpad1: '1', Numpad2: '2', Numpad3: '3', Numpad4: '4',
  Numpad5: '5', Numpad6: '6', Numpad7: '7', Numpad8: '8', Numpad9: '9',
  NumpadAdd: '+', NumpadSubtract: '-'
}

const TYPEWRITER_LETTERS = new Set(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'])

function getTypewriterKey(code) {
  if (PHYSICAL_CODE_TO_KEY[code]) return PHYSICAL_CODE_TO_KEY[code]
  if (!code.startsWith('Key')) return null

  const letter = code.slice(3)
  return TYPEWRITER_LETTERS.has(letter) ? letter : null
}

function isTextEntry(target) {
  return target instanceof HTMLElement && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'))
}

function allowsTimerShortcut(target) {
  return !isTextEntry(target) || target.matches('.timer-input')
}

const TIMER_MODE_KEYS = { Q: 'pomodoro', O: 'up', P: 'down' }

function Key({ label, hint, showKeyHints = false, active = false, pressed, physicallyPressed = false, disabled = false, onClick, className = '' }) {
  const hasHint = Boolean(hint)
  const hasTwoCharacterHint = /^[\u4e00-\u9fff]{2}$/.test(hint || '')
  const displayLabel = showKeyHints && hasHint ? hint : label

  return (
    <button
      type="button"
      className={`key ${active ? 'active' : ''} ${physicallyPressed ? 'key-physically-pressed' : ''} ${disabled ? 'key-disabled' : ''} ${showKeyHints && hasHint ? 'key-hint' : ''} ${showKeyHints && hasTwoCharacterHint ? 'key-hint-two-chars' : ''} ${showKeyHints && !hasHint ? 'key-muted' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={suppressKeyboardActivation}
      aria-label={showKeyHints && hasHint ? `${label}：${hint}` : label}
      aria-pressed={pressed}
    >
      {displayLabel}
    </button>
  )
}

export default function Keyboard({
  task,
  onUpdate,
  onCompleteStep,
  onGenerate,
  onReset,
  onToggleHistory,
  onToggleManual,
  onToggleVolume,
  onToggleEmojiSettings,
  onTogglePomodoroSettings,
  showPomodoroSettings,
  onSelectCelebration,
  showEmojiSettings,
  timerRef,
  timerMode,
  onSelectTimerMode,
  onToggleTimer,
  onToggleTimerPlayback,
  onToggleDrawer,
  showKeyHints = false,
  compactMode = false,
  minimalMode = false
}) {
  const [mappingMode, setMappingMode] = useState(false)
  const [pressedKeys, setPressedKeys] = useState(() => new Set())
  const pendingModifier = useRef(null)
  const timerActions = {
    Q: () => onSelectTimerMode('pomodoro'),
    W: onTogglePomodoroSettings,
    U: () => timerRef.current?.addTenMinutes(),
    I: () => timerRef.current?.subOneMinute(),
    O: () => onSelectTimerMode('up'),
    P: () => onSelectTimerMode('down')
  }

  function updateSections(delta) {
    if (task.status !== 'idle') return
    onUpdate({ sections: Math.max(1, task.sections + delta) })
  }

  function stopMapping() {
    pendingModifier.current = null
    setMappingMode(false)
    setPressedKeys(new Set())
  }

  function runMappedAction(key) {
    const actions = {
      '1': () => updateSections(1),
      '2': () => updateSections(-1),
      '0': onToggleEmojiSettings,
      '-': () => onSelectCelebration('emojiConfetti'),
      '+': () => onSelectCelebration('confetti'),
      ...timerActions,
      Z: stopMapping,
      ',': onToggleVolume,
      '.': onToggleManual,
      '/': onToggleHistory,
      Space: onCompleteStep,
      CL: onGenerate,
      SET: onReset
    }

    actions[key]?.()
  }

  useEffect(() => {
    if (!mappingMode) return undefined

    function pressKey(key) {
      setPressedKeys(current => current.has(key) ? current : new Set([...current, key]))
    }

    function handlePhysicalKey(event) {
      const target = event.target
      const isEditing = isTextEntry(target)
      if (event.key === 'Control' || event.key === 'Shift') {
        if (!event.repeat) {
          const isCtrl = event.key === 'Control'
          const canActivate = isCtrl ? allowsTimerShortcut(target) && !event.shiftKey : !minimalMode && !isEditing && !event.ctrlKey
          pendingModifier.current = !pendingModifier.current && canActivate && !event.altKey && !event.metaKey && !event.isComposing
            ? event.code
            : null
          if (!isCtrl) pressKey('SET')
        }
        return
      }

      pendingModifier.current = null
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.code === 'CapsLock') {
        if (!isEditing && !event.isComposing && !event.shiftKey && !event.repeat) {
          onToggleTimerPlayback()
        }
        return
      }
      if (!minimalMode && event.key === '~' && !isEditing && !event.isComposing) {
        event.preventDefault()
        if (!event.repeat) onToggleDrawer()
        return
      }
      const key = getTypewriterKey(event.code)
      if (!key) return
      if (minimalMode && key !== 'Space' && key !== 'Z') return

      if ((key === 'Space' || key === 'CL') && event.target instanceof HTMLElement &&
          event.target.closest('.history-export-dialog, .history-export-button, .history-detail-toggle, .pomodoro-settings button, .timer-pause-button, .minimal-mode-toggle, .minimal-progress')) return

      pressKey(key)

      if (event.isComposing || event.repeat) return

      if (isEditing) {
        if (key === 'CL' && target.matches('.title-input')) {
          event.preventDefault()
          runMappedAction(key)
        }
        return
      }

      event.preventDefault()
      runMappedAction(key)
    }

    function handlePhysicalKeyUp(event) {
      if (event.key === 'Control' || event.key === 'Shift') {
        const isStandalone = pendingModifier.current === event.code && !event.isComposing
        pendingModifier.current = null
        if (event.key === 'Control') {
          if (isStandalone && allowsTimerShortcut(event.target)) onToggleTimer()
          return
        }
        if (isStandalone && !isTextEntry(event.target)) runMappedAction('SET')
      }
      const key = getTypewriterKey(event.code)
      if (!key) return

      setPressedKeys(current => {
        if (!current.has(key)) return current
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }

    function clearPhysicalKeys() {
      pendingModifier.current = null
      setPressedKeys(new Set())
    }

    window.addEventListener('keydown', handlePhysicalKey, true)
    window.addEventListener('keyup', handlePhysicalKeyUp, true)
    window.addEventListener('blur', clearPhysicalKeys)
    return () => {
      window.removeEventListener('keydown', handlePhysicalKey, true)
      window.removeEventListener('keyup', handlePhysicalKeyUp, true)
      window.removeEventListener('blur', clearPhysicalKeys)
    }
  })

  function renderLetterRow() {
    return ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(label => (
      <Key
        key={label}
        label={label}
        hint={KEY_HINTS[label]}
        showKeyHints={showKeyHints}
        physicallyPressed={pressedKeys.has(label)}
        onClick={timerActions[label]}
        active={(label === 'W' && showPomodoroSettings) || TIMER_MODE_KEYS[label] === timerMode}
        pressed={TIMER_MODE_KEYS[label] ? TIMER_MODE_KEYS[label] === timerMode : undefined}
        className={timerActions[label] ? 'key-functional' : ''}
      />
    ))
  }

  return (
    <div className={`keyboard ${compactMode ? 'keyboard-compact' : ''} ${showKeyHints ? 'keyboard-hints' : ''}`}>
      <div className="row retract-row number-row">
        <Key label="1" hint="+1" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('1')} className="key-functional" onClick={() => updateSections(1)} />
        <Key label="2" hint="-1" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('2')} className="key-functional" onClick={() => updateSections(-1)} />
        {['3', '4', '5', '6', '7', '8', '9'].map(label => <Key key={label} label={label} showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has(label)} />)}
        <Key label="0" hint="表情" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('0')} active={showEmojiSettings} className="key-functional" onClick={onToggleEmojiSettings} />
        <Key
          label="-"
          hint="礼花"
          showKeyHints={showKeyHints}
          physicallyPressed={pressedKeys.has('-')}
          active={task.celebration === 'emojiConfetti'}
          className="key-functional"
          onClick={() => onSelectCelebration('emojiConfetti')}
        />
        <Key
          label="+"
          hint="彩带"
          showKeyHints={showKeyHints}
          physicallyPressed={pressedKeys.has('+')}
          active={task.celebration === 'confetti'}
          className="key-functional"
          onClick={() => onSelectCelebration('confetti')}
        />
      </div>

      <div className="row retract-row letter-row">
        {renderLetterRow()}
      </div>

      <div className="row retract-row symbol-row">
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'].map(label => {
          if (label === 'Z') {
            return (
              <Key
                key="Z"
                label="Z"
                hint="映射"
                showKeyHints={showKeyHints}
                physicallyPressed={pressedKeys.has('Z')}
                active={mappingMode}
                className="key-functional"
                onClick={() => {
                  if (mappingMode) stopMapping()
                  else setMappingMode(true)
                }}
              />
            )
          }
          if (label === ',') return <Key key="," label="," hint="音量" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has(',')} className="key-functional" onClick={onToggleVolume} />
          if (label === '.') return <Key key="." label="." hint="说明" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('.')} className="key-functional" onClick={onToggleManual} />
          if (label === '/') return <Key key="/" label="/" hint="记录" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('/')} className="key-functional" onClick={onToggleHistory} />
          return <Key key={label} label={label} showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has(label)} />
        })}
      </div>

      <div className="row bottom-row">
        <button
          type="button"
          onKeyDown={suppressKeyboardActivation}
          className={`space key-functional ${showKeyHints ? 'space-hint' : ''} ${pressedKeys.has('Space') ? 'space-physically-pressed' : ''}`}
          onClick={onCompleteStep}
        >
          {showKeyHints ? '进度+1' : 'Space'}
        </button>

        <div className="right-controls">
          <Key label="CL" hint="生成" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('CL')} onClick={onGenerate} className="cl-key" />
          <Key label="SET" hint="重置" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('SET')} onClick={onReset} className="set-key" />
        </div>
      </div>
    </div>
  )
}
