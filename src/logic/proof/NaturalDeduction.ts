/**
 * Natural Deduction proof system implementation
 * 
 * This is pure business logic - no React or UI dependencies.
 */

import { ProofSystem, Rule, ProofState, ProofStep, ApplicableRule, KnowledgeBase, RULE_KEYS } from './types'
import { tokenizeAndParse, FormulaType } from '../formula/common'
import { knowledgeBases } from './knowledgeBases'
import { naturalDeductionRules } from './rules'
import { formulaToString, isFullyParenthesized, parseImplication, normalizeFormula } from './formulaHelpers'

export class NaturalDeduction implements ProofSystem {
  name = 'Natural Deduction'

  private knowledgeBases = knowledgeBases
  private rules = naturalDeductionRules

  getRules(): Rule[] {
    return this.rules
  }

  getKnowledgeBases(): KnowledgeBase[] {
    return this.knowledgeBases
  }

  checkApplicability(rule: Rule, state: ProofState): ApplicableRule {
    const availableSteps = state.steps.filter(step => step.depth <= state.currentDepth)

    // Assume is always applicable
    if (rule.id === 'assume') {
      return { ...rule, applicable: true }
    }

    // Law of Excluded Middle is always applicable
    if (rule.id === 'lem') {
      return { ...rule, applicable: true }
    }

    // Implication introduction only works if we have an open assumption
    if (rule.id === 'impl_intro') {
      const hasOpenAssumptionAtDepth = state.currentDepth > 0 &&
        state.steps.some((step) => step.depth === state.currentDepth && step.ruleKey === RULE_KEYS.ASSUME)
      const lastStep = state.steps[state.steps.length - 1]
      const hasConclusionAtCurrentDepth = Boolean(lastStep && lastStep.depth === state.currentDepth)
      const hasOpenAssumption = hasOpenAssumptionAtDepth && hasConclusionAtCurrentDepth
      return {
        ...rule,
        applicable: hasOpenAssumption,
        reason: hasOpenAssumption ? undefined : 'No open assumption to close',
      }
    }

    // Or elimination needs a disjunction
    if (rule.id === 'or_elim') {
      const hasDisjunction = state.steps.some(s => {
        try {
          const parsed = tokenizeAndParse(s.formula)
          return parsed.type === FormulaType.OR
        } catch {
          return false
        }
      })
      return {
        ...rule,
        applicable: hasDisjunction,
        reason: hasDisjunction ? undefined : 'Need a disjunction (P∨Q) to apply this rule',
      }
    }

    // Check if we have enough steps at current depth
    if (availableSteps.length < rule.requiredSteps) {
      return {
        ...rule,
        applicable: false,
        reason: `Need at least ${rule.requiredSteps} step(s) at current depth`,
      }
    }

    // For now, mark all other rules as potentially applicable
    // More sophisticated checking would parse formulas and match patterns
    return { ...rule, applicable: true }
  }

  /**
   * Get one step from the state by ID. Returns null if selection is invalid.
   */
  private getOneStep(state: ProofState, selectedSteps: number[]): ProofStep | null {
    if (selectedSteps.length !== 1) {return null}
    return state.steps.find(s => s.id === selectedSteps[0]) || null
  }

  /**
   * Get two steps from the state by IDs. Returns null if selection is invalid.
   */
  private getTwoSteps(state: ProofState, selectedSteps: number[]): [ProofStep, ProofStep] | null {
    if (selectedSteps.length !== 2) {return null}
    const step1 = state.steps.find(s => s.id === selectedSteps[0])
    const step2 = state.steps.find(s => s.id === selectedSteps[1])
    if (!step1 || !step2) {return null}
    return [step1, step2]
  }

