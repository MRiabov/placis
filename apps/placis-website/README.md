# Placis website

Astro static app for Placis’s own site. `astro build` writes `dist/`. Live
origin is R2 — [docs](../../docs/features/placis-website/cloudflare.md). Not the contractor website Worker.

```bash
pnpm placis-website:dev
pnpm placis-website:check
pnpm placis-website:test:e2e
```

Local: <http://localhost:4322>. Set `PUBLIC_APP_ORIGIN` (default
`https://app.placis.com`) for Try now / Login / prompt submit.
