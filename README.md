# 🎭 TSS E2E Test Automation with Playwright

End-to-end testing framework for the TSS (Trader Support Service) project using [Playwright](https://playwright.dev/) with TypeScript.

See also: [DEVELOPING.md](DEVELOPING.md) (development guide) and [CODING_GUIDELINES.md](CODING_GUIDELINES.md) (coding standards).

## 🏗️ Project Structure

```
TSS-E2E/
├── 📁 tests/
│   ├── functional/              # GB→NI RoRo declaration journeys (.spec.ts)
│   ├── accessibility/           # Axe accessibility scans (signed-out portal)
│   └── test-hooks.ts            # Shared test object + before/after hooks
├── 📁 src/
│   ├── flows/                   # Business flows composed from page objects
│   │   └── common-flows/        # End-to-end composed flows (create & submit declaration)
│   ├── page-object/             # Page Object Model classes
│   │   └── components/          # Reusable UI components (agent banner, party block)
│   ├── fixtures/                # Playwright fixtures (pages, flows, locale, auth, axe, api)
│   ├── core/
│   │   ├── auth/                # globalSetup sign-in, credentials & account pool
│   │   ├── api/                 # API client
│   │   ├── report/              # Allure report managers, PDF export
│   │   └── util/                # Helpers (element, totp, string, date, ...)
│   ├── constant/                # Opaque domain codes (procedure codes, country codes, ...)
│   ├── test-data/               # Test data builders per screen
│   └── data-objects/            # Data types (user, ...)
├── 📁 locales/                  # Translation files (en.json, cy.json)
├── 📁 config/
│   ├── bootstrap-env.ts         # Loads .env.<ENV> (throws if ENV is not set)
│   ├── environment.ts           # Typed access to env vars
│   ├── global-setup.ts          # Signs in once per account, caches sessions
│   └── global-teardown.ts       # Generates the Allure report
├── 📁 templates/                # Azure DevOps pipeline templates
├── playwright.config.ts
└── package.json
```

## 🚀 Setup Guide

### Prerequisites

- **Windows 10/11**
- **PowerShell**
- **Git**
- **[Visual Studio Code](https://code.visualstudio.com/)** — the recommended editor for this
  framework (Step 4 sets up its extensions and one-click debugging)

### Step 1: Install Node.js with NVM

```powershell
# Install NVM for Windows
winget install CoreyButler.NVMforWindows

# Restart terminal, then install Node.js LTS
nvm install lts
nvm use lts        # triggers a UAC prompt (creates a symlink) — accept it

# Verify installation
node --version
npm --version
```

> `nvm use` needs elevation to create the Node symlink. If it fails silently, re-run the
> terminal as Administrator once, or accept the UAC prompt.

### Step 2: Install Project Dependencies

```powershell
# Clone repository
git clone <repository-url>
cd TSS-E2E

# Enable pnpm (version pinned via "packageManager" in package.json)
corepack enable

# Install dependencies
pnpm install

# Install the Playwright browser (only chromium is used by the projects)
pnpm exec playwright install chromium
```

**Notes:**
- If your machine was previously pointed at a corporate registry and `pnpm install` fails,
  reset to the public registry: `npm config set registry https://registry.npmjs.org/`
- On Node 25+ corepack is no longer bundled — install it first: `npm install -g corepack`

Verify the toolchain:

```powershell
pnpm exec playwright --version
```

### Step 3: Environment Configuration

Every run **requires** `ENV=<name>`; the config then loads `.env.<name>` (missing `ENV` fails immediately). Two environments are used:

| | `.env.sit` | `.env.test` |
|---|---|---|
| Used by | `*:sit` scripts — day-to-day dev runs | `*:test` scripts |
| `DEFAULT_TIMEOUT` | 5s | **15s** — the test env is noticeably slower, 5s action timeouts were flaky |

Create the file(s) from the example and fill in credentials:

```powershell
Copy-Item .env.example .env.sit
# then edit .env.sit
```

Key variables (see `.env.example` for the full list):

```ini
BASE_URL=<portal URL of the environment>   # get from Team Lead
LOCALE=en                        # en | cy | all

# Credentials per company profile: AGENT_*, IMPORTER_*, HAULIER_*
# (see "Authentication & Parallel Execution" below for the account-pool format)
AGENT_PASSWORD=...
AGENT_USER_NAME_1=...
AGENT_TOTP_SECRET_1=...

# Company names the Agent represents before declaring (env data, like the EORIs)
HAULIER_COMPANY_NAME=...
IMPORTER_COMPANY_NAME=...

OTP_ENABLED=true                 # environment enforces the TOTP step
```

**Important:**
- Contact your **Team Lead** to get credentials
- Do **NOT** commit `.env.*` files to the repository (already in .gitignore) — they contain real credentials

### Step 4: VS Code (recommended)

VS Code is the recommended editor — it gives one-click run/debug of a single test with
breakpoints straight in the TypeScript.

#### Extensions

Install these from the Extensions panel (`Ctrl+Shift+X`):

| Extension | ID | Why |
|---|---|---|
| Playwright Test for VSCode | `ms-playwright.playwright` | Run/debug tests from the Testing sidebar; reads `playwright.env` below |
| ESLint | `dbaeumer.vscode-eslint` | Surfaces the same lint rules as `pnpm lint` inline |
| SonarQube for IDE (SonarLint) | `SonarSource.sonarlint-vscode` | Connected-mode analysis against the team's SonarQube project |

#### `.vscode` files

Both `.vscode/settings.json` and `.vscode/launch.json` are **gitignored** (they hold
per-developer choices), so a fresh clone won't have them — create them yourself with the
content below. They will never be committed.

`.vscode/settings.json` — the env the Playwright extension's Testing sidebar runs with. The
`playwright.env` block is all you need to run and debug tests:

```jsonc
{
  "playwright.env": {
    "ENV": "sit",
    "LOCALE": "en"
  }
}
```

Optionally, to wire SonarLint to the team's SonarQube (connected mode), add the block below.
The `connectionId` and `projectKey` point at internal infrastructure, so they are **not
listed here** — get the exact values from a team member (or from SonarQube → *Connected
Mode* setup):

```jsonc
{
  "sonarlint.connectedMode.project": {
    "connectionId": "<your-team's-sonarqube-connection-id>",
    "projectKey": "<project-key-from-team>"
  }
}
```

`.vscode/launch.json` — F5 debug configurations. "current file" runs just the spec you have
open; the others run the whole suite against a given env:

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Playwright: current file (ENV=sit)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test", "${relativeFile}", "--project=chromium-en"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "env": { "ENV": "sit", "LOCALE": "en" }
    },
    {
      "name": "Playwright: ENV=sit",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "env": { "ENV": "sit", "LOCALE": "en" }
    },
    {
      "name": "Playwright: ENV=test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "env": { "ENV": "test", "LOCALE": "en" }
    }
  ]
}
```

#### How to debug a test

- **Testing sidebar** (Playwright extension): open the flask icon, hit the ▶/🐛 next to any
  test. It uses `playwright.env` from `settings.json`, so no `ENV` juggling. Set breakpoints
  by clicking the gutter — they hit inside page objects and flows.
- **Run and Debug panel** (`F5`): pick a `launch.json` config. Use **"current file (ENV=sit)"**
  while iterating on one spec. Breakpoints in `.ts` work directly.
- To debug against the TEST env, switch `playwright.env.ENV` to `test`, or pick the
  **"ENV=test"** launch config.

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
$env:ENV="sit"; pnpm test tests/functional --project=chromium-en --workers=3

# WORKERS in the .env file is respected too, but a shell WORKERS var is overridden
# by the .env value (dotenv override:true) — prefer --workers for ad-hoc runs.
```

