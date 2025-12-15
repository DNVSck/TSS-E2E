# TSS E2E Test Automation with Playwright

A comprehensive end-to-end UI testing framework for the Trader Support Service(TSS) project using Playwright with TypeScript.

## Prerequisites
- Windows 10/11
- Node.js (or NVM)
- Git

## Setup

### Step 1: Install Node.js LTS

```powershell
# Install NVM for Windows
winget install CoreyButler.NVMforWindows

# Restart terminal, then install Node.js
nvm install 24.12.0
nvm use 24.12.0

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
````powershell
# Clone repository
git clone <repository-url>
cd TSS-E2E

# Install pnpm (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

````
### Step 4: Environment Configuration

````powershell
copy .env.example .env.poc
````

Edit .env.poc and set the following:

```ini
BASE_URL=<application-url>
USER_NAME=<username>
PASSWORD=<password>
LOCALE=en
```

> **Notes:**
> - Contact your **Team Lead** to get `USER_NAME` and `PASSWORD`
> - Do not commit `.env.*` files
> - Restart the terminal if environment variables are not picked up
> - For other environments, create `.env.staging`, `.env.uat`, etc.

## Test execution

### Run all tests
```powershell
pnpm test
```

### Run all tests
```powershell
pnpm test --headed
```

### Run specific test
```powershell
pnpm test tests/ui/gb-ni-roro-simple-acco.spec.ts
```

### Run in different environments
```powershell
pnpm test:poc       # Create .env.poc
pnpm test:staging   # Create .env.staging
```

### Run in debug mode
```powershell
pnpm test --debug
```

### Run by languages
```powershell
pnpm test --project=chromium-en   # English
pnpm test --project=chromium-cy   # Welsh
```

### Allure reports
```powershell
# Generate report
pnpm report:generate
pnpm report:open

# Serve live Allure report
pnpm report:serve
```

## Additional Documentation

For more details and guidance, refer to:
- ARCHITECTURE.md
- DEVELOPING.md
- CODING_GUIDELINES.md
- TROUBLESHOOTING.md
