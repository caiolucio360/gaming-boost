---
description: TDD workflow for all new implementations
---

# TDD (Test-Driven Development) Workflow

// turbo-all

## Steps

1. **Create Test File First**
   - Create `src/__tests__/[path]/[feature].test.ts`
   - Write tests describing expected behavior
   - Run tests to verify they fail (Red phase)

2. **Implement Minimum Code**
   - Create the actual implementation file
   - Write just enough code to make tests pass
   - Run tests to verify they pass (Green phase)

3. **Refactor**
   - Improve code quality
   - Keep running tests to ensure they still pass
   - Add edge cases if needed

4. **Verify**
   - Run full test suite: `npm test`
   - Run build: `npm run build`

## Example Commands

```bash
# Run specific test file
npm test -- --testPathPattern="feature.test.ts"

# Run all tests
npm test -- --passWithNoTests

# Build verification
npm run build
```

## Key Principles

- Tests are documentation
- One assertion per test when possible
- Use descriptive test names in Portuguese
- Mock external dependencies
