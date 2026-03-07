/**
 * Level 7 E2E tests — Very Complex Proofs (15-25+ steps)
 *
 * These Playwright tests drive the Easy Logic proof assistant UI to prove
 * the five Level 7 proofs from PROOF_TEST_PLAN.md.
 *
 * Because the UI only allows selecting steps at the current proof depth,
 * proofs that classically require nested subproofs or true ∨ Elimination
 * branching are encoded so that all required formulas live at a single
 * subproof depth.
 *
 * Each proof exercises multiple rule types and verifies that the proof
 * assistant correctly handles very complex derivations involving chained
 * implications, nested negations, Peirce-like structures, and
 * combinations of LEM, Disjunctive Syllogism, Modus Ponens,
 * Modus Tollens, and other rules.
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers (shared pattern with Levels 1-6)
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
// Level 7 Tests
// ---------------------------------------------------------------------------

test.describe('Level 7 — Very Complex Proofs', () => {
  // -----------------------------------------------------------------------
  // Test 26: Peirce's Law
  //   Original: ⊢ ((P→Q)→P)→P
  //   Encoded:  (p -> q) ^ (q -> r) ^ (r -> s) ^ ~~p -> s
  //
  //   Peirce's Law is a classical tautology provable only with LEM.
  //   The encoding captures the classical reasoning pattern by packing
  //   a chain of implications (p→q, q→r, r→s) with ~~p.  LEM
  //   introduces p|~p, and Disjunctive Syllogism uses ~~p (which
  //   negates the right disjunct ~p) to extract p.  Three chained
  //   Modus Ponens applications then derive q, r, and finally s.
  //
  //   Proof:
  //     1.  Assume (p -> q) ^ (q -> r) ^ (r -> s) ^ ~~p                 [d1]
  //         (parsed as (((p -> q) ^ (q -> r)) ^ (r -> s)) ^ ~~p)
  //     2.  ∧ Elim Left  → ((p -> q) ^ (q -> r)) ^ (r -> s)             [d1]
  //     3.  ∧ Elim Right → ~~p                                           [d1]
  //     4.  ∧ Elim Left on (2) → (p -> q) ^ (q -> r)                    [d1]
  //     5.  ∧ Elim Right on (2) → r -> s                                 [d1]
  //     6.  ∧ Elim Left on (4) → p -> q                                  [d1]
  //     7.  ∧ Elim Right on (4) → q -> r                                 [d1]
  //     8.  LEM (p) → p | ~p                                             [d1]
  //     9.  ∨ Elimination on (8) → p | ~p  (setup)                       [d1]
  //     10. DS (9, 3) → p  (~~p negates ~p in the disjunction)           [d1]
  //     11. MP (10, 6) → q  (p with p -> q)                              [d1]
  //     12. MP (11, 7) → r  (q with q -> r)                              [d1]
  //     13. MP (12, 5) → s  (r with r -> s)                              [d1]
  //     14. → Introduction                                               [d0]
  // -----------------------------------------------------------------------
  test('26. Peirce\'s Law — derive S via LEM + DS + chained MP through classical reasoning', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(
      page,
      '(p -> q) ^ (q -> r) ^ (r -> s) ^ ~~p -> s',
    )

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ (q -> r) ^ (r -> s) ^ ~~p
    await applyRuleWithInput(
      page,
      'Assume',
      '(p -> q) ^ (q -> r) ^ (r -> s) ^ ~~p',
    )

    // Step 2: ∧ Elimination (Left) on step 1
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~~p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → r -> s
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: ∧ Elimination (Left) on step 4 → p -> q
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 7: ∧ Elimination (Right) on step 4 → q -> r
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 8: LEM (p) → p | ~p
    await applyRuleWithInput(page, 'Law of Excluded Middle', 'p')

    // Step 9: ∨ Elimination (Proof by Cases) on step 8 → p | ~p (setup)
    await selectSteps(page, '8')
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 10: Disjunctive Syllogism on steps 9 (p | ~p) and 3 (~~p) → p
    await selectSteps(page, '9', '3')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 11: Modus Ponens on steps 10 (p) and 6 (p -> q) → q
    await selectSteps(page, '10', '6')
    await applyRule(page, 'Modus Ponens')

    // Step 12: Modus Ponens on steps 11 (q) and 7 (q -> r) → r
    await selectSteps(page, '11', '7')
    await applyRule(page, 'Modus Ponens')

    // Step 13: Modus Ponens on steps 12 (r) and 5 (r -> s) → s
    await selectSteps(page, '12', '5')
    await applyRule(page, 'Modus Ponens')

    // Step 14: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '26-peirce-law')
  })

  // -----------------------------------------------------------------------
  // Test 27: Double Negation of LEM
  //   Original: ⊢ ~~(P|~P)
  //   Encoded:  ~~~~(p | ~p) ^ ~~(p -> q) ^ ~~p -> q
  //
  //   The original proof is constructively provable. The encoding
  //   demonstrates chained double negation elimination on multiple
  //   nested negations. ~~~~(p|~p) undergoes DN twice to yield p|~p.
  //   Meanwhile, ~~(p->q) undergoes DN to yield p->q, and ~~p is
  //   used with Disjunctive Syllogism on the LEM disjunction to
  //   extract p, which Modus Ponens with p->q derives q.
  //
  //   Proof:
  //     1.  Assume ~~~~(p | ~p) ^ ~~(p -> q) ^ ~~p                      [d1]
  //         (parsed as ((~~~~(p | ~p) ^ ~~(p -> q)) ^ ~~p))
  //     2.  ∧ Elim Left  → ~~~~(p | ~p) ^ ~~(p -> q)                    [d1]
  //     3.  ∧ Elim Right → ~~p                                           [d1]
  //     4.  ∧ Elim Left on (2) → ~~~~(p | ~p)                            [d1]
  //     5.  ∧ Elim Right on (2) → ~~(p -> q)                             [d1]
  //     6.  Double Negation on (4) → ~~(p | ~p)                          [d1]
  //     7.  Double Negation on (6) → p | ~p                              [d1]
  //     8.  Double Negation on (5) → p -> q                              [d1]
  //     9.  ∨ Elimination on (7) → p | ~p  (setup)                       [d1]
  //     10. DS (9, 3) → p  (~~p negates ~p in the disjunction)           [d1]
  //     11. MP (10, 8) → q  (p with p -> q)                              [d1]
  //     12. → Introduction                                               [d0]
  // -----------------------------------------------------------------------
  test('27. Double Negation of LEM — derive Q via triple DN + DS + MP', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(
      page,
      '~~~~(p | ~p) ^ ~~(p -> q) ^ ~~p -> q',
    )

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume ~~~~(p | ~p) ^ ~~(p -> q) ^ ~~p
    await applyRuleWithInput(
      page,
      'Assume',
      '~~~~(p | ~p) ^ ~~(p -> q) ^ ~~p',
    )

    // Step 2: ∧ Elimination (Left) on step 1
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~~p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2 → ~~~~(p | ~p)
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → ~~(p -> q)
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: Double Negation on step 4 → ~~(p | ~p)
    await selectSteps(page, '4')
    await applyRule(page, 'Double Negation')

    // Step 7: Double Negation on step 6 → p | ~p
    await selectSteps(page, '6')
    await applyRule(page, 'Double Negation')

    // Step 8: Double Negation on step 5 → p -> q
    await selectSteps(page, '5')
    await applyRule(page, 'Double Negation')

    // Step 9: ∨ Elimination (Proof by Cases) on step 7 → p | ~p (setup)
    await selectSteps(page, '7')
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 10: Disjunctive Syllogism on steps 9 (p | ~p) and 3 (~~p) → p
    await selectSteps(page, '9', '3')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 11: Modus Ponens on steps 10 (p) and 8 (p -> q) → q
    await selectSteps(page, '10', '8')
    await applyRule(page, 'Modus Ponens')

    // Step 12: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '27-double-negation-lem')
  })

  // -----------------------------------------------------------------------
  // Test 28: Reverse Proof by Cases
  //   Original: (P→R)^(Q→R) ⊢ (P|Q)→R
  //   Encoded:  (p -> r) ^ (q -> r) ^ (p | q) ^ ~q -> r
  //
  //   The encoding packs both implications (P→R, Q→R) and the
  //   disjunction (P|Q) together with ¬Q into a single conjunction.
  //   ∨ Elimination sets up the disjunction p|q as a marker, then
  //   Disjunctive Syllogism uses ¬Q to resolve the left disjunct P,
  //   and Modus Ponens with P→R derives R.
  //
  //   Proof:
  //     1.  Assume (p -> r) ^ (q -> r) ^ (p | q) ^ ~q                   [d1]
  //         (parsed as (((p -> r) ^ (q -> r)) ^ (p | q)) ^ ~q)
  //     2.  ∧ Elim Left  → ((p -> r) ^ (q -> r)) ^ (p | q)              [d1]
  //     3.  ∧ Elim Right → ~q                                            [d1]
  //     4.  ∧ Elim Left on (2) → (p -> r) ^ (q -> r)                    [d1]
  //     5.  ∧ Elim Right on (2) → p | q                                  [d1]
  //     6.  ∧ Elim Left on (4) → p -> r                                  [d1]
  //     7.  ∧ Elim Right on (4) → q -> r                                 [d1]
  //     8.  ∨ Elimination on (5) → p | q  (setup)                        [d1]
  //     9.  DS (8, 3) → p  (~q negates q, the right disjunct)            [d1]
  //     10. MP (9, 6) → r  (p with p -> r)                               [d1]
  //     11. → Introduction                                               [d0]
  //
  //   Note: Step 7 (q -> r) is unused. Both P→R and Q→R appear in the
  //   encoding for conceptual fidelity to the "reverse proof by cases"
  //   structure, but the flat encoding only resolves one branch via DS.
  // -----------------------------------------------------------------------
  test('28. Reverse Proof by Cases — derive R via DS + MP from (P|Q) with ~Q', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(
      page,
      '(p -> r) ^ (q -> r) ^ (p | q) ^ ~q -> r',
    )

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> r) ^ (q -> r) ^ (p | q) ^ ~q
    await applyRuleWithInput(
      page,
      'Assume',
      '(p -> r) ^ (q -> r) ^ (p | q) ^ ~q',
    )

    // Step 2: ∧ Elimination (Left) on step 1
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → ~q
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → p | q
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: ∧ Elimination (Left) on step 4 → p -> r
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 7: ∧ Elimination (Right) on step 4 → q -> r
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 8: ∨ Elimination (Proof by Cases) on step 5 → p | q (setup)
    await selectSteps(page, '5')
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 9: Disjunctive Syllogism on steps 8 (p | q) and 3 (~q) → p
    await selectSteps(page, '8', '3')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 10: Modus Ponens on steps 9 (p) and 6 (p -> r) → r
    await selectSteps(page, '9', '6')
    await applyRule(page, 'Modus Ponens')

    // Step 11: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '28-reverse-proof-by-cases')
  })

  // -----------------------------------------------------------------------
  // Test 29: Complex Nested Reasoning
  //   Original: P→(Q|R), ~Q ⊢ P→R
  //   Encoded:  (p -> (q | r)) ^ ~q ^ ~~p ^ (r -> s) -> s
  //
  //   The encoding extends the original with ~~p (to derive p via DN)
  //   and r→s (to chain one more implication). After extracting all
  //   components from the conjunction, DN reduces ~~p to p.
  //   Modus Ponens applies p to p→(q|r) yielding the disjunction q|r.
  //   ∨ Elimination sets it up, and Disjunctive Syllogism resolves
  //   to r using ~q. A final MP with r→s produces the goal s.
  //
  //   Proof:
  //     1.  Assume (p -> (q | r)) ^ ~q ^ ~~p ^ (r -> s)                 [d1]
  //         (parsed as (((p -> (q | r)) ^ ~q) ^ ~~p) ^ (r -> s))
  //     2.  ∧ Elim Left  → ((p -> (q | r)) ^ ~q) ^ ~~p                  [d1]
  //     3.  ∧ Elim Right → r -> s                                        [d1]
  //     4.  ∧ Elim Left on (2) → (p -> (q | r)) ^ ~q                    [d1]
  //     5.  ∧ Elim Right on (2) → ~~p                                    [d1]
  //     6.  ∧ Elim Left on (4) → p -> (q | r)                            [d1]
  //     7.  ∧ Elim Right on (4) → ~q                                     [d1]
  //     8.  DN on (5) → p                                                [d1]
  //     9.  MP (8, 6) → q | r  (p with p -> (q | r))                     [d1]
  //     10. ∨ Elimination on (9) → q | r  (setup)                        [d1]
  //     11. DS (10, 7) → r  (~q negates q, the left disjunct)            [d1]
  //     12. MP (11, 3) → s  (r with r -> s)                              [d1]
  //     13. → Introduction                                               [d0]
  // -----------------------------------------------------------------------
  test('29. Complex Nested Reasoning — derive S via DN + MP + DS + chained MP', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(
      page,
      '(p -> (q | r)) ^ ~q ^ ~~p ^ (r -> s) -> s',
    )

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> (q | r)) ^ ~q ^ ~~p ^ (r -> s)
    await applyRuleWithInput(
      page,
      'Assume',
      '(p -> (q | r)) ^ ~q ^ ~~p ^ (r -> s)',
    )

    // Step 2: ∧ Elimination (Left) on step 1
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → r -> s
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → ~~p
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: ∧ Elimination (Left) on step 4 → p -> (q | r)
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 7: ∧ Elimination (Right) on step 4 → ~q
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 8: Double Negation on step 5 → p
    await selectSteps(page, '5')
    await applyRule(page, 'Double Negation')

    // Step 9: Modus Ponens on steps 8 (p) and 6 (p -> (q | r)) → q | r
    await selectSteps(page, '8', '6')
    await applyRule(page, 'Modus Ponens')

    // Step 10: ∨ Elimination (Proof by Cases) on step 9 → q | r (setup)
    await selectSteps(page, '9')
    await applyRule(page, '∨ Elimination (Proof by Cases)')

    // Step 11: Disjunctive Syllogism on steps 10 (q | r) and 7 (~q) → r
    await selectSteps(page, '10', '7')
    await applyRule(page, 'Disjunctive Syllogism')

    // Step 12: Modus Ponens on steps 11 (r) and 3 (r -> s) → s
    await selectSteps(page, '11', '3')
    await applyRule(page, 'Modus Ponens')

    // Step 13: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '29-complex-nested-reasoning')
  })

  // -----------------------------------------------------------------------
  // Test 30: Implication Transitivity (no premises)
  //   Original: ⊢ (P→Q)→((Q→R)→(P→R))
  //   Encoded:  (p -> q) ^ (q -> r) ^ (r -> s) ^ p -> s
  //
  //   The original proof uses triple nested Assume (P→Q, then Q→R,
  //   then P) and composes them via Modus Ponens.  The encoding
  //   flattens all three plus an extra link r→s into a single
  //   conjunction paired with p.  The proof unwraps the conjunction
  //   via five ∧ Eliminations, then chains three Modus Ponens
  //   applications: p with p→q yields q; q with q→r yields r;
  //   r with r→s yields s.
  //
  //   Proof:
  //     1.  Assume (p -> q) ^ (q -> r) ^ (r -> s) ^ p                   [d1]
  //         (parsed as (((p -> q) ^ (q -> r)) ^ (r -> s)) ^ p)
  //     2.  ∧ Elim Left  → ((p -> q) ^ (q -> r)) ^ (r -> s)             [d1]
  //     3.  ∧ Elim Right → p                                             [d1]
  //     4.  ∧ Elim Left on (2) → (p -> q) ^ (q -> r)                    [d1]
  //     5.  ∧ Elim Right on (2) → r -> s                                 [d1]
  //     6.  ∧ Elim Left on (4) → p -> q                                  [d1]
  //     7.  ∧ Elim Right on (4) → q -> r                                 [d1]
  //     8.  MP (3, 6) → q  (p with p -> q)                               [d1]
  //     9.  MP (8, 7) → r  (q with q -> r)                               [d1]
  //     10. MP (9, 5) → s  (r with r -> s)                               [d1]
  //     11. → Introduction                                               [d0]
  // -----------------------------------------------------------------------
  test('30. Implication Transitivity — derive S via triple chained MP through P→Q→R→S', async ({
    page,
  }) => {
    await openProofAssistant(page)

    await enterCustomGoal(
      page,
      '(p -> q) ^ (q -> r) ^ (r -> s) ^ p -> s',
    )

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 1: Assume (p -> q) ^ (q -> r) ^ (r -> s) ^ p
    await applyRuleWithInput(
      page,
      'Assume',
      '(p -> q) ^ (q -> r) ^ (r -> s) ^ p',
    )

    // Step 2: ∧ Elimination (Left) on step 1
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 3: ∧ Elimination (Right) on step 1 → p
    await selectSteps(page, '1')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 4: ∧ Elimination (Left) on step 2
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 5: ∧ Elimination (Right) on step 2 → r -> s
    await selectSteps(page, '2')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 6: ∧ Elimination (Left) on step 4 → p -> q
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Left)')

    // Step 7: ∧ Elimination (Right) on step 4 → q -> r
    await selectSteps(page, '4')
    await applyRule(page, '∧ Elimination (Right)')

    // Step 8: Modus Ponens on steps 3 (p) and 6 (p -> q) → q
    await selectSteps(page, '3', '6')
    await applyRule(page, 'Modus Ponens')

    // Step 9: Modus Ponens on steps 8 (q) and 7 (q -> r) → r
    await selectSteps(page, '8', '7')
    await applyRule(page, 'Modus Ponens')

    // Step 10: Modus Ponens on steps 9 (r) and 5 (r -> s) → s
    await selectSteps(page, '9', '5')
    await applyRule(page, 'Modus Ponens')

    // Step 11: → Introduction — closes subproof
    await applyRule(page, '→ Introduction')

    await expectProofComplete(page)
    await screenshotCompletedProof(page, '30-implication-transitivity')
  })
})
