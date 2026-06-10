import JSConfetti from 'js-confetti'

let jsConfetti

export function emojiConfetti(emojis = ['⭐', '✨']) {
  if (!jsConfetti) {
    jsConfetti = new JSConfetti()
  }

  jsConfetti.addConfetti({
    emojis,
    emojiSize: 34,
    confettiNumber: 72
  })
}