Retries: `RETRY_COUNT` locally (default 0), 2 on CI.

### Known limitation

There is **no mid-run re-authentication**. If a session is lost mid-test (idle timeout, or
the account kicked out by a login elsewhere), that test simply fails. The 15-minute session
TTL is kept below Keycloak's 30-minute idle timeout so a run never *starts* near expiry.

## 🎮 Running Tests

`ENV` must always be set. The package scripts (`test:functional:*`, `test:smoke:*`) bake it
in via `cross-env`; for ad-hoc runs set it in PowerShell first — `cross-env` typed directly
in a shell is **not** on PATH (it only resolves inside package scripts):

```powershell
$env:ENV="sit"     # sticks for the rest of the terminal session
```

### Package scripts

```powershell
# All functional journeys, serial, English (the main suite)
pnpm test:functional:sit      # SIT
pnpm test:functional:test     # TEST env

# Smoke-tagged tests (@smoke)
pnpm test:smoke:sit           # SIT
pnpm test:smoke:test          # TEST env

# Lint
pnpm lint
```

> Every run script names its environment (`:sit` / `:test`) so it is unambiguous which
> env you are hitting. Smoke vs functional is a **scope** split (a `@smoke`-tagged subset
> vs the whole `tests/functional` folder), not an environment one.

### Ad-hoc runs

```powershell
# A single spec
$env:ENV="sit"; pnpm test tests/functional/gb-ni-roro-ens-only.spec.ts --project=chromium-en

# With visible browser / step debugger / UI mode
$env:ENV="sit"; pnpm test:headed ...
$env:ENV="sit"; pnpm test:debug ...
$env:ENV="sit"; pnpm test:ui ...

# IMMI Standalone (test env only)
$env:ENV="test"; pnpm test tests/functional/gb-ni-roro-immi-standalone.spec.ts --project=chromium-en
```

