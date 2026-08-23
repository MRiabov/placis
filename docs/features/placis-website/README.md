# Placis website

Placis’s own site. Distinct from the [contractor website](../website/README.md).

This directory locks how the Placis website is built and served. It is not a copy or
design PRD. The app (`apps/placis-website/`) is not in the repo yet.

- [ADR](ADR.md) — decisions
- [cloudflare.md](cloudflare.md) — Astro static build, R2 origin, zone hosts

Visual and copy source for a later port: `github.com/bongagift/placis-web` marketing
files (`frontend/src/components/public-website/`). That repo’s Next.js app, Clerk,
dashboard, and FastAPI are not this origin. Onboarding, sign-in, and the client interview
stay in `frontend-2`.
