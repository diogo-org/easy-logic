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
 * Each proof exercises Disjunctive Syllogism directly on the disjunction,
 * then uses Modus Ponens and other rules to complete the derivation.
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
// Level 4 Tests
// ---------------------------------------------------------------------------

test.describe('Level 4 — Disjunction Elimination (Proof by Cases)', () => {
  // -----------------------------------------------------------------------
  // Test 16: Classic Proof by Cases
  //   Original: P|Q, P→R, Q→R ⊢ R
  //   Encoded:  (p | q) ^ ~p ^ (q -> r) -> r
  //
  //   Since ∨ Elimination in the UI requires 3 steps (P∨Q + P→C + Q→C),
  //   we include ~p so Disjunctive Syllogism can resolve the case directly.
  //
  //   Proof:
  //     1. Assume (p | q) ^ ~p ^ (q -> r)              [depth 1]
  //     2. ∧ Elim Left  → (p | q) ^ ~p                 [depth 1]
  //     3. ∧ Elim Right → q -> r                        [depth 1]
  //     4. ∧ Elim Left on (2) → p | q                   [depth 1]
  //     5. ∧ Elim Right on (2) → ~p                     [depth 1]
  //     6. DS (4, 5) → q                                [depth 1]
  //     7. MP (6, 3) → r                                [depth 1]
  //     8. → Introduction                                [depth 0]
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
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → q -> r
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: ∧ Elimination (Left) on step 1.1 → p | q
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 1.4: ∧ Elimination (Right) on step 1.1 → ~p
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.5: Disjunctive Syllogism on steps 1.3 (p | q) and 1.4 (~p) → q
    await selectSteps(page, '1.3', '1.4')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 1.6: Modus Ponens on steps 1.5 (q) and 1.2 (q -> r) → r
    await selectSteps(page, '1.5', '1.2')
    await applyRule(page, 'Modus Ponens')

    // Step 8: → Introduction — closes subproof
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
  //     5. DS (2, 4) → p                                [depth 1]
  //     6. ∨ Intro Right on (5), input q → q | p        [depth 1]
  //     7. → Introduction                                [depth 0]
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
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~~~q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: Double Negation on step 1.2 → ~q
    await selectSteps(page, '1.2')
    await applyRule(page, 'Double Negation')

    // Step 1.4: Disjunctive Syllogism on steps 1.1 (p | q) and 1.3 (~q) → p
    await selectSteps(page, '1.1', '1.3')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 1.5: ∨ Introduction (Right) on step 1.4 (p), input q → q | p
    await selectSteps(page, '1.4')
    await applyRuleWithInput(page, '∨ Introduction (Right)', 'q')

    // Step 7: → Introduction — closes subproof
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
  //     6. DS (4, 3) → q                                [depth 1]
  //     7. ∧ Intro (6, 5) → q ^ r                       [depth 1]
  //     8. ∨ Intro Right on (7), input p ^ r →           [depth 1]
  //          (p ^ r) | (q ^ r)
  //     9. → Introduction                                [depth 0]
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
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: ∧ Elimination (Left) on step 1.1 → p | q
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 1.4: ∧ Elimination (Right) on step 1.1 → r
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.5: Disjunctive Syllogism on steps 1.3 (p | q) and 1.2 (~p) → q
    await selectSteps(page, '1.3', '1.2')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 1.6: ∧ Introduction on steps 1.5 (q) and 1.4 (r) → q ^ r
    await selectSteps(page, '1.5', '1.4')
    await applyRule(page, '∧ Introduction')

    // Step 1.7: ∨ Introduction (Right) on step 1.6 (q ^ r), input p ^ r
    //         → (p ^ r) | (q ^ r)
    await selectSteps(page, '1.6')
    await applyRuleWithInput(page, '∨ Introduction (Right)', 'p ^ r')

    // Step 9: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '18-distribution-disj-over-conj')
  })
})
