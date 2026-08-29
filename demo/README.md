# Placis look demo

Near-production look for The CMS, Ads, and onboarding. Mock data only. No
auth, no API.

## Run

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5176>. `?dev=1` opens the yellow developer strip.
`?shot=1` hides it.

```bash
pnpm build
pnpm preview
```

## Routes

- `/cms` — home chooser
- `/cms/website` — website editor
- `/cms/details` `/cms/projects` `/cms/certifications` `/cms/media`
- `/cms/ads`
- `/cms/billing` — stub
- `/onboarding/find` → review → interview → preview → generated

## Customer look host

This build is static files for customer demos when product behaviour is not
ready. Optional:

```bash
pnpm deploy
```

deploys `dist/` to Cloudflare Pages (`placis-demo`). No custom hostname is
required; a `pages.dev` URL is enough.

`demo/` has its own `pnpm-workspace.yaml` so install here does not join the
parent Placis workspace. Do not add this folder to the repo-root
`pnpm-workspace.yaml`. Copy the folder out when you want a standalone app;
copy it back when look should land in the repo.

## Check

```bash
pnpm check
```
