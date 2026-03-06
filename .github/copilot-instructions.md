# Copilot Instructions

> AI assistant guidance for high-quality React + TypeScript development

## 🤖 Pre-commit Enforcement — MANDATORY ⚠️

**ALL of the following rules are non-negotiable for both humans and AI assistants:**

### ALWAYS commit via the safe-commit script

```bash
# ALWAYS use this — never plain git commit
npm run commit -- -m "your message"
```

### NEVER bypass pre-commit

| ❌ Forbidden | ✅ Required |
|---|---|
| `git commit --no-verify` | `npm run commit -- -m "..."` |
| `git commit -n` | `npm run commit -- -m "..."` |
| `HUSKY=0 git commit` | `npm run commit -- -m "..."` |
| Skipping/ignoring hook errors | Fix the errors, then retry |

### What the pre-commit hook checks

| Step | Check | Requirement |
|------|-------|-------------|
| 1 | Bootstrap self-update | Project in sync with template |
| 2 | Hook integrity | Hooks must not be tampered with |
| 3 | Tests + coverage | Pass with ≥80% coverage |
| 4 | Conflict detection | No conflicts with `main` |
| 5 | Version bump | `package.json` version must be incremented |
| 6 | package-lock.json | Must be in sync |
| 7 | ESLint | Zero violations |
| 8 | Code duplication | ≤1% duplication |
| 9 | Secrets detection | No tokens/keys/passwords |
| 10 | TypeScript | Zero type errors |
| 11 | Build | Production build must succeed |
| 12 | Dead code | No unused exports/files |
| 13 | SonarQube | Quality gate must pass (when configured) |

If any gate fails: **read the error, fix the root cause, run `npm run commit` again.**

Run the hook manually at any time: `node .husky/pre-commit.cjs`

---

## Development Principles

### High Cohesion, Low Coupling — CRITICAL ⚠️

**High Cohesion** — each module does ONE thing and does it well.

**Low Coupling** — modules depend minimally on each other.
- Communicate through props, callbacks, and return values — not global state.
- Changes in one module should not cascade across many others.

**React example:**

❌ **BAD — hook mixes business logic with animation concerns:**
```typescript
function useFeature() {
  const [state, setState] = useState(...)
  const generateAnimation = () => { ... } // Different concern!
  return { state, animation }
}
```

✅ **GOOD — separate hooks, composed at the component level:**
```typescript
// useFeature.ts — ONLY business logic
function useFeature(onComplete: () => void) {
  const [state, setState] = useState(...)
  return { state, handleAction }
}

// useAnimation.ts — ONLY animation logic
function useAnimation() {
  return { trigger }
}

// Page.tsx — composes them
function Page() {
  const { trigger } = useAnimation()
  const { state, handleAction } = useFeature(trigger)
}
```

### Test-Driven Development (TDD) — CRITICAL ⚠️

**For every feature and bug fix:**

1. **Write failing tests FIRST** — never implement before seeing red
2. **Confirm the failure** — run `npm test` and verify it fails for the right reason
3. **Implement minimal code** — make tests pass with the simplest solution
4. **Refactor** — clean up while keeping tests green
5. **Commit** — pre-commit hooks enforce passing tests and ≥80% coverage

```typescript
// ❌ WRONG: implement then test
export function MyComponent() { return <div>hello</div> }

// ✅ CORRECT: test first (red), then implement (green)
it('renders greeting', () => {
  render(<MyComponent />)
  expect(screen.getByText('hello')).toBeInTheDocument() // FAILS until implemented
})
```

### Code Quality Standards

- **Single Responsibility** — one purpose per function, class, and file
- **No magic numbers** — use named constants (`ESLint` enforces this)
- **Strict TypeScript** — no `any`, no suppressions without justification
- **Keep files small** — aim for under 200 lines; split at natural boundaries

---

## React Architecture

### Folder Structure

Separate **business logic** from **UI** for testability:

```
src/
├── logic/           # Pure functions — no React, no JSX, fully testable
├── components/      # Reusable UI components
├── pages/           # Page-level components (compose logic + components)
├── hooks/           # Custom React hooks
├── context/         # React context providers
└── utils/           # Shared utilities
```

Logic in `logic/` must be framework-agnostic — testable with plain `vitest`, no `@testing-library/react` needed.

### Component Pattern

```typescript
// ✅ Good: typed props, presentation only
interface Props {
  data: DataType
  onAction: (id: string) => void
}

export function MyComponent({ data, onAction }: Props) {
  return <div onClick={() => onAction(data.id)}>{data.label}</div>
}
```

### Custom Hook Pattern

```typescript
// ✅ Good: single responsibility, injectable dependencies
export function useFeature(onComplete: () => void) {
  const [state, setState] = useState<FeatureState>(initialState)

  const handleAction = useCallback((input: string) => {
    setState(next => ({ ...next, value: input }))
    onComplete()
  }, [onComplete])

  return { state, handleAction }
}
```

---

## Testing Patterns

- Tests colocated with source: `Button.tsx` → `Button.test.tsx`
- Use `@testing-library/react` with `vitest`
- Test setup in `src/test.setup.ts`
- Minimum 80% coverage required

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('calls onAction when clicked', () => {
  const onAction = vi.fn()
  render(<MyComponent data={{ id: '1', label: 'Go' }} onAction={onAction} />)
  fireEvent.click(screen.getByText('Go'))
  expect(onAction).toHaveBeenCalledWith('1')
})
```

---

## Version Management

Version downgrades are blocked by the pre-commit hook.

```bash
npm run version:patch   # bug fix      1.2.3 → 1.2.4
npm run version:minor   # new feature  1.2.3 → 1.3.0
npm run version:major   # breaking     1.2.3 → 2.0.0
```

---

## Key Commands

```bash
npm run dev             # Start dev server
npm test                # Run tests (watch mode)
npm run test:coverage   # Coverage report — must be ≥80%
npm run lint            # Check for lint violations
npm run lint:fix        # Auto-fix lint issues
npm run build           # Production build
npm run commit -- -m "" # Commit with all quality gates
```

---

## AI Assistant Rules

1. **Never bypass pre-commit** — fix the error, do not skip the hook
2. **Always follow TDD** — write the failing test before any implementation
3. **Never lower quality thresholds** — 80% coverage, 0 ESLint errors, 0 type errors are minimums
4. **Bump the version** before any commit that changes behaviour
5. **Keep logic out of components** — put business logic in `logic/` or custom hooks
6. **No magic numbers** — extract to named constants
7. **One responsibility per file** — split when in doubt
8. **Use only verified GitHub tools** for all remote operations (PRs, issues, branches, commits) — never use third-party Git hosting integrations

---

## Success Criteria

A commit is ready when **all** of the following are true:

- ✅ Tests pass with ≥80% coverage
- ✅ Zero ESLint violations
- ✅ Zero TypeScript errors
- ✅ Build succeeds
- ✅ No duplication >1%
- ✅ No secrets detected
- ✅ Version bumped
- ✅ Written using TDD
- ✅ High cohesion, low coupling
- ✅ Business logic separated from UI components
