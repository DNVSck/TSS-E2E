# Coding Guidelines (Move to Wiki - TBC)

Mandatory coding standards for the TSS E2E framework.


## Page Object Model (Mandatory)

- No raw Playwright usage in tests
- No selectors inside tests
- No assertions inside page objects


## Selector Rules

Priority order:
1. data-testid
2. Unique IDs
3. Semantic attributes
4. Stable CSS classes
5. XPath (last resort)

Text-based selectors are not allowed.


## Multi-Language Rules

- Never hardcode text
- Always use translation keys
- Assertions must use translated values

## Naming Conventions

- Files: kebab-case
- Classes: PascalCase
- Methods/variables: camelCase
- Constants: UPPER_SNAKE_CASE

## Async/Await

- Always use async/await
- Do not mix promises and async calls


## Code Review Checklist

- Page Object Model followed
- No hardcoded text
- No raw Playwright usage
- Correct selectors
- Tests are readable and focused

