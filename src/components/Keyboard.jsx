import React, { useEffect, useState } from 'react'
import { playSound } from '../sounds'

function suppressKeyboardActivation(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
  }
}

const KEY_HINTS = {
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

function Key({ label, hint, showKeyHints = false, active = false, physicallyPressed = false, disabled = false, onClick, className = '' }) {
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
    >
      {displayLabel}
    </button>
  )
}

export default function Keyboard({
  task,
  onUpdate,
  onGenerate,
  onReset,
  onToggleHistory,
  onToggleManual,
  onToggleVolume,
  onToggleEmojiSettings,
  onSelectCelebration,
  showEmojiSettings,
  timerRef,
  timerMode,
  onSelectTimerMode,
  showKeyHints = false,
  compactMode = false
}) {
  const [mappingMode, setMappingMode] = useState(false)
  const [pressedKeys, setPressedKeys] = useState(() => new Set())

  function updateSections(delta) {
    if (task.status !== 'idle') return
    onUpdate({ sections: Math.max(1, task.sections + delta) })
  }

  function completeProgress() {
    if (task.status !== 'generated') return

    playSound('spacePress')
    onUpdate({
      progress: Math.min(task.sections, task.progress + 1)
    })
  }

  function runMappedAction(key) {
    const actions = {
      '1': () => updateSections(1),
      '2': () => updateSections(-1),
      '0': onToggleEmojiSettings,
      '-': () => onSelectCelebration('emojiConfetti'),
      '+': () => onSelectCelebration('confetti'),
      U: () => timerRef.current?.addTenMinutes(),
      I: () => timerRef.current?.subOneMinute(),
      O: () => onSelectTimerMode('up'),
      P: () => onSelectTimerMode('down'),
      Z: () => {
        setMappingMode(false)
        setPressedKeys(new Set())
      },
      ',': onToggleVolume,
      '.': onToggleManual,
      '/': onToggleHistory,
      Space: completeProgress,
      CL: onGenerate,
      SET: onReset
    }

    actions[key]?.()
  }

  useEffect(() => {
    if (!mappingMode) return undefined

    function handlePhysicalKey(event) {
      const key = getTypewriterKey(event.code)
      if (!key) return

      setPressedKeys(current => {
        if (current.has(key)) return current
        const next = new Set(current)
        next.add(key)
        return next
      })

      const target = event.target
      const isEditing = target instanceof HTMLElement && (
        target.matches('input, textarea, [contenteditable="true"]') ||
        Boolean(target.closest('input, textarea, [contenteditable="true"]'))
      )

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
    const actions = {
      U: () => timerRef.current?.addTenMinutes(),
      I: () => timerRef.current?.subOneMinute(),
      O: () => onSelectTimerMode('up'),
      P: () => onSelectTimerMode('down')
    }

    return ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(label => (
      <Key
        key={label}
        label={label}
        hint={KEY_HINTS[label]}
        showKeyHints={showKeyHints}
        physicallyPressed={pressedKeys.has(label)}
        onClick={actions[label] || (() => {})}
        active={(label === 'O' && timerMode === 'up') || (label === 'P' && timerMode === 'down')}
        className={actions[label] ? 'key-functional' : ''}
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
                onClick={() => setMappingMode(value => {
                  if (value) setPressedKeys(new Set())
                  return !value
                })}
              />
            )
          }
          if (label === ',') return <Key key="," label="," hint="音量" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has(',')} className="key-functional" onClick={onToggleVolume} />
          if (label === '.') return <Key key="." label="." hint="说明" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('.')} className="key-functional" onClick={onToggleManual} />
          if (label === '/') return <Key key="/" label="/" hint="记录" showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has('/')} className="key-functional" onClick={onToggleHistory} />
          return <Key key={label} label={label} showKeyHints={showKeyHints} physicallyPressed={pressedKeys.has(label)} onClick={() => {}} />
        })}
      </div>

      <div className="row bottom-row">
        <button
          type="button"
          onKeyDown={suppressKeyboardActivation}
          className={`space key-functional ${showKeyHints ? 'space-hint' : ''} ${pressedKeys.has('Space') ? 'space-physically-pressed' : ''}`}
          onClick={completeProgress}
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
