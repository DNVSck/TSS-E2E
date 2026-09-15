# TSS-E2E Pipelines

## Variable Groups

Per-environment variable groups hold the test variables directly (no base64). The pipeline
references the group matching the `environment` parameter, so each environment keeps its own values.

| Environment | Group |
|---|---|
| dev | `TSS-E2E-DEV` |
| test | `TSS-E2E-TEST` |
| sit | `TSS-E2E-SIT` |
| sit2 | `TSS-E2E-SIT2` |

Each group contains every variable the suite reads (see `.env.example` for the full list):
`BASE_URL`, `OTP_ENABLED`, the `AGENT_*` account pool, `HAULIER_*` / `IMPORTER_*` / `CARRIER_*`
credentials and authorisations, `PRIMARY_HOLDER_*` / `NON_PRIMARY_HOLDER_*`, `AUTH_ACCOUNT_*`,
`BUYER_/CONSIGNOR_/CONSIGNEE_/SELLER_/EXPORTER_EORI`, `ICS2_DECLARANT_ID`, `RMQ_*`, `CDS_TOKEN`.

- Non-secret variables are auto-injected into every step as environment variables.
- Secret variables (passwords, TOTP secrets, EORIs) must be marked **secret** in the group; the
  run step maps them explicitly so the test process can read them.
- Each group also holds `TEAMS_WEBHOOK_URL` (optional - leave empty to skip notifications).

## Pipelines

### `run-tests.yml` - Full Test Runner

Runs functional and accessibility tests with configurable scope. Tests run directly on the
agent; the Chromium system dependencies must be baked into the agent image (run
`npx playwright install-deps chromium` as root once when building the agent image).

| Parameter | Options | Default |
|---|---|---|
| `environment` | `dev`, `test`, `sit`, `sit2` | `test` |
| `testScope` | `smoke`, `all`, `regression`, `standalone`, `ens-integrated` | `smoke` |
| `testFilter` | Free text (overrides `testScope` when not `none`) | `none` |
| `workers` | `1`-`4` | `1` |
| `runAccessibilityTests` | `true` / `false` | `false` |
| `runFunctionalTests` | `true` / `false` | `true` |
| `runAll` | `true` / `false` | `false` |
| `notifyTeams` | `true` / `false` | `true` |

**Behavior:**
- A single `Test` job runs the selected test type(s). `runAccessibilityTests` / `runFunctionalTests`
  select the directory (`tests/accessibility` / `tests/functional`); `runAll` (or both selected) runs
  the whole `tests` directory
- The job uses the `run-group-of-tests.yml` template, which handles env setup, test execution,
  artifact publishing, cleanup, and a per-job Teams notification
- The `testFilter` parameter is passed through to Playwright's `--grep` flag. When set to `none`, the `testScope` dropdown value is used instead
- PR trigger runs the job on PRs to `main` branch
- The Teams notification is sent per job (inside `run-group-of-tests.yml`), not as a separate job

**Examples:**
- Run smoke tests on test: `environment=test`, `testScope=smoke`
- Run all tests: `testScope=all`, `runAll=true`
- Run specific test by tag: `testFilter="@smoke"`
- Run specific test by name: `testFilter="Accompanied"`

**Post-deployment smoke:** There is no separate smoke pipeline. Post-deployment smoke runs are
`run-tests.yml` invoked with `testScope=smoke` (and the deployed `environment`), so the same
pipeline handles both scheduled/nightly runs and post-deployment smoke.

### `azure-pipelines.yml` - SonarQube CI

Triggers on push/PR to `main`. Runs SonarQube static analysis only.

## Templates

### `run-group-of-tests.yml`
Main test execution template. Handles:
- Environment preparation (dependencies install)
- Test path/scope routing
- Playwright execution with configurable workers
- Artifact publishing, cleanup, and Teams notification

### `test-env-prepare.yml`
Installs Node, project dependencies, and Playwright Chromium.

### `publish-test-artifacts.yml`
Publishes JUnit results to the Tests tab and the generated Allure report as a build artifact.

### `notify-teams.yml`
Sends the per-job Teams notification (reads counts from the JUnit report).

### `cleanup.yml`
Cleans up temporary files after test run.

## Scheduling

Nightly regression is a dedicated schedule-only pipeline:

### `nightly.yml` - Nightly Regression

- Schedules: `0 2 * * *` (02:00 UTC) on `main`
- Runs two parallel jobs: `environment=test` and `environment=sit`, `testScope=regression`, `workers=2`
- `trigger: none` / `pr: none` (schedule-only)

The `regression` scope runs only the tests tagged `@regression` (auth, standalone,
ens-integrated, supplementary) rather than the whole functional suite.

## Teams Notifications

All pipelines include an optional Teams notification step. If `TEAMS_WEBHOOK_URL` is empty or not set in the variable group, the step skips gracefully with no error.

`run-tests.yml` also exposes a `notifyTeams` toggle (default `true`). Set it to `false` for manual runs while developing new tests to avoid posting a card to Teams for every run.

## Pool

All pipelines run on `TSS-NonProd-EKS`.
