import { describe, it, expect } from 'vitest'
import { generateTruthTable } from './truthTableGenerator'

describe('truthTableGenerator', () => {
  it('should generate truth table for single variable', () => {
    const rows = generateTruthTable('p')
    
    expect(rows).toHaveLength(2)
    expect(rows[0].assignment).toEqual({ p: false })
    expect(rows[0].result).toBe(false)
    expect(rows[1].assignment).toEqual({ p: true })
    expect(rows[1].result).toBe(true)
  })

  it('should generate truth table for negation', () => {
    const rows = generateTruthTable('~p')
    
    expect(rows).toHaveLength(2)
    expect(rows[0].result).toBe(true)
    expect(rows[1].result).toBe(false)
  })

  it('should generate truth table for AND', () => {
    const rows = generateTruthTable('p ^ q')
    
    expect(rows).toHaveLength(4)
    expect(rows[0].assignment).toEqual({ p: false, q: false })
    expect(rows[0].result).toBe(false)
    expect(rows[3].assignment).toEqual({ p: true, q: true })
    expect(rows[3].result).toBe(true)
  })

  it('should generate truth table for OR', () => {
    const rows = generateTruthTable('p | q')
    
    expect(rows).toHaveLength(4)
    expect(rows[0].result).toBe(false)
    expect(rows[1].result).toBe(true)
    expect(rows[2].result).toBe(true)
    expect(rows[3].result).toBe(true)
  })

  it('should generate truth table for IMPLIES', () => {
    const rows = generateTruthTable('p -> q')
    
    expect(rows).toHaveLength(4)
    expect(rows[0].result).toBe(true)  // F -> F = T
    expect(rows[1].result).toBe(true)  // F -> T = T
    expect(rows[2].result).toBe(false) // T -> F = F
    expect(rows[3].result).toBe(true)  // T -> T = T
  })

  it('should generate truth table for IFF', () => {
    const rows = generateTruthTable('p <-> q')
    
    expect(rows).toHaveLength(4)
    expect(rows[0].result).toBe(true)  // F <-> F = T
    expect(rows[1].result).toBe(false) // F <-> T = F
    expect(rows[2].result).toBe(false) // T <-> F = F
    expect(rows[3].result).toBe(true)  // T <-> T = T
  })

  it('should generate truth table for TRUE constant', () => {
    const rows = generateTruthTable('T')
    
    expect(rows).toHaveLength(1)
    expect(rows[0].result).toBe(true)
  })

  it('should generate truth table for FALSE constant', () => {
    const rows = generateTruthTable('F')
    
    expect(rows).toHaveLength(1)
    expect(rows[0].result).toBe(false)
  })

  it('should handle tautology', () => {
    const rows = generateTruthTable('p | ~p')
    
    expect(rows).toHaveLength(2)
    expect(rows.every(row => row.result)).toBe(true)
  })

  it('should handle contradiction', () => {
    const rows = generateTruthTable('p ^ ~p')
    
    expect(rows).toHaveLength(2)
    expect(rows.every(row => !row.result)).toBe(true)
  })

  it('should handle complex formula with multiple variables', () => {
    const rows = generateTruthTable('(p ^ q) | r')
    
    expect(rows).toHaveLength(8) // 2^3 = 8 rows
    expect(Object.keys(rows[0].assignment)).toHaveLength(3)
  })

  it('should handle formula with parentheses', () => {
    const rows = generateTruthTable('(p | q) ^ r')
    
    expect(rows).toHaveLength(8)
    // When p=F, q=F, r=F: (F | F) ^ F = F ^ F = F
    expect(rows[0].result).toBe(false)
    // When p=T, q=T, r=T: (T | T) ^ T = T ^ T = T
    expect(rows[7].result).toBe(true)
  })

  it('should respect operator precedence', () => {
    const rows1 = generateTruthTable('p | q ^ r')
    const rows2 = generateTruthTable('p | (q ^ r)')
    
    expect(rows1).toEqual(rows2)
  })

  it('should handle De Morgan\'s law', () => {
    const rows = generateTruthTable('~(p ^ q) <-> (~p | ~q)')
    
    expect(rows).toHaveLength(4)
    expect(rows.every(row => row.result)).toBe(true) // Should be tautology
  })

  it('should generate large truth table', () => {
    const rows = generateTruthTable('p ^ q ^ r ^ s')
    
    expect(rows).toHaveLength(16) // 2^4 = 16 rows
  })

  it('should throw error for invalid formula', () => {
    expect(() => generateTruthTable('p &')).toThrow()
  })

  it('should throw error for unmatched parentheses', () => {
    expect(() => generateTruthTable('(p ^ q')).toThrow()
  })
})
