import React from 'react'

export default function HistoryPanel({history, onSelect}){
  return (
    <div className="history-panel">
      {history.map(h=> (
        <div key={h.id} className="history-row" onClick={()=>onSelect(h)}>
          <div className="h-title">{h.title}</div>
          <div className="h-meta">{new Date(h.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}
