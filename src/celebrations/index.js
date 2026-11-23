import { confetti } from './confetti'
import { emojiConfetti } from './emojiConfetti'

export function playCelebration(name, { emojis } = {}) {
  if (name === 'confetti') confetti()
  if (name === 'emojiConfetti') emojiConfetti(emojis)
}
