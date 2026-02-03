/**
 * Celebration animations for proof completion
 * Contains keyframes and configuration for epic celebrations
 */

import { keyframes } from '@mui/material'

// 🎆 EPIC CELEBRATION ANIMATIONS 🎆

// Confetti falling with spinning
export const confettiFall = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(1080deg) scale(0.5);
    opacity: 0;
  }
`

// Stars twinkling
export const twinkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`

// Pulse heartbeat
export const heartbeat = keyframes`
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
`

// Shake the screen!
export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
`

// Firework burst
export const fireworkBurst = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
`

// Rainbow color cycle
export const rainbowGlow = keyframes`
  0% { filter: hue-rotate(0deg) drop-shadow(0 0 20px gold); }
  100% { filter: hue-rotate(360deg) drop-shadow(0 0 40px gold); }
`

// Big bang entrance
export const bounceIn = keyframes`
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(5deg); }
  70% { transform: scale(0.9) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`

// Float up
export const floatUp = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
`

export const confettiColors = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ff8800',
  '#88ff00',
  '#ff0088',
  '#00ff88',
  '#gold',
  '#silver',
]

export const shapes = ['●', '■', '▲', '★', '♦', '♥', '✦', '✧']
