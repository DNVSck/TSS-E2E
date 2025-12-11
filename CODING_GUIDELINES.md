# 📝 Coding Guidelines & Best Practices

This document outlines the coding standards and best practices for the TSS E2E Test Automation project using Playwright with TypeScript.

## 🎯 Core Principles

### 1. Page Object Model (POM) - **MANDATORY**
Always use Page Object Model pattern for maintainable and scalable tests.

**✅ DO:**
```typescript
// page-object/portal-page.ts
export class PortalPage extends BasePage {
    signInBtn = new Element("a[href='/portal/sign-in']");
    
    async clickSignIn(): Promise<void> {
        await this.signInBtn.click();
    }
}

// tests/ui/portal.spec.ts
test('Sign in test', async ({ portalPage }) => {
    await portalPage.clickSignIn();
});
```

**❌ DON'T:**
```typescript
test('Bad test', async ({ page }) => {
    await page.click("a[href='/portal/sign-in']");  // Raw selectors in test
});
```

### 2. Multi-Language Support - **CRITICAL**
Never use hardcoded text in locators or assertions. Always use translation keys.

**✅ DO:**
```typescript
// Use stable selectors (ID, data-testid, href)
signInBtn = new Element("a[href='/portal/sign-in']");
submitBtn = new Element("button[data-testid='submit']");
titleElement = new Element("h1[class*='govuk-heading']");

// Use translation function for text verification
test('Verify title', async ({ t, portalPage }) => {
    const expectedTitle = t('portal.title');  // "Trader Support Service" (en) / "Gwasanaeth Cymorth Masnachwyr" (cy)
    await portalPage.verifyPortalTitle(expectedTitle);
});
```

**❌ DON'T:**
```typescript
// Never use text in selectors - breaks multi-language
badBtn = new Element("button:has-text('Sign in')");
badLink = new Element("text=Portal");

// Never hardcode text in assertions
await expect(page.locator('h1')).toContainText('Trader Support Service');
```

## 🏗️ Project Structure Conventions

### File Naming
```
kebab-case.extension
```

**Examples:**
- `portal-page.ts` ✅
- `sign-in-page.ts` ✅  
- `PortalPage.ts` ❌
- `signin_page.ts` ❌

### Folder Structure
```
page-object/          # Page classes
├── base-page.ts     # Base functionality
├── portal-page.ts   # Specific page
└── sign-in-page.ts  # Another page

tests/ui/            # Test files
├── portal.spec.ts   # Portal tests
└── sign-in.spec.ts  # Sign-in tests

fixtures/            # Test fixtures
├── main-fixture.ts  # Combined fixtures
└── locale-fixture.ts # Translation fixture
```

## 🎨 Naming Conventions

### Classes
```typescript
// PascalCase for classes
export class PortalPage extends BasePage { }
export class SignInPage extends BasePage { }
export class UserManagementPage extends BasePage { }
```

### Variables & Functions
```typescript
// camelCase for variables and functions
const expectedTitle = t('portal.title');
const signInButton = new Element("button#sign-in");

async clickSignInButton(): Promise<void> { }
async verifyUserProfile(): Promise<void> { }
```

### Constants
```typescript
// UPPER_SNAKE_CASE for constants
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 30000;
const BASE_URL = process.env.BASE_URL;
```

### Test Names
```typescript
// Descriptive test names with tags
test('Navigation from Portal to Sign In @smoke @portal @ui', async ({ }) => {});
test('User login with valid credentials @regression @auth', async ({ }) => {});
test('Form validation with invalid email @negative @validation', async ({ }) => {});
```

## 🔧 Element Selectors Best Practices

### Priority Order (Use in this order)
1. **data-testid** (Recommended)
2. **Unique IDs**
3. **Semantic attributes** (href, type, role)
4. **CSS classes** (stable ones only)
5. **XPath** (last resort)

**✅ DO:**
```typescript
// 1. Test IDs (most stable)
submitBtn = new Element("[data-testid='submit-button']");

// 2. Unique IDs
userMenu = new Element("#user-menu");

// 3. Semantic attributes
signInLink = new Element("a[href='/portal/sign-in']");
submitBtn = new Element("button[type='submit']");

// 4. Stable CSS classes
heading = new Element(".govuk-heading-xl");

// 5. XPath for complex scenarios
breadcrumb = new Element("//nav[@aria-label='breadcrumb']//a[last()]");
```

**❌ DON'T:**
```typescript
// Text-based selectors (breaks i18n)
badBtn = new Element("text=Sign in");
badLink = new Element(":has-text('Portal')");

// Fragile selectors
fragileBtn = new Element("div > div > button:nth-child(3)");
unstableClass = new Element(".css-1abc2def");  // Generated classes
```

