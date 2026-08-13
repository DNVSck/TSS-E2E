---
name: create-page-object
description: "Create a new Page Object class for the TSS-E2E Playwright framework, including the page class, fixture registration, and type definition."
license: Proprietary
compatibility: opencode
---

## Steps

1. Create the page object file in `src/page-object/<name>-page.ts`.
2. Extend `BasePage` from `../page-object/base-page`.
3. Define locators using `this.page.locator()` with stable selectors (ID > data-testid > href > stable class > XPath).
4. Add action methods that interact with the locators.
5. If the page needs i18n text verification, accept optional `TFunction` in constructor.
6. Register the page in `src/fixtures/page-fixture.ts`:
   - Add to `PageFixtureType` interface
   - Add fixture entry with `async ({ page }, use) => { await use(new <PageName>(page)); }`
   - If i18n needed: `async ({ page, t }, use) => { await use(new <PageName>(page, t)); }`
7. Run `tsc --noEmit` and fix any errors.
8. Summarise the files created or modified.

## Rules

- Never use text-based selectors (`:has-text()`, `text=`)
- Keep methods focused (<20 lines)
- Use kebab-case filename: `<name>-page.ts`
- Use PascalCase class name: `<Name>Page`
- Reference `src/page-object/portal-page.ts` as a good example
