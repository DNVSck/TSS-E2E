---
name: create-test
description: "Create a new test spec file for the TSS-E2E framework, following the existing patterns for imports, hooks, tagging, and Allure reporting."
license: Proprietary
compatibility: opencode
---

## Steps

1. Create the test file in `tests/<category>/<name>.spec.ts` (functional, accessibility, or ui).
2. Import `test` from `../test-hooks`, never from `@playwright/test`.
3. Import `ReportLog` and `AllureTestManager` for reporting.
4. Add `test.describe()` with feature name.
5. Add `test.beforeEach` with `ReportLog.setFeature()`.
6. Add `test()` with `{ tag: [...] }` annotation.
7. Inside test: set story, add test link, call flow or page object methods.
8. Use `t()` for all text verification.
9. Run `tsc --noEmit` and fix any errors.
10. Summarise the files created or modified.

## Rules

- Import `test` from `../test-hooks` only
- Use `{ tag: ['@smoke'] }` annotation syntax (not name-based tags)
- Set Allure metadata: `ReportLog.setFeature()`, `ReportLog.setStory()`
- Link test case: `AllureTestManager.addTestLink()`
- Tests should be thin -- delegate to flows, not page objects directly
- Reference `tests/functional/gb-ni-roro-simple.spec.ts` as a good example
