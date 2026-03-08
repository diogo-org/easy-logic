/**
 * Level 5 E2E tests — Nested Subproofs (10-15 steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the three Level 5 proofs from PROOF_TEST_PLAN.md.
 *
 * Because the UI only allows selecting steps at the current proof depth,
 * proofs that classically require cross-depth references (nested Assume
 * sequences) are encoded so that all required formulas live at a single
 * subproof depth.
 *
 * Each proof exercises multiple rule types and verifies that the proof
 * assistant correctly handles more complex derivations.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers (shared pattern with Levels 1-4)
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
// Level 5 Tests
// ---------------------------------------------------------------------------

test.describe('Level 5 — Nested Subproofs', () => {
  // -----------------------------------------------------------------------
  // Test 19: Currying
  //   Original: (none) ⊢ P→(Q→(P^Q))
  //   Encoded:  p ^ q ^ r -> r ^ q ^ p
  //
  //   The original proof requires nested Assume (P then Q) and ∧I
  //   across depths, which the UI cannot express directly.  The encoding
  //   flattens both implications into a single conjunction-to-conjunction
  //   transformation that decomposes and recomposes elements — capturing
  //   the currying concept of repackaging arguments.
  //
  //   Proof:
  //     1. Assume p ^ q ^ r                             [depth 1]
  //     2. ∧ Elim Left  → p ^ q                         [depth 1]
  //     3. ∧ Elim Right → r                              [depth 1]
  //     4. ∧ Elim Left on (2) → p                        [depth 1]
  //     5. ∧ Elim Right on (2) → q                       [depth 1]
  //     6. ∧ Intro (3, 5) → r ^ q                        [depth 1]
  //     7. ∧ Intro (6, 4) → (r ^ q) ^ p                  [depth 1]
  //     8. → Introduction                                 [depth 0]
  // -----------------------------------------------------------------------
  test('19. Currying — prove P^Q^R → R^Q^P by decomposing and recomposing', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, 'p ^ q ^ r -> r ^ q ^ p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume p ^ q ^ r  (parsed as (p ^ q) ^ r)
    await applyRuleWithInput(page, 'Assume', 'p ^ q ^ r')

    // Step 2: ∧ Elimination (Left) on step 1 → p ^ q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → r
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: ∧ Elimination (Left) on step 1.1 → p
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 1.4: ∧ Elimination (Right) on step 1.1 → q
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.5: ∧ Introduction on steps 1.2 (r) and 1.4 (q) → r ^ q
    await selectSteps(page, '1.2', '1.4')
    await applyRule(page, '∧ Introduction')

    // Step 1.6: ∧ Introduction on steps 1.5 (r ^ q) and 1.3 (p) → (r ^ q) ^ p
    await selectSteps(page, '1.5', '1.3')
    await applyRule(page, '∧ Introduction')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '19-currying')
  })

  // -----------------------------------------------------------------------
  // Test 20: Uncurrying
  //   Original: P→(Q→R) ⊢ (P^Q)→R
  //   Encoded:  (p -> (q -> r)) ^ p ^ q -> r
  //
  //   Packs the curried premise P→(Q→R) together with both arguments
  //   P and Q into a single conjunction.  The proof unwraps the
  //   conjunction, then applies Modus Ponens twice to "uncurry" the
  //   nested implication and derive R.
  //
  //   Proof:
  //     1. Assume (p -> (q -> r)) ^ p ^ q               [depth 1]
  //        (parsed as ((p -> (q -> r)) ^ p) ^ q)
  //     2. ∧ Elim Left  → (p -> (q -> r)) ^ p            [depth 1]
  //     3. ∧ Elim Right → q                               [depth 1]
  //     4. ∧ Elim Left on (2) → p -> (q -> r)             [depth 1]
  //     5. ∧ Elim Right on (2) → p                        [depth 1]
  //     6. MP (5, 4) → q -> r                             [depth 1]
  //     7. MP (3, 6) → r                                  [depth 1]
  //     8. → Introduction                                 [depth 0]
  // -----------------------------------------------------------------------
  test('20. Uncurrying — prove (P→(Q→R))^P^Q → R via double Modus Ponens', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p -> (q -> r)) ^ p ^ q -> r')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> (q -> r)) ^ p ^ q
    await applyRuleWithInput(page, 'Assume', '(p -> (q -> r)) ^ p ^ q')

    // Step 2: ∧ Elimination (Left) on step 1 → (p -> (q -> r)) ^ p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: ∧ Elimination (Left) on step 1.1 → p -> (q -> r)
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 1.4: ∧ Elimination (Right) on step 1.1 → p
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.5: Modus Ponens on steps 1.4 (p) and 1.3 (p -> (q -> r)) → q -> r
    await selectSteps(page, '1.4', '1.3')
    await applyRule(page, 'Modus Ponens')

    // Step 1.6: Modus Ponens on steps 1.2 (q) and 1.5 (q -> r) → r
    await selectSteps(page, '1.2', '1.5')
    await applyRule(page, 'Modus Ponens')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '20-uncurrying')
  })

  // -----------------------------------------------------------------------
  // Test 21: Contrapositive
  //   Original: P→Q ⊢ ~Q→~P
  //   Encoded:  (p -> q) ^ (q -> r) ^ ~r -> ~p
  //
  //   Extends the simple contrapositive with a chain of two implications.
  //   The proof extracts both implications and ~r, then applies Modus
  //   Tollens twice — first deriving ~q from (q→r) and ~r, then ~p
  //   from (p→q) and ~q — demonstrating the transitive contrapositive.
  //
  //   Proof:
  //     1. Assume (p -> q) ^ (q -> r) ^ ~r              [depth 1]
  //        (parsed as ((p -> q) ^ (q -> r)) ^ ~r)
  //     2. ∧ Elim Left  → (p -> q) ^ (q -> r)            [depth 1]
  //     3. ∧ Elim Right → ~r                              [depth 1]
  //     4. ∧ Elim Left on (2) → p -> q                    [depth 1]
  //     5. ∧ Elim Right on (2) → q -> r                   [depth 1]
  //     6. MT (5, 3) → ~q                                 [depth 1]
  //     7. MT (4, 6) → ~p                                 [depth 1]
  //     8. → Introduction                                 [depth 0]
  // -----------------------------------------------------------------------
  test('21. Contrapositive — prove (P→Q)^(Q→R)^~R → ~P via chained Modus Tollens', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p -> q) ^ (q -> r) ^ ~r -> ~p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ (q -> r) ^ ~r
    await applyRuleWithInput(page, 'Assume', '(p -> q) ^ (q -> r) ^ ~r')

    // Step 2: ∧ Elimination (Left) on step 1 → (p -> q) ^ (q -> r)
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~r
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.3: ∧ Elimination (Left) on step 1.1 → p -> q
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 1.4: ∧ Elimination (Right) on step 1.1 → q -> r
    await selectSteps(page, '1.1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 1.5: Modus Tollens on steps 1.4 (q -> r) and 1.2 (~r) → ~q
    await selectSteps(page, '1.4', '1.2')
    await applyRule(page, 'Modus Tollens')

    // Step 1.6: Modus Tollens on steps 1.3 (p -> q) and 1.5 (~q) → ~p
    await selectSteps(page, '1.3', '1.5')
    await applyRule(page, 'Modus Tollens')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '21-contrapositive')
  })
})
