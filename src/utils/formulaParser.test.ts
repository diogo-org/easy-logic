import { describe, it, expect } from 'vitest'
import { parseFormula } from './formulaParser'

describe('formulaParser', () => {
  describe('parseFormula - Basic cases', () => {
    it('should parse single variable', () => {
      const result = parseFormula('p')
      expect(result.latex).toBe('p')
      expect(result.error).toBeUndefined()
    })

    it('should parse multi-letter variable', () => {
      const result = parseFormula('proposition')
      expect(result.latex).toBe('proposition')
      expect(result.error).toBeUndefined()
    })

    it('should parse true constant', () => {
      const result = parseFormula('T')
      expect(result.latex).toBe('\\top')
      expect(result.error).toBeUndefined()
    })

    it('should parse false constant', () => {
      const result = parseFormula('F')
      expect(result.latex).toBe('\\bot')
      expect(result.error).toBeUndefined()
    })
  })

  describe('parseFormula - Unary operators', () => {
    it('should parse negation', () => {
      const result = parseFormula('~p')
      expect(result.latex).toBe('\\neg p')
      expect(result.error).toBeUndefined()
    })

    it('should parse double negation', () => {
      const result = parseFormula('~~p')
      expect(result.latex).toBe('\\neg \\neg p')
      expect(result.error).toBeUndefined()
    })

    it('should parse negation with parentheses', () => {
      const result = parseFormula('~(p ^ q)')
      expect(result.latex).toBe('\\neg p \\land q')
      expect(result.error).toBeUndefined()
    })
  })

  describe('parseFormula - Binary operators', () => {
    it('should parse AND operator', () => {
      const result = parseFormula('p ^ q')
      expect(result.latex).toBe('p \\land q')
      expect(result.error).toBeUndefined()
    })

    it('should parse OR operator', () => {
      const result = parseFormula('p | q')
      expect(result.latex).toBe('p \\lor q')
      expect(result.error).toBeUndefined()
    })

    it('should parse IMPLIES operator', () => {
      const result = parseFormula('p -> q')
      expect(result.latex).toBe('p \\to q')
      expect(result.error).toBeUndefined()
    })

    it('should parse IFF operator', () => {
      const result = parseFormula('p <-> q')
      expect(result.latex).toBe('p \\leftrightarrow q')
      expect(result.error).toBeUndefined()
    })
  })

  describe('parseFormula - Operator precedence', () => {
    it('should respect NOT > AND precedence', () => {
      const result = parseFormula('~p ^ q')
      expect(result.latex).toBe('\\neg p \\land q')
    })

    it('should respect AND > OR precedence', () => {
      const result = parseFormula('p ^ q | r')
      expect(result.latex).toBe('p \\land q \\lor r')
    })

    it('should respect OR > IMPLIES precedence', () => {
      const result = parseFormula('p | q -> r')
      expect(result.latex).toBe('p \\lor q \\to r')
    })

    it('should respect IMPLIES > IFF precedence', () => {
      const result = parseFormula('p -> q <-> r')
      expect(result.latex).toBe('p \\to q \\leftrightarrow r')
    })

    it('should parse complex expression with multiple operators', () => {
      const result = parseFormula('p ^ q | r -> s <-> t')
      expect(result.latex).toBe('p \\land q \\lor r \\to s \\leftrightarrow t')
    })
  })

  describe('parseFormula - Parentheses', () => {
    it('should parse simple parentheses', () => {
      const result = parseFormula('(p)')
      expect(result.latex).toBe('p')
    })

    it('should override precedence with parentheses', () => {
      const result = parseFormula('(p | q) ^ r')
      expect(result.latex).toBe('p \\lor q \\land r')
    })

    it('should parse nested parentheses', () => {
      const result = parseFormula('((p ^ q) | r)')
      expect(result.latex).toBe('p \\land q \\lor r')
    })

    it('should handle multiple parenthesized groups', () => {
      const result = parseFormula('(p ^ q) -> (r | s)')
      expect(result.latex).toBe('p \\land q \\to r \\lor s')
    })
  })

  describe('parseFormula - Whitespace handling', () => {
    it('should handle extra spaces', () => {
      const result = parseFormula('p  ^  q')
      expect(result.latex).toBe('p \\land q')
    })

    it('should handle no spaces', () => {
      const result = parseFormula('p^q')
      expect(result.latex).toBe('p \\land q')
    })

    it('should trim input', () => {
      const result = parseFormula('  p ^ q  ')
      expect(result.latex).toBe('p \\land q')
    })
  })

  describe('parseFormula - Complex formulas', () => {
    it('should parse formula from readme example', () => {
      const result = parseFormula('(p ^ q) -> r')
      expect(result.latex).toBe('p \\land q \\to r')
    })

    it('should parse DeMorgan law', () => {
      const result = parseFormula('~(p ^ q) <-> (~p | ~q)')
      expect(result.latex).toBe('\\neg p \\land q \\leftrightarrow \\neg p \\lor \\neg q')
    })

    it('should parse complex logical formula', () => {
      const result = parseFormula('(p -> q) ^ (q -> r) -> (p -> r)')
      expect(result.latex).toBe('p \\to q \\land q \\to r \\to p \\to r')
    })

    it('should parse with mixed operators and parentheses', () => {
      const result = parseFormula('((p | q) ^ ~r) -> (s <-> t)')
      expect(result.latex).toBe('p \\lor q \\land \\neg r \\to s \\leftrightarrow t')
    })
  })

  describe('parseFormula - Error handling', () => {
    it('should handle empty input', () => {
      const result = parseFormula('')
      expect(result.error).toBeDefined()
    })

    it('should handle invalid character', () => {
      const result = parseFormula('p & q')
      expect(result.error).toBeDefined()
    })

    it('should handle unclosed parenthesis', () => {
      const result = parseFormula('(p ^ q')
      expect(result.error).toBeDefined()
    })

    it('should handle unexpected closing parenthesis', () => {
      const result = parseFormula('p ^ q)')
      expect(result.error).toBeDefined()
    })

    it('should handle operator at end', () => {
      const result = parseFormula('p ^')
      expect(result.error).toBeDefined()
    })

    it('should handle operator at start', () => {
      const result = parseFormula('^ p')
      expect(result.error).toBeDefined()
    })

    it('should handle missing operand for NOT', () => {
      const result = parseFormula('p ^ ~')
      expect(result.error).toBeDefined()
    })

    it('should return error message', () => {
      const result = parseFormula('@')
      expect(result.error).toBeTruthy()
      expect(typeof result.error).toBe('string')
    })
  })

  describe('parseFormula - Edge cases', () => {
    it('should parse constants in expressions', () => {
      const result = parseFormula('T ^ F')
      expect(result.latex).toBe('\\top \\land \\bot')
    })

    it('should parse negation of constants', () => {
      const result = parseFormula('~T | ~F')
      expect(result.latex).toBe('\\neg \\top \\lor \\neg \\bot')
    })

    it('should parse multiple operators in sequence with correct precedence', () => {
      const result = parseFormula('p | q | r')
      expect(result.latex).toBe('p \\lor q \\lor r')
    })

    it('should parse long chain of AND operators', () => {
      const result = parseFormula('p ^ q ^ r ^ s')
      expect(result.latex).toBe('p \\land q \\land r \\land s')
    })

    it('should parse variables with underscores and numbers', () => {
      const result = parseFormula('p_1 ^ q_2')
      expect(result.latex).toBe('p_1 \\land q_2')
    })
  })
})
