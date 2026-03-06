/**
 * Level 1 E2E tests — Simple Direct Rules (1-3 steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the six Level 1 proofs from PROOF_TEST_PLAN.md.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the proof assistant page and wait for the goal dialog */
async function openProofAssistant(page: Page) {
  await page.goto('/proof-assistant')
  // The goal dialog should be open
  await expect(page.getByRole('dialog')).toBeVisible()
}

/** Select a knowledge base by its translated name */
async function selectKB(page: Page, name: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name, exact: true }).click()
}

/** Click a suggested goal by its label (e.g. "Derive q", "Extract left") */
async function selectGoal(page: Page, goalLabel: string) {
  const dialog = page.getByRole('dialog')
  // Goals are rendered as ListItemButton with accessible name containing the label
  await dialog.getByRole('button', { name: new RegExp(goalLabel, 'i') }).click()
}

/**
 * Enter a custom goal in the "Custom Goal" text field and submit it.
 * The KB that is currently selected provides the premises.
 */
async function enterCustomGoal(page: Page, formula: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(/custom goal/i).fill(formula)
  await dialog.getByRole('button', { name: /start proof/i }).click()
}

/**
 * Select proof steps by their 1-based position in the step list.
 * Each step row is a clickable Paper that toggles selection.
 */
async function selectSteps(page: Page, ...positions: number[]) {
  // Steps are rendered as Paper elements inside the proof-steps section.
  // Each step starts with its line number "N." so we locate by that.
  for (const pos of positions) {
    // Click the checkbox for the step at position `pos`.
    // Steps contain a checkbox when selectable - click the row itself.
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
 * This opens a sub-dialog where the formula must be typed and confirmed.
 */
async function applyRuleWithInput(page: Page, ruleName: string, formula: string) {
  await applyRule(page, ruleName)
  // A dialog opens for user input
  const inputDialog = page.getByRole('dialog')
  await expect(inputDialog).toBeVisible()
  await inputDialog.getByRole('textbox', { name: /formula/i }).fill(formula)
  await inputDialog.getByRole('button', { name: /apply/i }).click()
}

/** Assert that the proof is complete by checking for the success banner */
async function expectProofComplete(page: Page) {
  await expect(page.getByText(/proof complete/i).first()).toBeVisible({ timeout: 5000 })
}

// ---------------------------------------------------------------------------
// Level 1 Tests
// ---------------------------------------------------------------------------

test.describe('Level 1 — Simple Direct Rules', () => {

  // -----------------------------------------------------------------------
  // Test 1: Basic Modus Ponens
  //   Premises: P, P→Q     Goal: Q     Rule: Modus Ponens
  // -----------------------------------------------------------------------
  test('1. Basic Modus Ponens — derive Q from P and P→Q', async ({ page }) => {
    await openProofAssistant(page)

    // Select the "Modus Ponens" knowledge base
    await selectKB(page, 'Modus Ponens')

    // Pick the suggested goal "Derive q"
    await selectGoal(page, 'Derive q')

    // Dialog closes; premises p (step 1) and p → q (step 2) are shown
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Select both premise steps
    await selectSteps(page, 1, 2)

    // Apply Modus Ponens
    await applyRule(page, 'Modus Ponens')

    // Proof should be complete
    await expectProofComplete(page)
  })

  // -----------------------------------------------------------------------
  // Test 2: Conjunction Introduction
  //   Premises: P, Q     Goal: P^Q     Rule: ∧ Introduction
  // -----------------------------------------------------------------------
  test('2. Conjunction Introduction — derive P∧Q from P and Q', async ({ page }) => {
    await openProofAssistant(page)

    // Select the "Conjunction" knowledge base
    await selectKB(page, 'Conjunction')

    // Pick the suggested goal "Combine with AND"
    await selectGoal(page, 'Combine with AND')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Select both premises
    await selectSteps(page, 1, 2)

    // Apply ∧ Introduction
    await applyRule(page, '∧ Introduction')

    await expectProofComplete(page)
  })

  // -----------------------------------------------------------------------
  // Test 3: Conjunction Elimination Left
  //   Premises: P^Q     Goal: P     Rule: ∧ Elimination (Left)
  // -----------------------------------------------------------------------
  test('3. Conjunction Elimination Left — derive P from P∧Q', async ({ page }) => {
    await openProofAssistant(page)

    // Select the "Conjunction Elimination" knowledge base
    await selectKB(page, 'Conjunction Elimination')

    // Pick the suggested goal "Extract left"
    await selectGoal(page, 'Extract left')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Select the premise (step 1: p ^ q)
    await selectSteps(page, 1)

    // Apply ∧ Elimination (Left)
    await applyRule(page, '∧ Elimination (Left)')

    await expectProofComplete(page)
  })

  // -----------------------------------------------------------------------
  // Test 4: Conjunction Elimination Right
  //   Premises: P^Q     Goal: Q     Rule: ∧ Elimination (Right)
  // -----------------------------------------------------------------------
  test('4. Conjunction Elimination Right — derive Q from P∧Q', async ({ page }) => {
    await openProofAssistant(page)

    // Select the "Conjunction Elimination" knowledge base
    await selectKB(page, 'Conjunction Elimination')

    // Pick the suggested goal "Extract right"
    await selectGoal(page, 'Extract right')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Select the premise (step 1: p ^ q)
    await selectSteps(page, 1)

    // Apply ∧ Elimination (Right)
    await applyRule(page, '∧ Elimination (Right)')

    await expectProofComplete(page)
  })

  // -----------------------------------------------------------------------
  // Test 5: Disjunction Introduction Left
  //   Premises: P     Goal: P|Q     Rule: ∨ Introduction Left
  //   Note: requires user input to specify Q
  // -----------------------------------------------------------------------
  test('5. Disjunction Introduction Left — derive P∨Q from P', async ({ page }) => {
    await openProofAssistant(page)

    // Select the "Disjunction" knowledge base
    await selectKB(page, 'Disjunction')

    // Pick the suggested goal "Add OR"
    await selectGoal(page, 'Add OR')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Select premise (step 1: p)
    await selectSteps(page, 1)

    // Apply ∨ Introduction (Left) — needs user input for the disjunct "q"
    await applyRuleWithInput(page, '∨ Introduction (Left)', 'q')

    await expectProofComplete(page)
  })

  // -----------------------------------------------------------------------
  // Test 6: Double Negation Elimination
  //   Premises: ~~P     Goal: P     Rule: Double Negation
  //
  //   No existing KB has ~~p as a premise, so we prove ~~p → p
  //   using the Empty KB with a custom goal. Steps:
  //     1. Assume ~~p          (opens subproof)
  //     2. Apply Double Neg    (derives p)
  //     3. → Introduction      (closes subproof → ~~p → p)
  //
  //   This still exercises the Double Negation rule which is the point.
  // -----------------------------------------------------------------------
  test('6. Double Negation Elimination — derive P from ~~P', async ({ page }) => {
    await openProofAssistant(page)

    // Stay on "Empty" KB (default) and enter a custom goal
    await enterCustomGoal(page, '~~p -> p')

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume ~~p (opens a subproof)
    await applyRuleWithInput(page, 'Assume', '~~p')

    // Step 2: Select the assumption (step 1: ~~p) and apply Double Negation
    await selectSteps(page, 1)
    await applyRule(page, 'Double Negation')

    // Step 3: Apply → Introduction to close the subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
  })
})
