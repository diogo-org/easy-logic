/**
 * Parse propositional logic formula and convert to LaTeX
 * 
 * This is pure business logic - no React or UI dependencies.
 * 
 * Syntax:
 * ^ : AND
 * | : OR
 * -> : IMPLIES
 * <-> : IFF
 * ~ : NOT
 * T : TRUE
 * F : FALSE
 * p, proposition, etc : variables
 */

import { tokenizeAndParse, Formula, FormulaType } from './common'

export function formulaToLatex(formula: Formula): string {
  switch (formula.type) {
    case FormulaType.VAR:
      return formula.value!

    case FormulaType.TRUE:
      return '\\top'

    case FormulaType.FALSE:
      return '\\bot'

    case FormulaType.NOT:
      return `\\neg ${formulaToLatex(formula.left!)}`

    case FormulaType.AND:
      return `${formulaToLatex(formula.left!)} \\land ${formulaToLatex(formula.right!)}`

    case FormulaType.OR:
      return `${formulaToLatex(formula.left!)} \\lor ${formulaToLatex(formula.right!)}`

    case FormulaType.IMPLIES:
      return `${formulaToLatex(formula.left!)} \\to ${formulaToLatex(formula.right!)}`

    case FormulaType.IFF:
      return `${formulaToLatex(formula.left!)} \\leftrightarrow ${formulaToLatex(formula.right!)}`

    default:
      throw new Error(`Unknown formula type`)
  }
}

export function parseFormula(input: string): { latex: string; error?: string } {
  try {
    const formula = tokenizeAndParse(input)
    const latex = formulaToLatex(formula)
    return { latex }
  } catch (error) {
    return {
      latex: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
