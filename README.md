# 🎭 TSS E2E Test Automation with Playwright

A comprehensive end-to-end testing framework for the TSS (Trader Support Service) project using Playwright with TypeScript.

## 📚 What is Playwright?

[Playwright](https://playwright.dev/) is a modern automation framework that:
- Tests across **Chrome, Firefox, Safari** browsers
- Supports **mobile testing** (Android/iOS)
- Provides **fast, reliable** element interactions
- Includes **auto-wait** mechanisms
- Generates **traces, screenshots, videos** for debugging
- Has **built-in assertions** with retry logic

## 🏗️ Project Structure

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

## 🚀 Complete Setup Guide

### Prerequisites

- **Windows 10/11** 
- **PowerShell** (any version)
- **Git** installed

### Step 1: Install Node.js with NVM

Open PowerShell as normal user (not admin):

```powershell
# Install NVM for Windows
winget install CoreyButler.NVMforWindows

# Restart terminal, then install Node.js LTS
nvm install lts
nvm use lts

# Verify installation
node --version
npm --version
```

### Step 2: Configure Package Registry

**Option A - Public Registry (Quick Start):**
```powershell
npm config set registry https://registry.npmjs.org/
```

**Option B - NC JFrog (Production):**
1. Request JFrog access via IT Services
2. Login to Netcompany JFrog Artifactory  
3. Click "Set Me Up" → Select npm repository
4. Copy auth config to `C:\Users\YourName\.npmrc`

### Step 3: Install Project Dependencies

```powershell
# Clone repository
git clone <repository-url>
cd TSS-E2E

# Enable pnpm (faster package manager)
corepack enable

# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

### Step 4: Environment Configuration
## Environment Variables

Create environment files for different test environments:

```powershell
# Copy example environment file
cp .env.poc .env.local
```

Edit `.env.local` with your settings:
```ini
BASE_URL=https://nc-tss.uk/portal/
USER_NAME=
PASSWORD=
LOCALE=en                       # Language: en | cy | all
HEADLESS=false                  # Show browser: true | false
BROWSER=chromium               # Browser: chromium | firefox | webkit
```

**Note:**
- Forị `USER_NAME` and `PASSWORD`, please contact your team lead to get the login credentials.
- Do not commit the `.env` file to the repository.

## 🎮 Running Tests

### Basic Commands

```powershell
# Run all tests
pnpm test

# Run with visible browser
pnpm test --headed

# Run specific test file
pnpm test tests/ui/gb-ni-roro-simple-acco.spec.ts

# Run with environment
pnpm test:poc                   # Use .env.poc
pnpm test:staging              # Use .env.staging
```

### Advanced Commands

```powershell
# Debug mode (step-by-step)
pnpm test --debug

# UI mode (visual test runner)
pnpm test --ui

# Generate test code (record actions)
pnpm exec playwright codegen https://nc-tss.uk/portal/

# Run specific project (language)
pnpm test --project=chromium-en
pnpm test --project=chromium-cy
```

### Reports

```powershell
# Generate and open Allure report
pnpm report:generate
pnpm report:open

# Serve live Allure report  
pnpm report:serve
```

## 🌍 Multi-Language Testing

The framework supports English and Welsh:

```typescript
// Test automatically adapts to project language
test('Portal test', async ({ t, portalPage }) => {
  const title = t('portal.title');           // "Trader Support Service" (en)
                                             // "Gwasanaeth Cymorth Masnachwyr" (cy)
  await portalPage.verifyPortalTitle(title);
});
```

**Language Projects:**
- `chromium-en` - English tests
- `chromium-cy` - Welsh tests  
- `LOCALE=all` - Run both languages

## 🏛️ Page Object Model

Use page objects for maintainable tests:

```typescript
// page-object/portal-page.ts
export class PortalPage extends BasePage {
    signInBtn = new Element("a[href='/portal/sign-in']");
    
    async clickSignIn(): Promise<void> {
        await this.signInBtn.click();
    }
}

// tests/ui/example.spec.ts
test('Sign in test', async ({ portalPage }) => {
    await portalPage.clickSignIn();           // Clean, readable
});
```

## 🔧 Writing Your First Test

1. **Create test file:**
```typescript
// tests/ui/my-test.spec.ts
import { test } from '../test-hooks';

test('My first test', async ({ basePage, portalPage, t }) => {
  // Navigate to portal
  await basePage.navigateToPortal('https://nc-tss.uk/portal/');
  
  // Verify title using translation
  const expectedTitle = t('portal.title');
  await portalPage.verifyPortalTitle(expectedTitle);
  
  // Click sign in button  
  await portalPage.clickSignIn();
});
```

2. **Run your test:**
```powershell
pnpm test tests/ui/my-test.spec.ts --headed
```

## 🛠️ Key Features

### Custom Element Wrapper
```typescript
const button = new Element('button#submit');
await button.click();                       // Auto-wait included
await button.waitForElementToBeVisible();   // Custom waits
```

### Environment Management  
```typescript
import { BASE_URL, LOCALE } from '../config/environment';
// Automatically loads correct .env file based on ENV variable
```

### Allure Reporting
- **Screenshots** on failure
- **Video recordings** of tests  
- **Step-by-step** execution traces
- **Multi-language** test results

### Browser Translation Disabled
```typescript
// Prevents auto-translation for accurate language testing
launchOptions: {
  args: ['--disable-translate', '--disable-features=Translate']
}
```

## 📖 Resources

- **Playwright Docs**: [playwright.dev](https://playwright.dev/docs/intro)
- **TypeScript Guide**: [typescriptlang.org](https://www.typescriptlang.org/docs/)
- **Allure Reports**: [docs.qameta.io](https://docs.qameta.io/allure/)
- **Page Object Model**: [playwright.dev/docs/pom](https://playwright.dev/docs/pom)

## 🆘 Troubleshooting

### Common Issues

**Tests fail with "Project not found":**
```powershell
# Clear Playwright cache
pnpm exec playwright install --force
```

**Environment variables not loading:**
```powershell
# Check environment file exists
ls .env.poc
# Verify ENV variable
echo $env:ENV
```

**Translation not working:**
```powershell
# Check locale files exist  
ls locales/
# Verify project name includes locale
pnpm test --list
```

### Debug Mode
```powershell
# Run single test with full debug info
pnpm test tests/ui/my-test.spec.ts --debug --headed
```

---

**Ready to start testing! 🚀**
