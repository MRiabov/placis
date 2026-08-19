# Ad Generation Technical Implementation

Status: proposed implementation plan.

Related docs:

1. [Ad generation PRD](prd.md)
2. [Ads data model](../data-model.md)
3. [Website](../../website/README.md)
4. [Architecture and JSON standards](../../../architecture.md)
5. [Backend API surface](../../../planning/go-backend-rewrite.md)

## Technical Thesis

Ad generation creates ads for a tenant. It is not a campaign-operations system: campaign
status, spend, ad leads, and reporting are future work, not part of ad generation. The first
version must produce an **ad ready to post** ad set (images cropped for each ad format, plus
copy) without doing ad posting itself.

The key rules:

1. **Approved media only**: ad images reference media assets owned by the tenant and approved
   for public use, with per-ad-format crop/focal metadata or derived crop variants. No raw URLs, no
   unreviewed media assets, no external hotlinks.
2. **The LLM drafts; the owner edits**: the LLM drafts copy, proposes image galleries, and may
   apply light cleanup to images (remove clutter/trash, tidy backgrounds). Everything lands in
   reviewable draft records with where it came from. Manual edits always win and are preserved;
   the LLM never overwrites an approved variant silently.
3. **Empty ad formats are left out**: an ad format with no suitable approved images is omitted
   from the ad set, never rendered as an empty placeholder.
4. **Validation before approval**: ad destination, images, copy limits, and claims are validated
   before an ad can reach `ad_ready_to_post`.
5. **LLM outputs are recorded**: every AI generation call records its reasoning, user-visible
   output, and tool calls through the existing `ai_generations` trace path, with tenant scope and
   actor context.
6. **A service of its own**: ad generation is a separate service with clearly defined inputs and
   a fixed output format with a version number (the ad set). Ads under `/cms/ads` is one caller of it;
   other internal parts of Placis (a future campaign-management feature) and later external
   systems can call the same service. For now it can live inside the main app, but it should be
   written so it can move into its own deployment or open to external callers without changing
   the ad set format.

## First Implementation Scope

Build the smallest real feature that produces a usable ad set as a service:

1. persisted ad and variant records with `draft` as the default status
2. copy stored as structured fields with ad-platform-aware limits and an allowed button-label set
3. image placements referencing approved media assets with per-ad-format crop metadata
4. ad destination references to tenant-owned published website pages
5. an LLM draft step (copy + image gallery + light cleanup edits) that writes reviewable
   draft records and traces
6. format-accurate previews for square, portrait, carousel, and story
7. validation and approval gates, then the ad set output with a downloadable rendering for the
   human path
8. Ads under `/cms/ads` as one caller of the service

Do not build: ad posting, campaign objects, budgets, audience targeting, landing page
generation, or AI image generation and substantive editing (beyond light cleanup). Those are
follow-up features documented in the PRD;
the future ads manager is expected to grow on top of this service rather than in the website
editor.

## Proposed Domain Objects

Add ad domain records under `internal/ads/`. Persistence follows the app's standard pattern:
goose migrations + sqlc queries over pgx — a typed service layer, no SQLAlchemy. The records are
the service's per-tenant records, not website page content, and the service's inputs and outputs are
clearly defined from the start so other callers can integrate without the Ads UI.

These are new tables — the ad, its variants, copy, image placements, ad lead form, and
review trail. They do not duplicate website, media library, or Details content: media assets,
projects, certifications, reviews, and website pages stay where they are, and the ad records
reference them by id (for example `ad_image_placements.media_asset_id`).

In code: Creative set is the marketing set (images + text), stored today as `ads` plus variants.
Distinct from Ad. Go/persistence forms are
snake_case tables with a `*_id` primary key, per [data-model.md](../data-model.md): Ad →
`ads`, `AdVariant` → `ad_variants`, `AdCopyVariant` → `ad_copy_variants`,
`AdImagePlacement` → `ad_image_placements`, `AdLeadForm` → `ad_lead_forms`. There is no separate
ad-destination record in Go — the ad destination is `destination_website_page_id` +
`destination_path` columns on `ads`.

Recommended top-level records:

