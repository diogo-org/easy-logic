import { describe, it, expect, beforeEach } from 'vitest'
import { NaturalDeduction } from './NaturalDeduction'
import { ProofState, RULE_KEYS } from './types'

describe('Bug Fixes - Critical Issues', () => {
  let nd: NaturalDeduction

  beforeEach(() => {
    nd = new NaturalDeduction()
  })

  describe('Bug #1: Line Number Calculation with Nested Subproofs', () => {
    it('should correctly compute line numbers when closing immediate subproof', () => {
      // Test: Opening and immediately closing a subproof should generate correct line number
      // Currently fails because computeLineNumber may not handle this edge case
      
      const state: ProofState = {
        goal: 'p -> p',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 1,
            isSubproofStart: true,
          },
        ],
        currentDepth: 1,
        currentSubproofId: '',
        nextStepInSubproof: [1, 2],
        isComplete: false,
      }

      // Apply impl_intro to close the subproof
      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.applyRule(implIntroRule, state, [])

      expect(result).not.toBeNull()
      expect(result?.lineNumber).toBe('2')  // Should be 2, not 1 or 1.1
      expect(result?.depth).toBe(0)
    })

    it('should correctly compute line numbers after closing subproof with multiple outer steps', () => {
      // Test: Line numbers after subproof should continue from parent depth numbering
      // This tests the edge case where parent has steps before the subproof
      
      const state: ProofState = {
        goal: 'q -> (p -> r)',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'q',
            ruleKey: RULE_KEYS.PREMISE,
            dependencies: [],
            justificationKey: 'justificationPremise',
            depth: 0,
          },
          {
            id: 2,
            lineNumber: '2',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 1,
            isSubproofStart: true,
          },
          {
            id: 3,
            lineNumber: '2.1',
            formula: 'r',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 1,
          },
        ],
        currentDepth: 1,
        currentSubproofId: '',
        nextStepInSubproof: [2, 4],
        isComplete: false,
      }

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.applyRule(implIntroRule, state, [])

      expect(result).not.toBeNull()
      // After closing subproof, next line should be 3 (continuing from parent)
      expect(result?.lineNumber).toBe('3')
      expect(result?.depth).toBe(0)
    })
  })

  describe('Bug #2: Modus Ponens with Negation - Formula Parsing Edge Case', () => {
    it('should correctly apply modus tollens with doubly negated formulas', () => {
      // Test case for proper formula handling with negation
      // When we have ~(~p) -> q and ~q, Modus Tollens should derive the negation of antecedent
      // The antecedent ~(~p) parses as ~~p, so negating gives ~(~~p)
      
      const state: ProofState = {
        goal: '~(~p)',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: '~(~p) -> q',
            ruleKey: RULE_KEYS.PREMISE,
            dependencies: [],
            justificationKey: 'justificationPremise',
            depth: 0,
          },
          {
            id: 2,
            lineNumber: '2',
            formula: '~q',
            ruleKey: RULE_KEYS.PREMISE,
            dependencies: [],
            justificationKey: 'justificationPremise',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const mtRule = nd.getRules().find((r) => r.id === 'mt')!
      const result = nd.applyRule(mtRule, state, [1, 2])

      expect(result).not.toBeNull()
      // The result should wrap the antecedent in parentheses when negating
      expect(result?.formula).toBe('~(~~p)')
      expect(result?.ruleKey).toBe(RULE_KEYS.MODUS_TOLLENS)
    })
  })

  describe('Bug #3: State Update After Rule Application in Hook', () => {
    it('validates proof completion state after applying rules', () => {
      // This tests that the validation logic properly checks if a proof is complete
      // after applying rules
      
      const kb = nd.getKnowledgeBases().find(kb => kb.id === 'modus-ponens')!
      const premiseSteps = kb.premises.map((premise, idx) => ({
        id: idx + 1,
        lineNumber: String(idx + 1),
        formula: premise,
        ruleKey: RULE_KEYS.PREMISE,
        dependencies: [] as number[],
        justificationKey: 'justificationPremise',
        depth: 0,
      }))

      const state: ProofState = {
        goal: 'q',
        premises: kb.premises,
        steps: premiseSteps,
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [premiseSteps.length + 1],
        isComplete: false,
      }

      // Apply modus ponens
      const mpRule = nd.getRules().find((r) => r.id === 'mp')!
      const newStep = nd.applyRule(mpRule, state, [1, 2])

      expect(newStep).not.toBeNull()
      expect(newStep!.formula).toBe('q')

      // Check if proof is now complete
      const completeState: ProofState = {
        ...state,
        steps: [...state.steps, newStep!],
        isComplete: nd.validateProof({
          ...state,
          steps: [...state.steps, newStep!],
        }),
      }

      expect(completeState.isComplete).toBe(true)
    })
  })

  describe('Bug #4: Depth Management in Complex Subproof Scenarios', () => {
    it('should correctly track depth when we have nested assumptions', () => {
      // Test: (p -> (q -> r)) proof requires nested subproofs
      // This tests proper depth tracking across multiple levels
      
      const state: ProofState = {
        goal: 'p -> (q -> r)',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 1,
            isSubproofStart: true,
          },
          {
            id: 2,
            lineNumber: '1.1',
            formula: 'q',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 2,
            isSubproofStart: true,
          },
          {
            id: 3,
            lineNumber: '1.1.1',
            formula: 'r',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 2,
          },
        ],
        currentDepth: 2,
        currentSubproofId: '',
        nextStepInSubproof: [2, 4],
        isComplete: false,
      }

      // Close inner subproof (q -> r)
      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const innerResult = nd.applyRule(implIntroRule, state, [])

      expect(innerResult).not.toBeNull()
      expect(innerResult?.formula).toBe('(q) -> (r)')
      expect(innerResult?.depth).toBe(1)  // Back to depth 1
    })
  })
})
