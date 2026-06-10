import celebrateSound from './assets/sounds/celebrate.mp3'
import generateSound from './assets/sounds/generate.mp3'
import spacePressSound from './assets/sounds/space-press.mp3'
import taskCompleteSound from './assets/sounds/task-complete.mp3'
import timeoverSound from './assets/sounds/timeover.mp3'

const sources = {
  celebrate: celebrateSound,
  generate: generateSound,
  spacePress: spacePressSound,
  taskComplete: taskCompleteSound,
  timeover: timeoverSound
}

let soundVolume = 1

export function setSoundVolume(volume) {
  soundVolume = Math.min(1, Math.max(0, volume))
}

export function playSound(name) {
  const src = sources[name]
  if (!src || soundVolume <= 0) return Promise.resolve()

  const audio = new Audio(src)
  audio.volume = soundVolume
  audio.currentTime = 0
  return audio.play().catch(() => {})
}
