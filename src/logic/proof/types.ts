/**
 * Type definitions for the proof assistant
 * 
 * This is pure business logic - no React or UI dependencies.
 */

/** Constants for rule keys - use these for type-safe comparisons */
export const RULE_KEYS = {
  ASSUME: 'ruleAssume',
  MODUS_PONENS: 'ruleModusPonens',
  MODUS_TOLLENS: 'ruleModusTollens',
  AND_INTRO: 'ruleAndIntro',
  AND_ELIM_LEFT: 'ruleAndElimLeft',
  AND_ELIM_RIGHT: 'ruleAndElimRight',
  OR_INTRO_LEFT: 'ruleOrIntroLeft',
  OR_INTRO_RIGHT: 'ruleOrIntroRight',
  DOUBLE_NEG: 'ruleDoubleNeg',
  IMPL_INTRO: 'ruleImplIntro',
  OR_ELIM: 'ruleOrElim',
  PREMISE: 'rulePremise',
} as const

export type RuleKey = typeof RULE_KEYS[keyof typeof RULE_KEYS]

export interface ProofStep {
  id: number // Sequential ID for internal tracking
  lineNumber: string // Fitch-style display number (e.g., "1", "2.1", "2.2.1")
  formula: string
  ruleKey: RuleKey // Translation key for the rule name
  dependencies: number[] // IDs of steps this depends on
  justificationKey: string // Translation key for justification
  justificationParams?: Record<string, string | number> // Parameters for translation interpolation
  depth: number // For nested subproofs (0 = main, 1 = first subproof, etc.)
  subproofId?: string // Which subproof this step belongs to (e.g., "2", "2.1")
  isSubproofStart?: boolean // True if this step opens a new subproof (e.g., Assume)
  isSubproofEnd?: boolean // True if this step closes a subproof (e.g., →I)
}

export interface ProofState {
  goal: string
  premises: string[] // Initial assumptions/axioms
  steps: ProofStep[]
  currentDepth: number
  currentSubproofId: string // Current subproof we're in (e.g., "", "2", "2.1")
  nextStepInSubproof: number[] // Stack of next step numbers per depth level
  isComplete: boolean
  // For ∨E: parallel branches that both need to derive the same conclusion
  orElimBranches?: {
    disjunctionStepId: number
    leftBranchId: string
    rightBranchId: string
    targetConclusion?: string // What both branches must derive
    leftComplete: boolean
    rightComplete: boolean
  }
}

export interface Rule {
  id: string
  nameKey: string // Translation key for name
  descriptionKey: string // Translation key for description
  category: 'basic' | 'introduction' | 'elimination' | 'assumption'
  requiredSteps: number // How many previous steps needed
  pattern?: string // Pattern to match
}

export interface ApplicableRule extends Rule {
  applicable: boolean
  reason?: string // Why it's not applicable
}

export interface SuggestedGoal {
  labelKey: string // Translation key for label
  formula: string
  descriptionKey: string // Translation key for description
}

export interface KnowledgeBase {
  id: string
  nameKey: string // Translation key for name
  descriptionKey: string // Translation key for description
  premises: string[]
  suggestedGoals: SuggestedGoal[]
}

/**
 * Abstract interface for proof systems
 * Uses Strategy pattern to allow different proof systems (Natural Deduction, Sequent Calculus, etc.)
 */
export interface ProofSystem {
  name: string
  getRules(): Rule[]
  getKnowledgeBases(): KnowledgeBase[]
  checkApplicability(rule: Rule, state: ProofState): ApplicableRule
  applyRule(rule: Rule, state: ProofState, selectedSteps: number[], userInput?: string): ProofStep | null
  validateProof(state: ProofState): boolean
  getSuggestedGoals(): SuggestedGoal[]
}
