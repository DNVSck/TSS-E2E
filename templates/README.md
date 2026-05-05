# Pipeline Templates

Reusable Azure DevOps pipeline templates for TSS E2E Playwright tests.

## Structure

* `test-env-prepare.yml`: Installs Node, PNPM, Chromium, and generates `.env` from `.env.example`.
* `run-group-of-tests.yml`: Executes a specific test suite.
* `publish-test-artifacts.yml`: Publishes Playwright and Allure reports.
* `cleanup.yml`: Cleans up the self-hosted agent workspace to prevent disk space issues.

## Variable Groups (Azure DevOps)

Manage configuration in **Pipelines → Library**. 

* `TSS-Secrets`: Global infra secrets (e.g., `NPM_TOKEN`).
* `TSS-dev` / `test` / `sit`: Environment-specific variables (`BASE_URL`, `USER_NAME`, `PASSWORD`).

*Note: The pipeline injects these variables directly into the `.env` file at runtime.*

## Adding a New Test Suite

To add a new test folder (e.g., `api`), add it to the `testSuites` parameter list in the main `run-tests.yml`:

```yaml
  - name: testSuites
    default:
      - name: ui
        enabled: true
      - name: api
        enabled: true
```

## Pull Request Behavior

When triggered by a Pull Request, the pipeline ignores the environment selection (defaults to `dev`) and only runs tests tagged with `@smoke`.

```typescript
test('@smoke should load the homepage', async ({ page }) => { ... });
```