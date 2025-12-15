# Troubleshooting (Move to Wiki - TBC)

Use this document if setup or execution fails.

---

## Node / pnpm Issues

- Restart terminal after installing Node or pnpm
- Ensure npm global bin is on PATH

---

## Playwright Browsers Missing

```powershell
pnpm exec playwright install
```

## Environment Variables Not Loading

- Ensure .env.poc exists
- Restart terminal


## Language Tests Not Running

- Verify locale files exist under locales/
- Verify Playwright project name

