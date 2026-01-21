# Pre-Commit Quality Gates

This project uses a pre-commit git hook to enforce code quality standards before allowing commits.

## Quality Gates

The pre-commit hook runs three mandatory checks:

### 1. **Tests Must Pass**
- Runs the full test suite with `npm test`
- If any test fails, the commit is aborted
- All tests must pass to proceed

### 2. **Code Coverage Must Be ≥ 80%**
- Runs coverage analysis with `npx vitest run --coverage`
- Checks that statement coverage meets the 80% minimum threshold
- If coverage is below 80%, the commit is aborted
- Current project coverage: **97.48%** ✅

### 3. **Build Must Succeed**
- Runs `npm run build` to compile TypeScript and bundle with Vite
- Ensures the project builds without errors
- If the build fails, the commit is aborted
- Build warnings are logged but currently do not block commits (can be enabled if desired)

## How It Works

When you attempt to commit:

```bash
git commit -m "Your commit message"
```

The pre-commit hook automatically runs:

1. ✓ Full test suite (80 tests currently passing)
2. ✓ Coverage verification (97.48% statements)
3. ✓ Build validation (TypeScript + Vite bundling)

If all checks pass, you'll see:
```
✅ All pre-commit checks passed!
Proceeding with commit...
```

If any check fails, you'll see:
```
❌ Commit aborted: [reason]
```

## Technology Stack

- **husky**: Git hooks manager
- **Node.js CommonJS**: Pre-commit script (`.husky/pre-commit.cjs`)
- **vitest**: Test runner and coverage analysis
- **npm**: Build orchestration

## Files

- `.husky/pre-commit`: Shell script that invokes the Node.js checker
- `.husky/pre-commit.cjs`: CommonJS script with quality gate logic
- `package.json`: Contains `prepare` script for husky initialization

## Bypassing the Hook (Not Recommended)

If absolutely necessary, you can bypass the hook with:

```bash
git commit --no-verify -m "Your commit message"
```

⚠️ **Note**: This should only be used in exceptional circumstances and defeats the purpose of the quality gates.

## Continuous Integration

These same checks are also enforced in GitHub Actions:
- Pull requests must pass tests and coverage gates before deployment
- The deployment workflow only proceeds if all quality gates pass

This provides both local (pre-commit) and remote (CI/CD) enforcement of code quality standards.
