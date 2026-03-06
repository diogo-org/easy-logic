/**
 * Hint strategy logic for the Proof Assistant.
 * Pure function — no React, no UI, fully testable.
 */

import { PROOF_HINT_STEPS } from '../../constants/ui'

interface HintContext {
  selectedKB: string
  stepCount: number
  selectedCount: number
  goal: string
}

/** undefined = no match (fall through), null = explicitly no hint, string = hint key */
type HintResult = string | null | undefined

function getModusPonensHint(ctx: HintContext): HintResult {
  if (ctx.stepCount === 2 && ctx.selectedCount === 0) {return 'hintSelectBothPremises'}
  if (ctx.selectedCount === 2) {return 'hintClickModusPonens'}
  if (ctx.stepCount > 2) {return null}
  return undefined
}

function getConjunctionHint(ctx: HintContext): HintResult {
  if (ctx.stepCount === 2 && ctx.selectedCount === 0) {return 'hintSelectBothPremises'}
  if (ctx.selectedCount === 2) {return 'hintClickAndIntro'}
  return undefined
}

function getEliminationHint(ctx: HintContext): HintResult {
  if (ctx.stepCount === 1 && ctx.selectedCount === 0) {return 'hintSelectPremise'}
  if (ctx.selectedCount === 1) {
    return ctx.goal === 'p' ? 'hintClickAndElimLeft' : 'hintClickAndElimRight'
  }
  return undefined
}

function getDisjunctionHint(ctx: HintContext): HintResult {
  if (ctx.stepCount === 1 && ctx.selectedCount === 0) {return 'hintSelectPremise'}
  if (ctx.selectedCount === 1) {return 'hintClickOrIntro'}
  return undefined
}

function getSyllogismHint(ctx: HintContext): HintResult {
  if (ctx.goal !== 'r') {return undefined}

  if (ctx.stepCount === PROOF_HINT_STEPS.SYLLOGISM_INITIAL && ctx.selectedCount === 0) {return 'hintSelectForMP1'}
  if (ctx.stepCount === PROOF_HINT_STEPS.SYLLOGISM_INITIAL && ctx.selectedCount === PROOF_HINT_STEPS.STEPS_REQUIRED) {return 'hintClickMP'}
  if (ctx.stepCount === PROOF_HINT_STEPS.SYLLOGISM_AFTER_MP && ctx.selectedCount === 0) {return 'hintSelectForMP2'}
  if (ctx.stepCount === PROOF_HINT_STEPS.SYLLOGISM_AFTER_MP && ctx.selectedCount === PROOF_HINT_STEPS.STEPS_REQUIRED) {return 'hintClickMPAgain'}
  return undefined
}

const HINT_STRATEGIES: Record<string, (ctx: HintContext) => HintResult> = {
  'modus-ponens': getModusPonensHint,
  conjunction: getConjunctionHint,
  elimination: getEliminationHint,
  disjunction: getDisjunctionHint,
  syllogism: getSyllogismHint,
}

/**
 * Returns the i18n key for the next hint, or null if no hint is available.
 */
export function getNextHintKey(ctx: HintContext): string | null {
  const strategy = HINT_STRATEGIES[ctx.selectedKB]
  if (!strategy) {return null}

  const result = strategy(ctx)
  return result ?? null
}
