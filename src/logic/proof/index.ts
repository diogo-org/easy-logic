/**
 * Proof module - pure business logic for proof systems
 */

// Types
export type { 
  ProofStep, 
  ProofState, 
  ApplicableRule, 
} from './types'

// Constants
export { RULE_KEYS } from './types'

// Natural Deduction proof system
export { NaturalDeduction } from './NaturalDeduction'
