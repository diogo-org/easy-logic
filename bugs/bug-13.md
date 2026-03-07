# Bug #13: ∨E (Disjunction Elimination) Produces Same Formula Instead of Case Subproofs

**Status**: FIXED  
**Severity**: Critical  
**Component**: `NaturalDeduction` engine / ∨E rule implementation  
**Affected screenshots**: 16, 17, 18, 22, 23, 25, 26, 27, 28, 29

## Description

When ∨ Elimination is applied to a disjunction (e.g., `p ∨ q`), the result is the **same disjunction** `p ∨ q` displayed in an **orange-highlighted row** (indicating an error/warning state). Proper ∨E should create two case subproofs — one assuming the left disjunct and one assuming the right disjunct — then derive the same conclusion from both.

Instead, the proof engine appears to fall back on Disjunctive Syllogism (DS) to continue, which requires a negation of one disjunct to be available. This means:
- ∨E is never actually performing proof-by-cases
- The orange step is a wasted/no-op step that duplicates an existing line
- Proofs that should use ∨E are worked around by adding extra negation premises

## Example (Screenshot 16 — classic proof by cases)

```
5. ¬p          ∧E-R (2)
6. p ∨ q       ∨E (4)    ← ORANGE: same as step 4!
7. q           DS 6, 5   ← uses DS instead of ∨E
```

## Expected behavior

∨E should open two case subproofs (one for `p`, one for `q`), and derive the target formula in each branch.

## Steps to reproduce

1. Open Proof Assistant
2. Enter a proof that involves a disjunction (e.g., goal `r` with premises `p|q`, `p->r`, `q->r`)
3. Apply ∨ Elimination to the disjunction step
4. Observe that the result is the same formula highlighted orange, not two case branches
