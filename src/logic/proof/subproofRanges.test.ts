import { describe, it, expect } from 'vitest'
import { computeSubproofRanges, getContainingSubproofDepths } from './subproofRanges'
import { RULE_KEYS, type ProofStep } from './types'

function makeStep(overrides: Partial<ProofStep> & { id: number; depth: number }): ProofStep {
  return {
    lineNumber: String(overrides.id),
    formula: 'p',
    ruleKey: RULE_KEYS.ASSUME,
    dependencies: [],
    justificationKey: 'justificationAssumption',
    ...overrides,
  }
}

describe('computeSubproofRanges', () => {
  it('returns empty array when there are no steps', () => {
    expect(computeSubproofRanges([])).toEqual([])
  })

  it('returns empty array when all steps are at depth 0', () => {
    const steps = [
      makeStep({ id: 1, depth: 0, ruleKey: RULE_KEYS.PREMISE }),
      makeStep({ id: 2, depth: 0, ruleKey: RULE_KEYS.MODUS_PONENS }),
    ]
    expect(computeSubproofRanges(steps)).toEqual([])
  })

  it('identifies a single subproof (depth 0 → 1 → 0)', () => {
    const steps = [
      makeStep({ id: 1, depth: 0, ruleKey: RULE_KEYS.PREMISE }),
      makeStep({ id: 2, depth: 1, ruleKey: RULE_KEYS.ASSUME }),
      makeStep({ id: 3, depth: 1 }),
      makeStep({ id: 4, depth: 0, ruleKey: RULE_KEYS.IMPL_INTRO }),
    ]
    const ranges = computeSubproofRanges(steps)
    expect(ranges).toEqual([
      { startIndex: 1, endIndex: 2, depth: 1 },
    ])
  })

  it('identifies nested subproofs (depth 0 → 1 → 2 → 1 → 0)', () => {
    const steps = [
      makeStep({ id: 1, depth: 0 }),
      makeStep({ id: 2, depth: 1 }),   // outer subproof start
      makeStep({ id: 3, depth: 2 }),   // inner subproof start
      makeStep({ id: 4, depth: 2 }),   // inner subproof body
      makeStep({ id: 5, depth: 1 }),   // inner closes, back to outer
      makeStep({ id: 6, depth: 0 }),   // outer closes
    ]
    const ranges = computeSubproofRanges(steps)
    // Inner closes first (stack order), then outer
    expect(ranges).toContainEqual({ startIndex: 2, endIndex: 3, depth: 2 })
    expect(ranges).toContainEqual({ startIndex: 1, endIndex: 4, depth: 1 })
    expect(ranges).toHaveLength(2)
  })

  it('handles subproof that is never closed (extends to end)', () => {
    const steps = [
      makeStep({ id: 1, depth: 0 }),
      makeStep({ id: 2, depth: 1 }),
      makeStep({ id: 3, depth: 1 }),
    ]
    const ranges = computeSubproofRanges(steps)
    expect(ranges).toEqual([
      { startIndex: 1, endIndex: 2, depth: 1 },
    ])
  })

  it('handles multiple sequential subproofs at the same depth', () => {
    const steps = [
      makeStep({ id: 1, depth: 0 }),
      makeStep({ id: 2, depth: 1 }),   // first subproof
      makeStep({ id: 3, depth: 0 }),   // closes first
      makeStep({ id: 4, depth: 1 }),   // second subproof
      makeStep({ id: 5, depth: 0 }),   // closes second
    ]
    const ranges = computeSubproofRanges(steps)
    expect(ranges).toContainEqual({ startIndex: 1, endIndex: 1, depth: 1 })
    expect(ranges).toContainEqual({ startIndex: 3, endIndex: 3, depth: 1 })
    expect(ranges).toHaveLength(2)
  })

  it('handles p -> p proof (single assumption step)', () => {
    const steps = [
      makeStep({ id: 1, depth: 1, ruleKey: RULE_KEYS.ASSUME, formula: 'p' }),
      makeStep({ id: 2, depth: 0, ruleKey: RULE_KEYS.IMPL_INTRO, formula: 'p -> p' }),
    ]
    const ranges = computeSubproofRanges(steps)
    expect(ranges).toEqual([
      { startIndex: 0, endIndex: 0, depth: 1 },
    ])
  })
})

describe('getContainingSubproofDepths', () => {
  it('returns empty for steps not in any subproof', () => {
    const ranges = [{ startIndex: 1, endIndex: 2, depth: 1 }]
    expect(getContainingSubproofDepths(0, ranges)).toEqual([])
    expect(getContainingSubproofDepths(3, ranges)).toEqual([])
  })

  it('returns [1] for a step inside a depth-1 subproof', () => {
    const ranges = [{ startIndex: 1, endIndex: 3, depth: 1 }]
    expect(getContainingSubproofDepths(2, ranges)).toEqual([1])
  })

  it('returns [1, 2] for a step inside nested subproofs', () => {
    const ranges = [
      { startIndex: 1, endIndex: 4, depth: 1 },
      { startIndex: 2, endIndex: 3, depth: 2 },
    ]
    expect(getContainingSubproofDepths(2, ranges)).toEqual([1, 2])
  })
})
