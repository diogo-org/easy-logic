/**
 * Type definitions for propositional logic formulas
 */

// Operator string lengths
export const TWO_CHAR_OPERATOR_LENGTH = 2
export const THREE_CHAR_OPERATOR_LENGTH = 3

/** Enum for formula node types */
export const FormulaType = {
  VAR: 'var',
  TRUE: 'true',
  FALSE: 'false',
  NOT: 'not',
  AND: 'and',
  OR: 'or',
  IMPLIES: 'implies',
  IFF: 'iff',
} as const

export type FormulaTypeValue = typeof FormulaType[keyof typeof FormulaType]

/** Enum for token types */
export const TokenType = {
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  AND: 'AND',
  OR: 'OR',
  IMPLIES: 'IMPLIES',
  IFF: 'IFF',
  NOT: 'NOT',
  VAR: 'VAR',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  EOF: 'EOF',
} as const

export type TokenTypeValue = typeof TokenType[keyof typeof TokenType]

export type Token = {
  type: TokenTypeValue
  value: string
}

export type Formula = {
  type: FormulaTypeValue
  value?: string
  left?: Formula
  right?: Formula
}
