# Yoga Admin Demo

Public **frontend-only** clickable prototype for Yoga Admin Demo UI demos.

- **Demo data only** — member names, masked phones, packages, and orders are fictional mock seed data, not a live studio database.
- No backend, no authentication against real systems, no API keys.
- Built with React + Vite + Tailwind.

## Live demo

After GitHub Pages is enabled: https://k9ox38.github.io/yoga-dashboard-demo/

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