1. Ad (`ads`)
2. `AdVariant`
3. `AdCopyVariant`
4. `AdImagePlacement`
5. `AdLeadForm`
6. `AdReview` (review/approval trail, or reuse the existing review record pattern)

### Ad (`ads`)

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `name`
04. `status`: `draft`, `ad_needs_review`, `ad_ready_to_post`, `archived`
05. `offer` (owner-visible goal, e.g. "promote garage conversions")
06. `ad_goal`: `more_calls`, `more_quotes`, `promote_service`
07. `service_focus_id` (optional reference to a tenant service)
08. ad destination: `destination_website_page_id` + `destination_path` (website page id or
    resolved website page path)
09. `review_status`
10. `source_refs`
11. `created_by`
12. `updated_by`
13. `created_at`
14. `updated_at`
15. `platform_refs` (flexible JSON: ad-platform object ids such as
    `{"facebook": {"ad_account_id": ..., "campaign_id": ..., "ad_id": ...}}`; empty until an
    ad-platform integration exists)
16. `platform_status`: `not_connected`, `synced`, `needs_sync`, `error`
17. `ideal_customer_profile` (typed: `age_min`, `age_max`, `household` such as
    `married_couples` or `any`, `location_focus`, `notes`, `source` (`default`, `llm_suggested`,
    `owner`), `review_status`; default is married couples aged 30-40; loose by design — steers
    generation now, precise targeting comes with ad posting)

Flexible JSON is allowed only for AI provenance and ad-platform-specific payload extras such as
`platform_refs`. Status, tenant ownership, offer, goal, ad destination, and review status are
hard typed.

### AdVariant

One row per ad format within an ad.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `ad_id`
04. `format`: `feed_square`, `feed_portrait`, `carousel`, `story`
05. `status`: `draft`, `ad_needs_review`, `approved`, `hidden`, `archived`
06. `copy_variant_id`
07. `image_placements` (ordered list of `AdImagePlacement`)
08. `position`
09. `review_status`
10. `created_at`
11. `updated_at`
12. `platform_refs` (flexible JSON: per-ad-format ad-platform ad object ids; empty until an
    ad-platform integration exists)

Ad-format-specific rules: `feed_square` and `feed_portrait` hold exactly one image placement;
`carousel` holds 2-10 square placements in order; `story` holds one or more 9:16 placements
(gallery-style stories).

### AdCopyVariant

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `headline`
04. `primary_text`
05. `description`
06. `cta_label` (from allowed set: `learn_more`, `get_quote`, `call_now`, `message`)
07. `source` (e.g. `ai_proposal`, `owner_edit`, `done_for_you_edit`, `manual`)
08. `ai_generation_ref` (trace id when LLM-drafted)
09. `created_at`
10. `updated_at`

Limits live in one constants module shared by the editor UI and backend validation:

1. headline: max 40 characters
2. primary_text: max 5000 characters, recommended max 500 for generated drafts
3. description: max 30 characters (optional)
4. `cta_label` from the allowed enum set

### AdImagePlacement

A reference to a media asset with ad-format-specific framing. No raw URLs.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `variant_id`
04. `media_asset_id` (must resolve to a tenant-owned approved media asset)
05. `format`
06. `crop` (typed: `x`, `y`, `width`, `height` normalized, or `full`)
07. `focal_point` (`x`, `y` normalized, inherited from the source media asset by default)
08. `position`
09. `alt_text` (inherited from the media asset unless overridden here; the media caption)

Crops are non-destructive. The source media asset is never modified; either store crop/focal
metadata on the placement or create a derived crop media asset through the existing media
derivation pattern so the renderer can produce the exact pixels.

Light cleanup edits follow the same pattern: the LLM drafts a cleanup preset (declutter, tidy
background) that produces a derived image variant of the approved source media asset. The derived
variant keeps parent-media-asset provenance and `pending_review` status, and only an approved
derived variant can appear in an ad set.

### AdLeadForm

Suggested fields for the ad lead form created at ad posting time. One set of suggestions per
ad.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `ad_id`
04. `title` (suggested)
05. `questions` (ordered structured list of a fixed set of standard fields — phone, full
    name, postcode, email — each mapped to a Meta ad-lead-form field type; phone is the
    essential default; no custom questions)
