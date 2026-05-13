import React from 'react'

export default function Paper({task, history, showHistory}){
  return (
    <div className="paper">
      {!task.title && task.status==='idle' && !showHistory && (
        <input className="title-input" placeholder="在此输入任务名称，然后按 CL (C) 生成" value={task.title} onChange={()=>{}} />
      )}
      <div className="paper-content">
        {showHistory ? (
          <div className="receipt">
            <h3>历史记录</h3>
            <div className="history-list">
              {history.map(h=> (
                <div className="history-item" key={h.id}>
                  <div className="hist-title">{h.title}</div>
                  <div className="hist-meta">{new Date(h.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="task-block">
            <div className="task-title">{task.title || '（空）'}</div>
            <div className="task-progress">{task.progress}/{task.sections}</div>
          </div>
        )}
      </div>
    </div>
  )
}