  /**
   * Compute the next line number based on state
   * - At depth 0: sequential (1, 2, 3...)
   * - Opening subproof: current.1 (e.g., if at line 3 and opening subproof, next is 3.1)
   * - Inside subproof: sequential in that subproof (3.1, 3.2, 3.3...)
   * - Closing subproof: return to parent depth numbering
   */
  private computeLineNumber(state: ProofState, isNewSubproof: boolean): string {
    if (state.steps.length === 0) {
      return '1'
    }

    if (isNewSubproof) {
      // Starting a new subproof - use last step's number + ".1"
      const lastStep = state.steps[state.steps.length - 1]
      const lastLineNumber = lastStep.lineNumber || String(state.steps.length)
      return `${lastLineNumber}.1`
    }

    // Find the last step at our target depth
    const lastStepAtDepth = [...state.steps].reverse().find(s => s.depth === state.currentDepth)
    
    if (lastStepAtDepth && lastStepAtDepth.lineNumber) {
      // Increment the last segment of the line number
      const parts = lastStepAtDepth.lineNumber.split('.')
      const lastPart = parseInt(parts[parts.length - 1], 10)
      parts[parts.length - 1] = String(lastPart + 1)
      return parts.join('.')
    }

    // Fallback: just use sequential
    return String(state.steps.length + 1)
  }

  applyRule(
    rule: Rule,
    state: ProofState,
    selectedSteps: number[],
    userInput?: string
  ): ProofStep | null {
    const newId = state.steps.length + 1

    try {
      const handler = this.ruleHandlers[rule.id]
      if (!handler) {return null}
      return handler(newId, state, selectedSteps, userInput)
    } catch (error) {
      console.error('Error applying rule:', error)
      return null
    }
  }

