# Ads (#403)

Ad generation turns approved contractor content (business profile, media library, projects,
services) into a reviewable, exportable ad set. This doc is the overview; the
**single authority** for the feature is [`ad-generation/`](ad-generation/ADR.md):

- [data-model.md](data-model.md) — `ads` and `ad_*` tables
- [api.md](api.md) — HTTP (`/v1/ads`)
- [ADR](ad-generation/ADR.md) — the decision record (why each choice was made)
- [PRD](ad-generation/prd.md) — product spec, user stories, acceptance criteria
- [technical-implementation.md](ad-generation/technical-implementation.md) — domain objects,
  generation pipeline, validation, export
- [frontend.md](ad-generation/frontend.md) — the `/cms/ads` workspace spec
- [frontend-debloat.md](ad-generation/frontend-debloat.md) — `frontend-2` port: keep / delete / retarget
- [testing.md](ad-generation/testing.md) — the ads E2E test
- [design/ads-workspace.html](ad-generation/design/ads-workspace.html) — static design mock
- [ad-application/meta](ad-application/meta/) — investigation for future ad posting to Meta (not the spec)

## Positioning (done-for-you + DIY)

Placis is **done-for-you, delivered into your inbox, so you can DIY too**:

- Done-for-you **suggests ads** for the contractor. Ad generation is the "suggest" half: it
  produces the ad set the owner (or done-for-you) hands to an ad platform.
- The **owner can also do it themselves** through Ads under `/cms/ads`.
- **Website tweaks** can be done by us, or by the owner through the website editor
  (`/cms/website`).

Ad posting, campaign operations (budget, bidding, targeting, scheduling, reporting) are **future
work** built on top of the ads service — the model reserves stable ids, `platform_refs`, and
`platform_status` for it. The MVP terminal Ad status is **ad ready to post** (a deterministic export
ad set), never actual ad posting.

How we would post to Meta (Facebook / Instagram) is written in
[`ad-application/meta/`](ad-application/meta/). That directory is not the
product spec; `ad-generation/` still is.

## Domain model

- **ad** — name, offer/goal, service focus, ad lead form, ideal customer profile, review status,
  `platform_refs`/`platform_status`.
- **ad variants** — one per ad format (`feed_square` 1:1, `feed_portrait` 4:5, `carousel` 1:1
  cards, `story` 9:16); each pairs an image selection with copy. Ad formats without suitable
  approved media items are omitted, never rendered empty.
- **ad copy variants** — headline, primary text, description, button label (fixed set), with
  platform character limits in one shared constants module.
- **ad image placements** — references to approved media assets with per-ad-format crop/focal
  metadata (non-destructive).
- **ad lead form** — suggested Meta lead-form fields (suggestions only; never block approval).
  Every ad has one. Ads do not send people to a website page.

Rules to preserve: AI **proposes** (copy + image gallery + light cleanup), the owner decides;
approved media items only (gated twice); every AI call records reasoning + output + tool calls via
`ai_generations`; conservative, source-backed marketing statements; validation before approval.

## Where things stand

- Creation flow: `draft → ad_needs_review → ad_ready_to_post → archived`.
- Existing-ad statuses (detail view): `Draft / Creative ready / Published / Archived`
  ("Creative ready" = the ad is done; "Published" is the next Ad status once ad posting exists).

Website leads from website forms (and later ad lead forms) are a separate surface:
[leads](../other/leads/README.md).

See the full spec in `ad-generation/`.
