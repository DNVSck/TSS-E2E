---
name: create-flow
description: "Create a new business Flow class for the TSS-E2E framework, including the flow class, fixture registration with dependency injection, and type definition."
license: Proprietary
compatibility: opencode
---

## Steps

1. Create the flow file in `src/flows/<name>-flow.ts`.
2. Use constructor injection with `private readonly` fields for page objects or sub-flows.
3. Create public methods that orchestrate page object actions.
4. Wrap each step in `ReportLog.step('Step name', async () => { ... })`.
5. Register the flow in `src/fixtures/flow-fixture.ts`:
   - Add to `FlowFixtureType` interface
   - Add fixture entry that injects dependencies from the destructured parameters
   - Use `async ({ dep1, dep2 }, use) => { await use(new <FlowName>(dep1, dep2)); }`
6. Run `tsc --noEmit` and fix any errors.
7. Summarise the files created or modified.

## Rules

- Use kebab-case filename: `<name>-flow.ts`
- Use PascalCase class name: `<Name>Flow`
- Constructor injection only, no direct imports of page objects in methods
- Every meaningful action wrapped in `ReportLog.step()`
- Reference `src/flows/portal-access-flow.ts` as a good example
- Reference `src/fixtures/flow-fixture.ts` for DI pattern
