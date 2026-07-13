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

Create environment file for local testing:

```powershell
# 1. Create .env.poc file
New-Item -Path .env.poc -ItemType File

# 2. Copy content from .env.example
Get-Content .env.example | Set-Content .env.poc
```

Edit `.env.poc` with your credentials:
```ini
BASE_URL=https://nc-tss.uk/portal

USER_NAME=your_username_here    # Get from Team Lead
PASSWORD=your_password_here     # Get from Team Lead

LOCALE=en                       # Language: en | cy | all
```

**Important:**
- Contact your **Team Lead** to get `USER_NAME` and `PASSWORD`
- Do **NOT** commit `.env.poc` to the repository (already in .gitignore)
- For other environments, create `.env.staging`, `.env.uat`, etc.

## Authentication & Parallel Execution

Tests never sign in themselves. `globalSetup` signs in **once per account**, caches the
browser session (cookies + localStorage) to `playwright/.auth/<ENV>/<PROFILE>.json`, and
each test simply **replays** its session. This keeps the login journey exercised once per
run while every test starts already signed in.

### How a test picks its identity

A spec declares the company profile it runs as — nothing else:

```typescript
test.describe('...', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });   // the only knob
  // ...
});
```

- `authProfile` drives the `storageState` a worker replays. Omit it (default `null`) and
  the test runs **anonymous / signed-out** — that is how the accessibility specs stay on
  the logged-out portal.
- Sign-in itself lives in `globalSetup` (`src/core/auth/ensure-auth-state.ts`), so a
  successful login never shows up as a passing test in the report.

### Account pool → one session per parallel worker

A company profile may hold **several logins**. This matters because the TSS portal keys
draft state by **session**: two workers replaying the *same* session collide, but distinct
sessions — even of accounts in the same company — run in parallel cleanly. So each
concurrently-running worker is pinned to its **own** account:

```
parallelIndex 0  →  AGENT account 1  →  AGENT-1.json
parallelIndex 1  →  AGENT account 2  →  AGENT-2.json
parallelIndex 2  →  AGENT account 3  →  AGENT-3.json
```

Assignment is `pool[testInfo.parallelIndex]` (see `accountFor` in
`src/core/auth/credentials.ts`). We use **`parallelIndex`** (the concurrent slot, bounded
to `[0, workers)` and reused when a worker is recycled), **not** `workerIndex` (which keeps
climbing on every fresh worker and would index past the pool into a session file that was
never created).

> **Rule:** keep `--workers` ≤ the number of accounts in the pool. Exceeding it throws a
> clear error rather than silently sharing a session.

### Configuring the account pool (`.env.<ENV>`)

Number accounts contiguously from 1. `PASSWORD` / `TOTP_SECRET` / `EORI` fall back to the
unindexed `<PROFILE>_*` var, so a shared password is written once. **TOTP secrets must be
base32 with NO spaces.**

```ini
# AGENT pool — one account per parallel worker
AGENT_PASSWORD=shared-password           # shared, so set once (fallback)
AGENT_USER_NAME_1=agent1@example.com
AGENT_TOTP_SECRET_1=BASE32SECRETNOSPACES1
AGENT_USER_NAME_2=agent2@example.com
AGENT_TOTP_SECRET_2=BASE32SECRETNOSPACES2
# ...add _3, _4 to grow the pool

# Single-account profiles keep the unindexed form, unchanged
IMPORTER_USER_NAME=importer@example.com
IMPORTER_PASSWORD=...
IMPORTER_TOTP_SECRET=...

OTP_ENABLED=true                         # environment enforces the TOTP step
```

The `AUTH_PROFILES` env var says which profiles **this run** needs (defaults to `AGENT`):

```powershell
$env:AUTH_PROFILES="AGENT,IMPORTER"; pnpm test ...
```

### TOTP (OTP) handling — no sleeps

`generateTotpCode` (`src/core/util/totp-auth.ts`) is a **pure** function of
`(secret, 30s window)`. Keycloak rejects a code it has already seen (e.g. two sign-ins in
the same window), so `SignInPage.inputTotp` submits, and if the on-screen OTP error appears
it **polls the generator until it yields a new code** (the next window) and resubmits — a
condition-based wait, never a fixed `sleep`. One submit per window, capped at
`MAX_TOTP_ATTEMPTS`.

Pool accounts have **distinct** secrets, so `globalSetup` logs them all in **concurrently**
(`Promise.allSettled`) — no window collision, and ~pool-size faster than serial.

### Running in parallel

```powershell
# Control worker count with the --workers flag (CLI wins over config/env)
pnpm test tests/functional --project=chromium-en --workers=3

# WORKERS in the .env file is respected too, but a shell WORKERS var is overridden
# by the .env value (dotenv override:true) — prefer --workers for ad-hoc runs.
```

Retries: `RETRY_COUNT` locally (default 0), 2 on CI.

### Known limitation

There is **no mid-run re-authentication**. If a session is lost mid-test (idle timeout, or
the account kicked out by a login elsewhere), that test simply fails. The 15-minute session
TTL is kept below Keycloak's 30-minute idle timeout so a run never *starts* near expiry.

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
