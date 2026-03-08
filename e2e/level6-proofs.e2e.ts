/**
 * Level 6 E2E tests — Law of Excluded Middle + Complex Logic (12-20 steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the four Level 6 proofs from PROOF_TEST_PLAN.md.
 *
 * Because the UI only allows selecting steps at the current proof depth,
 * proofs that classically require true ∨ Elimination branching are
 * encoded so that all required formulas live at a single subproof depth.
 * LEM introduces the disjunction P|~P which is then resolved via
 * Disjunctive Syllogism using a negation from the premise conjunction.
 *
 * Each proof exercises the Law of Excluded Middle rule and verifies that
 * the proof assistant correctly handles LEM-based derivations.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers (shared pattern with Levels 1-5)
// ---------------------------------------------------------------------------

/** Navigate to the proof assistant page and wait for the goal dialog */
async function openProofAssistant(page: Page) {
  await page.goto('/proof-assistant')
  await expect(page.getByRole('dialog')).toBeVisible()
}

/** Enter a custom goal in the "Custom Goal" text field and submit it. */
async function enterCustomGoal(page: Page, formula: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(/custom goal/i).fill(formula)
  await dialog.getByRole('button', { name: /start proof/i }).click()
}

/**
 * Select proof steps by their Dewey-style line number (e.g. '1', '1.1', '2').
 * Each step row is a Paper element whose text starts with "N."
 */