### Custom Element Wrapper Usage
```typescript
// Always use custom Element class, not raw Playwright
export class PortalPage extends BasePage {
    // ✅ Custom Element wrapper
    signInBtn = new Element("a[href='/portal/sign-in']");
    
    async clickSignIn(): Promise<void> {
        await this.signInBtn.click();  // Auto-wait included
    }
    
    // ❌ Don't use raw Playwright in page objects
    // async clickSignIn(): Promise<void> {
    //     await this.page().locator("a[href='/portal/sign-in']").click();
    // }
}
```

## 🌍 Internationalization (i18n) Patterns

### Translation Keys Structure
```json
// locales/en.json
{
  "portal": {
    "title": "Trader Support Service",
    "button": "Sign in",
    "navigation": {
      "home": "Home",
      "profile": "Profile"
    }
  },
  "forms": {
    "validation": {
      "required": "This field is required",
      "email": "Enter a valid email address"
    }
  }
}
```

### Using Translations in Tests
```typescript
test('Multi-language portal test', async ({ t, portalPage }) => {
    // Get translated text
    const portalTitle = t('portal.title');
    const signInText = t('portal.button');
    const homeNavText = t('portal.navigation.home');
    
    // Use in verifications
    await portalPage.verifyPortalTitle(portalTitle);
    await portalPage.verifySignInButtonText(signInText);
});
```

### Page Object Translation Support
```typescript
export class PortalPage extends BasePage {
    async verifyPortalTitle(expectedTitle: string): Promise<void> {
        const actualTitle = await this.portalTitle.getText();
        await expect(actualTitle).toContain(expectedTitle);
    }
    
    // Don't hardcode text in page objects
    // ❌ async verifyPortalTitle(): Promise<void> {
    //     await expect(this.portalTitle.asLocator).toHaveText('Trader Support Service');
    // }
}
```

## 🧪 Test Structure & Organization

### Test File Structure
```typescript
import { test } from '../test-hooks';

// Setup (if needed)
test.beforeEach(async ({ basePage }) => {
    await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
});

// Main test
test('Descriptive test name @tags', async ({ t, portalPage, basePage }, testInfo) => {
    // Arrange
    const expectedTitle = t('portal.title');
    
    // Act
    await basePage.navigateToPortal(getBaseUrl(), testInfo);
    
    // Assert
    await portalPage.verifyPortalTitle(expectedTitle);
});

// Cleanup (if needed)
test.afterEach(async ({ basePage }) => {
    // Cleanup code
});
```

### Test Tags Convention
```typescript
// Use meaningful tags for filtering
test('User flow test @smoke @e2e @critical', async ({ }) => {});     // Critical smoke test
test('Form validation @regression @forms @ui', async ({ }) => {});   // Regression test
test('Performance check @performance @slow', async ({ }) => {});     // Performance test
test('Negative scenario @negative @edge-case', async ({ }) => {});   // Edge case test
```

## 🚀 Async/Await Best Practices

### Always Use Async/Await
```typescript
// ✅ DO: Use async/await consistently
async navigateAndVerify(): Promise<void> {
    await this.navigateToPortal();
    await this.verifyPageLoaded();
    await this.waitForLanguageSwitch();
}

// ❌ DON'T: Mix promises and async/await
async badExample(): Promise<void> {
    this.navigateToPortal().then(() => {  // Don't mix
        this.verifyPageLoaded();
    });
}
```

### Error Handling
```typescript
// ✅ DO: Handle errors appropriately
async safeOperation(): Promise<void> {
    try {
        await this.riskyOperation();
    } catch (error) {
        console.warn(`Operation failed: ${error.message}`);
        // Fallback or re-throw
    }
}

// Use built-in retry mechanisms
await PlaywrightUtils.retry(async () => {
    await this.unstableOperation();
}, 60000, 1000);
```

## 🎯 Wait Strategies

### Use Appropriate Waits
```typescript
// ✅ DO: Use specific waits
await element.waitForElementToBeVisible();
await page.waitForLoadState('networkidle');
await page.waitForURL(/\/portal/);

// Wait for conditions
await page.waitForFunction(() => 
    document.querySelector('h1')?.textContent?.includes('Expected Text')
);

// ❌ DON'T: Use arbitrary timeouts
await page.waitForTimeout(5000);  // Avoid if possible
```

## 📊 Reporting & Debugging

### Test Steps
```typescript
// Use testStep for clear reporting
test('Complex workflow', async ({ portalPage, t }) => {
    await testStep('Navigate to portal', async () => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);
    });
    
    await testStep('Verify portal title', async () => {
        const expectedTitle = t('portal.title');
        await portalPage.verifyPortalTitle(expectedTitle);
    });
    
    await testStep('Complete sign in process', async () => {
        await portalPage.clickSignIn();
        // Additional steps...
    });
});
```

