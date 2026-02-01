import { describe, it, expect } from 'vitest'
import { NaturalDeduction } from './NaturalDeduction'
import { ProofState, RULE_KEYS } from './types'

describe('NaturalDeduction', () => {
  const nd = new NaturalDeduction()

  describe('getSuggestedGoals', () => {
    it('returns a list of suggested goals', () => {
      const goals = nd.getSuggestedGoals()
      expect(goals.length).toBeGreaterThan(0)
      expect(goals[0]).toHaveProperty('labelKey')
      expect(goals[0]).toHaveProperty('formula')
      expect(goals[0]).toHaveProperty('descriptionKey')
    })
  })

  describe('getRules', () => {
    it('returns all available rules', () => {
      const rules = nd.getRules()
      expect(rules.length).toBeGreaterThan(0)
      expect(rules[0]).toHaveProperty('id')
      expect(rules[0]).toHaveProperty('nameKey')
      expect(rules[0]).toHaveProperty('category')
    })
  })

  describe('checkApplicability', () => {
    it('marks Assume as always applicable', () => {
      const state: ProofState = {
        goal: 'p -> p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const assumeRule = nd.getRules().find((r) => r.id === 'assume')!
      const result = nd.checkApplicability(assumeRule, state)

      expect(result.applicable).toBe(true)
    })

    it('marks implication intro as not applicable without assumption', () => {
      const state: ProofState = {
        goal: 'p -> p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.checkApplicability(implIntroRule, state)

      expect(result.applicable).toBe(false)
      expect(result.reason).toBe('No open assumption to close')
    })

    it('marks implication intro as applicable with open assumption', () => {
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
          },
        ],
        currentDepth: 1,
        currentSubproofId: '',
        nextStepInSubproof: [1, 2],
        isComplete: false,
      }

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.checkApplicability(implIntroRule, state)

      expect(result.applicable).toBe(true)
    })
  })

  describe('applyRule', () => {
    it('applies Assume rule with user input', () => {
      const state: ProofState = {
        goal: 'p -> p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const assumeRule = nd.getRules().find((r) => r.id === 'assume')!
      const result = nd.applyRule(assumeRule, state, [], 'p')

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('p')
      expect(result?.ruleKey).toBe(RULE_KEYS.ASSUME)
      expect(result?.depth).toBe(1)
    })

    it('applies conjunction introduction', () => {
      const state: ProofState = {
        goal: '(p ^ q)',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
          {
            id: 2,
            lineNumber: '2',
            formula: 'q',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const andIntroRule = nd.getRules().find((r) => r.id === 'and_intro')!
      const result = nd.applyRule(andIntroRule, state, [1, 2])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('(p) ^ (q)')
      expect(result?.ruleKey).toBe(RULE_KEYS.AND_INTRO)
    })

    it('applies conjunction elimination left', () => {
      const state: ProofState = {
        goal: 'p',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p ^ q',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const andElimRule = nd.getRules().find((r) => r.id === 'and_elim_left')!
      const result = nd.applyRule(andElimRule, state, [1])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('p')
      expect(result?.ruleKey).toBe(RULE_KEYS.AND_ELIM_LEFT)
    })

    it('applies modus ponens', () => {
      const state: ProofState = {
        goal: 'q',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
          {
            id: 2,
            lineNumber: '2',
            formula: 'p -> q',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const mpRule = nd.getRules().find((r) => r.id === 'mp')!
      const result = nd.applyRule(mpRule, state, [1, 2])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('q')
      expect(result?.ruleKey).toBe(RULE_KEYS.MODUS_PONENS)
    })

    it('applies double negation', () => {
      const state: ProofState = {
        goal: 'p',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: '~~p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const dnRule = nd.getRules().find((r) => r.id === 'double_neg')!
      const result = nd.applyRule(dnRule, state, [1])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('p')
      expect(result?.ruleKey).toBe(RULE_KEYS.DOUBLE_NEG)
    })

    it('applies conjunction elimination right', () => {
      const state: ProofState = {
        goal: 'q',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p ^ q',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const andElimRightRule = nd.getRules().find((r) => r.id === 'and_elim_right')!
      const result = nd.applyRule(andElimRightRule, state, [1])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('q')
      expect(result?.ruleKey).toBe(RULE_KEYS.AND_ELIM_RIGHT)
    })

    it('applies disjunction introduction left', () => {
      const state: ProofState = {
        goal: 'p | q',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orIntroLeftRule = nd.getRules().find((r) => r.id === 'or_intro_left')!
      const result = nd.applyRule(orIntroLeftRule, state, [1], 'q')

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('(p) | (q)')
      expect(result?.ruleKey).toBe(RULE_KEYS.OR_INTRO_LEFT)
    })

    it('applies disjunction introduction right', () => {
      const state: ProofState = {
        goal: 'q | p',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orIntroRightRule = nd.getRules().find((r) => r.id === 'or_intro_right')!
      const result = nd.applyRule(orIntroRightRule, state, [1], 'q')

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('(q) | (p)')
      expect(result?.ruleKey).toBe(RULE_KEYS.OR_INTRO_RIGHT)
    })

    it('applies implication introduction', () => {
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

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.applyRule(implIntroRule, state, [])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('(p) -> (p)')
      expect(result?.ruleKey).toBe(RULE_KEYS.IMPL_INTRO)
      expect(result?.depth).toBe(0)
      expect(result?.isSubproofEnd).toBe(true)
    })

    it('applies modus tollens', () => {
      const state: ProofState = {
        goal: '~p',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p -> q',
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
      expect(result?.formula).toContain('~')
      expect(result?.formula).toContain('p')
      expect(result?.ruleKey).toBe(RULE_KEYS.MODUS_TOLLENS)
    })
  })

  describe('validateProof', () => {
    it('returns false for empty proof', () => {
      const state: ProofState = {
        goal: 'p -> p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      expect(nd.validateProof(state)).toBe(false)
    })

    it('returns false with open assumptions', () => {
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
          },
        ],
        currentDepth: 1,
        currentSubproofId: '',
        nextStepInSubproof: [1, 2],
        isComplete: false,
      }

      expect(nd.validateProof(state)).toBe(false)
    })

    it('returns true when goal is proven at depth 0', () => {
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
          },
          {
            id: 2,
            lineNumber: '2',
            formula: 'p -> p',
            ruleKey: RULE_KEYS.IMPL_INTRO,
            dependencies: [1],
            justificationKey: 'justificationImplIntro',
            justificationParams: { start: '1', end: '1' },
            depth: 0,
          },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      expect(nd.validateProof(state)).toBe(true)
    })
  })

  describe('getKnowledgeBases', () => {
    it('returns knowledge bases with premises and goals', () => {
      const kbs = nd.getKnowledgeBases()
      expect(kbs.length).toBeGreaterThan(0)
      
      const mpKb = kbs.find(kb => kb.id === 'modus-ponens')
      expect(mpKb).toBeDefined()
      expect(mpKb!.premises).toEqual(['p', 'p -> q'])
      expect(mpKb!.suggestedGoals[0].formula).toBe('q')
    })
  })

  describe('complete proof flow - Modus Ponens', () => {
    it('completes a proof using Modus Ponens knowledge base', () => {
      // Simulate the user flow: start with MP knowledge base, prove q
      const kb = nd.getKnowledgeBases().find(kb => kb.id === 'modus-ponens')!
      
      // Create initial state with premises as steps
      const premiseSteps = kb.premises.map((premise, idx) => ({
        id: idx + 1,
        lineNumber: String(idx + 1),
        formula: premise,
        ruleKey: RULE_KEYS.PREMISE,
        dependencies: [] as number[],
        justificationKey: 'justificationPremise',
        depth: 0,
      }))

      let state: ProofState = {
        goal: 'q',
        premises: kb.premises,
        steps: premiseSteps,
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [premiseSteps.length + 1],
        isComplete: false,
      }

      // User selects step 1 (p) and step 2 (p -> q), applies Modus Ponens
      const mpRule = nd.getRules().find(r => r.id === 'mp')!
      const newStep = nd.applyRule(mpRule, state, [1, 2])

      expect(newStep).not.toBeNull()
      expect(newStep!.formula).toBe('q')

      // Add the new step to the proof
      state = {
        ...state,
        steps: [...state.steps, newStep!],
      }

      // Validate the proof is complete
      expect(nd.validateProof(state)).toBe(true)
    })
  })

  describe('complete proof flow - Conjunction Elimination', () => {
    it('completes a proof using Conjunction Elimination knowledge base', () => {
      const kb = nd.getKnowledgeBases().find(kb => kb.id === 'elimination')!
      
      const premiseSteps = kb.premises.map((premise, idx) => ({
        id: idx + 1,
        lineNumber: String(idx + 1),
        formula: premise,
        ruleKey: RULE_KEYS.PREMISE,
        dependencies: [] as number[],
        justificationKey: 'justificationPremise',
        depth: 0,
      }))

      let state: ProofState = {
        goal: 'p',
        premises: kb.premises,
        steps: premiseSteps,
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [premiseSteps.length + 1],
        isComplete: false,
      }

      // User selects step 1 (p ^ q), applies AND Elimination Left
      const andElimRule = nd.getRules().find(r => r.id === 'and_elim_left')!
      const newStep = nd.applyRule(andElimRule, state, [1])

      expect(newStep).not.toBeNull()
      expect(newStep!.formula).toBe('p')

      state = {
        ...state,
        steps: [...state.steps, newStep!],
      }

      expect(nd.validateProof(state)).toBe(true)
    })
  })

  describe('complete proof flow - Hypothetical Syllogism', () => {
    it('completes a multi-step proof (two Modus Ponens applications)', () => {
      const kb = nd.getKnowledgeBases().find(kb => kb.id === 'syllogism')!
      
      const premiseSteps = kb.premises.map((premise, idx) => ({
        id: idx + 1,
        lineNumber: String(idx + 1),
        formula: premise,
        ruleKey: RULE_KEYS.PREMISE,
        dependencies: [] as number[],
        justificationKey: 'justificationPremise',
        depth: 0,
      }))

      let state: ProofState = {
        goal: 'r',
        premises: kb.premises,
        steps: premiseSteps,  // [p, p->q, q->r]
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [premiseSteps.length + 1],
        isComplete: false,
      }

      // Step 1: Apply MP on step 1 (p) and step 2 (p -> q) to get q
      const mpRule = nd.getRules().find(r => r.id === 'mp')!
      const step4 = nd.applyRule(mpRule, state, [1, 2])

      expect(step4).not.toBeNull()
      expect(step4!.formula).toBe('q')

      state = { ...state, steps: [...state.steps, step4!] }

      // Step 2: Apply MP on step 4 (q) and step 3 (q -> r) to get r
      const step5 = nd.applyRule(mpRule, state, [4, 3])

      expect(step5).not.toBeNull()
      expect(step5!.formula).toBe('r')

      state = { ...state, steps: [...state.steps, step5!] }

      expect(nd.validateProof(state)).toBe(true)
    })
  })

  describe('or_elim rule', () => {
    it('checks applicability - requires a disjunction', () => {
      const stateWithoutDisjunction: ProofState = {
        goal: 'r',
        premises: ['p'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.checkApplicability(orElimRule, stateWithoutDisjunction)

      expect(result.applicable).toBe(false)
      expect(result.reason).toBe('Need a disjunction (P∨Q) to apply this rule')
    })

    it('checks applicability - applicable when disjunction exists', () => {
      const stateWithDisjunction: ProofState = {
        goal: 'r',
        premises: ['p | q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.checkApplicability(orElimRule, stateWithDisjunction)

      expect(result.applicable).toBe(true)
    })

    it('applies or_elim to create branching step', () => {
      const state: ProofState = {
        goal: 'r',
        premises: ['p | q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.applyRule(orElimRule, state, [1])

      expect(result).not.toBeNull()
      expect(result?.ruleKey).toBe(RULE_KEYS.OR_ELIM)
      expect(result?.formula).toContain('p')
      expect(result?.formula).toContain('q')
    })

    it('returns null when no step is selected', () => {
      const state: ProofState = {
        goal: 'r',
        premises: ['p | q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.applyRule(orElimRule, state, [])

      expect(result).toBeNull()
    })

    it('returns null when selected step is not a disjunction', () => {
      const state: ProofState = {
        goal: 'r',
        premises: ['p'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.applyRule(orElimRule, state, [1])

      expect(result).toBeNull()
    })
  })
})
