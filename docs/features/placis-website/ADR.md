# Placis website Decision Record

Status: decided (2026-08-23, product owner + engineering).

This directory owns the Placis website (Placis’s own site). The contractor website is
[../website/](../website/README.md).

## Decisions

1. **The Placis website is an Astro app with a static build** — `apps/placis-website/`,
   `output: 'static'`. Authors write `.astro` files. CI runs `astro build` and uploads
   `dist/`. Not hand-authored HTML files. Not Next.js. Not the contractor-website
   `@astrojs/cloudflare` adapter.
   (2026-08-23)

2. **Serve from R2, not a Worker** — GitHub Actions uploads the build to a dedicated R2
   bucket. `placis.com` is the hostname attached to that bucket. There is no per-request
   logic on this origin, so there is no Worker, no Cloudflare Pages product, no Railway,
   and no Vercel.
   (2026-08-23)

3. **Own buckets** — `placis-website` (production) and `placis-website-staging`. Not the
   contractor-website Worker and not its R2 `latest/` tree.
   (2026-08-23)

4. **Canonical host is `https://placis.com`** — `www.placis.com` 301s to apex. This
   origin replaces the predecessor Next.js app on Vercel; do not keep Vercel’s
   www-canonical host or its webhook routes. Stripe and Clerk webhooks move with
   `frontend-2` / Go.
   (2026-08-23)

5. **Islands follow the predecessor marketing source** — The predecessor home hydrates in
   the browser because interactive widgets share a file with the markup. Keep as islands:
   TopBar (mobile nav + scroll glass), RotatingWord (hero trade timer), PlacisPromptBox
   (hero; drop Clerk `useAuth` / paywall; submit and Try now / Login go to
   `app.placis.com`), `/contact` mailto (validate, then `mailto:`). Markup only: news,
   getting-started, footer, `/support`, legal. Theme follows `prefers-color-scheme` in
   CSS, not `next-themes`.
   (2026-08-23)

6. **Onboarding and Clerk are not on this origin** — CTAs that were `/sign-up` /
   `/sign-in` go to `https://app.placis.com` (`/onboarding/find` and sign-in). Do not
   port OrbDemo, DustOrb, voice, enrichment, geo detection, Clerk sign-in / sign-up, or
   the dashboard. Those stay in `frontend-2`.
   (2026-08-23)

See [cloudflare.md](cloudflare.md).