06. `created_at`
07. `updated_at`

These are suggestions only. They never block approval, and the real ad lead form (including the
privacy notice Meta requires) is finalized at ad posting.

## Format And Crop Model

Supported ad formats and target ratios:

1. `feed_square`: `1:1`
2. `feed_portrait`: `4:5`
3. `carousel`: `1:1` cards, 2-10 images
4. `story`: `9:16`

The crop model stores normalized crop and focal point so previews and the ad-set renderer use
the same framing. Rendering cuts the source media asset to the crop (sharpening/format conversion
via the existing image pipeline) into a per-ad-format output file. Output naming is
deterministic, e.g. `{ad_id}/{variant_format}/{position}.{ext}`.

## Backend API Surface

Ad generation is a service of its own, exposed over HTTP. The routes below are
what Ads uses; the same service code is what internal callers use, and what a
future public API would expose. All routes use `/api/v1` and stable `operation_id` values.

Service-level rules:

1. inputs are per tenant and clearly defined: details from the business profile, approved media
   asset ids, service focus, ad goal, ideal customer profile, and ad-destination website page id
2. the output is the ad set (ad, variants, copy, image placements, ad lead form,
   ad destination, `ideal_customer_profile`) with a version number and the stable ad/variant ids
   in the response, so an ad-platform integration can map its own objects back to the ad
