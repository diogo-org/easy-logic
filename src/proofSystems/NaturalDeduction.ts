/**
 * Natural Deduction proof system implementation
 */

import { ProofSystem, Rule, ProofState, ProofStep, ApplicableRule, KnowledgeBase } from '../types/proof'
import { tokenizeAndParse, Formula } from '../utils/formulaCommon'

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
  ]

  getRules(): Rule[] {
    return this.rules
  }

  getKnowledgeBases(): KnowledgeBase[] {
    return this.knowledgeBases
  }

  checkApplicability(rule: Rule, state: ProofState): ApplicableRule {
    const availableSteps = state.steps.filter(step => step.depth === state.currentDepth)

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
            formula: userInput,
            rule: 'Assume',
            dependencies: [],
            justification: 'Assumption',
            depth: state.currentDepth + 1,
          }

        case 'mp': {
          if (selectedSteps.length !== 2) return null
          const step1 = state.steps.find(s => s.id === selectedSteps[0])
          const step2 = state.steps.find(s => s.id === selectedSteps[1])
          if (!step1 || !step2) return null

          // Try both orders: (P, P→Q) and (P→Q, P)
          const result = this.tryModusPonens(step1, step2) || this.tryModusPonens(step2, step1)
          if (!result) return null

          return {
            id: newId,
            formula: result,
            rule: 'Modus Ponens',
            dependencies: selectedSteps,
            justification: `MP (${selectedSteps[0]}, ${selectedSteps[1]})`,
            depth: state.currentDepth,
          }
        }

        case 'and_intro': {
          if (selectedSteps.length !== 2) return null
          const step1 = state.steps.find(s => s.id === selectedSteps[0])
          const step2 = state.steps.find(s => s.id === selectedSteps[1])
          if (!step1 || !step2) return null

          return {
            id: newId,
            formula: `(${step1.formula}) ^ (${step2.formula})`,
            rule: '∧ Introduction',
            dependencies: selectedSteps,
            justification: `∧I (${selectedSteps[0]}, ${selectedSteps[1]})`,
            depth: state.currentDepth,
          }
        }

        case 'and_elim_left': {
          if (selectedSteps.length !== 1) return null
          const step = state.steps.find(s => s.id === selectedSteps[0])
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== 'and' || !parsed.left) return null

          return {
            id: newId,
            formula: this.formulaToString(parsed.left),
            rule: '∧ Elimination',
            dependencies: selectedSteps,
            justification: `∧E-L (${selectedSteps[0]})`,
            depth: state.currentDepth,
          }
        }

        case 'and_elim_right': {
          if (selectedSteps.length !== 1) return null
          const step = state.steps.find(s => s.id === selectedSteps[0])
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== 'and' || !parsed.right) return null

          return {
            id: newId,
            formula: this.formulaToString(parsed.right),
            rule: '∧ Elimination',
            dependencies: selectedSteps,
            justification: `∧E-R (${selectedSteps[0]})`,
            depth: state.currentDepth,
          }
        }

        case 'or_intro_left': {
          if (selectedSteps.length !== 1) return null
          const step = state.steps.find(s => s.id === selectedSteps[0])
          if (!step || !userInput) return null

          return {
            id: newId,
            formula: `(${step.formula}) | (${userInput})`,
            rule: '∨ Introduction',
            dependencies: selectedSteps,
            justification: `∨I-L (${selectedSteps[0]})`,
            depth: state.currentDepth,
          }
        }

        case 'or_intro_right': {
          if (selectedSteps.length !== 1) return null
          const step = state.steps.find(s => s.id === selectedSteps[0])
          if (!step || !userInput) return null

          return {
            id: newId,
            formula: `(${userInput}) | (${step.formula})`,
            rule: '∨ Introduction',
            dependencies: selectedSteps,
            justification: `∨I-R (${selectedSteps[0]})`,
            depth: state.currentDepth,
          }
        }

        case 'double_neg': {
          if (selectedSteps.length !== 1) return null
          const step = state.steps.find(s => s.id === selectedSteps[0])
          if (!step) return null

          const parsed = tokenizeAndParse(step.formula)
          if (parsed.type !== 'not' || !parsed.left || parsed.left.type !== 'not' || !parsed.left.left)
            return null

          return {
            id: newId,
            formula: this.formulaToString(parsed.left.left),
            rule: 'Double Negation',
            dependencies: selectedSteps,
            justification: `DN (${selectedSteps[0]})`,
            depth: state.currentDepth,
          }
        }

        case 'impl_intro': {
          // Close the current assumption
          if (state.currentDepth === 0) return null
          
          // Find the assumption at current depth and the conclusion
          const assumption = state.steps.find(s => s.depth === state.currentDepth && s.rule === 'Assume')
          const conclusion = state.steps.length > 0 ? state.steps[state.steps.length - 1] : null
          
          if (!assumption || !conclusion || conclusion.depth !== state.currentDepth) return null

          return {
            id: newId,
            formula: `(${assumption.formula}) -> (${conclusion.formula})`,
            rule: '→ Introduction',
            dependencies: [assumption.id, conclusion.id],
            justification: `→I (${assumption.id}-${conclusion.id})`,
            depth: state.currentDepth - 1,
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

  private tryModusPonens(stepP: ProofStep, stepImpl: ProofStep): string | null {
    try {
      const parsedImpl = tokenizeAndParse(stepImpl.formula)
      if (parsedImpl.type !== 'implies') return null

      const antecedent = this.formulaToString(parsedImpl.left!)
      const consequent = this.formulaToString(parsedImpl.right!)

      // Check if stepP matches the antecedent
      if (this.normalizeFormula(stepP.formula) === this.normalizeFormula(antecedent)) {
        return consequent
      }

      return null
    } catch {
      return null
    }
  }

  private formulaToString(formula: Formula): string {
    switch (formula.type) {
      case 'var':
        return formula.value || ''
      case 'true':
        return 'T'
      case 'false':
        return 'F'
      case 'not':
        return `~${this.formulaToString(formula.left!)}`
      case 'and':
        return `${this.formulaToString(formula.left!)} ^ ${this.formulaToString(formula.right!)}`
      case 'or':
        return `${this.formulaToString(formula.left!)} | ${this.formulaToString(formula.right!)}`
      case 'implies':
        return `${this.formulaToString(formula.left!)} -> ${this.formulaToString(formula.right!)}`
      case 'iff':
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
