/**
 * Natural Deduction proof system implementation
 * 
 * This is pure business logic - no React or UI dependencies.
 */

import { ProofSystem, Rule, ProofState, ProofStep, ApplicableRule, KnowledgeBase, RULE_KEYS } from './types'
import { tokenizeAndParse, Formula, FormulaType } from '../formula/common'

export class NaturalDeduction implements ProofSystem {
  name = 'Natural Deduction'

  private knowledgeBases: KnowledgeBase[] = [
    {
      id: 'empty',
      nameKey: 'kbEmpty',
      descriptionKey: 'kbEmptyDesc',
      premises: [],
      suggestedGoals: [
        {
          labelKey: 'goalIdentity',
          formula: 'p -> p',
          descriptionKey: 'goalIdentityDesc',
        },
      ],
    },
    {
      id: 'modus-ponens',
      nameKey: 'kbModusPonens',
      descriptionKey: 'kbModusPonensDesc',
      premises: ['p', 'p -> q'],
      suggestedGoals: [
        {
          labelKey: 'goalDeriveQ',
          formula: 'q',
          descriptionKey: 'goalDeriveQDesc',
        },
      ],
    },
    {
      id: 'conjunction',
      nameKey: 'kbConjunction',
      descriptionKey: 'kbConjunctionDesc',
      premises: ['p', 'q'],
      suggestedGoals: [
        {
          labelKey: 'goalCombineAnd',
          formula: 'p ^ q',
          descriptionKey: 'goalCombineAndDesc',
        },
        {
          labelKey: 'goalCommutative',
          formula: 'q ^ p',
          descriptionKey: 'goalCommutativeDesc',
        },
      ],
    },
    {
      id: 'disjunction',
      nameKey: 'kbDisjunction',
      descriptionKey: 'kbDisjunctionDesc',
      premises: ['p'],
      suggestedGoals: [
        {
          labelKey: 'goalAddOr',
          formula: 'p | q',
          descriptionKey: 'goalAddOrDesc',
        },
      ],
    },
    {
      id: 'syllogism',
      nameKey: 'kbSyllogism',
      descriptionKey: 'kbSyllogismDesc',
      premises: ['p', 'p -> q', 'q -> r'],
      suggestedGoals: [
        {
          labelKey: 'goalDeriveR',
          formula: 'r',
          descriptionKey: 'goalDeriveRDesc',
        },
        {
          labelKey: 'goalDirectImpl',
          formula: 'p -> r',
          descriptionKey: 'goalDirectImplDesc',
        },
      ],
    },
    {
      id: 'elimination',
      nameKey: 'kbElimination',
      descriptionKey: 'kbEliminationDesc',
      premises: ['p ^ q'],
      suggestedGoals: [
        {
          labelKey: 'goalExtractLeft',
          formula: 'p',
          descriptionKey: 'goalExtractLeftDesc',
        },
        {
          labelKey: 'goalExtractRight',
          formula: 'q',
          descriptionKey: 'goalExtractRightDesc',
        },
      ],
    },
  ]

  private rules: Rule[] = [
    {
      id: 'assume',
      nameKey: 'ruleAssume',
      descriptionKey: 'ruleAssumeDesc',
      category: 'assumption',
      requiredSteps: 0,
    },
    {
      id: 'mp',
      nameKey: 'ruleModusPonens',
      descriptionKey: 'ruleModusPonensDesc',
      category: 'basic',
      requiredSteps: 2,
    },
    {
      id: 'mt',
      nameKey: 'ruleModusTollens',
      descriptionKey: 'ruleModusTollensDesc',
      category: 'basic',
      requiredSteps: 2,
    },
    {
      id: 'and_intro',
      nameKey: 'ruleAndIntro',
      descriptionKey: 'ruleAndIntroDesc',
      category: 'introduction',
      requiredSteps: 2,
    },
    {
      id: 'and_elim_left',
      nameKey: 'ruleAndElimLeft',
      descriptionKey: 'ruleAndElimLeftDesc',
      category: 'elimination',
      requiredSteps: 1,
    },
    {
      id: 'and_elim_right',
      nameKey: 'ruleAndElimRight',
      descriptionKey: 'ruleAndElimRightDesc',
      category: 'elimination',
      requiredSteps: 1,
    },
    {
      id: 'or_intro_left',
      nameKey: 'ruleOrIntroLeft',
      descriptionKey: 'ruleOrIntroLeftDesc',
      category: 'introduction',
      requiredSteps: 1,
    },
    {
      id: 'or_intro_right',
      nameKey: 'ruleOrIntroRight',
      descriptionKey: 'ruleOrIntroRightDesc',
      category: 'introduction',
      requiredSteps: 1,
    },
    {
      id: 'double_neg',
      nameKey: 'ruleDoubleNeg',
      descriptionKey: 'ruleDoubleNegDesc',
      category: 'basic',
      requiredSteps: 1,
    },
    {
      id: 'impl_intro',
      nameKey: 'ruleImplIntro',
      descriptionKey: 'ruleImplIntroDesc',
      category: 'introduction',
      requiredSteps: 1,
    },
    {
      id: 'or_elim',
      nameKey: 'ruleOrElim',
      descriptionKey: 'ruleOrElimDesc',
      category: 'elimination',
      requiredSteps: 1,
    },
  ]

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

