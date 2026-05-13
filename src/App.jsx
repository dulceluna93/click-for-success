import React, {useEffect, useState, useRef} from 'react'
import Paper from './components/Paper'
import Keyboard from './components/Keyboard'
import Timer from './components/Timer'
import HistoryPanel from './components/HistoryPanel'
import { playCelebration } from './celebrations/index'

const STORAGE_KEY = 'cfs_history_v1'
const HISTORY_MAX = 50

export default function App(){
  const [task, setTask] = useState({
    id: null,
    title: '',
    sections: 10,
    progress: 0,
    status: 'idle', // idle, editing, ready, generated, completed
    celebration: null // 'confetti'|'fireworks'|'balloons'
  })
  const [history, setHistory] = useState(() => {
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }catch(e){return[]}
  })
  const [showHistory, setShowHistory] = useState(false)
  const lockedCelebration = useRef(null)

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  },[history])

  useEffect(()=>{
    function onKey(e){
      const k = e.key
      if(k === '1') setTask(t => ({...t, sections: Math.max(1, t.sections-1)}))
      if(k === '2') setTask(t => ({...t, sections: t.sections+1}))
      if(k === '0'){ lockedCelebration.current = 'fireworks'; setTask(t=>({...t, celebration:'fireworks'})) }
      if(k === '-'){ lockedCelebration.current = 'balloons'; setTask(t=>({...t, celebration:'balloons'})) }
      if(k === '='){ lockedCelebration.current = 'confetti'; setTask(t=>({...t, celebration:'confetti'})) }
      if(k === ' '){ // space completes a section
        e.preventDefault()
        setTask(t => {
          if(t.status !== 'generated') return t
          const p = Math.min(t.sections, t.progress+1)
          const status = p === t.sections ? 'completed' : t.status
          if(status === 'completed'){
            // finalize and push to history (only when completed)
            const entry = {
              id: 'task-'+Date.now(),
              title: t.title,
              sections: t.sections,
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              celebration: t.celebration || lockedCelebration.current
            }
            setHistory(h => {
              const next = [entry, ...h].slice(0, HISTORY_MAX)
              return next
            })
            playCelebration(t.celebration || lockedCelebration.current)
          }
          return {...t, progress: p, status}
        })
      }
      if(k.toLowerCase() === 'c'){ // CL -> generate task (do not write preview into history)
        setTask(t => ({...t, id: t.id||'task-'+Date.now(), status: 'generated'}))
      }
      if(k === '?') setShowHistory(s=>!s)
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[task])

  function updateTask(up){ setTask(t => ({...t, ...up})) }
  function onGenerate(){
    setTask(t => ({...t, id: t.id||'task-'+Date.now(), status: 'generated'}))
    // do not write a preview entry to history here; history only stores completed tasks
  }
  function onResetTask(){ setTask({id:null,title:'',sections:10,progress:0,status:'idle',celebration:null}); lockedCelebration.current = null }
  function onSelectHistoryItem(item){
    // render receipt on paper (read-only)
    setShowHistory(true)
    setTask(t => ({...t}))
    // Paper will read history prop to render
  }

  return (
    <div className="app-root">
      <div className="printer">
        <Paper task={task} history={history} showHistory={showHistory} />
        <div className="body">
          <div className="logo">ClickforSuccess</div>
          <div className="timer-area">
            <Timer />
          </div>
        </div>
        <Keyboard
          task={task}
          onUpdate={updateTask}
          onGenerate={onGenerate}
          onReset={onResetTask}
          lockedCelebrationRef={lockedCelebration}
          onToggleHistory={()=>setShowHistory(s=>!s)}
        />
      </div>
      <div className="footer-note">按键示例：1/2 调整分节，0/-/= 选择 烟火/气球/彩带，Space 完成一节，C (CL) 生成任务</div>
    </div>
  )
}
