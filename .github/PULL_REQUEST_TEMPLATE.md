# Pull Request Checklist

## TDD (Required)
- [ ] Wrote failing test(s) first
- [ ] Verified test(s) fail for the right reason
- [ ] Implemented minimal change to pass
- [ ] Refactored with tests still green

## Quality Gates (Required)
- [ ] `npm run lint`
- [ ] `npm run test:coverage` (>= 90%)
- [ ] `npm run build`

## Design and Architecture
- [ ] High cohesion, low coupling validated
- [ ] Clear, readable code with single responsibility
- [ ] No new magic numbers
