# Ad Generation Technical Implementation

Status: proposed implementation plan.

Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Services: `CreateAd`, `GenerateAdDraft` (River job `ads_generate`),
`ApproveAd`, `ExportAdSet`. Tables:
[persistence.md](../persistence.md). DTOs and Routes: [api.md](../api.md).
Pipeline: [pipeline/](pipeline/README.md).

Related docs:

1. [Ad generation PRD](prd.md)
2. [Ads persistence](../persistence.md)
3. [Website](../../website/README.md)
4. [Architecture and JSON standards](../../../general-architecture/backend-stack.md)
5. [HTTP](../api.md)

## Technical Thesis

Ad generation creates ads for a tenant. It is not a campaign-operations system:
campaign status, spend, ad leads, and reporting are future work, not part of ad
generation. The first slice must produce an **ad ready to post** ad set (images
cropped for this ad's format, plus copy) without doing ad posting itself.

The key rules:

1. **Approved media items only**: ad images reference media assets owned by the
   tenant and approved for public use, with crop/focal metadata for this ad's
   format or derived crop variants. No raw URLs, no unreviewed media assets, no
   external hotlinks.
2. **The LLM drafts; the owner edits**: the LLM drafts copy, proposes image
   galleries, and may apply light cleanup to images (remove clutter/trash, tidy
   backgrounds). Everything lands in reviewable draft records with where it came
   from. Manual edits always win and are preserved; the LLM never overwrites an
   approved variant silently.
3. **Never produce an empty format**: if the chosen format has no suitable
   approved images, generate does not succeed (see Open questions in
   [ads README](../README.md#open-questions)).
4. **Validation before approval**: images and copy limits are validated before
   an ad can reach `ad_ready_to_post`. Sensitive marketing statements do not
   block approval once the owner kept, edited, or prompted them ([ADR 18](ADR.md)).
   Every ad carries a suggested ad lead form.
5. **LLM outputs are recorded**: every AI generation call records its reasoning,
   user-visible output, and tool calls through the existing `ai_generations`
   trace path, with tenant scope and actor context.
6. **A service of its own**: ad generation is a separate service with clearly
   defined inputs and a fixed output format with an ad set format number (the ad
   set). Ads under `/cms/ads` is one caller of it; other internal parts of
   Placis (a future campaign-management feature) and later external systems can
   call the same service. For now it can live inside the main app, but it should
   be written so it can move into its own deployment or open to external callers
   without changing the ad set format.

## First Implementation Scope

Build the smallest real feature that produces a usable ad set as a service:

1. persisted ad and variant records with `draft` as the default status
2. copy stored as structured fields with ad-platform-aware limits and an allowed
   button-label set
3. image placements referencing approved media assets with crop metadata for
   this ad's format
4. an ad lead form on every ad (suggested title and standard fields)
5. an LLM draft step (copy + image gallery + light cleanup edits) that writes
   reviewable draft records and traces
6. format-accurate Facebook + Instagram preview for this ad's one format
   ([ADR 32](ADR.md), [ADR 35](ADR.md))
7. validation and approval gates, then the ad set output with a downloadable
   rendering for the human path
8. Ads under `/cms/ads` as one caller of the service

Do not build: ad posting, campaign objects, budgets, audience targeting, sending
people to a website page, campaign landing website page generation, or AI image
generation and substantive editing (beyond light cleanup). Those are follow-up
features documented in the PRD; the future ads manager is expected to grow on
top of this service rather than in the website editor.

## Domain objects

See [persistence.md](../persistence.md). Package `internal/ads/` (goose +
sqlc; no SQLAlchemy). Media assets:
[media library](../../other/media/persistence.md). Business profile:
[details](../../business-profile/details/persistence.md). Projects:
[projects](../../business-profile/projects/persistence.md). There is no ad
destination on `ads` for now.

## Format And Crop Model

Supported ad formats and target ratios:

1. `feed_square`: `1:1`
2. `feed_portrait`: `4:5`
3. `carousel`: `1:1` cards, 2-10 images
4. `story`: `9:16`

The crop model stores `crop_mode` plus 0–1 `crop_x` / `crop_y` / `crop_width` /
`crop_height` and `focal_x` / `focal_y` so the framing UI and the ad-set
renderer use the same framing. Rendering cuts the source media asset to the crop
(sharpening/format conversion via the existing image pipeline) into an output
file for this ad's format. Output naming is deterministic, e.g.
`{ad_id}/{variant_format}/{position}.{ext}`.

## HTTP

Routes, `Idempotency-Key`, `base_updated_at` / `409`, and `platform_refs` omit:
[ads HTTP](../api.md). The contractor website never calls these. Ad sets are not
live-website content.

Rewrite and cleanup are the Review directed calls (`rewrite` with required
`field` + `prompt` and optional selection — **select to edit inline AI
assistance**; omit selection = whole field; `cleanup` with required `prompt`).
There is no unprompted Review `regenerate`.

## Future Callers Of The Service

Expected later consumers, without changing the ad set format:

1. campaign management in Ads reading approved ad sets for campaign creation
2. an ad-posting service (Facebook/Google) uploading ad-set images and copy
3. external API callers integrating Placis ad generation into their own tooling

Ads-manager capabilities (budgets, bidding, targeting, scheduling, A/B testing,
retargeting, reporting) are out of scope for the first implementation but are
expected later, built on top of this service rather than inside the website
editor.

## Ready For Ad-Platform Integration

Connecting an ad platform (like a Facebook Ads Manager) later should be
additive, not a restructure. The model is ready for it from the start:

1. every ad and variant has a stable id and a `platform_refs` map for
   ad-platform object ids (ad account, campaign, ad), plus a `platform_status`
   on the ad
2. a future integration writes ad-platform object ids and syncs status; it does
   not change the ad model or the ad set format
3. performance metrics (impressions, clicks, spend, results) attach to the
   stable ad/variant ids, so they can be shown next to each approved ad without
   changing the ad records
4. the ad set already carries suggested ad lead form fields and the confirmed
   ideal customer profile, so ad posting creates the final ad lead form and
   targets by age range, household, and location without extra data entry

Once ad posting exists, the zip download is no longer needed: the ad-platform
integration reads the ad set directly.

Internal ad logic outside Meta (custom rules deciding when or how an ad runs) is
future work and out of scope for now; the ideal customer profile and ad set are
shaped so that logic can attach later.

## Future Work: Video Ads

Video ads are deferred future work, noted here so the image ad set does not
block them later. Making good videos is a real challenge for contractors, so
this is likely worth building after the first implementation.

1. input is the same approved media items: photos and, later, source video clips
2. output is a rendered video ad set per ad format (`story` 9:16, `feed_square`
   1:1, `feed_portrait` 4:5)
3. assembly, not generation: cuts of approved pieces together; the LLM may add
   transitions or short generated segments for a cinematic style
4. review works like images: the assembled video is a reviewable media library
   copy with inherited supplied by and `pending_review` status until approved
5. rendering is a separate pipeline (encoding, timing, copy/subtitle overlay)
   and stays out of the first implementation

## Pipeline

Write path: [pipeline](pipeline/README.md) (`CreateAd`, `GenerateAdDraft`,
`ApproveAd`, `ExportAdSet`). Review PATCH / rewrite / cleanup stay on
[ads HTTP](../api.md). Screens: [frontend.md](frontend.md). E2E:
[testing.md](testing.md).

## AI And Voice Behavior

Allowed AI behavior:

1. draft headline / primary text / short label (`description`) from approved
   business-profile details
2. propose an image gallery by picking from the media captions of ready approved
   photos
3. apply light cleanup edits to selected images (remove clutter/trash, tidy
   backgrounds) as reviewable copies
4. suggest an ideal customer profile from the business profile and business
   research, asynchronously and reviewable
5. if copy includes a detail, call `update_details` (one shared tool; also the
   Assistant); do not invent reviews, ratings, years, guarantees
   unprompted
6. rewrite one copy field from a required owner prompt after generate
   (**select to edit inline AI assistance**; omit selection = whole field)
7. apply promptable light cleanup of the current photo through
   `POST /v1/media-assets/{id}/image-edits`
8. summarize the ad set into an owner-readable explanation

Blocked AI behavior:

1. inventing reviews, ratings, years, guarantees, certifications, insurance,
   pricing, or results on the **unprompted** first generate (owner edit or owner
   prompt is allowed)
2. selecting unreviewed library photos, non-tenant media assets, or
   media-caption-free items **for the unprompted gallery draft** (the owner may
   add a just-uploaded photo to this ad before its media caption exists)
3. generating new images or making substantive edits — adding/removing objects,
   changing the work shown, concealing damage or defects (heavy editing stays in
   the media library)
4. writing the ideal customer profile into the copy unprompted (e.g. "ideal for
   homeowners 40-55") — the ideal customer profile steers tone and imagery; an
   owner prompt may override
5. writing directly into approved variants or reaching `ad_ready_to_post`
   without explicit approval
6. running rewrite or cleanup with an empty prompt
7. auto-creating ad records from onboarding interest alone

Ads are created on demand in Ads. Onboarding and voice do not collect ad
preferences and never create ad records.

## Testing Strategy

Named asserts and tables: [testing.md](testing.md) and
[pipeline/testing](pipeline/testing/README.md).

Backend tests:

01. ads default to `draft` for new tenants
02. ad records are never created by onboarding or voice flows
03. image placements reject unreviewed library picks, cross-tenant assets, and
    media-caption-free items on the **LLM gallery draft**. An owner-added upload
    is acceptable once the photo is uploaded, without a media caption yet
04. copy validation enforces character limits and the allowed button-label set
05. unprompted sensitive marketing statements set `ad_needs_review`; they do not
    block `ad_ready_to_post` once the owner kept, edited, or prompted them. A
    profile detail writes the business profile via `update_details`
06. approval requires images and copy on this ad's format
07. the rendered download contains this ad's format only
08. retry of the same generate while the ad is still an Ad draft or Ad needs
    review returns the cached generation; a new generate after
    `ad_ready_to_post`, or one that would duplicate a Published ad, rolls the
    `prompt_version`
09. tenant isolation for ads, variants, and placements
10. LLM draft calls record `ai_generations` traces with tenant scope and actor
    context
11. manual edits on other fields are preserved when one field is rewritten;
    empty rewrite/cleanup prompt is rejected; Ctrl+Z restores an LLM rewrite and
    cleanup Accept
12. an internal caller gets the ad set through the service without the Ads UI,
    and the ad set shape is asserted by a focused service test
13. light cleanup edits produce a new media library item (a copy) that inherits
    `supplied_by`, stays `pending_review`, cannot enter an ad set until
    reviewed, and never modify the source media asset
14. `platform_refs` and `platform_status` default safely (empty /
    `not_connected`) and never affect approval or the ad set format
15. the ideal customer profile defaults to married couples aged 30-40, and an
    LLM suggestion is recorded, reviewable, and never auto-publishes
16. the ad set always carries suggested ad lead form fields, and they never
    block approval

Frontend tests:

1. Ads shows list badges (Ad draft / Creative ready / Published / Archived) and
   creation-flow labels (ad draft / ad needs review / ad ready to post) where
   specified
2. create flow requires an ad lead form and does not offer a website page
3. media picker only offers approved tenant media assets
4. copy fields show live character counts and blocks over-limit approval
5. Facebook and Instagram previews for the selected format render without
   overflow, including mobile story
6. approve and download actions produce the expected ad-set rendering without
   ad-platform credentials
7. AI-orb rewrite keeps other fields' manual edits, requires a prompt, and marks
   `ad_needs_review`; empty prompt does not fire; Ctrl+Z restores the previous
   copy
8. cleanup edit drafts render as reviewable before/after image changes and can
   be accepted or rejected per image; a different cleanup orb requires a prompt
   and uses shared media library cleanup; Ctrl+Z after Accept restores the
   previous photo
9. an owner-added photo is usable once the photo is uploaded (Uploading… only;
   hover a circle-and-cross, click to cancel); Ads does not block on a media
   caption or show Processing… as a wait-to-use overlay

Contract checks:

1. run `go generate ./...` (sqlc + huma OpenAPI export) after API schema changes
2. regenerate the frontend API types from the served `/openapi.json`
3. run `go test ./internal/ads/...`

Relevant broader checks:

1. `go build ./...` and `go vet ./...`
2. targeted backend tests for the ads service/routes
3. `pnpm --dir frontend-2 check`
4. one E2E test: create → generate → review/edit → approve → use the ad set (via
   the service and the human download), with external/paid integrations mocked
   but core domain logic unmocked
