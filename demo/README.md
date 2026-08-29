# Placis look demo

Near-production look for The CMS, Ads, and onboarding. Mock data only. No
auth, no API.

Look work happens here and in the copied checkout `demo.placis.com`. Specs
remain canonical. Sync with `scripts/sync-look-demo.sh` from the Placis repo
root (copies this folder, `docs/glossary.md`, and the Don't-say checker).
Copy-back: rsync this app onto `demo/`, then copy `glossary.md` onto
`docs/glossary.md`.

## Run

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5176>. `?dev=1` opens the yellow developer strip.
`?shot=1` hides it.

```bash
pnpm build
```

Serve `dist/` locally with Vite if you need a static host.

## Routes

- `/cms` — home chooser
- `/cms/website` — website editor
- `/cms/details` `/cms/projects` `/cms/certifications` `/cms/media`
- `/cms/ads` — ad list
- `/cms/ads/new` — new ad workspace (`?review=1` opens Review)
- `/cms/ads/:id` — existing ad detail
- `/cms/ads/:id/edit` — edit workspace
- `/cms/billing` — Usage & billing (account menu; not left nav)
- `/cms/website?subscription=canceled` — Publish blocked until they pay
- `/onboarding/find` → review → questions → website → generated

## Look host

This build is static files when product behaviour is not ready. Intended host:
`demo.placis.com`. Optional:

```bash
pnpm deploy
```

deploys `dist/` to Cloudflare Pages (`placis-demo`). A `pages.dev` URL works
until the custom hostname is attached.

This folder has its own `pnpm-workspace.yaml` so install here does not join
the parent Placis workspace. Do not add this folder to the repo-root
`pnpm-workspace.yaml`.

## Check

Go is required (Don't-say). Then:

```bash
pnpm check
```

That is Biome, TypeScript (strict-plus), Knip, file-size (800 lines), token
colors, and Don't-say. CI runs the same command plus `pnpm build`.
