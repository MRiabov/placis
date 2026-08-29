# Ads (#403)

Ad generation turns approved contractor content (business profile, media
library, projects, services) into a reviewable, exportable ad set. This doc is
the overview; the **single authority** for the feature is [`ad-generation/`](ad-generation/ADR.md):

- [persistence.md](persistence.md) — `ads` and `ad_*` tables
- [api.md](api.md) — HTTP (`/v1/ads`)
- [ADR](ad-generation/ADR.md) — architectural decision record (why each choice was made)
- [PRD](ad-generation/prd.md) — product spec, user stories, acceptance criteria
- [technical-implementation.md](ad-generation/technical-implementation.md) — domain objects, generation pipeline,
  validation, export
- [frontend.md](ad-generation/frontend.md) — the `/cms/ads` workspace spec
- [design-decision-record.md](ad-generation/design-decision-record.md) — list Archive look
- [frontend-debloat.md](ad-generation/frontend-debloat.md) — `frontend-2` port: keep / delete / retarget
- [testing.md](ad-generation/testing.md) — the ads E2E test
- [ads look](../../../demo/README.md) — `/cms/ads` in the look app
- [ads.html](../../design/ads.html) — HTML archive (also was embedded at
  [cms.html](../../design/cms.html)?scene=ads)
- [ad-application/meta](ad-application/meta/) — investigation for future ad posting to Meta (not the
  spec)

## Positioning (done-for-you + DIY)

Placis is **done-for-you, delivered into your inbox, so you can DIY too**:

- Done-for-you **suggests ads** for the contractor. Ad generation is the
  "suggest" half: it produces the ad set the owner (or done-for-you) hands to an
  ad platform.
- The **owner can also do it themselves** through Ads under `/cms/ads`.
- **Website tweaks** can be done by us, or by the owner through the website
  editor (`/cms/website`).

Ad posting, campaign operations (budget, bidding, targeting, scheduling,
reporting) are **future work** built on top of the ads service — the model
reserves stable ids, `platform_refs`, and `platform_status` for it. The MVP
terminal Ad status is **ad ready to post** (a deterministic export ad set),
never actual ad posting.

How we would post to Meta (Facebook / Instagram) is written in
[`ad-application/meta/`](ad-application/meta/). That directory is not the
product spec; `ad-generation/` still is.

## Domain model

- **ad** — name, offer/goal, service focus, ad lead form, ideal customer
  profile, review status, `platform_refs`/`platform_status`.
- **ad variants** — one per ad (one format: `feed_square` 1:1, `feed_portrait`
  4:5, `carousel` 1:1 cards, or `story` 9:16); pairs an image selection with
  copy. Never produce an empty format. If that format has no suitable approved
  photo, generate does not succeed (see [Open questions](#open-questions)).
- **ad copy variants** — headline, primary text, short label (stored as
  `description`), button label (fixed set), with platform character limits in
  one shared constants module.
- **ad image placements** — references to approved media assets with crop/focal
  metadata for this ad's format (non-destructive).
- **ad lead form** — suggested Meta lead-form fields (suggestions only; never
  block approval). Every ad has one. Ads do not send people to a website page.

Rules to preserve: AI **proposes** (copy + image gallery + light cleanup), the
owner decides; approved media items only (gated twice); every AI call records
reasoning + output + tool calls via `ai_generations`; conservative unprompted
marketing statements (owner override / owner prompt allowed — `update_details`
writes the business profile; Approve is not blocked); character limits, uploads
still in flight, and failed uploads still block. Owner-added photos in an ad are
usable once the photo is uploaded (~10 seconds); captioning is not a gate.

## Where things stand

- Creation flow: `draft → ad_needs_review → ad_ready_to_post → archived`.
- Existing-ad statuses (detail view):
  `Draft / Creative ready / Published / Archived` ("Creative ready" = the ad is
  done; "Published" is the next Ad status once ad posting exists).

Website leads from website forms (and later ad lead forms) are a separate
surface:
[leads](../other/leads/README.md).

See the full spec in `ad-generation/`.

## Open questions

Product calls still needed. Until answered, specs treat an empty format as
invalid (do not generate one).

1. **Carousel with too few ready photos.** Carousel needs 2–10 ready approved
   photos. If the library has one, do we disable the Carousel pill until there
   are enough photos, allow picking Carousel and block
   **Create ad and generate** with a warning, or tell them to pick Square feed
   (or another one-image format) instead? Square feed, Portrait feed, and Story
   need one ready photo — same question if the library is empty.
2. **`review_status` vs `status`.** `ads` and `ad_variants` each have both
   `status` (lifecycle) and `review_status` (no values specified). Is
   `review_status` leftover of `status`, or a second field (for example pending
   / approved / rejected like the media library)? `icp_review_status` is
   separate and stays.
3. **Ad destination in the glossary.** The term is still defined (a published
   website page the ad can send people to). v1 ads use an ad lead form only and
   do not send people to a website page ([ADR 1](ad-generation/ADR.md)). Keep the term as deferred
   Post-MVP, or drop it from the ads glossary until that work?