3. generation is safe to retry: running the same request twice gives the same result
4. for now only internal callers (the app's own session/actor context) can use it; external
   API keys are future work and must not change the ad set format

Recommended private editor routes (the Ads client):

1. `GET /api/v1/ads`
2. `POST /api/v1/ads`
3. `GET /api/v1/ads/{ad_id}`
4. `PATCH /api/v1/ads/{ad_id}`
5. `DELETE /api/v1/ads/{ad_id}` for draft-only removal
6. `GET /api/v1/ads/{ad_id}/variants`
7. `PATCH /api/v1/ads/{ad_id}/variants/{variant_id}`
8. `POST /api/v1/ads/{ad_id}/variants/{variant_id}/regenerate` (LLM
   draft for copy and/or image gallery on one variant)
9. `POST /api/v1/ads/{ad_id}/approve`
10. `POST /api/v1/ads/{ad_id}/ad-set` (returns the ad set)
11. `POST /api/v1/ads/{ad_id}/download` (renders and returns a signed
    ad-set download for the human path)

Mutating routes that can be retried accept `Idempotency-Key`. Approve/ad-set/download/archive
mutations audit. The contractor website application never calls these routes; ad sets are not live-website content.

## Future Callers Of The Service

Expected later consumers, without changing the ad set format:

1. campaign management in Ads reading approved ad sets for campaign creation
2. an ad-posting service (Facebook/Google) uploading ad-set images and copy
3. external API callers integrating Placis ad generation into their own tooling

Ads-manager capabilities (budgets, bidding, targeting, scheduling, A/B testing, retargeting,
reporting) are out of scope for the first implementation but are expected later, built on top of
this service rather than inside the website editor.

## Ready For Ad-Platform Integration

Connecting an ad platform (like a Facebook Ads Manager) later should be additive, not a
restructure. The model is ready for it from the start:

1. every ad and variant has a stable id and a `platform_refs` map for ad-platform object
   ids (ad account, campaign, ad), plus a `platform_status` on the ad
2. a future integration writes ad-platform object ids and syncs status; it does not change the
   ad model or the ad set format
3. performance metrics (impressions, clicks, spend, results) attach to the stable
   ad/variant ids, so they can be shown next to each approved ad without changing the ad
   records
4. the ad set already carries suggested ad lead form fields and the confirmed ideal customer
   profile, so ad posting creates the final ad lead form and targets by age range, household, and
   location without extra data entry

Once ad posting exists, the zip download is no longer needed: the ad-platform integration reads
the ad set directly.

Internal ad logic outside Meta (custom rules deciding when or how an ad runs) is future work
and out of scope for now; the ideal customer profile and ad set are shaped so that logic can
attach later.

## Future Work: Video Ads

Video ads are deferred future work, noted here so the image ad set does not block them later.
Making good videos is a real challenge for contractors, so this is likely worth building after
the first implementation.

1. input is the same approved media: photos and, later, source video clips
2. output is a rendered video ad set per ad format (`story` 9:16, `feed_square` 1:1, `feed_portrait` 4:5)
3. assembly, not generation: cuts of approved pieces together; the LLM may add transitions or
   short generated segments for a cinematic style
4. review works like images: the assembled video is reviewable derived media with
   where it came from and `pending_review` status until approved
5. rendering is a separate pipeline (encoding, timing, copy/subtitle overlay) and stays out of
   the first implementation

## Generation Pipeline

The "generate ad ideas" step is one endpoint that writes reviewable drafts, never approved
status:

1. gather inputs: approved media assets (review approved, tenant-owned, media caption present),
   projects, services, service area, certifications, reviews, business name and details, the
   confirmed ideal customer profile, and the ad destination's public copy
2. call the existing structured AI assistant tooling (LLM, with the deterministic
   no-key fallback used by projects) with a clearly defined ad-copy response schema
3. record the call through `ai_generations` tracing: reasoning, user-visible copy output, tool
   calls, usage, and cost, with tenant scope and actor context
4. create `draft`/`ad_needs_review` copy variants, proposed image galleries referencing approved
   media assets, and proposed light cleanup edits as derived image variants; never write
   approved status
5. return the draft to Ads so the owner can review, edit, swap images, and adjust crops
   per ad format

Image gallery drafts use deterministic scoring first (project/service relevance, review
status, media caption presence, aspect suitability) with model assistance for ranking where
useful. Drafts never include unreviewed, non-tenant, or media-caption-free media assets.

## Validation And Approval Rules

An ad can reach `ad_ready_to_post` only when:

1. the tenant owns every referenced media asset and ad-destination website page
2. every image placement resolves to an approved tenant-owned media asset with a media caption
   and a valid crop for its ad format; a cleanup-edited derived variant counts only once it has
   passed review
3. the ad destination, if set, is a tenant-owned published (or scheduled-to-publish) website
   page; unpublished or hidden website pages are invalid ad destinations
4. copy satisfies character limits and `cta_label` is in the allowed set
5. sensitive claims (reviews, ratings, guarantees, certifications, insurance, pricing, results,
   before/after outcomes) are source-backed or explicitly owner or done-for-you approved; for
   before/after, source-backed means a real image pair from the same project. Anything
   LLM-drafted resembling such a claim sets `ad_needs_review`
6. at least one ad format has a complete variant; empty ad formats are left out of the ad set

Approval is explicit, audited, and final within Ads: `ad_ready_to_post` means "can be consumed
and handed to an ad platform", not "ad posting done".

## Ad Set Output

The service returns the ad set; that is the deliverable. The zip below is a temporary step for
a person doing ad posting manually, until direct transmission to Meta (future work) replaces it.

Rendering is deterministic and offline:

1. cut each approved source media asset to its crop and produce the per-ad-format image output
2. write a copy sheet (markdown or plain text) with headline, primary text, description, button
   label, ad destination URL, and per-ad-format notes
3. write the suggested ad lead form fields (title, questions) as the starting point for the ad
   lead form created on Meta
4. write a mapping of each output image to its source media asset, crop, and ad format
5. pack as a zip; the download is a signed short-lived read, not a public URL

The same approved ad always yields the same ad set and the same rendered bytes for the same
source media assets. Rendering requires no ad-platform credentials and does no ad posting.

## Frontend Ads Work

Add Ads under `/cms/ads` in The CMS (`frontend-2`):

1. ad list with status badges and last-updated
2. create-an-ad flow (name, offer/goal and service focus pickers pre-filled from the business
   profile, ideal customer profile, ad lead form by default, optional ad destination,
   budget/schedule shown but disabled) then generation
3. variant tabs for square, portrait, carousel, and story
4. the media library, scoped to approved tenant media assets, with framing controls
5. copy editor with live character counts and button-label select
6. format-accurate previews rendered from the backend response — one card per variant returned;
   only ad formats with approved images appear, empty ad formats are omitted (never rendered as
   placeholders); rendered from the same projection the ad-set renderer uses
7. inline validation errors next to the relevant field
8. approve and download actions
9. mobile-safe preview of the story variant (9:16) without horizontal overflow

The ad destination picker lists tenant website pages that are published or scheduled, defaulting
to the contact/quote website page or the matching service website page.

## AI And Voice Behavior

Allowed AI behavior:

1. draft headline/primary text/description from approved business-profile details and ad
   destination copy
2. propose an image gallery from approved media with relevance/quality ranking
3. apply light cleanup edits to selected images (remove clutter/trash, tidy backgrounds) as
   reviewable derived variants
4. suggest an ideal customer profile from the business profile and business research,
   asynchronously and reviewable
5. flag sensitive claims in generated copy for review
6. summarize the ad set into an owner-readable explanation

Blocked AI behavior:

1. inventing reviews, ratings, years, guarantees, certifications, insurance, pricing, or results
   — including before/after results without a real before/after image pair
2. selecting unreviewed, non-tenant, or media-caption-free media assets
3. generating new images or making substantive edits — adding/removing objects, changing the
   work shown, concealing damage or defects (heavy editing stays in the media library)
4. writing the ideal customer profile into the copy (e.g. "ideal for homeowners 40-55") — the
   ideal customer profile steers tone and imagery, never the text
5. writing directly into approved variants or reaching `ad_ready_to_post` without explicit
   approval
6. auto-creating ad records from onboarding interest alone

Ads are created on demand in Ads. Onboarding and voice do not collect ad
preferences and never create ad records.

## Testing Strategy

Backend tests:

01. ads default to `draft` for new tenants
02. ad records are never created by onboarding or voice flows
03. image placements reject unreviewed, cross-tenant, and media-caption-free media assets
04. ad-destination validation rejects unpublished, hidden, and cross-tenant website pages
05. copy validation enforces character limits and the allowed button-label set
06. sensitive LLM-drafted claims set `ad_needs_review` and block `ad_ready_to_post`
07. approval requires a valid ad destination, images, and copy on at least one ad format
08. empty ad formats are left out of the ad set and the rendered download
09. the ad set is stable across repeated generation calls (safe to retry)
10. tenant isolation for ads, variants, placements, and ad destinations
11. LLM draft calls record `ai_generations` traces with tenant scope and actor context
12. manual edits are preserved when a variant is regenerated
13. an internal caller gets the ad set through the service without the Ads UI, and the ad set
    shape is asserted by a focused service test
14. light cleanup edits produce non-destructive derived variants with provenance and
    `pending_review`, cannot enter an ad set until reviewed, and never modify the source media
    asset
15. `platform_refs` and `platform_status` default safely (empty / `not_connected`) and never
    affect approval or the ad set format
16. the ideal customer profile defaults to married couples aged 30-40, and an LLM suggestion is
    recorded, reviewable, and never auto-publishes
17. the ad set always carries suggested ad lead form fields, and they never block approval

Frontend tests:

1. Ads shows Ad states: ad draft / ad needs review / ad ready to post
2. create flow requires an ad destination before approval
3. media picker only offers approved tenant media assets
4. copy editor shows live character counts and blocks over-limit approval
5. square, portrait, carousel, and story previews render without overflow, including mobile story
6. approve and download actions produce the expected ad-set rendering without ad-platform
   credentials
7. regeneration keeps manual edits and marks the result `ad_needs_review`
8. cleanup edit drafts render as reviewable before/after image changes and can be accepted or
   rejected per image

Contract checks:

1. run `go generate ./...` (sqlc + huma OpenAPI export) after API schema changes
2. regenerate the frontend API types from the served `/openapi.json`
3. run `go test ./internal/ads/...`

Relevant broader checks:

1. `go build ./...` and `go vet ./...`
2. targeted backend tests for the ads service/routes
3. `pnpm --dir frontend-2 check`
4. one E2E test: create → generate → review/edit → approve → use the ad set (via the service
   and the human download), with external/paid integrations mocked but core domain logic unmocked