### Reports

The Allure report is generated automatically in `globalTeardown` after each run.

```powershell
pnpm report:open       # open the generated report (test-results/result.html)
pnpm report:serve      # serve a live Allure report from allure-results/
pnpm report:pdf        # export the Allure report to PDF
```

Also produced per run: Playwright HTML report (`playwright-report/`) and JUnit XML
(`test-results/junit.xml`, used by CI).

## 🌍 Multi-Language (Welsh)

Two Playwright projects exist: `chromium-en` and `chromium-cy`, with translations in
`locales/en.json` / `locales/cy.json` and a `t('key')` fixture for translated assertions.

> **Note:** Welsh testing is currently **inactive** — the portal's language switcher is not
> yet available, so the `cy` switch in `BasePage` is a placeholder and the functional suite
> runs `chromium-en` only. The infrastructure stays in place for when the switcher ships.

## 🏛️ Architecture: Page Objects → Flows → Tests

Three layers keep tests readable:

1. **Page objects** (`src/page-object/`) own locators and single-screen actions. They use
   Playwright `Locator`s directly (there is no custom element wrapper) and take `page` in
   the constructor:

```typescript
// src/page-object/portal-page.ts
export class PortalPage extends BasePage {
    private readonly signInBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.signInBtn = page.locator("a[href='/portal']");
    }

    async clickSignIn(): Promise<void> {
        await this.signInBtn.click();
    }
}
```

2. **Flows** (`src/flows/`) compose page objects into business journeys (initial form →
   movement → consignment → goods → submit). `common-flows/` chains those into complete
   end-to-end journeys.

3. **Tests** (`tests/functional/`) declare an `authProfile`, pick a flow fixture, and pass
   journey-specific data overrides:

```typescript
// tests/functional/gb-ni-roro-ens-only.spec.ts
import { getBaseUrl, test } from '../test-hooks';
import { COMPANY_PROFILE } from '../../src/core/auth/credentials';

test.describe('GB to NI RoRo ENS-only Declaration Process', () => {
  test.use({ authProfile: COMPANY_PROFILE.AGENT });

  test.beforeEach(async ({ representTraderFlow }) => {
    await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
  });

  test('Accompanied', { tag: ['@smoke'] }, async ({ createAndSubmitEnsDeclarationFlow }, testInfo) => {
    await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
      testInfo,
      url: getBaseUrl(),
      consignmentOverrides: ensOnlyConsignment(),
    });
  });
});
```

All page objects and flows are injected as fixtures (`src/fixtures/`), so tests never
`new` anything. To add a page/flow, register it in `page-fixture.ts` / `flow-fixture.ts` —
see [DEVELOPING.md](DEVELOPING.md).

### Ground rules

- **No fixed sleeps** — never `waitForTimeout`/`sleep`; always wait on a real condition
  (element state, URL, new TOTP window, ...).
- **Constants only for opaque codes** (`GB`, `R1`, `14`, procedure codes) in
  `src/constant/` — self-describing strings stay inline.
- Full standards in [CODING_GUIDELINES.md](CODING_GUIDELINES.md).

## 🆘 Troubleshooting

**`ENV is not set` on startup:**
```powershell
# Every run needs ENV — use a package script, or set it in the shell first
$env:ENV="sit"; pnpm test ...
```

**`ENOENT ... playwright/.auth/<ENV>/<PROFILE>.json`:**
The run needed a profile that `globalSetup` did not sign in. Set `AUTH_PROFILES` for the
run (defaults to `AGENT`):
```powershell
$env:AUTH_PROFILES="AGENT,IMPORTER"; $env:ENV="sit"; pnpm test ...
```

**Worker-count error mentioning the account pool:**
`--workers` exceeds the number of pool accounts — add `<PROFILE>_USER_NAME_<n>` accounts
or lower `--workers`.

**OTP rejected repeatedly:**
Check the `TOTP_SECRET` is base32 **without spaces**, and the machine clock is accurate.

**Tests flaky on the `test` env:**
The test env is slow — make sure you run with `.env.test` (its `DEFAULT_TIMEOUT` is 15s,
vs 5s on SIT).

**Browsers missing / "Project not found":**
```powershell
pnpm exec playwright install chromium --force
```

## 📖 Resources

- **Playwright Docs**: [playwright.dev](https://playwright.dev/docs/intro)
- **Page Object Model**: [playwright.dev/docs/pom](https://playwright.dev/docs/pom)
- **Allure Reports**: [allurereport.org/docs](https://allurereport.org/docs/)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/docs/)

---

**Ready to start testing! 🚀**
