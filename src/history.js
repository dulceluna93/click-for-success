export const HISTORY_LIMITS = [50, 200, 500]

export function getHistorySteps(entry) {
  const timestamps = entry.stepCompletedAtMs
  const startedAt = Date.parse(entry.createdAt)
  if (!Array.isArray(timestamps) || !Number.isFinite(startedAt)) return []

  const steps = []
  let previous = startedAt
  for (const time of timestamps) {
    if (typeof time !== 'number' || !Number.isFinite(new Date(time).getTime()) || time < previous) return []
    steps.push({ time, duration: time - previous })
    previous = time
  }
  return steps
}

export function formatStepDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor(totalSeconds / 3600) % 24
  const minutes = Math.floor(totalSeconds / 60) % 60
  const seconds = totalSeconds % 60
  return [
    days ? `${days}天` : '',
    hours ? `${hours}小时` : '',
    minutes ? `${minutes}分钟` : '',
    seconds || totalSeconds === 0 ? `${seconds}秒` : ''
  ].join('')
}
