# Placis website

Placis’s own site. Distinct from the [contractor website](../website/README.md).

This directory locks how the Placis website is built and served. It is not a
copy or design PRD. The app lives in `apps/placis-website/`. This origin has
**no Go HTTP**
([HTTP conventions](../../general-architecture/api.md)).

- [ADR](ADR.md) — architectural decision record
- [cloudflare.md](cloudflare.md) — Astro static build, R2 origin, zone hosts
- [testing.md](testing.md) — Playwright against the static build
- Pricing: `/pricing/` ([billing](../billing/README.md)) — bake amounts
  at `astro build` from `GET /v1/billing/catalog`. No Stripe on this
  origin.
- [sep-3-issue-list.md](sep-3-issue-list.md) — Sep 3 issue list (keep /
  doc gap / drop)

Visual and copy source: `github.com/bongagift/placis-web` marketing files
(`frontend/src/components/public-website/`). That repo’s Next.js app, Clerk,
dashboard, and FastAPI are not this origin. Onboarding, sign-in, and the client
interview stay in `frontend-3`. Privacy and terms copy was removed there as
unreviewed, so this origin has no legal routes until that copy exists.
