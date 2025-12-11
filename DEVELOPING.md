# 🚀 Development Guide for New Developers

Quick guide to work with the Playwright E2E Testing framework.

## 🎯 Creating Page Objects

Create file in `page-object/page-name.ts`:

```typescript
// page-object/user-profile-page.ts
import { BasePage } from "./base-page";
import { Element } from "../core/element/element";

export class UserProfilePage extends BasePage {
    editProfileBtn = new Element("button[data-testid='edit-profile']");
    nameInput = new Element("input#full-name");
    saveButton = new Element("button[type='submit']");
    
    constructor() { super(); }
    
    async fillAndSave(name: string): Promise<void> {
        await this.nameInput.fillText(name);
        await this.saveButton.click();
    }
}
```

Add to `fixtures/page-fixture.ts`:
```typescript
import { UserProfilePage } from '../page-object/user-profile-page';

export type PageFixtureType = {
    // ... existing pages
    userProfilePage: UserProfilePage;  //->  Add this
}

export const pageFixture: ExtendParams[0] = {
    // ... existing fixtures

    // -> Add this
    userProfilePage: async ({}, use) => {
        await use(new UserProfilePage());
    },
};
```

**Selector Priority:** ID > data-testid > href > stable class
**Avoid:** Text selectors (breaks multi-language)

## 📝 Writing Test Cases

Create test in `tests/ui/test-name.spec.ts`:

```typescript
// tests/ui/user-profile.spec.ts
import { test } from '../test-hooks';

test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});

test('Edit profile @smoke', async ({ t, basePage, userProfilePage }, testInfo) => {
  // Navigate & verify
  await basePage.navigateToPortal(process.env.BASE_URL!, testInfo);
  
  // Edit profile
  await userProfilePage.fillAndSave('John Doe');
  
  // Verify with translation
  const expectedMsg = t('profile.updateSuccess');
  // Add verification logic
});
```

**Key Points:**
- Use `t()` for all text verification
- Import from `../test-hooks` 
- Use `testInfo` for navigation

## 🎮 Running Tests

```powershell
# Basic commands
pnpm test tests/ui/user-profile.spec.ts
pnpm test tests/ui/user-profile.spec.ts --headed
npx playwright test your-test.spec.ts --debug

# By tags
pnpm test --grep "@smoke"
pnpm test --grep "@ui.*@smoke"

# By language
pnpm test --project="en"    # English only
pnpm test --project="cy"    # Welsh only
pnpm test                   # Both languages

# Advanced
pnpm test --workers=3 --retries=2
pnpm test --reporter=html
```

## 🌐 Multi-Language Support

Framework auto-detects and switches language:

```typescript
test('Multi-language test', async ({ t, portalPage }) => {
  // ✅ Use translation function
  const title = t('portal.title');        // Auto: EN or Welsh
  const button = t('common.signIn');      
  
  await portalPage.verifyPortalTitle(title);
  
  // ❌ Never hardcode text
  // await portalPage.verifyPortalTitle('Trader Support Service');
});
```

**Auto language switching:**
- Detects project (`en`/`cy`)
- Navigates and switches language automatically in `basePage.navigateToPortal()`

## ⚡ Quick Tips

**Element Waiting:** Elements auto-wait, no manual waits needed
```typescript
await this.button.click();  // ✅ Auto-waits
```

**Environment Variables:**
```typescript
const email = process.env.USER_NAME || 'fallback@email.com';
const url = process.env.BASE_URL || 'default-url.com';
```

**Debug Commands:**
```powershell
npx playwright test your-test.spec.ts --debug     # Step-by-step
pnpm test your-test.spec.ts --headed              # See browser
npx playwright test your-test.spec.ts --trace on  # Record execution
```

**Selectors:** ID > data-testid > href > class (never text)

---

## 📚 References
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - Detailed standards
- [README.md](./README.md) - Project setup
- [Playwright Docs](https://playwright.dev/)
