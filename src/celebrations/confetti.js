import launchConfetti from 'canvas-confetti'

// Launch pattern adapted from Toby Smith's Confetti Cannon (ISC).
// See public/third-party-notices.txt.
const CANNONS = [
  { x: 0, angle: 45 },
  { x: 0.5, angle: 90 },
  { x: 1, angle: 135 }
]

const BURSTS = [
  { share: 0.25, spread: 26, velocity: 100, decay: 0.9 },
  { share: 0.2, spread: 60, velocity: 45, decay: 0.9 },
  { share: 0.35, spread: 100, velocity: 45, decay: 0.91 },
  { share: 0.1, spread: 120, velocity: 50, decay: 0.92 },
  { share: 0.1, spread: 120, velocity: 90, decay: 0.9 }
]

export function confetti() {
  const countPerCannon = Math.min(160, Math.max(50, Math.round(window.innerWidth / 7)))
  const velocityScale = Math.min(1, Math.max(0.38, Math.sqrt(window.innerHeight / 900)))

  for (const { x, angle } of CANNONS) {
    for (const { share, spread, velocity, decay } of BURSTS) {
      launchConfetti({
        origin: { x, y: 1 },
        angle,
        particleCount: Math.round(countPerCannon * share),
        spread,
        startVelocity: velocity * velocityScale,
        decay,
        disableForReducedMotion: true
      })
    }
  }
}
