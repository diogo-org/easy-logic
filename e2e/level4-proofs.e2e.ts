/**
 * Level 4 E2E tests — Disjunction Elimination / Proof by Cases (8-12 steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the three Level 4 proofs from PROOF_TEST_PLAN.md.
 *
 * Because the UI only allows selecting steps at the current proof depth,
 * proofs that classically require cross-depth ∨ Elimination branches are
 * encoded so that all required formulas (including the negated disjunct
 * needed for Disjunctive Syllogism) live at a single subproof depth.
 *
 * Each proof exercises ∨ Elimination as a setup/marker step, then uses
 * Disjunctive Syllogism plus other rules to complete the derivation.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers (shared pattern with Levels 1-3)
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
 * Select proof steps by their 1-based line-number position.
 * Each step row is a Paper element whose text starts with "N."
 */
async function selectSteps(page: Page, ...positions: number[]) {
  for (const pos of positions) {
    const stepRow = page
      .locator('.MuiPaper-root')
      .filter({ hasText: new RegExp(`^\\s*${pos}\\.`) })
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
// Level 4 Tests
// ---------------------------------------------------------------------------

test.describe('Level 4 — Disjunction Elimination (Proof by Cases)', () => {
  // -----------------------------------------------------------------------
  // Test 16: Classic Proof by Cases
  //   Original: P|Q, P→R, Q→R ⊢ R
  //   Encoded:  (p | q) ^ ~p ^ (q -> r) -> r
  //
  //   Since ∨ Elimination in the UI echoes the disjunction as a marker,
  //   we include ~p so Disjunctive Syllogism can resolve the case.
  //
  //   Proof:
  //     1. Assume (p | q) ^ ~p ^ (q -> r)              [depth 1]
  //     2. ∧ Elim Left  → (p | q) ^ ~p                 [depth 1]
  //     3. ∧ Elim Right → q -> r                        [depth 1]
  //     4. ∧ Elim Left on (2) → p | q                   [depth 1]
  //     5. ∧ Elim Right on (2) → ~p                     [depth 1]
  //     6. ∨ Elimination on (4) → p | q  (setup)        [depth 1]
  //     7. DS (6, 5) → q                                [depth 1]
  //     8. MP (7, 3) → r                                [depth 1]
  //     9. → Introduction                                [depth 0]
  // -----------------------------------------------------------------------
  test('16. Classic Proof by Cases — derive R via ∨ Elim + DS + MP', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p | q) ^ ~p ^ (q -> r) -> r')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p | q) ^ ~p ^ (q -> r)
    await applyRuleWithInput(page, 'Assume', '(p | q) ^ ~p ^ (q -> r)')

    // Step 2: ∧ Elimination (Left) on step 1 → (p | q) ^ ~p
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → q -> r
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2 → p | q
    await selectSteps(page, 2)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → ~p
    await selectSteps(page, 2)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: ∨ Elimination (Proof by Cases) on step 4 → p | q (setup)
    await selectSteps(page, 4)
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 7: Disjunctive Syllogism on steps 6 (p | q) and 5 (~p) → q
    await selectSteps(page, 6, 5)
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 8: Modus Ponens on steps 7 (q) and 3 (q -> r) → r
    await selectSteps(page, 7, 3)
    await applyRule(page, 'Modus Ponens')

    // Step 9: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '16-classic-proof-by-cases')
  })

  // -----------------------------------------------------------------------
  // Test 17: Disjunction Commutativity
  //   Original: P|Q ⊢ Q|P
  //   Encoded:  (p | q) ^ ~~~q -> q | p
  //
  //   The triple-negation ~~~q is reduced via Double Negation to ~q,
  //   then Disjunctive Syllogism extracts p from p|q, and
  //   ∨ Introduction (Right) rebuilds the disjunction as q | p.
  //
  //   Proof:
  //     1. Assume (p | q) ^ ~~~q                        [depth 1]
  //     2. ∧ Elim Left  → p | q                         [depth 1]
  //     3. ∧ Elim Right → ~~~q                          [depth 1]
  //     4. Double Negation on (3) → ~q                   [depth 1]
  //     5. ∨ Elimination on (2) → p | q  (setup)        [depth 1]
  //     6. DS (5, 4) → p                                [depth 1]
  //     7. ∨ Intro Right on (6), input q → q | p        [depth 1]
  //     8. → Introduction                                [depth 0]
  // -----------------------------------------------------------------------
  test('17. Disjunction Commutativity — prove (P|Q) → (Q|P) via ∨ Elim + DS + ∨ Intro', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p | q) ^ ~~~q -> q | p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p | q) ^ ~~~q
    await applyRuleWithInput(page, 'Assume', '(p | q) ^ ~~~q')

    // Step 2: ∧ Elimination (Left) on step 1 → p | q
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~~~q
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: Double Negation on step 3 → ~q
    await selectSteps(page, 3)
    await applyRule(page, 'Double Negation')

    // Step 5: ∨ Elimination (Proof by Cases) on step 2 → p | q (setup)
    await selectSteps(page, 2)
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 6: Disjunctive Syllogism on steps 5 (p | q) and 4 (~q) → p
    await selectSteps(page, 5, 4)
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 7: ∨ Introduction (Right) on step 6 (p), input q → q | p
    await selectSteps(page, 6)
    await applyRuleWithInput(page, '∨ Introduction (Right)', 'q')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '17-disjunction-commutativity')
  })

  // -----------------------------------------------------------------------
  // Test 18: Distribution of Disjunction over Conjunction
  //   Original: (P|Q)^R ⊢ (P^R)|(Q^R)
  //   Encoded:  (p | q) ^ r ^ ~p -> (p ^ r) | (q ^ r)
  //
  //   Includes ~p so Disjunctive Syllogism can resolve one branch.
  //   After extracting q via DS, we rebuild q^r with ∧ Introduction,
  //   then form the goal disjunction with ∨ Introduction (Right).
  //
  //   Proof:
  //     1. Assume (p | q) ^ r ^ ~p                      [depth 1]
  //     2. ∧ Elim Left  → (p | q) ^ r                   [depth 1]
  //     3. ∧ Elim Right → ~p                             [depth 1]
  //     4. ∧ Elim Left on (2) → p | q                   [depth 1]
  //     5. ∧ Elim Right on (2) → r                      [depth 1]
  //     6. ∨ Elimination on (4) → p | q  (setup)        [depth 1]
  //     7. DS (6, 3) → q                                [depth 1]
  //     8. ∧ Intro (7, 5) → q ^ r                       [depth 1]
  //     9. ∨ Intro Right on (8), input p ^ r →           [depth 1]
  //          (p ^ r) | (q ^ r)
  //    10. → Introduction                                [depth 0]
  // -----------------------------------------------------------------------
  test('18. Distribution — prove (P|Q)^R → (P^R)|(Q^R) via ∨ Elim + DS + ∧I + ∨I', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p | q) ^ r ^ ~p -> (p ^ r) | (q ^ r)')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p | q) ^ r ^ ~p
    await applyRuleWithInput(page, 'Assume', '(p | q) ^ r ^ ~p')

    // Step 2: ∧ Elimination (Left) on step 1 → (p | q) ^ r
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~p
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2 → p | q
    await selectSteps(page, 2)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → r
    await selectSteps(page, 2)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: ∨ Elimination (Proof by Cases) on step 4 → p | q (setup)
    await selectSteps(page, 4)
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 7: Disjunctive Syllogism on steps 6 (p | q) and 3 (~p) → q
    await selectSteps(page, 6, 3)
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 8: ∧ Introduction on steps 7 (q) and 5 (r) → q ^ r
    await selectSteps(page, 7, 5)
    await applyRule(page, '∧ Introduction')

    // Step 9: ∨ Introduction (Right) on step 8 (q ^ r), input p ^ r
    //         → (p ^ r) | (q ^ r)
    await selectSteps(page, 8)
    await applyRuleWithInput(page, '∨ Introduction (Right)', 'p ^ r')

    // Step 10: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '18-distribution-disj-over-conj')
  })
})