    // Implication introduction only works if we have an open assumption
    if (rule.id === 'impl_intro') {
      const hasOpenAssumption = state.currentDepth > 0
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
    if (selectedSteps.length !== 1) return null
    return state.steps.find(s => s.id === selectedSteps[0]) || null
  }

  /**
   * Get two steps from the state by IDs. Returns null if selection is invalid.
   */
  private getTwoSteps(state: ProofState, selectedSteps: number[]): [ProofStep, ProofStep] | null {
    if (selectedSteps.length !== 2) return null
    const step1 = state.steps.find(s => s.id === selectedSteps[0])
    const step2 = state.steps.find(s => s.id === selectedSteps[1])
    if (!step1 || !step2) return null
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
      switch (rule.id) {
        case 'assume':
          if (!userInput) return null
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

        case 'mp': {
          const steps = this.getTwoSteps(state, selectedSteps)
          if (!steps) return null
          const [step1, step2] = steps

          // Try both orders: (P, P→Q) and (P→Q, P)
          const result = this.tryModusPonens(step1, step2) || this.tryModusPonens(step2, step1)
          if (!result) return null

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
        }

        case 'mt': {
          const steps = this.getTwoSteps(state, selectedSteps)
          if (!steps) return null
          const [step1, step2] = steps

          // Try both orders: (P→Q, ¬Q) and (¬Q, P→Q)
          const result = this.tryModusTollens(step1, step2) || this.tryModusTollens(step2, step1)
          if (!result) return null

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
        }

        case 'and_intro': {
          const steps = this.getTwoSteps(state, selectedSteps)
          if (!steps) return null
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
        }

        case 'and_elim_left': {
          const step = this.getOneStep(state, selectedSteps)
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== FormulaType.AND || !parsed.left) return null

          return {
            id: newId,
            lineNumber: this.computeLineNumber(state, false),
            formula: this.formulaToString(parsed.left),
            ruleKey: RULE_KEYS.AND_ELIM_LEFT,
            dependencies: selectedSteps,
            justificationKey: 'justificationAndElimLeft',
            justificationParams: { step: step.lineNumber },
            depth: state.currentDepth,
          }
        }

        case 'and_elim_right': {
          const step = this.getOneStep(state, selectedSteps)
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== FormulaType.AND || !parsed.right) return null

          return {
            id: newId,
            lineNumber: this.computeLineNumber(state, false),
            formula: this.formulaToString(parsed.right),
            ruleKey: RULE_KEYS.AND_ELIM_RIGHT,
            dependencies: selectedSteps,
            justificationKey: 'justificationAndElimRight',
            justificationParams: { step: step.lineNumber },
            depth: state.currentDepth,
          }
        }

        case 'or_intro_left': {
          const step = this.getOneStep(state, selectedSteps)
          if (!step || !userInput) return null

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
        }

        case 'or_intro_right': {
          const step = this.getOneStep(state, selectedSteps)
          if (!step || !userInput) return null

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
        }

        case 'double_neg': {
          const step = this.getOneStep(state, selectedSteps)
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== FormulaType.NOT || !parsed.left || parsed.left.type !== FormulaType.NOT || !parsed.left.left)
            return null

