/**
 * Level 3 E2E tests — Subproofs with → Introduction (5-8 steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the four Level 3 proofs from PROOF_TEST_PLAN.md.
 *
 * Because the UI only allows selecting steps at the current proof depth,
 * proofs that classically need cross-depth references are encoded so that
 * all required formulas live at a single subproof depth.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers (shared pattern with Levels 1 & 2)
// ---------------------------------------------------------------------------

/** Navigate to the proof assistant page and wait for the goal dialog */
async function openProofAssistant(page: Page) {
  await page.goto('/proof-assistant')
  await expect(page.getByRole('dialog')).toBeVisible()
}

/** Click a suggested goal by its label */
async function selectGoal(page: Page, goalLabel: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: new RegExp(goalLabel, 'i') }).click()
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
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\.\\s`) })
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
// Level 3 Tests
// ---------------------------------------------------------------------------

test.describe('Level 3 — Subproofs (→ Introduction)', () => {
  // -----------------------------------------------------------------------
  // Test 12: Trivial Implication
  //   Premises: (none)    Goal: P→P    Rules: Assume, → Introduction
  //
  //   Uses the Empty KB with the suggested "Identity" goal (p → p).
  //   Proof:
  //     1. Assume p           (opens subproof, depth 1)
  //     2. → Introduction     (closes subproof → p → p, depth 0)
  // -----------------------------------------------------------------------
  test('12. Trivial Implication — prove P→P with Assume + →I', async ({
    page,
  }) => {
    await openProofAssistant(page)

    // The Empty KB is selected by default; choose the "Identity" goal
    await selectGoal(page, 'Identity')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume p (opens a subproof)
    await applyRuleWithInput(page, 'Assume', 'p')

    // Step 2: → Introduction (closes the subproof → p → p)
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '12-trivial-implication')
  })

  // -----------------------------------------------------------------------
  // Test 13: Hypothetical Syllogism
  //   Original: P→Q, Q→R ⊢ P→R
  //   Encoded:  (p → q) ∧ (q → r) ∧ p → r
  //
  //   All premises + the assumed variable are packed into a single
  //   conjunction at depth 1 so that every formula is selectable.
  //   Proof:
  //     1. Assume (p -> q) ^ (q -> r) ^ p        [depth 1]
  //     2. ∧ Elim Right  → p                      [depth 1]
  //     3. ∧ Elim Left   → (p -> q) ^ (q -> r)    [depth 1]
  //     4. ∧ Elim Left   → p -> q                  [depth 1]
  //     5. ∧ Elim Right  → q -> r                  [depth 1]
  //     6. MP (2, 4)     → q                       [depth 1]
  //     7. MP (6, 5)     → r                       [depth 1]
  //     8. → Introduction                          [depth 0]
  // -----------------------------------------------------------------------
  test('13. Hypothetical Syllogism — prove (P→Q)∧(Q→R)∧P → R', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p -> q) ^ (q -> r) ^ p -> r')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ (q -> r) ^ p
    await applyRuleWithInput(page, 'Assume', '(p -> q) ^ (q -> r) ^ p')

    // Step 2: ∧ Elimination (Right) on step 1 → p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 3: ∧ Elimination (Left) on step 1 → (p -> q) ^ (q -> r)
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 4: ∧ Elimination (Left) on step 3 → p -> q
    await selectSteps(page, '3')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 3 → q -> r
    await selectSteps(page, '3')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: Modus Ponens on steps 2 (p) and 4 (p -> q) → q
    await selectSteps(page, '2', '4')
    await applyRule(page, 'Modus Ponens')

    // Step 7: Modus Ponens on steps 6 (q) and 5 (q -> r) → r
    await selectSteps(page, '6', '5')
    await applyRule(page, 'Modus Ponens')

    // Step 8: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '13-hypothetical-syllogism')
  })

  // -----------------------------------------------------------------------
  // Test 14: Weakening
  //   Original: P ⊢ Q→P
  //   Encoded:  (P∧Q)∧R → P∧R  (drop Q, keep P and R)
  //
  //   Demonstrates that irrelevant conjuncts can be "weakened away".
  //   Proof:
  //     1. Assume (p ^ q) ^ r              [depth 1]
  //     2. ∧ Elim Left  → p ^ q            [depth 1]
  //     3. ∧ Elim Right → r                [depth 1]
  //     4. ∧ Elim Left  on (2) → p         [depth 1]
  //     5. ∧ Intro (4, 3) → p ^ r          [depth 1]
  //     6. → Introduction                   [depth 0]
  // -----------------------------------------------------------------------
  test('14. Weakening — prove (P∧Q)∧R → P∧R by dropping Q', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p ^ q) ^ r -> p ^ r')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p ^ q) ^ r
    await applyRuleWithInput(page, 'Assume', '(p ^ q) ^ r')

    // Step 2: ∧ Elimination (Left) on step 1 → p ^ q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → r
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2 → p
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Introduction on steps 4 (p) and 3 (r) → p ^ r
    await selectSteps(page, '4', '3')
    await applyRule(page, '∧ Introduction')

    // Step 6: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '14-weakening')
  })

  // -----------------------------------------------------------------------
  // Test 15: Extracting Implication from Conjunction
  //   Original: P∧Q ⊢ P→Q
  //   Encoded:  (P∧Q) → Q
  //
  //   Proof:
  //     1. Assume p ^ q                     [depth 1]
  //     2. ∧ Elim Right → q                 [depth 1]
  //     3. → Introduction                    [depth 0]
  // -----------------------------------------------------------------------
  test('15. Extract Implication from Conjunction — prove (P∧Q) → Q', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p ^ q) -> q')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume p ^ q
    await applyRuleWithInput(page, 'Assume', 'p ^ q')

    // Step 2: ∧ Elimination (Right) on step 1 → q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 3: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '15-extract-impl-from-conj')
  })
})
