import { describe, it, expect } from 'vitest'
import { NaturalDeduction } from './NaturalDeduction'
import { ProofState, RULE_KEYS } from './types'
import { tokenizeAndParse } from '../formula/common'

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

    it('marks implication intro as not applicable when depth is open but no assumption exists at current depth', () => {
      const state: ProofState = {
        goal: 'p -> p',
        premises: [],
        steps: [
          {
            id: 1,
            lineNumber: '1',
            formula: 'p',
            ruleKey: RULE_KEYS.PREMISE,
            dependencies: [],
            justificationKey: 'justificationPremise',
            depth: 0,
          },
        ],
        currentDepth: 1,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.checkApplicability(implIntroRule, state)

      expect(result.applicable).toBe(false)
      expect(result.reason).toBe('No open assumption to close')
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

    it('closes the latest open assumption when there are previous closed assumptions at the same depth', () => {
      const state: ProofState = {
        goal: 'q -> q',
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
            lineNumber: '2',
            formula: '(p) -> (p)',
            ruleKey: RULE_KEYS.IMPL_INTRO,
            dependencies: [1, 1],
            justificationKey: 'justificationImplIntro',
            depth: 0,
            isSubproofEnd: true,
          },
          {
            id: 3,
            lineNumber: '3',
            formula: 'r',
            ruleKey: RULE_KEYS.PREMISE,
            dependencies: [],
            justificationKey: 'justificationPremise',
            depth: 0,
          },
          {
            id: 4,
            lineNumber: '4',
            formula: 'q',
            ruleKey: RULE_KEYS.ASSUME,
            dependencies: [],
            justificationKey: 'justificationAssumption',
            depth: 1,
            isSubproofStart: true,
          },
          {
            id: 5,
            lineNumber: '4.1',
            formula: 'q',
            ruleKey: RULE_KEYS.PREMISE,
            dependencies: [],
            justificationKey: 'justificationPremise',
            depth: 1,
          },
        ],
        currentDepth: 1,
        currentSubproofId: '',
        nextStepInSubproof: [6],
        isComplete: false,
      }

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.applyRule(implIntroRule, state, [])

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('(q) -> (q)')
      expect(result?.dependencies).toEqual([4, 5])
      expect(result?.lineNumber).toBe('5')
    })

    it('uses hierarchical numbering when closing nested subproofs', () => {
      const state: ProofState = {
        goal: 'p -> (q -> q)',
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
        ],
        currentDepth: 2,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const implIntroRule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.applyRule(implIntroRule, state, [])

      expect(result).not.toBeNull()
      expect(result?.lineNumber).toBe('1.2')
      expect(result?.depth).toBe(1)
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

    it('should handle LEM-generated formulas like (p | ~p) | ~(p | ~p)', () => {
      const state: ProofState = {
        goal: 'r',
        premises: [],
        steps: [
          { id: 1, lineNumber: '1', formula: '(p | ~p) | ~(p | ~p)', ruleKey: RULE_KEYS.LEM, dependencies: [], justificationKey: 'justificationLEM', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.applyRule(orElimRule, state, [1])

      expect(result).not.toBeNull()
      // Should NOT contain brackets [ or ]
      expect(result?.formula).not.toContain('[')
      expect(result?.formula).not.toContain(']')
      // Should be parseable
      expect(() => tokenizeAndParse(result!.formula)).not.toThrow()
    })

    it('should handle nested disjunctions with parentheses', () => {
      const state: ProofState = {
        goal: 'r',
        premises: [],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | ~p | ~(p | ~p)', ruleKey: RULE_KEYS.LEM, dependencies: [], justificationKey: 'justificationLEM', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const orElimRule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.applyRule(orElimRule, state, [1])

      expect(result).not.toBeNull()
      // Should NOT contain brackets [ or ]
      expect(result?.formula).not.toContain('[')
      expect(result?.formula).not.toContain(']')
      // Should be parseable
      expect(() => tokenizeAndParse(result!.formula)).not.toThrow()
    })
  })

  describe('Law of Excluded Middle (LEM)', () => {
    describe('rule availability', () => {
      it('should have a LEM rule defined', () => {
        const lemRule = nd.getRules().find((r) => r.id === 'lem')
        expect(lemRule).toBeDefined()
        expect(lemRule?.nameKey).toBe('ruleLEM')
        expect(lemRule?.descriptionKey).toBe('ruleLEMDesc')
        expect(lemRule?.requiredSteps).toBe(0)
      })

      it('should always be applicable regardless of state', () => {
        const emptyState: ProofState = {
          goal: 'p | ~p',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const applicability = nd.checkApplicability(lemRule, emptyState)
        expect(applicability.applicable).toBe(true)
      })

      it('should be applicable even with existing steps', () => {
        const stateWithSteps: ProofState = {
          goal: 'q',
          premises: ['p -> q'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p -> q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          ],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [2],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const applicability = nd.checkApplicability(lemRule, stateWithSteps)
        expect(applicability.applicable).toBe(true)
      })
    })

    describe('formula generation - simple variables', () => {
      it('should generate "p | ~p" for input "p"', () => {
        const state: ProofState = {
          goal: 'p | ~p',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'p')

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('p | ~p')
        expect(result?.ruleKey).toBe(RULE_KEYS.LEM)
      })

      it('should generate "q | ~q" for input "q"', () => {
        const state: ProofState = {
          goal: 'q | ~q',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'q')

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('q | ~q')
      })

      it('should generate "r | ~r" for input "r"', () => {
        const state: ProofState = {
          goal: 'r | ~r',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'r')

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('r | ~r')
      })
    })

    describe('formula generation - complex formulas', () => {
      it('should generate "(p -> q) | ~(p -> q)" for input "p -> q"', () => {
        const state: ProofState = {
          goal: '(p -> q) | ~(p -> q)',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'p -> q')

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('(p -> q) | ~(p -> q)')
      })

      it('should generate "(p ^ q) | ~(p ^ q)" for input "p ^ q"', () => {
        const state: ProofState = {
          goal: '(p ^ q) | ~(p ^ q)',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'p ^ q')

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('(p ^ q) | ~(p ^ q)')
      })

      it('should generate "(p | q) | ~(p | q)" for input "p | q"', () => {
        const state: ProofState = {
          goal: '(p | q) | ~(p | q)',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'p | q')

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('(p | q) | ~(p | q)')
      })

      it('should generate "(p | ~p) | ~(p | ~p)" for input "p | ~p"', () => {
        const state: ProofState = {
          goal: '(p | ~p) | ~(p | ~p)',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'p | ~p')

        expect(result).not.toBeNull()
        // Should be "(p | ~p) | ~(p | ~p)", NOT "p | ~p | ~p | ~p"
        expect(result?.formula).toBe('(p | ~p) | ~(p | ~p)')
        // Verify parentheses are present
        expect(result?.formula).toContain('(p | ~p)')
      })
    })

    describe('formula generation - already parenthesized', () => {
      it('should not add extra parentheses to "(p -> q)" input', () => {
        const state: ProofState = {
          goal: '(p -> q) | ~(p -> q)',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], '(p -> q)')

        expect(result).not.toBeNull()
        // Should be (p -> q) | ~(p -> q), not ((p -> q)) | ~((p -> q))
        expect(result?.formula).toBe('(p -> q) | ~(p -> q)')
      })
    })

    describe('step metadata', () => {
      it('should have correct justification and dependencies', () => {
        const state: ProofState = {
          goal: 'p | ~p',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], 'p')

        expect(result?.justificationKey).toBe('justificationLEM')
        expect(result?.dependencies).toEqual([])
        expect(result?.depth).toBe(0)
      })

      it('should not require any selected steps', () => {
        const state: ProofState = {
          goal: 'p | ~p',
          premises: ['q'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          ],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [2],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        // Pass empty array for selectedSteps
        const result = nd.applyRule(lemRule, state, [], 'p')

        expect(result).not.toBeNull()
        expect(result?.dependencies).toEqual([])
      })
    })

    describe('error handling', () => {
      it('should return null when no user input is provided', () => {
        const state: ProofState = {
          goal: 'p | ~p',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [])

        expect(result).toBeNull()
      })

      it('should return null when user input is empty string', () => {
        const state: ProofState = {
          goal: 'p | ~p',
          premises: [],
          steps: [],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [1],
          isComplete: false,
        }

        const lemRule = nd.getRules().find((r) => r.id === 'lem')!
        const result = nd.applyRule(lemRule, state, [], '')

        expect(result).toBeNull()
      })
    })
  })

  // Level 1: Simple Direct Rules - Complete Proofs
  describe('Level 1: Simple Direct Rules', () => {
    describe('Test 1: Basic Modus Ponens - P, P→Q ⊢ Q', () => {
      it('should complete proof with single MP application', () => {
        const state: ProofState = {
          goal: 'q',
          premises: ['p', 'p -> q'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
            { id: 2, lineNumber: '2', formula: 'p -> q', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
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
        expect(state.goal).toBe('q')
      })
    })

    describe('Test 2: Conjunction Introduction - P, Q ⊢ P^Q', () => {
      it('should complete proof with ∧I', () => {
        const state: ProofState = {
          goal: 'p ^ q',
          premises: ['p', 'q'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
            { id: 2, lineNumber: '2', formula: 'q', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
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
      })
    })

    describe('Test 3: Conjunction Elimination Left - P^Q ⊢ P', () => {
      it('should complete proof with ∧E left', () => {
        const state: ProofState = {
          goal: 'p',
          premises: ['p ^ q'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p ^ q', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
          ],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [2],
          isComplete: false,
        }

        const andElimLeftRule = nd.getRules().find((r) => r.id === 'and_elim_left')!
        const result = nd.applyRule(andElimLeftRule, state, [1])

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('p')
      })
    })

    describe('Test 4: Conjunction Elimination Right - P^Q ⊢ Q', () => {
      it('should complete proof with ∧E right', () => {
        const state: ProofState = {
          goal: 'q',
          premises: ['p ^ q'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p ^ q', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
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
      })
    })

    describe('Test 5: Disjunction Introduction Left - P ⊢ P|Q', () => {
      it('should complete proof with ∨I left', () => {
        const state: ProofState = {
          goal: 'p | q',
          premises: ['p'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
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
      })
    })

    describe('Test 6: Double Negation - ~~P ⊢ P', () => {
      it('should complete proof with ¬¬E', () => {
        const state: ProofState = {
          goal: 'p',
          premises: ['~~p'],
          steps: [
            { id: 1, lineNumber: '1', formula: '~~p', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
          ],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [2],
          isComplete: false,
        }

        const doubleNegRule = nd.getRules().find((r) => r.id === 'double_neg')!
        const result = nd.applyRule(doubleNegRule, state, [1])

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('p')
      })
    })
  })

  // Level 2: Multiple Steps
  describe('Level 2: Multiple rule applications', () => {
    describe('Test 7: Chained Modus Ponens - P, P→Q, Q→R ⊢ R', () => {
      it('should complete proof with two MP applications', () => {
        const state: ProofState = {
          goal: 'r',
          premises: ['p', 'p -> q', 'q -> r'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
            { id: 2, lineNumber: '2', formula: 'p -> q', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
            { id: 3, lineNumber: '3', formula: 'q -> r', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
          ],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [4],
          isComplete: false,
        }

        const mpRule = nd.getRules().find((r) => r.id === 'mp')!
        
        // First MP: p, p→q ⊢ q
        const step1 = nd.applyRule(mpRule, state, [1, 2])
        expect(step1).not.toBeNull()
        expect(step1?.formula).toBe('q')

        // Add step to state
        state.steps.push({ ...step1!, id: 4, lineNumber: '4', depth: 0 })
        state.nextStepInSubproof = [5]

        // Second MP: q, q→r ⊢ r
        const step2 = nd.applyRule(mpRule, state, [4, 3])
        expect(step2).not.toBeNull()
        expect(step2?.formula).toBe('r')
      })
    })

    describe('Test 8: Conjunction chain - P^Q, (P^Q)→R ⊢ R', () => {
      it('should complete proof with ∧E and MP', () => {
        const state: ProofState = {
          goal: 'r',
          premises: ['p ^ q', '(p ^ q) -> r'],
          steps: [
            { id: 1, lineNumber: '1', formula: 'p ^ q', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
            { id: 2, lineNumber: '2', formula: '(p ^ q) -> r', ruleKey: RULE_KEYS.PREMISE, justificationKey: 'justificationPremise', dependencies: [], depth: 0 },
          ],
          currentDepth: 0,
          currentSubproofId: '',
          nextStepInSubproof: [3],
          isComplete: false,
        }

        const mpRule = nd.getRules().find((r) => r.id === 'mp')!
        const result = nd.applyRule(mpRule, state, [1, 2])

        expect(result).not.toBeNull()
        expect(result?.formula).toBe('r')
      })
    })
  })

  describe('applyRule error handling', () => {
    it('returns null for assume without user input', () => {
      const state: ProofState = {
        goal: 'p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const assumeRule = nd.getRules().find((r) => r.id === 'assume')!
      const result = nd.applyRule(assumeRule, state, [], undefined)

      expect(result).toBeNull()
    })

    it('returns null for mp with wrong number of steps', () => {
      const state: ProofState = {
        goal: 'q',
        premises: ['p', 'p -> q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          { id: 2, lineNumber: '2', formula: 'p -> q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const mpRule = nd.getRules().find((r) => r.id === 'mp')!
      const result = nd.applyRule(mpRule, state, [1]) // Only one step instead of two

      expect(result).toBeNull()
    })

    it('returns null for mp with non-existent step ids', () => {
      const state: ProofState = {
        goal: 'q',
        premises: ['p', 'p -> q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          { id: 2, lineNumber: '2', formula: 'p -> q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const mpRule = nd.getRules().find((r) => r.id === 'mp')!
      const result = nd.applyRule(mpRule, state, [1, 999]) // Second id doesn't exist

      expect(result).toBeNull()
    })

    it('returns null for mp with non-implication formula', () => {
      const state: ProofState = {
        goal: 'q',
        premises: ['p', 'q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          { id: 2, lineNumber: '2', formula: 'q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const mpRule = nd.getRules().find((r) => r.id === 'mp')!
      const result = nd.applyRule(mpRule, state, [1, 2]) // Second is not an implication

      expect(result).toBeNull()
    })

    it('returns null for and_elim_left on non-conjunction', () => {
      const state: ProofState = {
        goal: 'p',
        premises: ['p | q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'and_elim_left')!
      const result = nd.applyRule(rule, state, [1])

      expect(result).toBeNull()
    })

    it('returns null for and_elim_right on non-conjunction', () => {
      const state: ProofState = {
        goal: 'q',
        premises: ['p | q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'and_elim_right')!
      const result = nd.applyRule(rule, state, [1])

      expect(result).toBeNull()
    })

    it('returns null for double_neg on non-negation', () => {
      const state: ProofState = {
        goal: 'p',
        premises: ['p'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'double_neg')!
      const result = nd.applyRule(rule, state, [1])

      expect(result).toBeNull()
    })

    it('returns null for double_neg on single negation', () => {
      const state: ProofState = {
        goal: 'p',
        premises: ['~p'],
        steps: [
          { id: 1, lineNumber: '1', formula: '~p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'double_neg')!
      const result = nd.applyRule(rule, state, [1])

      expect(result).toBeNull()
    })

    it('returns null for or_intro_left without user input', () => {
      const state: ProofState = {
        goal: 'p | q',
        premises: ['p'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'or_intro_left')!
      const result = nd.applyRule(rule, state, [1], undefined) // No user input

      expect(result).toBeNull()
    })

    it('returns null for or_intro_right without user input', () => {
      const state: ProofState = {
        goal: 'p | q',
        premises: ['q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'or_intro_right')!
      const result = nd.applyRule(rule, state, [1], undefined) // No user input

      expect(result).toBeNull()
    })

    it('returns null for lem without user input', () => {
      const state: ProofState = {
        goal: 'p | ~p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'lem')!
      const result = nd.applyRule(rule, state, [], undefined) // No user input

      expect(result).toBeNull()
    })

    it('returns null for lem with empty user input', () => {
      const state: ProofState = {
        goal: 'p | ~p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'lem')!
      const result = nd.applyRule(rule, state, [], '   ') // Empty/whitespace user input

      expect(result).toBeNull()
    })

    it('returns null for impl_intro without open assumption', () => {
      const state: ProofState = {
        goal: 'p -> q',
        premises: [],
        steps: [],
        currentDepth: 0, // No open assumption
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'impl_intro')!
      const result = nd.applyRule(rule, state, [])

      expect(result).toBeNull()
    })

    it('returns null for or_elim on non-disjunction', () => {
      const state: ProofState = {
        goal: 'p',
        premises: ['p ^ q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p ^ q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [2],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'or_elim')!
      const result = nd.applyRule(rule, state, [1])

      expect(result).toBeNull()
    })

    it('returns null for disj_syl with non-two-steps', () => {
      const state: ProofState = {
        goal: 'q',
        premises: ['p | q', '~p'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p | q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          { id: 2, lineNumber: '2', formula: '~p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'disj_syl')!
      const result = nd.applyRule(rule, state, [1]) // Only one step

      expect(result).toBeNull()
    })

    it('handles rule application with unknown rule id', () => {
      const state: ProofState = {
        goal: 'p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      // Create a fake rule with unknown id
      const fakeRule = { id: 'unknown_rule', nameKey: 'test', category: 'basic' as const, requiredSteps: 0, descriptionKey: 'test' }
      const result = nd.applyRule(fakeRule, state, [])

      expect(result).toBeNull()
    })

    it('applies lem successfully with simple formula', () => {
      const state: ProofState = {
        goal: 'p | ~p',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'lem')!
      const result = nd.applyRule(rule, state, [], 'p')

      expect(result).not.toBeNull()
      expect(result?.formula).toBe('p | ~p')
    })

    it('applies lem with formula that needs parentheses', () => {
      const state: ProofState = {
        goal: '(p ^ q) | ~(p ^ q)',
        premises: [],
        steps: [],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [1],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'lem')!
      const result = nd.applyRule(rule, state, [], 'p ^ q')

      expect(result).not.toBeNull()
      expect(result?.formula).toContain('|')
      expect(result?.formula).toContain('~')
    })

    it('returns null for mt with non-implication', () => {
      const state: ProofState = {
        goal: '~p',
        premises: ['p', '~q'],
        steps: [
          { id: 1, lineNumber: '1', formula: 'p', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
          { id: 2, lineNumber: '2', formula: '~q', ruleKey: RULE_KEYS.PREMISE, dependencies: [], justificationKey: 'justificationPremise', depth: 0 },
        ],
        currentDepth: 0,
        currentSubproofId: '',
        nextStepInSubproof: [3],
        isComplete: false,
      }

      const rule = nd.getRules().find((r) => r.id === 'mt')!
      const result = nd.applyRule(rule, state, [1, 2])

      expect(result).toBeNull()
    })
  })
})
