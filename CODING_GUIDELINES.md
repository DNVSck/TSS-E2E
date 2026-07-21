# 📝 Coding Guidelines & Best Practices

Coding standards for the TSS E2E Test Automation project (Playwright + TypeScript).
For the how-to (creating pages/flows/fixtures), see [DEVELOPING.md](./DEVELOPING.md).

## 🎯 Core Principles

### 1. Layered architecture — **MANDATORY**

Tests → Flows → Page Objects. Each layer only talks to the one below it:

- **Page objects** (`src/page-object/`) own locators and single-screen actions
- **Flows** (`src/flows/`) sequence page objects into business journeys
- **Tests** (`tests/`) declare identity (`authProfile`), data, and call flows

**✅ DO:**
```typescript
// src/page-object/portal-page.ts
export class PortalPage extends BasePage {
    private readonly signInBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.signInBtn = page.locator("a[href='/portal/oauth']");
    }

    async clickSignIn(): Promise<void> {
        await this.signInBtn.click();
    }
}

// tests/functional/portal.spec.ts
test('Sign in test', async ({ portalPage }) => {
    await portalPage.clickSignIn();
});
```

**❌ DON'T:**
```typescript
test('Bad test', async ({ page }) => {
    await page.click("a[href='/portal/oauth']");  // Raw selectors in a test
});
```

### 2. No fixed sleeps — **HARD RULE**

Never `page.waitForTimeout()`, `setTimeout`-based sleeps, or arbitrary delays. Always wait
on the real condition you actually need:

```typescript
// ✅ DO: condition-based waits
await locator.waitFor({ state: 'visible' });
await page.waitForURL(url => url.pathname === route);
await expect(dropdown).toHaveValue(value);          // web-first assertion retries

// ❌ DON'T
await page.waitForTimeout(5000);
```

If something is flaky, find the condition that isn't being awaited (a route change, a
re-render, a new TOTP window) and wait on *that* — see `element-helper.ts` and
`SignInPage.inputTotp` for worked examples.

### 3. No hardcoded UI text — use `t()`

Never text-based locators or hardcoded strings in assertions. Text comes from
`locales/*.json` via the `t('key')` fixture, so assertions survive a locale switch.
(Welsh runs are currently inactive, but the rule keeps us ready.)

**✅ DO:**
```typescript
signInBtn = page.locator("a[href='/portal/oauth']");        // stable attribute
const expectedTitle = t('portal.title');
```

**❌ DON'T:**
```typescript
page.locator("button:has-text('Sign in')");                  // breaks i18n
await expect(heading).toHaveText('Trader Support Service');  // hardcoded text
```

## 🔧 Selectors

### Priority order
1. **data-testid** (when available)
2. **Unique IDs**
3. **Semantic attributes** (`href`, `name`, `value`, `type`, `role`)
4. **Stable CSS classes** (GOV.UK classes like `.govuk-summary-list__row` are fine)
5. **XPath** (last resort)

```typescript
// ✅ DO
submitBtn = page.locator("[data-testid='submit-button']");
userMenu = page.locator('#user-menu');
signInLink = page.locator("a[href='/portal/oauth']");
continueBtn = page.locator("button.govuk-button[value='next']");

// ❌ DON'T
page.locator("text=Sign in");                    // text-based
page.locator('div > div > button:nth-child(3)'); // structure-fragile
page.locator('.css-1abc2def');                   // generated class
```

### Helper convention — value-add only

Shared interaction helpers live in `src/core/util/element-helper.ts`. A helper earns its
place only when it **adds behaviour** — waiting, retry, an assertion, or knowledge of a
DOM shape (autocomplete commit, tab routes, summary-list rows). Do **not** write one-line
passthrough wrappers around the Playwright `Locator` API:

```typescript
// ✅ Worth a helper: fill() alone silently fails on this component
await selectAutocompleteValue(input, firstOption, '0808108010');

// ❌ Not worth a helper — just call Playwright
export async function clickElement(l: Locator) { await l.click(); }
```

## 📦 Constants & Test Data

Constants (`src/constant/`) are for **opaque domain codes only** — values a reader can't
decode without the mapping (`'GB'`, `'R1'`, procedure code `'40 00'`, package type `'BX'`):

```typescript
// ✅ Opaque code — constant earns its keep
await checkRadioByValue(page, 'roleInMovement', ROLE_IN_MOVEMENT.CARRIER);

// ❌ Self-describing string — inline it, a constant only adds indirection
await checkRadioByValue(page, 'isContainerPacked', 'yes');
```

