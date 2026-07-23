# 🚀 Development Guide for New Developers

Quick guide to extending the Playwright E2E framework. Environment setup (Node, pnpm,
`.env.sit` / `.env.test`, credentials) is covered in [README.md](./README.md) — do that first.

## 🧭 The Three Layers

```
tests/functional/*.spec.ts     what to test  — picks authProfile, data, and a flow
        │ uses (fixtures)
src/flows/*.ts                 how the journey goes — sequences page objects
        │ uses (constructor injection)
src/page-object/*.ts           where things are — locators + single-screen actions
```

Everything is wired through Playwright fixtures (`src/fixtures/`), so tests and flows
never `new` a page object themselves.

## 🎯 Creating a Page Object

Create the file in `src/page-object/` (kebab-case name). Page objects extend `BasePage`,
take `page` in the constructor, and keep locators `private readonly`:

```typescript
// src/page-object/user-profile-page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class UserProfilePage extends BasePage {
    private readonly nameInput: Locator;
    private readonly saveButton: Locator;

    constructor(page: Page) {
        super(page);
        this.nameInput = page.locator('#full-name');
        this.saveButton = page.locator("button[type='submit']");
    }

    async fillAndSave(name: string): Promise<void> {
        await this.nameInput.fill(name);
        await this.saveButton.click();
    }
}
```

Register it in `src/fixtures/page-fixture.ts`:

```typescript
import { UserProfilePage } from '../page-object/user-profile-page';

export type PageFixtureType = {
    // ... existing pages
    userProfilePage: UserProfilePage;                 // -> add this
}

export const pageFixture: ExtendParams[0] = {
    // ... existing fixtures
    userProfilePage: async ({ page }, use) => {       // -> add this
        await use(new UserProfilePage(page));
    },
};
```

**Selector priority:** `data-testid` > unique ID > semantic attribute (`href`, `name`,
`value`, `type`) > stable class > XPath (last resort).
**Never** text-based selectors — they break multi-language.

### Shared GOV.UK interaction helpers

Before hand-rolling an interaction, check `src/core/util/element-helper.ts`. It centralises
the tricky GOV.UK patterns:

- `selectDropdownValue` — select + assert a dropdown value
- `selectAutocompleteValue` — accessible-autocomplete (commodity code, ...): type, wait for
  the suggestion, commit via ArrowDown+Enter, retry — a plain `fill()` silently fails here
- `summaryListValue` — read a summary-list row's value by its (translated) label
- `switchToTab` / `switchToTabAndClickNew` — overview tabs are server sub-routes; wait on
  the URL, not the paint
- `checkRadioByValue` — radio by `name` + `value`

Helpers here must **add value** (waiting, retry, assertion, DOM-shape knowledge). Don't add
one-line passthrough wrappers around Playwright — call the `Locator` API directly for that.

## 🔀 Creating a Flow

Flows (`src/flows/`) compose page objects into a business journey. They receive their page
objects via constructor and expose journey-level methods:

```typescript
// src/flows/user-profile-flow.ts
export class UserProfileFlow {
    constructor(private readonly userProfilePage: UserProfilePage) {}

    async updateDisplayName(name: string): Promise<void> {
        await this.userProfilePage.fillAndSave(name);
        // ...follow-up screens
    }
}
```

Register in `src/fixtures/flow-fixture.ts` the same way as pages — the fixture pulls in the
page fixtures it needs:

```typescript
userProfileFlow: async ({ userProfilePage }, use) => {
    await use(new UserProfileFlow(userProfilePage));
},
```

Complete end-to-end journeys that chain several flows live in `src/flows/common-flows/`
(see `CreateAndSubmitEnsDeclarationFlow`).

## 📦 Test Data

Test data lives in `src/test-data/` as typed builders (e.g. `consignment()`,
`ensOnlyConsignment()`), keyed to the journey they feed. Specs pass **overrides** to the
flow rather than building raw objects. Domain codes (country codes, procedure codes, ...)
come from `src/constant/` — see [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) for when a
constant is warranted.

## 📝 Writing a Test

Create the spec in `tests/functional/`:

```typescript
// tests/functional/my-journey.spec.ts
import { getBaseUrl, test } from '../test-hooks';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';
import { ReportLog } from '../../src/core/report/report-log';

test.describe('My journey', () => {
  // Which cached session this spec replays (sign-in happens in globalSetup).
  // Omit for anonymous/signed-out tests (accessibility specs).
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async () => {
    await ReportLog.setFeature('My journey');
  });

  test('Happy path', { tag: ['@smoke'] }, async ({ myJourneyFlow }, testInfo) => {
    await ReportLog.setStory('My journey - happy path');
    await myJourneyFlow.complete({ testInfo, url: getBaseUrl() });
  });
});
```

**Key points:**
- Import `test` from `../test-hooks` (never from `@playwright/test` directly)
- Declare `authProfile` per describe-block — tests never sign in themselves
- Tags use the options object: `{ tag: ['@smoke'] }`
- `ReportLog.setFeature` / `setStory` structure the Allure report;
  `ReportLog.info/pass/warn/fail` for step-level logging

## 🎮 Running Tests

`ENV` is required on every run. Package scripts bake it in; for ad-hoc runs set it in the
shell first (don't type `cross-env` directly — it only resolves inside package scripts):

```powershell
# The main suite (ENV=sit baked in)
pnpm test:functional

# Ad-hoc: set ENV once for the terminal session
$env:ENV="sit"

# A single spec
pnpm test tests/functional/my-journey.spec.ts --project=chromium-en

# Headed / step debugger / trace
pnpm test <spec> --headed
pnpm test <spec> --debug
pnpm test <spec> --trace on

# By tag
pnpm test --grep "@smoke" --project=chromium-en

# Parallel — keep --workers <= the account pool size (see README)
pnpm test tests/functional --project=chromium-en --workers=3
```

## ⚡ Quick Tips

**No fixed sleeps — ever.** Never `page.waitForTimeout()`. Wait on a real condition:
element state (`locator.waitFor`), URL (`page.waitForURL`), or a web-first assertion.
The element-helper functions show the pattern.

**Locators auto-wait:**
```typescript
await this.saveButton.click();   // ✅ auto-waits for actionable
```

**Environment access** goes through `config/environment.ts` (typed, validated), not raw
`process.env` scattered around:
```typescript
import { BASE_URL, NAVIGATION_TIMEOUT } from '../config/environment';
```

**Translations:** use the `t('key')` fixture for text assertions, never hardcoded strings.
(Welsh runs are currently inactive — the portal language switcher isn't live — but the rule
keeps assertions ready for it.)

**Lint before pushing:** `pnpm lint`

---

## 📚 References
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) — detailed standards
- [README.md](./README.md) — setup, environments, auth & parallel execution
- [Playwright Docs](https://playwright.dev/)
