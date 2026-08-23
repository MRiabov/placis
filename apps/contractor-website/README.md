# Contractor website

`apps/contractor-website` is the shared Astro + React application that serves every contractor's
live website and website preview. One Worker, no per-tenant build. The website editor in
`frontend-2` is a different application.

This directory is the predecessor renderer, renamed from its old package name. Do not invent a
second HTML engine. Website publication is not a Cloudflare deploy. Live HTML belongs in R2
`latest/`; a live GET is Cache then R2 and never calls Go. An R2 miss is 404. Website preview
is the only per-request render (`/preview/{token}/`).

The locked serve path, Worker names, R2 keys, and Connect website address flow:
[docs/features/website/cloudflare.md](../../docs/features/website/cloudflare.md).

Astro owns routing, the document, prerender-at-publication, and metadata. React islands and
website components come from `@placis/website-components`. A bundle-boundary check blocks
imports from `frontend-2`.

## Local

Predecessor env names are kept on the Worker (`PUBLIC_SITE_*`) so existing `.dev.vars` still
work. Copy `.dev.vars.example` to `.dev.vars` and point it at local `cmd/api`.

```bash
pnpm contractor-website:check
pnpm contractor-website:bundle-boundary
pnpm contractor-website:build
PUBLIC_SITE_API_BASE_URL=http://localhost:8000 pnpm contractor-website:deploy:local -- --port 4321
```

`wrangler dev` uses Miniflare R2 when a bucket is passed. R2-off is incompatible with the
R2-only live path. Website preview talks to local `cmd/api`.

## Deploy

Manual GitHub Actions `workflow_dispatch` only: **deploy contractor website cloudflare**
(staging | production). CircleCI does not deploy this Worker. Secrets stay in GitHub
Environments.

```bash
pnpm contractor-website:cf:deploy:staging
pnpm contractor-website:cf:deploy:production
```

Worker names: `placis-contractor-website-local` / `placis-contractor-website-staging` /
`placis-contractor-website`. R2 buckets: `placis-contractor-websites` /
`placis-contractor-websites-staging`.

Not in this import: Custom Hostnames, Connect website address, website publication HTML
render into R2, or a `workers.dev` adapter.
