import { describe, it, expect } from 'vitest'
import { formulaToString, isFullyParenthesized, parseImplication, normalizeFormula } from './formulaHelpers'
import { FormulaType } from '../formula/types'
import type { Formula } from '../formula/types'

describe('formulaHelpers', () => {
  describe('formulaToString', () => {
    it('converts VAR formula to string', () => {
      const formula = { type: FormulaType.VAR, value: 'p' }
      expect(formulaToString(formula)).toBe('p')
    })

    it('converts TRUE formula to string', () => {
      const formula = { type: FormulaType.TRUE }
      expect(formulaToString(formula)).toBe('T')
    })

    it('converts FALSE formula to string', () => {
      const formula = { type: FormulaType.FALSE }
      expect(formulaToString(formula)).toBe('F')
    })

    it('converts NOT formula to string', () => {
      const formula = {
        type: FormulaType.NOT,
        left: { type: FormulaType.VAR, value: 'p' },
      }
      expect(formulaToString(formula)).toBe('~p')
    })

    it('converts AND formula to string', () => {
      const formula = {
        type: FormulaType.AND,
        left: { type: FormulaType.VAR, value: 'p' },
        right: { type: FormulaType.VAR, value: 'q' },
      }
      expect(formulaToString(formula)).toBe('p ^ q')
    })

    it('converts OR formula to string', () => {
      const formula = {
        type: FormulaType.OR,
        left: { type: FormulaType.VAR, value: 'p' },
        right: { type: FormulaType.VAR, value: 'q' },
      }
      expect(formulaToString(formula)).toBe('p | q')
    })

    it('converts IMPLIES formula to string', () => {
      const formula = {
        type: FormulaType.IMPLIES,
        left: { type: FormulaType.VAR, value: 'p' },
        right: { type: FormulaType.VAR, value: 'q' },
      }
      expect(formulaToString(formula)).toBe('p -> q')
    })

    it('converts IFF formula to string', () => {
      const formula = {
        type: FormulaType.IFF,
        left: { type: FormulaType.VAR, value: 'p' },
        right: { type: FormulaType.VAR, value: 'q' },
      }
      expect(formulaToString(formula)).toBe('p <-> q')
    })

    it('handles VAR with empty value', () => {
      const formula: Formula = { type: FormulaType.VAR, value: '' }
      expect(formulaToString(formula)).toBe('')
    })

    it('handles VAR without value property', () => {
      const formula: Formula = { type: FormulaType.VAR }
      expect(formulaToString(formula)).toBe('')
    })

    it('adds parentheses when precedence requires it', () => {
      // (p | q) ^ r - OR has lower precedence than AND, so needs parens when it's inside AND
      const formula = {
        type: FormulaType.AND,
        left: {
          type: FormulaType.OR,
          left: { type: FormulaType.VAR, value: 'p' },
          right: { type: FormulaType.VAR, value: 'q' },
        },
        right: { type: FormulaType.VAR, value: 'r' },
      }
      expect(formulaToString(formula)).toBe('(p | q) ^ r')
    })

    it('does not add unnecessary parentheses', () => {
      // p -> (q -> r) should not wrap the inner implication in extra parens
      const formula = {
        type: FormulaType.IMPLIES,
        left: { type: FormulaType.VAR, value: 'p' },
        right: {
          type: FormulaType.IMPLIES,
          left: { type: FormulaType.VAR, value: 'q' },
          right: { type: FormulaType.VAR, value: 'r' },
        },
      }
      expect(formulaToString(formula)).toBe('p -> q -> r')
    })

    it('handles nested NOT formulas', () => {
      const formula = {
        type: FormulaType.NOT,
        left: {
          type: FormulaType.NOT,
          left: { type: FormulaType.VAR, value: 'p' },
        },
      }
      expect(formulaToString(formula)).toBe('~~p')
    })

    it('handles complex nested formulas', () => {
      // (p ^ q) | (r -> s) - AND has higher precedence than OR so parens not needed on left
      const formula = {
        type: FormulaType.OR,
        left: {
          type: FormulaType.AND,
          left: { type: FormulaType.VAR, value: 'p' },
          right: { type: FormulaType.VAR, value: 'q' },
        },
        right: {
          type: FormulaType.IMPLIES,
          left: { type: FormulaType.VAR, value: 'r' },
          right: { type: FormulaType.VAR, value: 's' },
        },
      }
      expect(formulaToString(formula)).toBe('p ^ q | (r -> s)')
    })
  })

  describe('isFullyParenthesized', () => {
    it('returns true for fully parenthesized formula', () => {
      expect(isFullyParenthesized('(p -> q)')).toBe(true)
    })

    it('returns false for formula without outer parentheses', () => {
      expect(isFullyParenthesized('p -> q')).toBe(false)
    })

    it('returns false for formula with opening paren but no closing', () => {
      expect(isFullyParenthesized('(p -> q')).toBe(false)
    })

    it('returns false for formula with closing paren but no opening', () => {
      expect(isFullyParenthesized('p -> q)')).toBe(false)
    })

    it('returns false for formula with outer parens not wrapping entire expression', () => {
      expect(isFullyParenthesized('(p) -> q')).toBe(false)
    })

    it('handles formula with whitespace', () => {
      expect(isFullyParenthesized('  (p -> q)  ')).toBe(true)
    })

    it('handles empty string', () => {
      expect(isFullyParenthesized('')).toBe(false)
    })

    it('handles only parentheses', () => {
      expect(isFullyParenthesized('()')).toBe(true)
    })

    it('handles nested parentheses correctly', () => {
      expect(isFullyParenthesized('((p))')).toBe(true)
    })

    it('returns false when inner parens close before outer', () => {
      expect(isFullyParenthesized('(p) (q)')).toBe(false)
    })
  })

  describe('parseImplication', () => {
    it('parses simple implication', () => {
      const result = parseImplication('p -> q')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('p')
      expect(result?.consequent).toBe('q')
    })

    it('returns null for non-implication formula', () => {
      const result = parseImplication('p ^ q')
      expect(result).toBeNull()
    })

    it('returns null for invalid formula', () => {
      const result = parseImplication('p ->')
      expect(result).toBeNull()
    })

    it('parses implication with complex antecedent', () => {
      const result = parseImplication('(p ^ q) -> r')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('p ^ q')
      expect(result?.consequent).toBe('r')
    })

    it('parses implication with complex consequent', () => {
      const result = parseImplication('p -> (q ^ r)')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('p')
      expect(result?.consequent).toBe('q ^ r')
    })

    it('parses implication with both sides complex', () => {
      const result = parseImplication('(p | q) -> (r ^ s)')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('p | q')
      expect(result?.consequent).toBe('r ^ s')
    })

    it('parses implication with nested implications', () => {
      const result = parseImplication('p -> (q -> r)')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('p')
      expect(result?.consequent).toBe('q -> r')
    })

    it('handles whitespace in formula', () => {
      const result = parseImplication('  p  ->  q  ')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('p')
      expect(result?.consequent).toBe('q')
    })

    it('returns null for empty string', () => {
      const result = parseImplication('')
      expect(result).toBeNull()
    })

    it('parses formula with constants', () => {
      const result = parseImplication('T -> F')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('T')
      expect(result?.consequent).toBe('F')
    })

    it('parses formula with NOT', () => {
      const result = parseImplication('~p -> q')
      expect(result).not.toBeNull()
      expect(result?.antecedent).toBe('~p')
      expect(result?.consequent).toBe('q')
    })
  })

  describe('normalizeFormula', () => {
    it('removes spaces from formula', () => {
      expect(normalizeFormula('p -> q')).toBe('p->q')
    })

    it('removes parentheses from formula', () => {
      expect(normalizeFormula('(p -> q)')).toBe('p->q')
    })

    it('converts to lowercase', () => {
      expect(normalizeFormula('P -> Q')).toBe('p->q')
    })

    it('handles formula with all special characters', () => {
      expect(normalizeFormula('(p -> q) ^ (r | s)')).toBe('p->q^r|s')
    })

    it('removes multiple spaces', () => {
      expect(normalizeFormula('p   ->   q')).toBe('p->q')
    })

    it('handles empty string', () => {
      expect(normalizeFormula('')).toBe('')
    })

    it('handles formula with only spaces', () => {
      expect(normalizeFormula('   ')).toBe('')
    })

    it('handles formula with tabs and newlines', () => {
      expect(normalizeFormula('p\t->\nq')).toBe('p->q')
    })

    it('handles complex nested formula', () => {
      expect(normalizeFormula('((P ^ Q) -> (R | S)) <-> (~T | F)')).toBe('p^q->r|s<->~t|f')
    })
  })
})
