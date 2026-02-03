/**
 * Formula manipulation helpers for Natural Deduction
 * Contains utilities for formula string conversion and parsing
 */

import { tokenizeAndParse, Formula, FormulaType } from '../formula/common'

/**
 * Operator precedence constants (lower number = lower precedence)
 * Must match the precedence in the parser
 */
const ATOM_PRECEDENCE = 6
const PRECEDENCE: Record<string, number> = {
  [FormulaType.IFF]: 1,
  [FormulaType.IMPLIES]: 2,
  [FormulaType.OR]: 3,
  [FormulaType.AND]: 4,
  [FormulaType.NOT]: 5,
}

/**
 * Convert a Formula AST to a string representation with proper precedence handling
 */
export function formulaToString(formula: Formula, parentPrecedence: number = 0): string {
  const needsParens = (type: string): boolean => {
    const currentPrec = PRECEDENCE[type] || ATOM_PRECEDENCE
    return currentPrec < parentPrecedence
  }

  const wrapIfNeeded = (str: string, type: string): string => {
    return needsParens(type) ? `(${str})` : str
  }

  switch (formula.type) {
    case FormulaType.VAR:
      return formula.value || ''
    case FormulaType.TRUE:
      return 'T'
    case FormulaType.FALSE:
      return 'F'
    case FormulaType.NOT:
      return `~${formulaToString(formula.left!, PRECEDENCE[FormulaType.NOT])}`
    case FormulaType.AND: {
      const left = formulaToString(formula.left!, PRECEDENCE[FormulaType.AND])
      const right = formulaToString(formula.right!, PRECEDENCE[FormulaType.AND])
      return wrapIfNeeded(`${left} ^ ${right}`, FormulaType.AND)
    }
    case FormulaType.OR: {
      const left = formulaToString(formula.left!, PRECEDENCE[FormulaType.OR])
      const right = formulaToString(formula.right!, PRECEDENCE[FormulaType.OR])
      return wrapIfNeeded(`${left} | ${right}`, FormulaType.OR)
    }
    case FormulaType.IMPLIES: {
      const left = formulaToString(formula.left!, PRECEDENCE[FormulaType.IMPLIES])
      const right = formulaToString(formula.right!, PRECEDENCE[FormulaType.IMPLIES])
      return wrapIfNeeded(`${left} -> ${right}`, FormulaType.IMPLIES)
    }
    case FormulaType.IFF: {
      const left = formulaToString(formula.left!, PRECEDENCE[FormulaType.IFF])
      const right = formulaToString(formula.right!, PRECEDENCE[FormulaType.IFF])
      return wrapIfNeeded(`${left} <-> ${right}`, FormulaType.IFF)
    }
    default:
      return ''
  }
}

/**
 * Check if a formula string is fully parenthesized
 * (i.e., wrapped in outer parentheses that contain the entire expression)
 */
export function isFullyParenthesized(formula: string): boolean {
  const trimmed = formula.trim()
  
  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
    return false
  }
  
  // Check if the outer parentheses wrap the entire formula
  let depth = 0
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === '(') depth++
    if (trimmed[i] === ')') depth--
    // If depth reaches 0 before the end, outer parens don't wrap everything
    if (depth === 0 && i < trimmed.length - 1) {
      return false
    }
  }
  return true
}

/**
 * Parse an implication formula and return antecedent/consequent strings.
 * Returns null if the formula is not an implication.
 */
export function parseImplication(formula: string): { antecedent: string; consequent: string } | null {
  try {
    const parsed = tokenizeAndParse(formula)
    if (parsed.type !== FormulaType.IMPLIES) return null
    return {
      antecedent: formulaToString(parsed.left!),
      consequent: formulaToString(parsed.right!),
    }
  } catch {
    return null
  }
}

/**
 * Normalize a formula string for comparison (removes spaces, parens, converts to lowercase)
 */
export function normalizeFormula(formula: string): string {
  return formula.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase()
}