          return {
            id: newId,
            lineNumber: this.computeLineNumber(state, false),
            formula: this.formulaToString(parsed.left.left),
            ruleKey: RULE_KEYS.DOUBLE_NEG,
            dependencies: selectedSteps,
            justificationKey: 'justificationDoubleNeg',
            justificationParams: { step: step.lineNumber },
            depth: state.currentDepth,
          }
        }

        case 'impl_intro': {
          // Close the current assumption
          if (state.currentDepth === 0) return null
          
          // Find the assumption at current depth and the conclusion
          const assumption = state.steps.find(s => s.depth === state.currentDepth && s.ruleKey === RULE_KEYS.ASSUME)
          const conclusion = state.steps.length > 0 ? state.steps[state.steps.length - 1] : null
          
          if (!assumption || !conclusion || conclusion.depth !== state.currentDepth) return null

          // Line number goes back to parent depth
          const parentDepthSteps = state.steps.filter(s => s.depth === state.currentDepth - 1)
          let lineNumber: string
          if (parentDepthSteps.length > 0) {
            const lastParent = parentDepthSteps[parentDepthSteps.length - 1]
            const parts = lastParent.lineNumber.split('.')
            const lastPart = parseInt(parts[parts.length - 1], 10)
            parts[parts.length - 1] = String(lastPart + 1)
            lineNumber = parts.join('.')
          } else {
            lineNumber = String(state.steps.length + 1)
          }

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

        case 'or_elim': {
          // Disjunction elimination (proof by cases)
          // User selects a disjunction P∨Q, we create two branches with assumptions P and Q
          const step = this.getOneStep(state, selectedSteps)
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== FormulaType.OR || !parsed.left || !parsed.right) return null

          const leftFormula = this.formulaToString(parsed.left)
          const rightFormula = this.formulaToString(parsed.right)

          // Return special step that indicates branching should start
          // The UI will handle creating the actual branches
          return {
            id: newId,
            lineNumber: this.computeLineNumber(state, false),
            formula: `[${leftFormula}] | [${rightFormula}]`,
            ruleKey: RULE_KEYS.OR_ELIM,
            dependencies: selectedSteps,
            justificationKey: 'justificationOrElim',
            justificationParams: { step: step.lineNumber },
            depth: state.currentDepth,
          }
        }

        default:
          return null
      }
    } catch (error) {
      console.error('Error applying rule:', error)
      return null
    }
  }

  /**
   * Parse an implication formula and return antecedent/consequent strings.
   * Returns null if the formula is not an implication.
   */
  private parseImplication(formula: string): { antecedent: string; consequent: string } | null {
    try {
      const parsed = tokenizeAndParse(formula)
      if (parsed.type !== FormulaType.IMPLIES) return null
      return {
        antecedent: this.formulaToString(parsed.left!),
        consequent: this.formulaToString(parsed.right!),
      }
    } catch {
      return null
    }
  }

  private tryModusPonens(stepP: ProofStep, stepImpl: ProofStep): string | null {
    const impl = this.parseImplication(stepImpl.formula)
    if (!impl) return null

    // Check if stepP matches the antecedent
    if (this.normalizeFormula(stepP.formula) === this.normalizeFormula(impl.antecedent)) {
      return impl.consequent
    }
    return null
  }

  private tryModusTollens(stepImpl: ProofStep, stepNegQ: ProofStep): string | null {
    const impl = this.parseImplication(stepImpl.formula)
    if (!impl) return null

    // Check if stepNegQ is ¬Q where Q is the consequent
    try {
      const parsedNegQ = tokenizeAndParse(stepNegQ.formula)
      if (parsedNegQ.type !== FormulaType.NOT || !parsedNegQ.left) return null

      const negatedFormula = this.formulaToString(parsedNegQ.left)
      
      // Check if negatedFormula matches the consequent
      if (this.normalizeFormula(negatedFormula) === this.normalizeFormula(impl.consequent)) {
        return `~${impl.antecedent}`
      }
      return null
    } catch {
      return null
    }
  }

  private formulaToString(formula: Formula): string {
    switch (formula.type) {
      case FormulaType.VAR:
        return formula.value || ''
      case FormulaType.TRUE:
        return 'T'
      case FormulaType.FALSE:
        return 'F'
      case FormulaType.NOT:
        return `~${this.formulaToString(formula.left!)}`
      case FormulaType.AND:
        return `${this.formulaToString(formula.left!)} ^ ${this.formulaToString(formula.right!)}`
      case FormulaType.OR:
        return `${this.formulaToString(formula.left!)} | ${this.formulaToString(formula.right!)}`
      case FormulaType.IMPLIES:
        return `${this.formulaToString(formula.left!)} -> ${this.formulaToString(formula.right!)}`
      case FormulaType.IFF:
        return `${this.formulaToString(formula.left!)} <-> ${this.formulaToString(formula.right!)}`
      default:
        return ''
    }
  }

  private normalizeFormula(formula: string): string {
    // Remove spaces and convert to lowercase
    // Also remove redundant parentheses for comparison
    return formula.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase()
  }

  validateProof(state: ProofState): boolean {
    if (state.steps.length === 0) return false
    
    const lastStep = state.steps[state.steps.length - 1]
    
    // Proof is complete if:
    // 1. We're at depth 0 (no open assumptions)
    // 2. The last step matches the goal
    return (
      state.currentDepth === 0 &&
      this.normalizeFormula(lastStep.formula) === this.normalizeFormula(state.goal)
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
