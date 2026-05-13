import React, {useState, useEffect, useRef} from 'react'

export default function Timer(){
  const [mode,setMode] = useState('countup')
  const [running,setRunning] = useState(false)
  const [time,setTime] = useState(0)
  const ref = useRef(null)

  useEffect(()=>{
    if(running){
      ref.current = setInterval(()=> setTime(t=>t+1), 1000)
    } else {
      clearInterval(ref.current)
    }
    return ()=> clearInterval(ref.current)
  },[running])

  function start(){ setRunning(true) }
  function pause(){ setRunning(false) }
  function reset(){ setRunning(false); setTime(0) }

  return (
    <div className="timer">
      <div className="time-display">{new Date(time*1000).toISOString().substr(11,8)}</div>
      <div className="timer-controls">
        <button onClick={()=>setTime(t=>t+60)}>Q+</button>
        <button onClick={()=>setTime(t=>Math.max(0,t-60))}>W-</button>
        <button onClick={start}>E</button>
        <button onClick={pause}>R</button>
        <button onClick={reset}>T</button>
      </div>
    </div>
  )
}
