# The CMS

The CMS is the whole owner app (sidebar + main area): website, ads, Leads, and
Profile. It is not a domain object and not a vertical feature. This directory
owns the **CMS (sidebar + main area)** — left nav, `/cms` two-card chooser, look
tokens, and the CMS-wide design decision record.

Visual mock: [`apps/demo/`](../../../apps/demo/README.md) (`cd apps/demo && pnpm install && pnpm dev`). Specs
win over the mock.

- [frontend.md](frontend.md) — left nav, Profile disclosure, `/cms` two-card chooser
- [design.md](design.md) — tokens (Satoshi, ink, hairline, outline vs `--secondary`)
- [design decision record](design-decision-record.md) — CMS-wide look (moved from website design decision
  record)
- [ADR](ADR.md) — nav / Profile grouping / `/cms`
- [frontend-debloat.md](../frontend-debloat.md) — left nav / `/cms` port notes (cross-cutting)

Destinations:

- [Website editor](../../features/website/README.md)
- [Assistant](../../features/assistant/README.md)
- [Ads](../../features/ads/README.md)
- [Leads](../../features/other/leads/README.md)
- [Business profile](../../features/business-profile/README.md) — Details, Projects, Certifications and reviews
- [Media library](../../features/other/media/README.md) — Profile child; not under business-profile/
