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

function formulaToLatex(formula: Formula, parentPrecedence: number = 0): string {
  // Operator precedence (lower number = lower precedence)
  const ATOM_PRECEDENCE = 6
  const precedence: Record<string, number> = {
    [FormulaType.IFF]: 1,
    [FormulaType.IMPLIES]: 2,
    [FormulaType.OR]: 3,
    [FormulaType.AND]: 4,
    [FormulaType.NOT]: 5,
  }

  const needsParens = (type: string): boolean => {
    const currentPrec = precedence[type] || ATOM_PRECEDENCE
    return currentPrec < parentPrecedence
  }

  const wrapIfNeeded = (latex: string, type: string): string => {
    return needsParens(type) ? `(${latex})` : latex
  }

  switch (formula.type) {
    case FormulaType.VAR:
      return formula.value!

    case FormulaType.TRUE:
      return '\\top'

    case FormulaType.FALSE:
      return '\\bot'

    case FormulaType.NOT:
      return `\\neg ${formulaToLatex(formula.left!, precedence[FormulaType.NOT])}`

    case FormulaType.AND: {
      const left = formulaToLatex(formula.left!, precedence[FormulaType.AND])
      const right = formulaToLatex(formula.right!, precedence[FormulaType.AND])
      const result = `${left} \\land ${right}`
      return wrapIfNeeded(result, FormulaType.AND)
    }

    case FormulaType.OR: {
      const left = formulaToLatex(formula.left!, precedence[FormulaType.OR])
      const right = formulaToLatex(formula.right!, precedence[FormulaType.OR])
      const result = `${left} \\lor ${right}`
      return wrapIfNeeded(result, FormulaType.OR)
    }

    case FormulaType.IMPLIES: {
      const left = formulaToLatex(formula.left!, precedence[FormulaType.IMPLIES])
      const right = formulaToLatex(formula.right!, precedence[FormulaType.IMPLIES])
      const result = `${left} \\to ${right}`
      return wrapIfNeeded(result, FormulaType.IMPLIES)
    }

    case FormulaType.IFF: {
      const left = formulaToLatex(formula.left!, precedence[FormulaType.IFF])
      const right = formulaToLatex(formula.right!, precedence[FormulaType.IFF])
      const result = `${left} \\leftrightarrow ${right}`
      return wrapIfNeeded(result, FormulaType.IFF)
    }

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
