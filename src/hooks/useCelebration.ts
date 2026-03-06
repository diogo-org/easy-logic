/**
 * Custom hook for celebration animations
 * Handles all celebration-related state and logic
 */

/* eslint-disable sonarjs/pseudo-random -- Math.random() is used only for visual animations (confetti position, size, delay), not for security purposes */

import { useState, useCallback } from 'react'
import { confettiColors, shapes } from '../constants/animations'
import { CELEBRATION, ANIMATION_MS } from '../constants/ui'

export function useCelebration() {
  const [showCelebration, setShowCelebration] = useState(false)

  // Generate confetti pieces
  const generateConfetti = useCallback(() => {
    return Array.from({ length: CELEBRATION.CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * CELEBRATION.SCALE_PERCENT,
      delay: Math.random() * CELEBRATION.MAX_DELAY_S,
      duration:
        CELEBRATION.MIN_DURATION_S +
        Math.random() * CELEBRATION.MAX_DURATION_EXTRA_S,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size:
        CELEBRATION.CONFETTI_SIZE_MIN +
        Math.random() * CELEBRATION.CONFETTI_SIZE_RANGE,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * CELEBRATION.FULL_ROTATION_DEG,
    }))
  }, [])

  // Generate fireworks
  const generateFireworks = useCallback(() => {
    return Array.from({ length: CELEBRATION.FIREWORK_COUNT }, (_, i) => ({
      id: i,
      left:
        CELEBRATION.MIN_POSITION_PERCENT +
        Math.random() * CELEBRATION.MAX_X_POSITION_PERCENT,
      top:
        CELEBRATION.MIN_POSITION_PERCENT +
        Math.random() * CELEBRATION.MAX_Y_POSITION_PERCENT,
      delay: Math.random() * CELEBRATION.FIREWORK_DELAY_S,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size:
        CELEBRATION.FIREWORK_SIZE_MIN +
        Math.random() * CELEBRATION.FIREWORK_SIZE_RANGE,
    }))
  }, [])

  // Generate floating emojis
  const generateFloatingEmojis = useCallback(() => {
    const emojis = [
      '🎉',
      '🎊',
      '🌟',
      '⭐',
      '✨',
      '💫',
      '🎆',
      '🎇',
      '🏆',
      '👏',
      '🙌',
      '💯',
      '🔥',
      '💪',
    ]
    return Array.from({ length: CELEBRATION.FLOATING_EMOJI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * CELEBRATION.SCALE_PERCENT,
      bottom: Math.random() * CELEBRATION.MAX_BOTTOM_PERCENT,
      delay: Math.random() * CELEBRATION.MAX_DELAY_S,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size:
        CELEBRATION.EMOJI_SIZE_MIN +
        Math.random() * CELEBRATION.EMOJI_SIZE_RANGE,
    }))
  }, [])

  const [confetti, setConfetti] = useState(generateConfetti())
  const [fireworks, setFireworks] = useState(generateFireworks())
  const [floatingEmojis, setFloatingEmojis] = useState(generateFloatingEmojis())

  const triggerCelebration = useCallback(() => {
    setShowCelebration(true)
    setConfetti(generateConfetti())
    setFireworks(generateFireworks())
    setFloatingEmojis(generateFloatingEmojis())

    // Phase 2: More fireworks after 1 second
    setTimeout(() => {
      setFireworks(generateFireworks())
    }, ANIMATION_MS.FAST)

    // Phase 3: Even more after 2 seconds
    setTimeout(() => {
      setConfetti(generateConfetti())
    }, ANIMATION_MS.MEDIUM)

    // Auto-hide celebration after 6 seconds
    setTimeout(() => {
      setShowCelebration(false)
    }, ANIMATION_MS.SLOW)
  }, [generateConfetti, generateFireworks, generateFloatingEmojis])

  const closeCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  return {
    showCelebration,
    confetti,
    fireworks,
    floatingEmojis,
    triggerCelebration,
    closeCelebration,
  }
}
