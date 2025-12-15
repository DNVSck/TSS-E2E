# Developing Guide (Move to Wiki - TBC)

This document explains how to extend the framework by adding tests, pages, and fixtures.

---

## Adding a Page Object

Create a new page under `page-object/`:

```ts
export class PortalPage extends BasePage {
  signInBtn = new Element("a[href='/portal/sign-in']");

  async clickSignIn(): Promise<void> {
    await this.signInBtn.click();
  }
}
```
Register the page in fixtures/page-fixture.ts.

## Writing a Test

Create tests under tests/ui/:
```ts
import { test } from '../test-hooks';

test('Portal sign-in', async ({ portalPage }) => {
  await portalPage.clickSignIn();
});
```

## Multi-Language Usage

Use translation keys in tests:
```ts
const title = t('portal.title');
```
Do not hardcode visible text.
