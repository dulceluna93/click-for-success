import React, { useEffect, useState } from 'react'

export default function Paper({
  task,
  history,
  showHistory,
  showEmojiSettings,
  showManual,
  showVolumeSettings,
  soundVolume,
  showCelebrationRequired,
  emojiConfettiFillers,
  onUpdate,
  onSaveEmojiConfetti,
  onChangeSoundVolume,
  onExportHistory,
  formatHistoryDate,
  formatHistoryDuration
}) {
  const isEditing = task.status === 'idle' && !showHistory && !showEmojiSettings && !showManual && !showVolumeSettings
  const paperState = isEditing ? 'paper-collapsed' : 'paper-expanded'
  const [draftEmojis, setDraftEmojis] = useState(emojiConfettiFillers)
  const [isEditingSections, setIsEditingSections] = useState(false)
  const [sectionsDraft, setSectionsDraft] = useState(String(task.sections))
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  useEffect(() => {
    if (showEmojiSettings) {
      setDraftEmojis(emojiConfettiFillers)
    }
  }, [showEmojiSettings, emojiConfettiFillers])

  useEffect(() => {
    if (task.status !== 'idle') setIsEditingSections(false)
    setSectionsDraft(String(task.sections))
  }, [task.sections, task.status])

  useEffect(() => {
    if (!showHistory) setShowExportConfirm(false)
  }, [showHistory])

  const celebrationMarks = {
    emojiConfetti: '☆',
    confetti: '✦'
  }
  const celebrationMark = celebrationMarks[task.celebration] || (showCelebrationRequired ? '?' : null)

  function updateDraft(index, value) {
    setDraftEmojis(current => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  function submitEmojiSettings(event) {
    event.preventDefault()
    onSaveEmojiConfetti(draftEmojis)
  }

  function startEditingSections() {
    if (!isEditing) return
    setSectionsDraft(String(task.sections))
    setIsEditingSections(true)
  }

  function saveSections() {
    const nextSections = Number.parseInt(sectionsDraft, 10)
    if (Number.isFinite(nextSections)) {
      onUpdate({ sections: Math.max(1, nextSections) })
    }
    setIsEditingSections(false)
  }

  function handleSectionsKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveSections()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setSectionsDraft(String(task.sections))
      setIsEditingSections(false)
    }
  }

  function renderVolumeIcon(level) {
    if (level === 0) return '🔇'
    if (level <= 2) return '🔈'
    if (level <= 4) return '🔉'
    return '🔊'
  }

  return (
    <div className={`paper ${task.status} ${paperState}`}>
      <div className="paper-content">
        {showManual ? (
          <div className="manual-view">
            <h3>--- 说明书 ---</h3>
            <div className="manual-section-title">任务功能：</div>
            <div className="manual-list">
              <div><span className="manual-key">输入框：</span>直接输入任务名称；</div>
              <div><span className="manual-key">进度总数：</span>生成前点击数字直接修改；</div>
              <div><span className="manual-key">1：</span>增加任务进度划分；</div>
              <div><span className="manual-key">2：</span>减少任务进度划分；</div>
              <div><span className="manual-key">0：</span>礼花内的表情设置；</div>
              <div><span className="manual-key">"-"：</span>礼花庆祝；</div>
              <div><span className="manual-key">"+"：</span>彩带庆祝；</div>
              <div><span className="manual-key">CL / Enter：</span>生成任务；</div>
              <div><span className="manual-key">SET / Shift：</span>重置任务；</div>
              <div><span className="manual-key">Space：</span>完成进度1；</div>
              <div><span className="manual-key">生成后：</span>任务划分数量锁定；</div>
            </div>
            <div className="manual-section-title">计时器功能：</div>
            <div className="manual-list">
              <div><span className="manual-key">U：</span>增加10min；</div>
              <div><span className="manual-key">I：</span>减少1min；</div>
              <div><span className="manual-key">O：</span>正计时；</div>
              <div><span className="manual-key">P：</span>倒计时；</div>
              <div><span className="manual-key">右上方按键：</span>开始计时/归零；</div>
            </div>
            <div className="manual-section-title">其他按键：</div>
            <div className="manual-list">
              <div><span className="manual-key">Z：</span>电脑键盘映射开关；</div>
              <div><span className="manual-key">映射输入：</span>输入框内仅显示按键效果（任务名内Enter除外）；</div>
              <div><span className="manual-key">","：</span>音量设置；</div>
              <div><span className="manual-key">"."：</span>说明书；</div>
              <div><span className="manual-key">"/"：</span>历史记录及TXT导出；</div>
              <div><span className="manual-key">"?"便签：</span>显示按键提示；</div>
              <div><span className="manual-key">左上角圆盘：</span>切换抽屉模式；</div>
              <div><span className="manual-key">Pin / Min / X：</span>置顶/最小化/关闭；</div>
            </div>
          </div>
        ) : showVolumeSettings ? (
          <div className="volume-view">
            <h3>音量设置</h3>
            <div className="volume-row">
              <span className="volume-icon">{renderVolumeIcon(0)}</span>
              <input
                className="volume-slider"
                type="range"
                min="0"
                max="5"
                step="1"
                value={Math.round(soundVolume * 5)}
                onChange={(event) => onChangeSoundVolume(Number(event.target.value) / 5)}
              />
              <span className="volume-icon">{renderVolumeIcon(5)}</span>
            </div>
            <div className="volume-value">当前音量：{Math.round(soundVolume * 5)} / 5</div>
          </div>
        ) : showHistory ? (
          <div className="receipt">
            <div className="history-heading-row">
              <h3>--- HISTORY ---</h3>
              <button
                type="button"
                className="history-export-button"
                aria-label="导出完成记录"
                title="导出完成记录"
                disabled={history.length === 0}
                onClick={() => setShowExportConfirm(true)}
              >
                <span className="history-export-icon" aria-hidden="true" />
              </button>
            </div>
            <div className="history-list">
              {history.length === 0 && <div className="hint">暂无记录</div>}
              {history.map(h => (
                <div className="history-item" key={h.id}>
                  <div className="hist-title">{h.title || '无题任务'} <span className="hist-sections">{h.sections ?? '-'}</span></div>
                  <div className="hist-meta">{formatHistoryDate(h.createdAt)}</div>
                  <div className="hist-duration">用时 {formatHistoryDuration(h.durationMs)}</div>
                  <div className="divider">------------------</div>
                </div>
              ))}
            </div>
            {showExportConfirm && (
              <div className="history-export-backdrop">
                <div className="history-export-dialog" role="dialog" aria-modal="true" aria-labelledby="history-export-title">
                  <div id="history-export-title" className="history-export-title">是否导出完成记录？</div>
                  <div className="history-export-actions">
                    <button type="button" onClick={() => setShowExportConfirm(false)}>取消</button>
                    <button
                      type="button"
                      className="history-export-confirm"
                      onClick={() => {
                        setShowExportConfirm(false)
                        onExportHistory()
                      }}
                    >
                      导出
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : showEmojiSettings ? (
          <form className="emoji-settings" onSubmit={submitEmojiSettings}>
            <div className="emoji-settings-title">请选择礼花填充物：</div>
            <div className="emoji-settings-controls">
              <input
                className="emoji-input"
                aria-label="第一个礼花填充物"
                value={draftEmojis[0] || ''}
                onChange={(event) => updateDraft(0, event.target.value)}
              />
              <input
                className="emoji-input"
                aria-label="第二个礼花填充物"
                value={draftEmojis[1] || ''}
                onChange={(event) => updateDraft(1, event.target.value)}
              />
              <button className="emoji-confirm" type="submit">确定</button>
            </div>
          </form>
        ) : (
          <div className="task-view">
            <div className="title-area">
              {isEditing ? (
                <input
                  className="title-input"
                  placeholder="在此输入任务名称..."
                  autoFocus
                  value={task.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  style={{ position: 'relative', zIndex: 10, color: '#333', background: 'transparent', border: 'none', width: '100%', fontSize: '24px', fontFamily: 'inherit' }}
                />
              ) : (
                <div className="task-title-display">{task.title || '无题任务'}</div>
              )}
            </div>

            <div className="status-area">
              <div className="status-line">
                <div className="task-progress-display">
                  进度: <span className="current-num">{task.progress}</span> /{' '}
                  {isEditingSections && isEditing ? (
                    <input
                      className="sections-input"
                      type="number"
                      min="1"
                      step="1"
                      value={sectionsDraft}
                      autoFocus
                      aria-label="任务划分数量"
                      onChange={(event) => setSectionsDraft(event.target.value)}
                      onBlur={saveSections}
                      onKeyDown={handleSectionsKeyDown}
                    />
                  ) : isEditing ? (
                    <button
                      type="button"
                      className="sections-edit-button"
                      onClick={startEditingSections}
                      title="修改任务划分数量"
                    >
                      {task.sections}
                    </button>
                  ) : (
                    <span>{task.sections}</span>
                  )}
                </div>
                {celebrationMark && (
                  <div className="celebration-mark" aria-label="selected celebration">
                    {celebrationMark}
                  </div>
                )}
              </div>
              {!isEditing && task.status === 'completed' && <div className="stamp">COMPLETED</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
