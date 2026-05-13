import React from 'react'

function Key({label, small=false, active=false, onClick, className=''}){
  return (
    <button className={`key ${small? 'key-small':''} ${active? 'active':''} ${className}`} onClick={onClick}>{label}</button>
  )
}

export default function Keyboard({task,onUpdate,onGenerate,onReset,lockedCelebrationRef,onToggleHistory}){
  const celebration = task.celebration || lockedCelebrationRef.current
  return (
    <div className="keyboard">
      <div className="row">
        <Key label="1" onClick={()=>onUpdate({sections: Math.max(1, task.sections-1)})} />
        <Key label="2" onClick={()=>onUpdate({sections: task.sections+1})} />
        <Key label="Q" onClick={()=>{}} />
        <Key label="W" onClick={()=>{}} />
        <Key label="E" onClick={()=>{}} />
        <Key label="R" onClick={()=>{}} />
        <Key label="T" onClick={()=>{}} />
      </div>
      <div className="row">
        {/* letters simplified for demo */}
        <div className="letters">
          <div className="letter-row">Q W E R T Y U I O P</div>
          <div className="letter-row">A S D F G H J K L ;</div>
          <div className="letter-row">Z X C V B N M , . /</div>
        </div>
      </div>
      <div className="row bottom">
        <Key label="0" active={celebration==='fireworks'} onClick={()=>{ lockedCelebrationRef.current='fireworks'; onUpdate({celebration:'fireworks'}) }} />
        <Key label="-" active={celebration==='balloons'} onClick={()=>{ lockedCelebrationRef.current='balloons'; onUpdate({celebration:'balloons'}) }} />
        <Key label="+" active={celebration==='confetti'} onClick={()=>{ lockedCelebrationRef.current='confetti'; onUpdate({celebration:'confetti'}) }} />
        <Key label="CL" onClick={onGenerate} className="cl-key" />
        <Key label="SET" onClick={onReset} className="set-key" />
        <Key label="?" onClick={onToggleHistory} className="help-key" />
        <button className="space" onClick={()=>{ if(task.status==='generated') onUpdate({progress: Math.min(task.sections, task.progress+1)}) }}>Space</button>
      </div>
    </div>
  )
}