### Logging
```typescript
// Use structured logging
logInfo(`Starting test with locale: ${currentLocale}`);
logPass(`Successfully verified title: "${actualTitle}"`);
console.warn(`Fallback used for translation key: ${key}`);
```

## 🔒 Security & Environment

### Environment Variables
```typescript
// ✅ DO: Use environment management
import { BASE_URL, LOCALE } from '../config/environment';

// Access credentials safely
const credentials = {
    username: process.env.USER_NAME,
    password: process.env.PASSWORD
};

// ❌ DON'T: Hardcode sensitive data
// const username = "admin@test.com";  // Never do this
// const password = "password123";     // Never do this
```

### Test Data Management
```typescript
// ✅ DO: Use external test data
import testData from '../test-data/users.json';

// ✅ DO: Use data builders/factories
const user = UserBuilder.createDefault()
    .withEmail('test@example.com')
    .withRole('admin')
    .build();
```

## 🧹 Code Quality

### TypeScript Best Practices
```typescript
// ✅ DO: Use proper typing
interface User {
    id: string;
    email: string;
    role: 'admin' | 'user';
}

async processUser(user: User): Promise<void> {
    // Implementation
}

// ✅ DO: Use enums for constants
enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    GUEST = 'guest'
}
```

### Method Size & Responsibility
```typescript
// ✅ DO: Keep methods focused and small
async clickSignIn(): Promise<void> {
    await this.signInBtn.click();
}

async verifyPortalTitle(expectedTitle: string): Promise<void> {
    const actualTitle = await this.portalTitle.getText();
    await expect(actualTitle).toContain(expectedTitle);
}

// ❌ DON'T: Create god methods
async doEverything(): Promise<void> {
    // 100 lines of mixed responsibilities
}
```

## 📋 Common Anti-Patterns to Avoid

### 1. **Text-Based Selectors**
```typescript
// ❌ NEVER: Will break with different languages
button:has-text('Submit')
text=English Text
:has-text('Click here')
```

### 2. **Raw Page Usage in Tests**
```typescript
// ❌ DON'T: Use page directly in tests
test('Bad test', async ({ page }) => {
    await page.click('#button');  // Use page objects instead
});
```

### 3. **Hardcoded Values**
```typescript
// ❌ DON'T: Hardcode URLs, timeouts, or text
await page.goto('https://hardcoded-url.com');
await page.waitForTimeout(5000);
await expect(heading).toHaveText('Hardcoded Text');
```

### 4. **Mixed Fixture Patterns**
```typescript
// ❌ DON'T: Mix old and new fixture patterns
import { test } from '@playwright/test';  // Old way
import { testMain as test } from '../fixtures/main-fixture';  // New way - use this
```

### 5. **Inconsistent Naming**
```typescript
// ❌ DON'T: Use inconsistent naming
class portalpage { }           // Wrong case
const SignIn_Button = '';     // Wrong convention
async Do_Something() { }       // Wrong convention
```

## ✅ Code Review Checklist

Before submitting code, ensure:

- [ ] **Page Object Model used** - No raw page interactions in tests
- [ ] **No text-based selectors** - Uses stable selectors only
- [ ] **Translation keys used** - No hardcoded text
- [ ] **Proper async/await** - All async operations awaited
- [ ] **TypeScript types** - Proper typing used
- [ ] **Naming conventions** - Follows project standards
- [ ] **Test tags applied** - Appropriate tags for filtering
- [ ] **Environment variables** - No hardcoded config
- [ ] **Error handling** - Appropriate error handling
- [ ] **Code documentation** - Clear comments where needed

## 🔄 Migration Guidelines

### From Legacy Pattern to Modern Pattern

**Old (Locale Manager):**
```typescript
// ❌ Old pattern - remove this
import { LocaleManager } from '../locales/locale-manager';
const locale = new LocaleManager();
const title = locale.getPortalTitle();
```

**New (Fixture Pattern):**
```typescript
// ✅ New pattern - use this
test('Modern test', async ({ t }) => {
    const title = t('portal.title');
});
```

### From Raw Page to Page Objects

**Old (Raw Playwright):**
```typescript
// ❌ Old pattern
test('Old test', async ({ page }) => {
    await page.goto(url);
    await page.click('#button');
    await page.fill('#input', 'text');
});
```

**New (Page Objects):**
```typescript
// ✅ New pattern
test('Modern test', async ({ portalPage, basePage }) => {
    await basePage.navigateToPortal(url);
    await portalPage.clickSignIn();
    await portalPage.fillEmail('text');
});
```

---

## 📚 Additional Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

---

**Remember: These guidelines ensure maintainable, scalable, and reliable test automation that works across multiple languages and environments.** 🎯