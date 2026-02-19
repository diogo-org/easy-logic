# Copilot Instructions

> AI assistant guidance for high-quality TypeScript development

## Development Principles

### #1 Rule: High Cohesion, Low Coupling - CRITICAL ⚠️

**High Cohesion** = Each module does ONE thing and does it well
- All code in a module should be related to the same concern
- If you can't describe a module's purpose in one sentence, split it
- Example: `useAnimation` handles ONLY animations, not business logic

**Low Coupling** = Modules depend minimally on each other
- Modules communicate through clean interfaces (props, callbacks, return values)
- Changes in one module shouldn't require changes in many others
- Use dependency injection (pass dependencies as parameters)

**Examples:**

❌ **BAD - Low Cohesion (multiple concerns in one module):**
```typescript
// useFeature.ts mixing business logic with UI concerns
function useFeature() {
  // Business logic
  const [state, setState] = useState(...)
  
  // UI animation logic (WRONG - different concern!)
  const generateAnimation = () => { ... }
  
  return { state, animation } // Mixed concerns!
}
```

✅ **GOOD - High Cohesion (single concern per module):**
```typescript
// useFeature.ts - ONLY business logic
function useFeature(onComplete) {
  const [state, setState] = useState(...)
  return { state, handleAction }
}

// useAnimation.ts - ONLY UI animations
function useAnimation() {
  const generateAnimation = () => { ... }
  return { animation, trigger }
}

// Component combines them
function Page() {
  const { trigger } = useAnimation()
  const feature = useFeature(trigger) // Low coupling via callback
}
```

**How to achieve this:**
1. **Before writing code:** Ask "What is this module's single responsibility?"
2. **While coding:** If adding code, ask "Does this belong to the same concern?"
3. **When reviewing:** If a file mixes concerns (business logic + UI + data fetching), split it

**Red flags indicating violation:**
- File handles both business logic AND UI concerns
- File has both data fetching AND state management AND UI rendering
- Module imports seem unrelated to its main purpose
- Can't describe module's purpose in one clear sentence

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
- **No God Classes** - Keep files under 200 lines when possible
- **No Magic Numbers** - Use named constants (ESLint enforces this)
- **Separation of Concerns** - Never mix business logic with UI concerns in the same module
- **Fail Fast** - Validate inputs early and surface errors with clear messages
- **Prevent Bugs Early** - Tests first, strict linting, and high coverage are non-negotiable

## Pre-Commit Quality Gates

The hook (`.husky/pre-commit.cjs`) runs 6 checks - **all must pass**:

1. **ESLint** - `npm run lint` must pass with no violations
2. **Tests + Coverage** - `vitest --coverage` must pass with ≥80% coverage
3. **Code Duplication** - ≤1% code duplication (jscpd)
4. **Secrets Detection** - No API keys, tokens, or passwords
5. **TypeScript** - No type errors (`tsc --noEmit`)
6. **Build** - `npm run build` must succeed

**These checks are non-negotiable.** They ensure code quality and prevent bad commits.

Run manually: `node .husky/pre-commit.cjs`

## Architecture Guidelines

### Folder Structure Pattern

Separate **business logic** from **UI components** for better testability:

```
src/
├── logic/           # Pure business logic (no React dependencies)
├── components/      # React UI components
├── pages/           # Page-level React components
├── hooks/           # Custom React hooks
├── context/         # React context providers
└── utils/           # Utility functions
```

**Key principle:** Logic in `logic/` should be framework-agnostic and testable without React.

## Testing Patterns

- Tests colocated with source: `Component.tsx` → `Component.test.tsx`
- Use `@testing-library/react` with `vitest`
- Test configuration in `src/test.setup.ts`
- Minimum 80% coverage required

## Key Commands

```bash
npm run dev           # Start dev server
npm test              # Run tests once
npm run test:ui       # Vitest UI for debugging
npm run test:coverage # Coverage report (must be ≥80%)
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix lint issues
npm run build         # Build for production
```

## Adding New Features

### TDD Workflow (MANDATORY)

**For ANY new feature or bug fix:**

1. **Write failing test(s)** - Cover expected behavior and edge cases
2. **Run tests** - Confirm they fail with `npm test`
3. **Implement minimal solution** - Make tests pass
4. **Run tests again** - Verify all pass
5. **Refactor** - Improve code quality while keeping tests green
6. **Verify coverage** - Check with `npm run test:coverage` (must be ≥80%)
7. **Commit** - Pre-commit hooks will verify everything

**Never skip step 1 or 2** - Implementing before seeing tests fail breaks the TDD cycle.

## Common Patterns

### Custom Hooks

```typescript
// ✅ Good: Single responsibility
export function useFeature() {
  const [state, setState] = useState<FeatureState>(initialState)
  
  const handleAction = useCallback((input: string) => {
    // Business logic here
    setState(newState)
  }, [])
  
  return { state, handleAction }
}
```

### Component Structure

```typescript
// ✅ Good: Clean separation
interface Props {
  data: DataType
  onAction: (id: string) => void
}

export function Component({ data, onAction }: Props) {
  // Presentation logic only
  return <div>{/* JSX */}</div>
}
```

## Code Review Checklist

Before committing, verify:

- [ ] Tests written first (TDD)
- [ ] All tests pass
- [ ] Coverage ≥80%
- [ ] No magic numbers
- [ ] High cohesion, low coupling
- [ ] Single responsibility per module
- [ ] No secrets in code
- [ ] ESLint passes
- [ ] TypeScript has no errors
- [ ] Build succeeds

## AI Assistant Guidelines

When helping with this project:

1. **Always follow TDD** - Write tests first, then implementation
2. **Preserve quality standards** - Never lower thresholds or disable checks
3. **Maintain separation of concerns** - Keep business logic separate from UI
4. **Version bump required for release** - Before tagging or publishing, update `package.json` using `npm run version:patch|version:minor|version:major`
5. **Use named constants** - No magic numbers
6. **Test everything** - Minimum 80% coverage is required
7. **Keep modules focused** - One responsibility per file
8. **Document decisions** - Explain non-obvious code choices

## Success Criteria

Code is ready to commit when:

- ✅ All tests pass
- ✅ Coverage is ≥80%
- ✅ No ESLint violations
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ No code duplication >1%
- ✅ No secrets detected
- ✅ Follows high cohesion, low coupling principle
- ✅ Written using TDD approach
