# 🎭 Playwright TSS End-to-End Test Automation Project

Welcome! This project contains end-to-end tests using [Playwright](https://playwright.dev/). This guide will help you set up your Windows environment and start writing tests quickly.

## Prerequisites & Installation

We use **Node.js** to run our tests. On Windows, we recommend managing Node versions using `nvm-windows`.

### 1. Install Tools (PowerShell)

Open PowerShell as Administrator and run the following commands.

*   **[Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/)**: The Windows Package Manager (installs software).
*   **[NVM (Node Version Manager)](https://github.com/coreybutler/nvm-windows)**: Allows you to switch between different Node.js versions easily.

```powershell
# Install NVM for Windows
winget install CoreyButler.NVMforWindows

# Restart your terminal (or open a new one) to apply changes
```

### 2. Install Node.js

Now, use NVM to install the latest Long Term Support (LTS) version of Node.js.

```powershell
# Install the latest LTS version
nvm install lts

# Tell Windows to use this version
nvm use lts
```

### 3. Configure Package Mirror (JFrog)

To ensure we can download all necessary packages, configure npm to use our NC JFrog mirror. Create or edit the `.npmrc` file in your user profile (usually `C:\Users\YourName\.npmrc`) and add:

```ini
registry=https://repo.netcompany.com/artifactory/api/npm/tss-dev-npm/
```

### 4. Install Dependencies

We use **[pnpm](https://pnpm.io/)** (Performant NPM) for faster and efficient package management.

```powershell
# Enable pnpm
corepack enable

# Install project dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

---

## Project Structure

Here is a quick overview of where things are:

*   **`tests/`**: 👈 **Start here!** This is where our actual test files live (e.g., `example.spec.ts`).
*   **`playwright-examples/`**: A reference folder cloned from the official repo. Check this if you need inspiration or code snippets (look inside `playwright-examples/tests/`).
*   **`playwright.config.ts`**: Global configuration for browsers, timeouts, and reporting.

---

## Running Tests

### Run all tests
```powershell
pnpm exec playwright test
```

### Run tests with UI Mode (Recommended for Dev )
Great for debugging and watching tests run step-by-step.
```powershell
pnpm exec playwright test --ui
```

### Record a new test (Codegen)
Don't want to write code from scratch? Record your clicks!
```powershell
pnpm exec playwright codegen
```

---

## Resources

*   **Official Docs**: [playwright.dev](https://playwright.dev/docs/intro) - The best place to learn.
*   **Netcompany Deliverables**: For specific internal guidelines on code style and policy.