  /** Maps rule IDs to their handler functions */
  private ruleHandlers: Record<string, (newId: number, state: ProofState, selectedSteps: number[], userInput?: string) => ProofStep | null> = {
    assume: (newId, state, _selectedSteps, userInput) => {
      if (!userInput) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, true),
        formula: userInput,
        ruleKey: RULE_KEYS.ASSUME,
        dependencies: [],
        justificationKey: 'justificationAssumption',
        depth: state.currentDepth + 1,
        isSubproofStart: true,
      }
    },

    mp: (newId, state, selectedSteps) => {
      const steps = this.getTwoSteps(state, selectedSteps)
      if (!steps) {return null}
      const [step1, step2] = steps
      const result = this.tryModusPonens(step1, step2) || this.tryModusPonens(step2, step1)
      if (!result) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: result,
        ruleKey: RULE_KEYS.MODUS_PONENS,
        dependencies: selectedSteps,
        justificationKey: 'justificationMP',
        justificationParams: { step1: step1.lineNumber, step2: step2.lineNumber },
        depth: state.currentDepth,
      }
    },

    mt: (newId, state, selectedSteps) => {
      const steps = this.getTwoSteps(state, selectedSteps)
      if (!steps) {return null}
      const [step1, step2] = steps
      const result = this.tryModusTollens(step1, step2) || this.tryModusTollens(step2, step1)
      if (!result) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: result,
        ruleKey: RULE_KEYS.MODUS_TOLLENS,
        dependencies: selectedSteps,
        justificationKey: 'justificationMT',
        justificationParams: { step1: step1.lineNumber, step2: step2.lineNumber },
        depth: state.currentDepth,
      }
    },

    and_intro: (newId, state, selectedSteps) => {
      const steps = this.getTwoSteps(state, selectedSteps)
      if (!steps) {return null}
      const [step1, step2] = steps
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: `(${step1.formula}) ^ (${step2.formula})`,
        ruleKey: RULE_KEYS.AND_INTRO,
        dependencies: selectedSteps,
        justificationKey: 'justificationAndIntro',
        justificationParams: { step1: step1.lineNumber, step2: step2.lineNumber },
        depth: state.currentDepth,
      }
    },

    and_elim_left: (newId, state, selectedSteps) => {
      const step = this.getOneStep(state, selectedSteps)
      if (!step) {return null}
      const parsed = tokenizeAndParse(step.formula)
      if (parsed.type !== FormulaType.AND || !parsed.left) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: formulaToString(parsed.left),
        ruleKey: RULE_KEYS.AND_ELIM_LEFT,
        dependencies: selectedSteps,
        justificationKey: 'justificationAndElimLeft',
        justificationParams: { step: step.lineNumber },
        depth: state.currentDepth,
      }
    },

    and_elim_right: (newId, state, selectedSteps) => {
      const step = this.getOneStep(state, selectedSteps)
      if (!step) {return null}
      const parsed = tokenizeAndParse(step.formula)
      if (parsed.type !== FormulaType.AND || !parsed.right) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: formulaToString(parsed.right),
        ruleKey: RULE_KEYS.AND_ELIM_RIGHT,
        dependencies: selectedSteps,
        justificationKey: 'justificationAndElimRight',
        justificationParams: { step: step.lineNumber },
        depth: state.currentDepth,
      }
    },

    or_intro_left: (newId, state, selectedSteps, userInput) => {
      const step = this.getOneStep(state, selectedSteps)
      if (!step || !userInput) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: `(${step.formula}) | (${userInput})`,
        ruleKey: RULE_KEYS.OR_INTRO_LEFT,
        dependencies: selectedSteps,
        justificationKey: 'justificationOrIntroLeft',
        justificationParams: { step: step.lineNumber },
        depth: state.currentDepth,
      }
    },

    or_intro_right: (newId, state, selectedSteps, userInput) => {
      const step = this.getOneStep(state, selectedSteps)
      if (!step || !userInput) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: `(${userInput}) | (${step.formula})`,
        ruleKey: RULE_KEYS.OR_INTRO_RIGHT,
        dependencies: selectedSteps,
        justificationKey: 'justificationOrIntroRight',
        justificationParams: { step: step.lineNumber },
        depth: state.currentDepth,
      }
    },

    double_neg: (newId, state, selectedSteps) => {
      const step = this.getOneStep(state, selectedSteps)
      if (!step) {return null}
      const parsed = tokenizeAndParse(step.formula)
      if (parsed.type !== FormulaType.NOT || !parsed.left || parsed.left.type !== FormulaType.NOT || !parsed.left.left) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: formulaToString(parsed.left.left),
        ruleKey: RULE_KEYS.DOUBLE_NEG,
        dependencies: selectedSteps,
        justificationKey: 'justificationDoubleNeg',
        justificationParams: { step: step.lineNumber },
        depth: state.currentDepth,
      }
    },

    impl_intro: (newId, state) => {
      return this.applyImplIntro(newId, state)
    },

    or_elim: (newId, state, selectedSteps) => {
      const step = this.getOneStep(state, selectedSteps)
      if (!step) {return null}
      const parsed = tokenizeAndParse(step.formula)
      if (parsed.type !== FormulaType.OR || !parsed.left || !parsed.right) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: step.formula,
        ruleKey: RULE_KEYS.OR_ELIM,
        dependencies: selectedSteps,
        justificationKey: 'justificationOrElim',
        justificationParams: { step: step.lineNumber },
        depth: state.currentDepth,
      }
    },

    lem: (newId, state, _selectedSteps, userInput) => {
      return this.applyLEM(newId, state, userInput)
    },

    disj_syl: (newId, state, selectedSteps) => {
      const steps = this.getTwoSteps(state, selectedSteps)
      if (!steps) {return null}
      const [step1, step2] = steps
      const result = this.tryDisjunctiveSyllogism(step1, step2) || this.tryDisjunctiveSyllogism(step2, step1)
      if (!result) {return null}
      return {
        id: newId,
        lineNumber: this.computeLineNumber(state, false),
        formula: result,
        ruleKey: RULE_KEYS.DISJ_SYL,
        dependencies: selectedSteps,
        justificationKey: 'justificationDisjSyl',
        justificationParams: { step1: step1.lineNumber, step2: step2.lineNumber },
        depth: state.currentDepth,
      }
    },
  }

  private applyImplIntro(newId: number, state: ProofState): ProofStep | null {
    if (state.currentDepth === 0) {return null}

    const closedAssumptionIds = new Set(
      state.steps
        .filter((step) => step.ruleKey === RULE_KEYS.IMPL_INTRO && step.dependencies.length >= 1)
        .map((step) => step.dependencies[0])
    )

    const assumption = state.steps.find(
      (step) =>
        step.depth === state.currentDepth &&
        step.ruleKey === RULE_KEYS.ASSUME &&
        !closedAssumptionIds.has(step.id)
    )

    const conclusion = [...state.steps]
      .reverse()
      .find((step) => step.depth === state.currentDepth)

    if (!assumption || !conclusion) {return null}

    // Compute the next line number at the parent depth level
    const parentState = { ...state, currentDepth: state.currentDepth - 1 }
    const lineNumber = this.computeLineNumber(parentState, false)

    return {
      id: newId,
      lineNumber,
      formula: `(${assumption.formula}) -> (${conclusion.formula})`,
      ruleKey: RULE_KEYS.IMPL_INTRO,
      dependencies: [assumption.id, conclusion.id],
      justificationKey: 'justificationImplIntro',
      justificationParams: { start: assumption.lineNumber, end: conclusion.lineNumber },
      depth: state.currentDepth - 1,
      isSubproofEnd: true,
    }
  }

  private applyLEM(newId: number, state: ProofState, userInput?: string): ProofStep | null {
    if (!userInput || userInput.trim() === '') {return null}

    const trimmed = userInput.trim()
    const needsParens = /[|^&]|->|<->/.test(trimmed) && !isFullyParenthesized(trimmed)
    const wrappedFormula = needsParens ? `(${trimmed})` : trimmed
    const lemFormula = `${wrappedFormula} | ~${wrappedFormula}`

    return {
      id: newId,
      lineNumber: this.computeLineNumber(state, false),
      formula: lemFormula,
      ruleKey: RULE_KEYS.LEM,
      dependencies: [],
      justificationKey: 'justificationLEM',
      depth: state.currentDepth,
    }
  }

  private tryModusPonens(stepP: ProofStep, stepImpl: ProofStep): string | null {
    const impl = parseImplication(stepImpl.formula)
    if (!impl) {return null}

    // Check if stepP matches the antecedent
    if (normalizeFormula(stepP.formula) === normalizeFormula(impl.antecedent)) {
      return impl.consequent
    }
    return null
  }

  private tryModusTollens(stepImpl: ProofStep, stepNegQ: ProofStep): string | null {
    const impl = parseImplication(stepImpl.formula)
    if (!impl) {return null}

    // Check if stepNegQ is ¬Q where Q is the consequent
    try {
      const parsedNegQ = tokenizeAndParse(stepNegQ.formula)
      if (parsedNegQ.type !== FormulaType.NOT || !parsedNegQ.left) {return null}

      const negatedFormula = formulaToString(parsedNegQ.left)
      
      // Check if negatedFormula matches the consequent
      if (normalizeFormula(negatedFormula) === normalizeFormula(impl.consequent)) {
        // Wrap antecedent in parentheses to preserve formula structure when negating
        return `~(${impl.antecedent})`
      }
      return null
    } catch {
      return null
    }
  }

  private tryDisjunctiveSyllogism(stepDisj: ProofStep, stepNeg: ProofStep): string | null {
    // Parse the disjunction: P ∨ Q
    try {
      const parsedDisj = tokenizeAndParse(stepDisj.formula)
      if (parsedDisj.type !== FormulaType.OR || !parsedDisj.left || !parsedDisj.right) {
        return null
      }

      const leftDisjunct = formulaToString(parsedDisj.left)
      const rightDisjunct = formulaToString(parsedDisj.right)

      // Parse the negation: ¬P or ¬Q
      const parsedNeg = tokenizeAndParse(stepNeg.formula)
      if (parsedNeg.type !== FormulaType.NOT || !parsedNeg.left) {
        return null
      }

      const negatedFormula = formulaToString(parsedNeg.left)

      // Check if negatedFormula matches left disjunct → return right
      if (normalizeFormula(negatedFormula) === normalizeFormula(leftDisjunct)) {
        return rightDisjunct
      }

      // Check if negatedFormula matches right disjunct → return left
      if (normalizeFormula(negatedFormula) === normalizeFormula(rightDisjunct)) {
        return leftDisjunct
      }

      return null
    } catch {
      return null
    }
  }

  validateProof(state: ProofState): boolean {
    if (state.steps.length === 0) {return false}
    
    const lastStep = state.steps[state.steps.length - 1]
    
    // Proof is complete if:
    // 1. We're at depth 0 (no open assumptions)
    // 2. The last step matches the goal
    return (
      state.currentDepth === 0 &&
      normalizeFormula(lastStep.formula) === normalizeFormula(state.goal)
    )
  }

  getSuggestedGoals(): Array<{ labelKey: string; formula: string; descriptionKey: string }> {
    // Flatten all goals from all knowledge bases
    return this.knowledgeBases.flatMap(kb => 
      kb.suggestedGoals.map(goal => ({
        ...goal,
      }))
    )
  }
}
