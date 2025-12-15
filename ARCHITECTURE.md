# Architecture (Move to Wiki - TBC)

This document describes the design and structure of the TSS E2E test automation framework.

---

## Automation Framework

### Playwright
The framework uses Playwright because it:
- Supports Chromium, Firefox, and WebKit
- Provides automatic waiting for elements
- Generates traces, screenshots, and videos
- Includes built-in assertions with retry logic

### TypeScript
TypeScript is used to:
- Improve maintainability
- Enforce type safety
- Support scalable test and framework code

---

## Project Structure

```
TSS-E2E/
├── 📁 tests/                    # Test files (.spec.ts)
│   ├── ui/                      # UI tests
│   └── test-hooks.ts           # Common test utilities
├── 📁 page-object/             # Page Object Model classes
│   ├── base-page.ts            # Base page with common methods
│   └── portal-page.ts          # Portal-specific pages
├── 📁 fixtures/                # Test fixtures & utilities
│   ├── locale-fixture.ts       # Multi-language support
│   ├── main-fixture.ts         # Combined fixtures
│   └── page-fixture.ts         # Page object fixtures
├── 📁 core/                    # Core framework
│   ├── element/                # Custom element wrapper
│   ├── browser/                # Browser management
│   └── util/                   # Utility functions
├── 📁 locales/                 # Translation files
│   ├── en.json                 # English translations
│   └── cy.json                 # Welsh translations
├── 📁 config/                  # Configuration
│   ├── environment.ts          # Environment management
│   └── global-setup.ts         # Test setup
├── 📁 test-data/               # Test data files
├── playwright.config.ts        # Playwright configuration
└── package.json                # Dependencies & scripts
```


Each directory has a single responsibility to avoid coupling between tests and framework logic.

---

## Page Object Model

The framework follows the Page Object Model pattern.

- Page objects encapsulate UI interactions
- Page objects do not contain assertions
- Tests contain assertions and intent
- Common behaviour is shared via a base page

This ensures readable, maintainable, and reusable tests.

---

## Fixtures Architecture

Custom Playwright fixtures are used to:
- Control browser and context lifecycle
- Inject page objects into tests
- Provide locale and environment context

Fixtures replace global state and manual setup inside tests.

---

## Multi-Language Testing

The framework supports English and Welsh.

- Language-specific Playwright projects (`chromium-en`, `chromium-cy`)
- Translation files stored under `locales/`
- Tests use translation keys instead of hardcoded text

This allows the same tests to run across multiple languages without duplication.

---

## Accessibility Testing

Accessibility tests are separated from UI functional tests.

- Centralised accessibility rules
- Dedicated test hooks
- Axe-based scanning

This keeps functional and accessibility concerns isolated.

---

## Reporting

The framework integrates Allure reporting.

Reports include:
- Execution steps
- Screenshots on failure
- Video recordings
- Traces
- Language-specific results

Reporting is handled at framework level, not inside tests.

---

## Browser Configuration

Browser translation is disabled to ensure accurate language validation.

```ts
args: ['--disable-translate', '--disable-features=Translate']