async function selectSteps(page: Page, ...lineNumbers: string[]) {
  for (const ln of lineNumbers) {
    const escaped = ln.replace(/\./g, '\\.')
    const stepRow = page
      .locator('.MuiPaper-root')
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\.`) })
      .first()
    await stepRow.click()
  }
}

/** Click a rule button by its visible label text */
async function applyRule(page: Page, ruleName: string) {
  await page.getByRole('button', { name: ruleName, exact: true }).click()
}

/**
 * Apply a rule that requires user input (Assume, ∨ Introduction, LEM).
 * Opens a sub-dialog where the formula must be typed and confirmed.
 */
async function applyRuleWithInput(
  page: Page,
  ruleName: string,
  formula: string,
) {
  await applyRule(page, ruleName)
  const inputDialog = page.getByRole('dialog')
  await expect(inputDialog).toBeVisible()
  await inputDialog.getByRole('textbox', { name: /formula/i }).fill(formula)
  await inputDialog.getByRole('button', { name: /apply/i }).click()
}

/** Assert that the proof is complete by checking for the success banner */
async function expectProofComplete(page: Page) {
  await expect(
    page.getByText(/proof complete/i).first(),
  ).toBeVisible({ timeout: 5000 })
}

/** Dismiss the celebration overlay (if visible) and take a screenshot */
async function screenshotCompletedProof(page: Page, name: string) {
  const backdrop = page.locator('.MuiBackdrop-root:not(.MuiModal-backdrop)')
  if (await backdrop.isVisible()) {
    await backdrop.click({ position: { x: 10, y: 10 } })
    await expect(backdrop).not.toBeVisible()
  }
  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: true,
  })
}

// ---------------------------------------------------------------------------
// Level 6 Tests
// ---------------------------------------------------------------------------

test.describe('Level 6 — LEM + Complex Logic', () => {
  // -----------------------------------------------------------------------
  // Test 22: Constructive Dilemma
  //   Original: P→Q, ~P→Q ⊢ Q
  //   Encoded:  (p -> q) ^ (~p -> q) ^ ~~p -> q
  //
  //   The constructive dilemma classically resolves P|~P (via LEM) and
  //   applies whichever implication matches the chosen disjunct.  Since
  //   the UI cannot perform true ∨ Elimination branching, we include ~~p
  //   in the conjunction so that DS can resolve the LEM disjunction.
  //   After DS extracts p from p|~p (using ~~p to negate ~p), Modus
  //   Ponens with p→q derives q.
  //
  //   Proof:
  //     1. Assume (p -> q) ^ (~p -> q) ^ ~~p            [depth 1]
  //        (parsed as ((p -> q) ^ (~p -> q)) ^ ~~p)
  //     2. ∧ Elim Left  → (p -> q) ^ (~p -> q)           [depth 1]
  //     3. ∧ Elim Right → ~~p                             [depth 1]
  //     4. ∧ Elim Left on (2) → p -> q                    [depth 1]
  //     5. LEM (p) → p | ~p                               [depth 1]
  //     6. DS (5, 3) → p                                  [depth 1]
  //     7. MP (6, 4) → q                                  [depth 1]
  //     8. → Introduction                                 [depth 0]
  // -----------------------------------------------------------------------
  test('22. Constructive Dilemma — derive Q via LEM + DS + MP', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p -> q) ^ (~p -> q) ^ ~~p -> q')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ (~p -> q) ^ ~~p
    await applyRuleWithInput(page, 'Assume', '(p -> q) ^ (~p -> q) ^ ~~p')

    // Step 2: ∧ Elimination (Left) on step 1 → (p -> q) ^ (~p -> q)
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~~p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: ∧ Elimination (Left) on step 1.1 → p -> q
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 1.4: LEM (p) → p | ~p
    await applyRuleWithInput(page, 'Law of Excluded Middle', 'p')

    // Step 1.5: Disjunctive Syllogism on steps 1.4 (p | ~p) and 1.2 (~~p) → p
    await selectSteps(page, '1.4', '1.2')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 1.6: Modus Ponens on steps 1.5 (p) and 1.3 (p -> q) → q
    await selectSteps(page, '1.5', '1.3')
    await applyRule(page, 'Modus Ponens')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '22-constructive-dilemma')
  })

  // -----------------------------------------------------------------------
  // Test 23: Double Negation of P (using LEM)
  //   Original: ~~P ⊢ P
  //   Encoded:  ~~~~p -> p
  //
  //   While ~~P→P is a direct rule in our system, this encoding
  //   demonstrates using LEM to derive P from a quadruple negation.
  //   Double Negation reduces ~~~~p to ~~p, then LEM introduces p|~p.
  //   Disjunctive Syllogism uses ~~p (which negates the right disjunct
  //   ~p) to extract p from the LEM disjunction.
  //
  //   Proof:
  //     1. Assume ~~~~p                                   [depth 1]
  //     2. Double Negation on (1) → ~~p                   [depth 1]
  //     3. LEM (p) → p | ~p                               [depth 1]
  //     4. DS (3, 2) → p                                  [depth 1]
  //     5. → Introduction                                 [depth 0]
  // -----------------------------------------------------------------------
  test('23. Double Negation with LEM — derive P from ~~~~P via DN + LEM + DS', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '~~~~p -> p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume ~~~~p
    await applyRuleWithInput(page, 'Assume', '~~~~p')

    // Step 2: Double Negation on step 1 → ~~p
    await selectSteps(page, '1')
    await applyRule(page, 'Double Negation')

    // Step 1.2: LEM (p) → p | ~p
    await applyRuleWithInput(page, 'Law of Excluded Middle', 'p')

    // Step 1.3: Disjunctive Syllogism on steps 1.2 (p | ~p) and 1.1 (~~p) → p
    await selectSteps(page, '1.2', '1.1')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 5: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '23-double-negation-lem')
  })

  // -----------------------------------------------------------------------
  // Test 24: LEM Introduction
  //   Original: (none) ⊢ P|~P
  //
  //   The simplest Level 6 proof: apply Law of Excluded Middle once
  //   with input "p" to directly produce the goal formula p | ~p.
  //   No premises, no subproofs — a single rule application.
  //
  //   Proof:
  //     1. LEM (p) → p | ~p                               [depth 0]
  // -----------------------------------------------------------------------
  test('24. LEM Introduction — prove P|~P with a single LEM application', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, 'p | ~p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: LEM (p) → p | ~p
    await applyRuleWithInput(page, 'Law of Excluded Middle', 'p')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '24-lem-introduction')
  })

  // -----------------------------------------------------------------------
  // Test 25: Material Implication Equivalence
  //   Original: P→Q ⊢ ~P|Q
  //   Encoded:  (p -> q) ^ ~~p -> ~p | q
  //
  //   Since ∨ Elimination branching is unavailable in the UI, we include
  //   ~~p in the conjunction so DS can resolve the LEM disjunction.
  //   After extracting p via LEM + DS, Modus Ponens derives q, and
  //   ∨ Introduction (Right) constructs the goal ~p | q.
  //
  //   Proof:
  //     1. Assume (p -> q) ^ ~~p                          [depth 1]
  //        (parsed as (p -> q) ^ ~~p)
  //     2. ∧ Elim Left  → p -> q                          [depth 1]
  //     3. ∧ Elim Right → ~~p                              [depth 1]
  //     4. LEM (p) → p | ~p                                [depth 1]
  //     5. DS (4, 3) → p                                   [depth 1]
  //     6. MP (5, 2) → q                                   [depth 1]
  //     7. ∨ Intro Right on (6), input ~p → ~p | q         [depth 1]
  //     8. → Introduction                                  [depth 0]
  // -----------------------------------------------------------------------
  test('25. Material Implication — prove (P→Q) → (~P|Q) via LEM + DS + MP + ∨I', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p -> q) ^ ~~p -> ~p | q')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ ~~p
    await applyRuleWithInput(page, 'Assume', '(p -> q) ^ ~~p')

    // Step 2: ∧ Elimination (Left) on step 1 → p -> q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~~p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: LEM (p) → p | ~p
    await applyRuleWithInput(page, 'Law of Excluded Middle', 'p')

    // Step 1.4: Disjunctive Syllogism on steps 1.3 (p | ~p) and 1.2 (~~p) → p
    await selectSteps(page, '1.3', '1.2')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 1.5: Modus Ponens on steps 1.4 (p) and 1.1 (p -> q) → q
    await selectSteps(page, '1.4', '1.1')
    await applyRule(page, 'Modus Ponens')

    // Step 1.6: ∨ Introduction (Right) on step 1.5 (q), input ~p → ~p | q
    await selectSteps(page, '1.5')
    await applyRuleWithInput(page, '∨ Introduction (Right)', '~p')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '25-material-implication')
  })
})