Test data lives in `src/test-data/` as typed builders (`consignment()`,
`ensOnlyConsignment()`, ...). Journeys that share most fields share one type with a
discriminator + factories — don't fork near-identical types that will drift.

## 🏗️ Naming & Files

- **Files:** `kebab-case.ts` (`sign-in-page.ts`, `movement-overview-flow.ts`)
- **Classes:** `PascalCase` (`SignInPage`, `MovementOverviewFlow`)
- **Variables/functions:** `camelCase`
- **Env-derived constants:** `UPPER_SNAKE_CASE` (`BASE_URL`, `DEFAULT_TIMEOUT`)
- **Page object suffixes:** `*-page.ts` in `src/page-object/`, reusable fragments in
  `src/page-object/components/`, flows `*-flow.ts` in `src/flows/`

## 🧪 Test Structure

```typescript
import { getBaseUrl, test } from '../test-hooks';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { ReportLog } from '../../src/core/report/report-log';

test.describe('GB to NI RoRo ENS-only Declaration Process', () => {
  // Identity: which cached session this spec replays. Never sign in inside a test.
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await ReportLog.setFeature('GB to NI RoRo ENS-only Declaration Process');
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Accompanied', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await ReportLog.setStory('ENS-only - GB to NI RoRo Accompanied');
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: ensOnlyConsignment(),
    });
  });
});
```

Rules:
- Import `test` from `tests/test-hooks.ts`, never from `@playwright/test` in a spec
- Tags go in the options object: `{ tag: ['@smoke'] }`
- `ReportLog.setFeature/setStory` structure the Allure report; `ReportLog.info/pass/warn/fail`
  for step-level logging
- A known product defect blocks a scenario → `test.fixme()` with a comment naming the defect,
  not a deleted or permanently-skipped test

## 🚀 Async/Await

```typescript
// ✅ DO: await everything, consistently
async navigateAndVerify(): Promise<void> {
    await this.navigateToPortal();
    await this.verifyPageLoaded();
}

// ❌ DON'T: mix .then() chains with async/await, or drop promises
async badExample(): Promise<void> {
    this.navigateToPortal().then(() => this.verifyPageLoaded());  // floating promise
}
```

Don't swallow errors to make a test pass — a `try/catch` is only justified when the catch
does something real (retry with a new condition, fallback path, enriched error).

## 🔒 Security & Environment

- Credentials come from `.env.<ENV>` per company profile (`AGENT_*`, `IMPORTER_*`, ...) —
  **never** hardcode usernames, passwords, TOTP secrets, or EORIs in code
- Access config through `config/environment.ts` (typed, validated), not scattered
  `process.env` reads
- `.env.*` files are gitignored — keep them that way; they hold real credentials
- Environment-specific data (company names, EORIs) belongs in the env file, matched on
  visible names — not on GUIDs that change when data is reseeded

## 📋 Common Anti-Patterns

1. **Text-based selectors** — `:has-text(...)`, `text=` (breaks i18n)
2. **Raw `page` in tests** — go through page objects/flows
3. **Fixed sleeps** — `waitForTimeout` anywhere
4. **Passthrough helpers** — wrappers that just rename a Playwright call
5. **Constants for self-describing strings** — `const YES = 'yes'`
6. **Signing in inside a test** — identity is `authProfile`; sign-in lives in globalSetup
7. **`workerIndex` for pool assignment** — use `parallelIndex` (see README)
8. **Importing `test` from `@playwright/test`** in specs — fixtures won't be available

## ✅ Code Review Checklist

- [ ] Layering respected — no raw page interactions in tests, no business sequencing in page objects
- [ ] No text-based selectors; stable selectors only
- [ ] No hardcoded UI text — `t()` for assertions
- [ ] **No fixed sleeps** — every wait is condition-based
- [ ] Constants only for opaque codes; helpers only where they add behaviour
- [ ] All async operations awaited; no floating promises
- [ ] `authProfile` declared; no in-test sign-in
- [ ] No credentials/EORIs/secrets in code
- [ ] Naming and file-location conventions followed
- [ ] `pnpm lint` passes

---

## 📚 Additional Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Remember: these guidelines keep the suite maintainable, parallel-safe, and free of the flakiness that fixed sleeps and fragile selectors create.** 🎯
