# Yoga Admin Demo

Public **frontend-only** clickable prototype for Yoga Admin Demo UI demos.

- **Demo data only** — member names, masked phones, packages, and orders are fictional mock seed data, not a live studio database.
- No backend, no authentication against real systems, no API keys.
- Built with React + Vite + Tailwind.

## Live demo

After GitHub Pages is enabled: https://k9ox38.github.io/yoga-dashboard-demo/

## Demo sign-in

The admin pages sit behind a demo login page. Use **admin** / **demo1234** (the login page shows them and can fill them in).
The check runs in the browser only — there is no server, and it protects nothing. The session lasts for the browser tab,
or 7 days with “7 天内自动登录”. Sign out from the icon next to the profile at the bottom of the sidebar, or from 管理员资料.

## Local development

```bash
pnpm install
pnpm exec vite --config vite.config.ts
```

## Build

```bash
pnpm install
pnpm exec vite build --config vite.config.ts
pnpm test
```

## License / attributions

See `ATTRIBUTIONS.md` (shadcn/ui MIT; Unsplash photos where applicable).
