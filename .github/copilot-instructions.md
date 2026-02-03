# Easy Logic - AI Coding Instructions

## Project Overview
A propositional logic formula renderer and proof assistant with i18n support (English/Portuguese). Built with React 18, TypeScript, MUI v7, and Vite.

## Development Principles

### Test-Driven Development (TDD) - CRITICAL ⚠️
**ALL new features and bug fixes MUST follow strict TDD:**

1. **Write failing tests FIRST** - Never implement before seeing red tests
2. **Verify test failures** - Run tests and confirm they fail for the right reason
3. **Implement minimal code** - Make tests pass with simplest solution
4. **Refactor** - Clean up while keeping tests green
5. **Commit only when tests pass** - Pre-commit hooks enforce this

**TDD Workflow Example:**
```typescript
// ❌ WRONG: Implementing before testing
export function newFeature() { /* implementation */ }

// ✅ CORRECT: Test-first approach
describe('newFeature', () => {
  it('should handle basic case', () => {
    expect(newFeature()).toBe(expected) // FAILS (red)
  })
})
// Then implement to make it pass (green)
// Then refactor if needed (still green)
```

**Why TDD is mandatory:**
- Prevents regressions caught after commit
- Ensures testable, modular design
- Documents expected behavior
- Catches edge cases early
- Pre-commit hooks verify ≥80% coverage

### Code Quality Standards
- **Single Responsibility Principle** - Classes/functions do ONE thing well
- **Low Coupling** - Minimize dependencies between modules
- **High Cohesion** - Related functionality stays together
- **No God Classes** - Keep files under 200 lines when possible
- **No Magic Numbers** - Use named constants (ESLint enforces this)
- **No Hardcoded Strings** - Use translation keys (pre-commit blocks commits)

## Architecture

### Folder Structure
The codebase separates **business logic** from **UI components** for better testability:

```
src/
├── logic/           # Pure business logic (no React dependencies)
│   ├── formula/     # Formula parsing: tokenizer, parser, LaTeX conversion
│   ├── proof/       # Proof systems: types, NaturalDeduction
│   └── truthTable/  # Truth table generation
├── components/      # React UI components
├── pages/           # Page-level React components
├── context/         # React context providers
└── i18n/            # Internationalization
```

### Core Components
- **Formula Parser** (`src/logic/formula/`): Tokenizes logic formulas → AST → LaTeX (rendered via KaTeX)
- **Proof Systems** (`src/logic/proof/`): Strategy pattern for Natural Deduction rules. Add new proof systems by implementing `ProofSystem` interface in `src/logic/proof/types.ts`
- **Truth Table** (`src/logic/truthTable/`): Generates truth tables from formulas
- **Pages**: `HomePage` (formula input), `TruthTablePage`, `ProofAssistantPage`

### i18n Pattern (CRITICAL)
**All user-visible strings must use translation keys** - the pre-commit hook will block commits with hardcoded strings.

```tsx
// ✅ Correct
const { t } = useTranslation()
<Button>{t('apply')}</Button>
title={t('backToHome')}

// ❌ Wrong - will fail pre-commit
<Button>Apply</Button>
title="Back to home"
```

For non-React code (like `NaturalDeduction.ts`), use `nameKey`/`descriptionKey` properties that are resolved via `t()` in UI components:
```typescript
// In NaturalDeduction.ts
{ id: 'mp', nameKey: 'ruleModusPonens', descriptionKey: 'ruleModusPonensDesc' }

// In component
{t(rule.nameKey)}
```

Translation files: `src/i18n/locales/en.json` and `pt-BR.json` - **must have identical keys**.

## Pre-Commit Quality Gates
The hook (`.husky/pre-commit.cjs`) runs 5 checks - all must pass:

1. **ESLint** - `npm run lint` must pass with no violations (includes `no-magic-numbers` and `i18next/no-literal-string` rules)
2. **Tests + Coverage** - `vitest --coverage` must pass with ≥80% statement coverage
3. **Duplication** - ≤1% code duplication (jscpd)
4. **Hardcoded Strings** - No untranslated text in JSX + translation file key sync check
5. **Build** - `npm run build` must succeed

Run manually: `node .husky/pre-commit.cjs`

## Available Proof Rules
The Natural Deduction system (`src/logic/proof/NaturalDeduction.ts`) includes:

| Rule | ID | Description |
|------|----|-------------|
| Assume | `assume` | Start an assumption (subproof) |
| Modus Ponens | `mp` | From P and P→Q, derive Q |
| Modus Tollens | `mt` | From P→Q and ¬Q, derive ¬P |
| ∧ Introduction | `and_intro` | From P and Q, derive P∧Q |
| ∧ Elimination (L/R) | `and_elim_left`, `and_elim_right` | From P∧Q, derive P or Q |
| ∨ Introduction (L/R) | `or_intro_left`, `or_intro_right` | From P, derive P∨Q |
| ∨ Elimination | `or_elim` | Proof by cases: from P∨Q, start branches assuming P and Q |
| Double Negation | `double_neg` | From ¬¬P, derive P |
| → Introduction | `impl_intro` | Close assumption: if assumed P and derived Q, conclude P→Q |

## Key Commands
```bash
npm run dev          # Start dev server (localhost:5173/easy-logic/)
npm test             # Run tests once
npm run test:ui      # Vitest UI for debugging
npm run test:coverage # Coverage report
```

## Testing Patterns
- Tests colocated with source: `Component.tsx` → `Component.test.tsx`
- Use `@testing-library/react` with `vitest`
- Mock i18n is configured in `src/test.setup.ts`

## Formula Syntax
Operators: `^` (AND), `|` (OR), `~` (NOT), `->` (IMPLIES), `<->` (IFF), `T`/`F` (constants)

## Adding New Features

### TDD Workflow (MANDATORY)
**For ANY new feature or bug fix:**

1. **Write failing test(s)** - Cover expected behavior and edge cases
2. **Run tests** - Confirm they fail with `npm test`
3. **Implement minimal solution** - Make tests pass
4. **Run tests again** - Verify all pass with `npm test`
5. **Refactor** - Improve code quality while keeping tests green
6. **Verify coverage** - Check with `npm run test:coverage` (must be ≥80%)
7. **Commit** - Pre-commit hooks will verify everything

**Never skip step 1 or 2** - Implementing before seeing tests fail breaks the TDD cycle and risks shipping broken code.

### New Translation Key
1. Add to both `en.json` and `pt-BR.json` (same key, translated value)
2. Use via `t('keyName')` in component

### New Proof Rule (TDD Required)
1. **Write tests** - Test rule application, error cases, formula generation
2. **Run tests** - Verify they fail
3. Add rule object to `NaturalDeduction.ts` with `nameKey`/`descriptionKey`
4. Add translation keys to both locale files
5. Implement logic in `applyRule()` switch statement
6. **Verify tests pass** - Run `npm test`

### New Knowledge Base
Add to `knowledgeBases` array in `NaturalDeduction.ts` with `nameKey`, `descriptionKey`, premises, and `suggestedGoals` (each goal needs `labelKey`/`descriptionKey`).
