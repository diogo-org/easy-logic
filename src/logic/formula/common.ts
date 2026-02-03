/**
 * Shared tokenizer and parser for propositional logic formulas
 * Re-exports from modular files for backward compatibility
 */

// Re-export types
export type {
  Token,
  TokenTypeValue,
  Formula,
  FormulaTypeValue,
} from './types'

export {
  FormulaType,
  TokenType,
  TWO_CHAR_OPERATOR_LENGTH,
  THREE_CHAR_OPERATOR_LENGTH,
} from './types'

// Re-export classes
export { Tokenizer } from './tokenizer'
export { Parser } from './parserClass'

// Convenience functions
import { Tokenizer } from './tokenizer'
import { Parser } from './parserClass'
import { Formula, FormulaType } from './types'

/**
 * Convenience function to tokenize and parse a formula string
 */
export function tokenizeAndParse(input: string): Formula {
  const tokenizer = new Tokenizer(input)
  const tokens = tokenizer.tokenize()
  const parser = new Parser(tokens)
  return parser.parse()
}

/**
 * Extract all unique variable names from a formula
 */
export function extractVariables(formula: Formula): string[] {
  const vars = new Set<string>()

  function traverse(f: Formula) {
    if (f.type === FormulaType.VAR && f.value) {
      vars.add(f.value)
    }
    if (f.left) traverse(f.left)
    if (f.right) traverse(f.right)
  }

  traverse(formula)
  return Array.from(vars).sort()
}
