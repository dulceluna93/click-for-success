import React from 'react'
import { playSound } from '../sounds'

function suppressKeyboardActivation(event) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
  }
}

function Key({ label, active = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`key ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={suppressKeyboardActivation}
    >
      {label}
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
  compactMode = false
}) {
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
        onClick={actions[label] || (() => {})}
        active={(label === 'O' && timerMode === 'up') || (label === 'P' && timerMode === 'down')}
        className={actions[label] ? 'key-functional' : ''}
      />
    ))
  }

  return (
    <div className={`keyboard ${compactMode ? 'keyboard-compact' : ''}`}>
      <div className="row retract-row number-row">
        <Key label="1" className="key-functional" onClick={() => onUpdate({ sections: Math.max(1, task.sections - 1) })} />
        <Key label="2" className="key-functional" onClick={() => onUpdate({ sections: task.sections + 1 })} />
        <Key label="3" />
        <Key label="4" />
        <Key label="5" />
        <Key label="6" />
        <Key label="7" />
        <Key label="8" />
        <Key label="9" />
        <Key label="0" active={showEmojiSettings} className="key-functional" onClick={onToggleEmojiSettings} />
        <Key
          label="-"
          active={task.celebration === 'emojiConfetti'}
          className="key-functional"
          onClick={() => onSelectCelebration('emojiConfetti')}
        />
        <Key
          label="+"
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
          if (label === ',') return <Key key="," label="," className="key-functional" onClick={onToggleVolume} />
          if (label === '.') return <Key key="." label="." className="key-functional" onClick={onToggleManual} />
          if (label === '/') return <Key key="/" label="/" className="key-functional" onClick={onToggleHistory} />
          return <Key key={label} label={label} onClick={() => {}} />
        })}
      </div>

      <div className="row bottom-row">
        <button
          type="button"
          onKeyDown={suppressKeyboardActivation}
          className="space key-functional"
          onClick={() => {
            if (task.status === 'generated') {
              playSound('spacePress')
              onUpdate({
                progress: Math.min(task.sections, task.progress + 1)
              })
            }
          }}
        >
          Space
        </button>

        <div className="right-controls">
          <Key label="CL" onClick={onGenerate} className="cl-key" />
          <Key label="SET" onClick={onReset} className="set-key" />
        </div>
      </div>
    </div>
  )
}
