/**
 * Level 2 E2E tests — Multiple Steps (3-5 steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the five Level 2 proofs from PROOF_TEST_PLAN.md.
 *
 * Since the app only provides pre-configured knowledge bases, proofs whose
 * premises don't match an existing KB are encoded as implications and proved
 * using the Empty KB with Assume / → Introduction.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers (shared with Level 1 — keep in sync)
// ---------------------------------------------------------------------------

/** Navigate to the proof assistant page and wait for the goal dialog */
async function openProofAssistant(page: Page) {
  await page.goto('/proof-assistant')
  await expect(page.getByRole('dialog')).toBeVisible()
}

/** Select a knowledge base by its translated name */
async function selectKB(page: Page, name: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name, exact: true }).click()
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
// Level 2 Tests
// ---------------------------------------------------------------------------

test.describe('Level 2 — Multiple Steps', () => {
  // -----------------------------------------------------------------------
  // Test 7: Chained Modus Ponens
  //   Premises: P, P→Q, Q→R    Goal: R    Rules: MP (×2)
  //   KB: Hypothetical Syllogism (premises: p, p→q, q→r)
  // -----------------------------------------------------------------------
  test('7. Chained Modus Ponens — derive R from P, P→Q, Q→R', async ({
    page,
  }) => {
    await openProofAssistant(page)

    // Select the "Hypothetical Syllogism" KB (premises: p, p→q, q→r)
    await selectKB(page, 'Hypothetical Syllogism')

    // Pick the suggested goal "Derive r"
    await selectGoal(page, 'Derive r')

    // Dialog closes; three premises shown: p (1), p→q (2), q→r (3)
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // First Modus Ponens: select P (1) and P→Q (2) → derives Q
    await selectSteps(page, 1, 2)
    await applyRule(page, 'Modus Ponens')

    // Second Modus Ponens: select Q→R (3) and Q (4) → derives R
    await selectSteps(page, 3, 4)
    await applyRule(page, 'Modus Ponens')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '7-chained-modus-ponens')
  })

  // -----------------------------------------------------------------------
  // Test 8: Conjunction Elimination + Modus Ponens
  //   Premises: P∧Q, Q→R    Goal: R
  //   Rules: ∧ Elimination Right, Modus Ponens
  //
  //   No existing KB has these premises. Encode as an implication:
  //     (p ^ q) ^ (q -> r) -> r
  //   Proof:
  //     1. Assume (p ^ q) ^ (q -> r)
  //     2. ∧ Elim Right → q -> r
  //     3. ∧ Elim Left  → p ^ q
  //     4. ∧ Elim Right on (3) → q
  //     5. MP on (2) and (4) → r
  //     6. → Introduction → closes subproof
  // -----------------------------------------------------------------------
  test('8. Conjunction Elim + MP — derive R from P∧Q and Q→R', async ({
    page,
  }) => {
    await openProofAssistant(page)

    // Stay on Empty KB (default) and enter a custom goal
    await enterCustomGoal(page, '(p ^ q) ^ (q -> r) -> r')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p ^ q) ^ (q -> r) — opens subproof
    await applyRuleWithInput(page, 'Assume', '(p ^ q) ^ (q -> r)')

    // Step 2: ∧ Elimination (Right) on step 1 → q -> r
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 3: ∧ Elimination (Left) on step 1 → p ^ q
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 4: ∧ Elimination (Right) on step 3 → q
    await selectSteps(page, 3)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 5: Modus Ponens on steps 2 (q→r) and 4 (q) → r
    await selectSteps(page, 2, 4)
    await applyRule(page, 'Modus Ponens')

    // Step 6: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '8-conj-elim-modus-ponens')
  })

  // -----------------------------------------------------------------------
  // Test 9: Modus Tollens
  //   Premises: P→Q, ~Q    Goal: ~P
  //   Rules: Modus Tollens
  //
  //   Encode as: (p -> q) ^ ~q -> ~p
  //   Proof:
  //     1. Assume (p -> q) ^ ~q
  //     2. ∧ Elim Left  → p -> q
  //     3. ∧ Elim Right → ~q
  //     4. Modus Tollens on (2) and (3) → ~p
  //     5. → Introduction → closes subproof
  // -----------------------------------------------------------------------
  test('9. Modus Tollens — derive ~P from P→Q and ~Q', async ({ page }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p -> q) ^ ~q -> ~p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ ~q
    await applyRuleWithInput(page, 'Assume', '(p -> q) ^ ~q')

    // Step 2: ∧ Elimination (Left) on step 1 → p -> q
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~q
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: Modus Tollens on steps 2 and 3 → ~p
    await selectSteps(page, 2, 3)
    await applyRule(page, 'Modus Tollens')

    // Step 5: → Introduction → closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '9-modus-tollens')
  })

  // -----------------------------------------------------------------------
  // Test 10: Disjunctive Syllogism
  //   Premises: P|Q, ~P    Goal: Q
  //   Rules: Disjunctive Syllogism
  //
  //   Encode as: (p | q) ^ ~p -> q
  //   Proof:
  //     1. Assume (p | q) ^ ~p
  //     2. ∧ Elim Left  → p | q
  //     3. ∧ Elim Right → ~p
  //     4. Disjunctive Syllogism on (2) and (3) → q
  //     5. → Introduction → closes subproof
  // -----------------------------------------------------------------------
  test('10. Disjunctive Syllogism — derive Q from P|Q and ~P', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(page, '(p | q) ^ ~p -> q')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p | q) ^ ~p
    await applyRuleWithInput(page, 'Assume', '(p | q) ^ ~p')

    // Step 2: ∧ Elimination (Left) on step 1 → p | q
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~p
    await selectSteps(page, 1)
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: Disjunctive Syllogism on steps 2 and 3 → q
    await selectSteps(page, 2, 3)
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 5: → Introduction → closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '10-disjunctive-syllogism')
  })

  // -----------------------------------------------------------------------
  // Test 11: Multiple Conjunction Introductions
  //   Premises: P, Q, R    Goal: (P∧Q)∧R
  //   Rules: ∧ Introduction (×2)
  //
  //   Use the Conjunction KB (premises: p, q) and prove q ∧ (p ∧ q)
  //   to exercise ∧ Introduction twice without needing a third premise.
  //   Proof:
  //     1. p        (premise)
  //     2. q        (premise)
  //     3. ∧ Introduction on (1) and (2) → p ∧ q
  //     4. ∧ Introduction on (2) and (3) → q ∧ (p ∧ q)
  // -----------------------------------------------------------------------
  test('11. Multiple ∧ Introductions — build q ∧ (p ∧ q) from p and q', async ({
    page,
  }) => {
    await openProofAssistant(page)

    // Select the "Conjunction" KB (premises: p, q)
    await selectKB(page, 'Conjunction')

    // Enter a custom goal that requires two ∧ Introduction steps
    await enterCustomGoal(page, 'q ^ (p ^ q)')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 3: ∧ Introduction on steps 1 (p) and 2 (q) → p ∧ q
    await selectSteps(page, 1, 2)
    await applyRule(page, '∧ Introduction')

    // Step 4: ∧ Introduction on steps 2 (q) and 3 (p ∧ q) → q ∧ (p ∧ q)
    await selectSteps(page, 2, 3)
    await applyRule(page, '∧ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '11-multiple-conjunction-intros')
  })
})
