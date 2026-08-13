# TSS-E2E Framework

Playwright + TypeScript E2E test framework for the Trader Support Service (UK customs declaration app). Bilingual (English/Welsh), TOTP 2FA, Azure DevOps CI/CD.

## Do

- use Page Object Model -- no raw `page.locator()` in test files
- use stable selectors: ID > data-testid > href > stable class > XPath (last resort)
- use `t('key.path')` from locale fixture for all text assertions
- import `test` from `../test-hooks`, never from `@playwright/test` directly
- use `async/await`, never `.then()` chains
- use kebab-case for filenames, PascalCase for classes, camelCase for methods, UPPER_SNAKE_CASE for constants
- tag tests with `{ tag: ['@smoke'] }` annotation syntax
- wrap flow steps in `ReportLog.step()`
- use factory functions for test data with defaults + partial overrides
- add new page objects to `page-fixture.ts` and re-export in `main-fixture.ts`
- add new flows to `flow-fixture.ts` with constructor injection

## Don't

- use text-based selectors (`:has-text()`, `text=`) -- breaks i18n
- hardcode text in assertions or selectors
- hardcode credentials, URLs, or timeouts
- create god methods -- keep page object methods focused (<20 lines)
- mix old and new fixture patterns
- commit `.env.*` files

## Commands

```powershell
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/functional/gb-ni-roro-simple.spec.ts

# Run with visible browser
pnpm test --headed

# Debug mode
pnpm test --debug

# Run by tag
pnpm test --grep "@smoke"

# Run by locale
pnpm test --project=chromium-en
pnpm test --project=chromium-cy

# Lint
pnpm lint

# Type check
tsc --noEmit

# Open Allure report
pnpm report:open
```

## Safety and Permissions

**Allowed without prompt:**
- read files, list files
- `tsc --noEmit`
- `pnpm lint`
- `pnpm test` on single test files

**Ask first:**
- package installs
- git push
- deleting files
- running full test suite
- structural changes to fixtures or architecture

## Project Structure

```
src/
  page-object/          # Page Object Model classes (13 pages, extend BasePage)
  flows/                # Business flow orchestration (7 flows)
  fixtures/             # Playwright fixture DI (5 modules -> main-fixture.ts)
  test-data/            # Factory functions with defaults + overrides (5 modules)
  constant/             # Domain constants (28+ files)
  core/
    api/                # APIClient (scaffolded, unused)
    auth/               # Credentials + TOTP
    report/             # Allure reporting (3 modules)
    util/               # Helpers (8 files)
tests/
  functional/           # E2E functional tests
  accessibility/        # WCAG 2.2 AA tests (axe-core)
  ui/                   # UI tests (placeholder)
  test-hooks.ts         # Central test object + global hooks
config/
  environment.ts        # Env var exports
  bootstrap-env.ts      # .env loader
  global-setup.ts       # Allure init
  global-teardown.ts    # Allure report generation
locales/                # en.json, cy.json translations
```

## Architecture

Tests → Flows → Page Objects → BasePage → Playwright Page

Fixtures provide dependency injection. See `src/fixtures/main-fixture.ts` for composition.

## Good Examples

- page object: `src/page-object/portal-page.ts` -- clean POM pattern
- flow: `src/flows/portal-access-flow.ts` -- constructor injection, ReportLog.step()
- test: `tests/functional/gb-ni-roro-simple.spec.ts` -- thin orchestration, flow delegation
- fixture: `src/fixtures/page-fixture.ts` -- DI pattern with type extraction
- test data: `src/test-data/consignment-data.ts` -- factory with defaults + overrides

## PR Checklist

- lint and type check pass (`pnpm lint`, `tsc --noEmit`)
- test runs green on affected files
- diff is small and focused
- no hardcoded text, credentials, or URLs
- page objects registered in `page-fixture.ts`
- flows registered in `flow-fixture.ts`
- test tagged appropriately

## When Stuck

- ask a clarifying question, propose a short plan, or write a plan to `.opencode/plans/`
- do not push large speculative changes without confirmation
