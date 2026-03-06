/**
 * Tests for hint strategy logic
 */

import { describe, it, expect } from 'vitest'
import { getNextHintKey } from './hintStrategy'

describe('getNextHintKey', () => {
  describe('unknown KB', () => {
    it('returns null for unrecognized KB', () => {
      expect(getNextHintKey({ selectedKB: 'unknown', stepCount: 0, selectedCount: 0, goal: '' })).toBeNull()
    })
  })

  describe('modus-ponens KB', () => {
    it('hints to select both premises when 2 steps and none selected', () => {
      expect(getNextHintKey({ selectedKB: 'modus-ponens', stepCount: 2, selectedCount: 0, goal: 'q' }))
        .toBe('hintSelectBothPremises')
    })

    it('hints to click MP when 2 steps are selected', () => {
      expect(getNextHintKey({ selectedKB: 'modus-ponens', stepCount: 2, selectedCount: 2, goal: 'q' }))
        .toBe('hintClickModusPonens')
    })

    it('returns null when more than 2 steps (done or progressing)', () => {
      expect(getNextHintKey({ selectedKB: 'modus-ponens', stepCount: 3, selectedCount: 0, goal: 'q' }))
        .toBeNull()
    })

    it('returns null when 1 step and nothing selected (no match)', () => {
      expect(getNextHintKey({ selectedKB: 'modus-ponens', stepCount: 1, selectedCount: 0, goal: 'q' }))
        .toBeNull()
    })
  })

  describe('conjunction KB', () => {
    it('hints to select both premises when 2 steps and none selected', () => {
      expect(getNextHintKey({ selectedKB: 'conjunction', stepCount: 2, selectedCount: 0, goal: '' }))
        .toBe('hintSelectBothPremises')
    })

    it('hints to click AND intro when 2 selected', () => {
      expect(getNextHintKey({ selectedKB: 'conjunction', stepCount: 2, selectedCount: 2, goal: '' }))
        .toBe('hintClickAndIntro')
    })

    it('returns null when no conditions match', () => {
      expect(getNextHintKey({ selectedKB: 'conjunction', stepCount: 1, selectedCount: 0, goal: '' }))
        .toBeNull()
    })
  })

  describe('elimination KB', () => {
    it('hints to select premise when 1 step and none selected', () => {
      expect(getNextHintKey({ selectedKB: 'elimination', stepCount: 1, selectedCount: 0, goal: '' }))
        .toBe('hintSelectPremise')
    })

    it('hints AND elim left when goal is p', () => {
      expect(getNextHintKey({ selectedKB: 'elimination', stepCount: 1, selectedCount: 1, goal: 'p' }))
        .toBe('hintClickAndElimLeft')
    })

    it('hints AND elim right when goal is not p', () => {
      expect(getNextHintKey({ selectedKB: 'elimination', stepCount: 1, selectedCount: 1, goal: 'q' }))
        .toBe('hintClickAndElimRight')
    })

    it('returns null when no conditions match', () => {
      expect(getNextHintKey({ selectedKB: 'elimination', stepCount: 3, selectedCount: 0, goal: '' }))
        .toBeNull()
    })
  })

  describe('disjunction KB', () => {
    it('hints to select premise when 1 step and none selected', () => {
      expect(getNextHintKey({ selectedKB: 'disjunction', stepCount: 1, selectedCount: 0, goal: '' }))
        .toBe('hintSelectPremise')
    })

    it('hints to click OR intro when 1 selected', () => {
      expect(getNextHintKey({ selectedKB: 'disjunction', stepCount: 1, selectedCount: 1, goal: '' }))
        .toBe('hintClickOrIntro')
    })

    it('returns null when no conditions match', () => {
      expect(getNextHintKey({ selectedKB: 'disjunction', stepCount: 3, selectedCount: 0, goal: '' }))
        .toBeNull()
    })
  })

  describe('syllogism KB', () => {
    it('returns null when goal is not r', () => {
      expect(getNextHintKey({ selectedKB: 'syllogism', stepCount: 3, selectedCount: 0, goal: 'q' }))
        .toBeNull()
    })

    it('hints to select for MP1 at initial step count with none selected', () => {
      expect(getNextHintKey({ selectedKB: 'syllogism', stepCount: 3, selectedCount: 0, goal: 'r' }))
        .toBe('hintSelectForMP1')
    })

    it('hints to click MP at initial step count with 2 selected', () => {
      expect(getNextHintKey({ selectedKB: 'syllogism', stepCount: 3, selectedCount: 2, goal: 'r' }))
        .toBe('hintClickMP')
    })

    it('hints to select for MP2 after first MP with none selected', () => {
      expect(getNextHintKey({ selectedKB: 'syllogism', stepCount: 4, selectedCount: 0, goal: 'r' }))
        .toBe('hintSelectForMP2')
    })

    it('hints to click MP again after first MP with 2 selected', () => {
      expect(getNextHintKey({ selectedKB: 'syllogism', stepCount: 4, selectedCount: 2, goal: 'r' }))
        .toBe('hintClickMPAgain')
    })

    it('returns null when no conditions match', () => {
      expect(getNextHintKey({ selectedKB: 'syllogism', stepCount: 10, selectedCount: 0, goal: 'r' }))
        .toBeNull()
    })
  })
})
