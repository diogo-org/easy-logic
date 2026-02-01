/**
 * UI Constants - Named constants to avoid magic numbers
 */

// Layout constants
export const LAYOUT = {
  DEPTH_INDENT_PX: 16,
  SMALL_SPACING_PX: 4,
  RULE_BUTTON_MIN_WIDTH: 120,
} as const

// Animation durations (milliseconds)
export const ANIMATION_MS = {
  FAST: 1000,
  MEDIUM: 2000,
  SLOW: 6000,
  SHAKE_DURATION: 0.5,
} as const

// Celebration animation constants
export const CELEBRATION = {
  // Counts
  CONFETTI_COUNT: 150,
  FIREWORK_COUNT: 12,
  FLOATING_EMOJI_COUNT: 30,
  STAR_COUNT: 50,
  
  // Timing
  MAX_DELAY_S: 3,
  FIREWORK_DELAY_S: 2,
  MIN_DURATION_S: 2,
  MAX_DURATION_EXTRA_S: 3,
  
  // Positioning percentages
  SCALE_PERCENT: 100,
  MIN_POSITION_PERCENT: 10,
  MAX_X_POSITION_PERCENT: 80,
  MAX_Y_POSITION_PERCENT: 60,
  MAX_BOTTOM_PERCENT: 30,
  
  // Sizes
  CONFETTI_SIZE_MIN: 10,
  CONFETTI_SIZE_RANGE: 15,
  FIREWORK_SIZE_MIN: 50,
  FIREWORK_SIZE_RANGE: 100,
  EMOJI_SIZE_MIN: 24,
  EMOJI_SIZE_RANGE: 32,
  STAR_SIZE_MIN: 10,
  STAR_SIZE_RANGE: 20,
  
  // Rotation
  FULL_ROTATION_DEG: 360,
  
  // Twinkle timing
  TWINKLE_BASE_DURATION: 1,
  TWINKLE_RANDOM_DELAY: 1,
} as const

// Proof hint step counts
export const PROOF_HINT_STEPS = {
  SYLLOGISM_INITIAL: 3,
  SYLLOGISM_AFTER_MP: 4,
  STEPS_REQUIRED: 2,
} as const

// Opacity values
export const OPACITY = {
  HALF: 0.5,
  FULL: 1,
  TRANSPARENT: 0,
} as const

// Parser constants
export const PARSER = {
  OPERATOR_ARROW_LENGTH: 3,
} as const
