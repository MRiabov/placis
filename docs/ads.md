# Ads (#403)

Ad generation turns approved contractor content (business profile, media library, projects,
services) into a reviewable, exportable ad creative package. This doc is the overview; the
**single authority** for the feature is [`docs/ads/ad-generation/`](ad-generation/ADR.md):

- [ADR](ad-generation/ADR.md) — the decision record (why each choice was made)
- [PRD](ad-generation/prd.md) — product spec, user stories, acceptance criteria
- [technical-implementation.md](ad-generation/technical-implementation.md) — domain objects, API,
  generation pipeline, validation, export
- [frontend.md](ad-generation/frontend.md) — the `/cms/ads` workspace spec
- [design/ads-workspace.html](ad-generation/design/ads-workspace.html) — static design mock

## Positioning (done-for-you + DIY)

Placis is **done-for-you, delivered into your inbox, so you can DIY too**:

- The **managed ads team suggests and runs ads** for the contractor. Ad generation is the
  "suggest" half: it produces the creative package the team (or the contractor) hands to a
  platform.
- The **owner can also do it themselves** through the Ads workspace under `/cms/ads`.
- **Website tweaks** can be done by us, or by the owner through the website editor
  (`/cms/website`).

Posting, campaign operations (budget, bidding, targeting, scheduling, reporting) are **future
work** built on top of the creative service — the model reserves stable ids, `platform_refs`, and
`platform_status` for it. The MVP terminal state is `ready to post` (a deterministic export
package), never actual posting.

## Domain model

- **ad creative set** (the owner calls it an "ad") — name, offer/goal, service focus, destination
  page, ideal customer profile, review/publish state, `platform_refs`/`platform_status`.
- **ad variants** — one per format (`feed_square` 1:1, `feed_portrait` 4:5, `carousel` 1:1 cards,
  `story` 9:16); each pairs an image selection with copy. Formats without suitable approved
  images are omitted, never rendered empty.
- **ad copy variants** — headline, primary text, description, button label (fixed set), with
  platform character limits in one shared constants module.
- **ad image placements** — references to approved CMS media assets with per-format crop/focal
  metadata (non-destructive).
- **ad lead form** — suggested Meta lead-form fields (suggestions only; never block approval).
- **destination** — a tenant-owned published (or scheduled) website page.

Rules to preserve: AI **proposes** (copy + image gallery + light cleanup), the owner decides;
approved media only (gated twice); every AI call records reasoning + output + tool calls via
`ai_generations`; conservative, source-backed claims; validation before approval.

## State machines

- Creation flow: `draft → needs_review → ready_to_post → archived`.
- Existing-ad statuses (detail view): `Draft / Creative ready / Published / Archived`
  ("Creative ready" = creative done; "Published" is the next state once posting exists).

See the full spec in `docs/ads/ad-generation/`.
