/**
 * Parse propositional logic formula and convert to LaTeX
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

import { tokenizeAndParse, Formula } from './formulaCommon'

function formulaToLatex(formula: Formula): string {
  switch (formula.type) {
    case 'var':
      return formula.value!

    case 'true':
      return '\\top'

    case 'false':
      return '\\bot'

    case 'not':
      return `\\neg ${formulaToLatex(formula.left!)}`

    case 'and':
      return `${formulaToLatex(formula.left!)} \\land ${formulaToLatex(formula.right!)}`

    case 'or':
      return `${formulaToLatex(formula.left!)} \\lor ${formulaToLatex(formula.right!)}`

    case 'implies':
      return `${formulaToLatex(formula.left!)} \\to ${formulaToLatex(formula.right!)}`

    case 'iff':
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
