# Placis website on Cloudflare

How the Placis website is built, stored, and served. This document locks the origin so
`apps/placis-website` does not become a Worker, a Cloudflare Pages project, or the
contractor website.

The app is not in this repo yet. Next: Astro app in `apps/placis-website/`, then the
upload workflow.

Related: [ADR.md](ADR.md), [contractor website Cloudflare](../website/cloudflare.md),
[ci-cd.md](../../../ci-cd.md), [architecture.md](../../../architecture.md).

## Locks

- Authoring is **Astro** (`output: 'static'`). CI runs `astro build` and uploads `dist/`.
- **No Worker.** Live GET is the hostname attached to the R2 bucket. No `@astrojs/cloudflare`.
- **No Cloudflare Pages product, no Railway, no Vercel** for this origin.
- Dedicated buckets: `placis-website` and `placis-website-staging`. Not the contractor
  website R2 tree.
- Canonical host is **`https://placis.com`**. `www.placis.com` 301s to apex. Do not
  advertise `{website_address}.placis.com`.
- Trailing slash so objects are `index.html` and `about/index.html`.
- Onboarding, sign-in, and the client interview stay on `frontend-2`
  (`https://app.placis.com`).

This origin **replaces** the predecessor Next.js app (`github.com/bongagift/placis-web`
on Vercel at `www.placis.com`). Do not preserve that www-canonical host or its Clerk /
Stripe webhook routes.

## Distinct from the contractor website

| | Placis website | Contractor website |
| --- | --- | --- |
| Whose site | Placis | the contractor |
| App | `apps/placis-website/` (not in the repo yet) | `apps/contractor-website/` |
| Build | `astro build` → `dist/` | Worker + publication HTML |
| Store | one R2 tree per environment | `sites/{website_address}/latest/` |
| Live GET | hostname on the R2 bucket | Worker, Cache then R2 |
| Host | `placis.com` | locked in [contractor website Cloudflare](../website/cloudflare.md) |

## Why not a Worker

The contractor-website Worker exists because a live GET maps `Host` to an R2 key, attaches
custom website addresses, and renders website preview. The Placis website has none of
that: one build, one tree of files.

Workers Static Assets would still be a Worker *project* and a `wrangler deploy` to host
HTML. Attaching `placis.com` to the bucket already puts it behind the zone (CDN, TLS,
WAF).

Cloudflare Pages is a second product on the same zone. Do not use it. Do not use the
Cloudflare Pages hostname API — that lock is for contractor hostnames; it is not a reason
to put the Placis website on that product either.

## Islands (from the predecessor source)

Predecessor marketing files:
`placis-web/frontend/src/components/public-website/`. Home today: TopBar → Hero
(RotatingWord + PlacisPromptBox) → news → getting-started → footer. The client interview
runs on the dashboard; from home the prompt box is a sign-up doorway.

**Islands** (browser JS is real):

- TopBar — mobile nav + scroll glass
- RotatingWord — `"Built for {trade}."`
- PlacisPromptBox — hero; drop Clerk `useAuth` / paywall; submit and Try now / Login go
  to `https://app.placis.com/onboarding/find` and sign-in
- `/contact` mailto — validate, then `mailto:`

**Markup, no island:** news, getting-started, footer, `/support` (mailto link), legal.
Theme is CSS `prefers-color-scheme`, not `next-themes`.

**Do not port to this origin:** OrbDemo, DustOrb, voice, enrichment, geo detection,
Clerk sign-in / sign-up, dashboard. Those stay in `frontend-2`.

## Live serve path

```text
Host placis.com
  → R2 object {path}/index.html   (home is index.html)

Host www.placis.com
  → 301 https://placis.com{path}
```

Unknown path is `404.html` from the same build.

## Zone host map (`placis.com`)

| Host | Origin |
| --- | --- |
| `placis.com` | Placis website R2 bucket (canonical) |
| `www.placis.com` | 301 to `https://placis.com` |
| `app.placis.com` | `frontend-2` (CMS, onboarding, website preview) |
| contractor live hosts | contractor-website Worker — [contractor website Cloudflare](../website/cloudflare.md) |
| API | Railway `cmd/api` (host unchanged here) |

How `frontend-2` is hosted on `app.placis.com` is not this spec. This file only names
that host as the CTA target.

## R2

| Environment | Bucket |
| --- | --- |
| production | `placis-website` |
| staging | `placis-website-staging` |

Staging hostname: `staging.placis.com` on the staging bucket.

CI uploads the built tree (overwrite in place is enough). Then purge Cloudflare cache
for `placis.com` (or `staging.placis.com`). Not `wrangler deploy`.

R2 is not S3 website hosting. It will not map `/` or `/about/` to `index.html` by
itself. That is zone **URL Rewrite Rules**, not a Worker. Same for www → apex
(**Redirect Rule**) and HTML caching (**Cache Rule** — a hostname on an R2 bucket does
not cache HTML by default).

**Local.** `astro dev` for the Placis website next to `cmd/api` / `frontend-2`. No
Miniflare R2 for this origin; the live path is the uploaded tree.

## CI deploy

Manual GitHub Actions `workflow_dispatch` only, workflow name `deploy placis website`,
environment staging | production. CircleCI does not upload this bucket. Secrets stay
out of git. Does not run on pull request. See [ci-cd.md](../../../ci-cd.md).

The workflow YAML is not in this documentation commit.

## One-time ops (not this commit)

On the `placis.com` zone: attach the production bucket to `placis.com`; staging bucket
to `staging.placis.com`; Redirect Rule www → apex; URL
Rewrite Rules for `/` and `*/` → `index.html`; Cache Rule so HTML is cached. Move DNS
off Vercel when the first upload is ready. No Cloudflare account work in this
documentation commit.

## Out of this spec

- Implementing `apps/placis-website/` or copying files from `placis-web`
- A Worker, a Cloudflare Pages project, or `@astrojs/cloudflare` adapter
- The contractor-website Worker, its R2 bucket, or Custom Hostnames
- How `frontend-2` is hosted on `app.placis.com`
- Blog, a marketing CMS, or contact fields that POST to Go
- Registrar automation
