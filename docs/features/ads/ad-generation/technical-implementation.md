# Ad Generation Technical Implementation

Status: proposed implementation plan.

Related docs:

1. [Ad generation PRD](prd.md)
2. [Ads persistence](../persistence.md)
3. [Website](../../website/README.md)
4. [Architecture and JSON standards](../../../general-architecture/backend-stack.md)
5. [HTTP](../api.md)

## Technical Thesis

Ad generation creates ads for a tenant. It is not a campaign-operations system: campaign
status, spend, ad leads, and reporting are future work, not part of ad generation. The first
slice must produce an **ad ready to post** ad set (images cropped for this ad's format, plus
copy) without doing ad posting itself.

The key rules:

1. **Approved media items only**: ad images reference media assets owned by the tenant and approved
   for public use, with crop/focal metadata for this ad's format or derived crop variants. No raw URLs, no
   unreviewed media assets, no external hotlinks.
2. **The LLM drafts; the owner edits**: the LLM drafts copy, proposes image galleries, and may
   apply light cleanup to images (remove clutter/trash, tidy backgrounds). Everything lands in
   reviewable draft records with where it came from. Manual edits always win and are preserved;
   the LLM never overwrites an approved variant silently.
3. **Never produce an empty format**: if the chosen format has no suitable approved images,
   generate does not succeed (see Open questions in [ads README](../README.md#open-questions)).
4. **Validation before approval**: images and copy limits are validated before an ad can
   reach `ad_ready_to_post`. Sensitive marketing statements do not block
   approval once the owner kept, edited, or prompted them ([ADR 18](ADR.md)). Every ad
   carries a suggested ad lead form.
5. **LLM outputs are recorded**: every AI generation call records its reasoning, user-visible
   output, and tool calls through the existing `ai_generations` trace path, with tenant scope and
   actor context.
6. **A service of its own**: ad generation is a separate service with clearly defined inputs and
   a fixed output format with an ad set format number (the ad set). Ads under `/cms/ads` is one caller of it;
   other internal parts of Placis (a future campaign-management feature) and later external
   systems can call the same service. For now it can live inside the main app, but it should be
   written so it can move into its own deployment or open to external callers without changing
   the ad set format.

## First Implementation Scope

Build the smallest real feature that produces a usable ad set as a service:

1. persisted ad and variant records with `draft` as the default status
2. copy stored as structured fields with ad-platform-aware limits and an allowed button-label set
3. image placements referencing approved media assets with crop metadata for this ad's format
4. an ad lead form on every ad (suggested title and standard fields)
5. an LLM draft step (copy + image gallery + light cleanup edits) that writes reviewable
   draft records and traces
6. format-accurate Facebook + Instagram preview for this ad's one format ([ADR 32](ADR.md),
   [ADR 35](ADR.md))
7. validation and approval gates, then the ad set output with a downloadable rendering for the
   human path
8. Ads under `/cms/ads` as one caller of the service

Do not build: ad posting, campaign objects, budgets, audience targeting, sending people to a
website page, campaign landing website page generation, or AI image generation and substantive
editing (beyond light cleanup). Those are follow-up features documented in the PRD;
the future ads manager is expected to grow on top of this service rather than in the website editor.

## Proposed Domain Objects

Add ad domain records under `internal/ads/`. Persistence follows the app's standard pattern:
goose migrations + sqlc queries over pgx — a typed service layer, no SQLAlchemy. The records are
the service's per-tenant records, not website page content, and the service's inputs and outputs are
clearly defined from the start so other callers can integrate without the Ads UI.

These are new tables — the ad, its variants, copy, image placements, ad lead form, and
review trail. They do not duplicate website, media library, or Details content: media assets,
projects, certifications, and reviews stay where they are, and the ad records
reference them by id (for example `ad_image_placements.media_asset_id`).

In code: the marketing set is images + text, stored today as `ads` plus variants.
Distinct from Ad. Go/persistence forms are
snake_case tables with a `*_id` primary key, per [persistence.md](../persistence.md): Ad →
`ads`, `AdVariant` → `ad_variants`, `AdCopyVariant` → `ad_copy_variants`,
`AdImagePlacement` → `ad_image_placements`, `AdLeadForm` → `ad_lead_forms`. There is no ad
destination on `ads` for now.

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
08. `review_status` (no values specified — see Open questions in [ads README](../README.md#open-questions); `status` is the lifecycle)
09. `origin` (`owner`, `llm`, `done_for_you`, `business_profile`)
10. `created_by`
11. `updated_by`
12. `created_at`
13. `updated_at`
14. `platform_refs` (flexible JSON: ad-platform object ids such as
    `{"facebook": {"ad_account_id": ..., "campaign_id": ..., "ad_id": ...}}`; empty until an
    ad-platform integration exists)
15. `platform_status`: `not_connected`, `synced`, `needs_sync`, `error`
16. `icp_age_min`, `icp_age_max`, `icp_household` (`married_couples` or `any`),
    `icp_location_focus`, `icp_notes`, `icp_source` (`default`, `llm_suggested`, `owner`),
    `icp_review_status`; default is married couples aged 30-40; loose by design — steers
    generation now, precise targeting comes with ad posting

Flexible JSON is allowed only for `ai_generations` traces (`input` / `internal_reasoning` /
`output` / `tool_calls` / `applied_changes`) and ad-platform-specific payload extras such as
`platform_refs`. Status, tenant ownership, offer, goal, review status, and the ideal customer
profile are hard typed.

### AdVariant

One row per ad — the ad's one format ([ADR 32](ADR.md)).

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `ad_id`
04. `format`: `feed_square`, `feed_portrait`, `carousel`, `story`
05. `status`: `draft`, `ad_needs_review`, `approved`, `archived`
06. `copy_variant_id`
07. `image_placements` (ordered list of `AdImagePlacement`)
08. `review_status` (no values specified — see Open questions in [ads README](../README.md#open-questions); `status` is the lifecycle)
09. `created_at`
10. `updated_at`
11. `platform_refs` (flexible JSON: ad-platform ad object ids for this format; empty until an
    ad-platform integration exists)

Ad-format-specific rules: one variant per ad ([ADR 32](ADR.md)). `feed_square` and
`feed_portrait` hold exactly one image placement. `carousel` holds 2-10 square placements in
order. `story` holds exactly one 9:16 placement and shorter overlay copy. Multi-frame story
sequences are out of scope. Variant `hidden` and variant `position` were multi-format leftovers
and are not stored.

### AdCopyVariant

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `headline`
04. `primary_text`
05. `description` (owner-facing **short label**; Meta `link_data.description`)
06. `cta_label` (from allowed set: `learn_more`, `get_quote`, `call_now`, `message`)
07. `source` (e.g. `ai_proposal`, `owner_edit`, `done_for_you_edit`, `manual`)
08. `ai_generation_ref` (trace id when LLM-drafted)
09. `created_at`
10. `updated_at`

Limits live in one constants module shared by the Ads UI and backend validation. Platform
maxima are shared; recommended generated length is format-shaped ([ADR 33](ADR.md)):

1. headline: max 40 characters
2. primary_text: max 5000 characters; recommended generated length is shorter on feed, shorter
   still on carousel cards, and overlay-short on story
3. description (owner-facing short label): max 30 characters (optional)
4. `cta_label` from the allowed enum set

### AdImagePlacement

A reference to a media asset with ad-format-specific framing. No raw URLs.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `variant_id`
04. `media_asset_id` (must resolve to a tenant-owned approved media asset)
05. `format`
06. `crop_mode` (`full` or `rect`), `crop_x`, `crop_y`, `crop_width`, `crop_height` (0–1, null when `full`)
07. `focal_x`, `focal_y` (0–1, inherited from the source media asset by default)
08. `position`
09. `media_caption` (inherited from the media asset unless overridden here)

Crops are non-destructive. The source media asset is never modified; either store crop/focal
metadata on the placement or create a derived crop media asset through the existing media library
derivation pattern so the renderer can produce the exact pixels.

Light cleanup edits call the **same AI cleanup** as `/cms/media` and the website
assistant `cleanup_image` ([media library](../../other/media/README.md)): declutter, tidy
background; not invent work. That function creates a new media library item (a copy) of the
approved source. The copy sets `parent_media_asset_id`, inherits `supplied_by`, and stays
`pending_review`; only an approved copy can appear in an ad set.

### AdLeadForm

Suggested fields for the ad lead form created at ad posting time. One set of suggestions per
ad.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `ad_id`
04. `title` (suggested)
05. `include_marketing_phone` (default true), `include_full_name`, `include_postcode`,
    `include_email` — include/exclude toggles for the fixed set of standard fields; marketing phone
    is the essential default; no custom questions
06. `created_at`
07. `updated_at`

These are suggestions only. They never block approval, and the real ad lead form (including the
privacy notice Meta requires) is finalized at ad posting. Every ad persists an `ad_lead_forms`
row.

## Format And Crop Model

Supported ad formats and target ratios:

1. `feed_square`: `1:1`
2. `feed_portrait`: `4:5`
3. `carousel`: `1:1` cards, 2-10 images
4. `story`: `9:16`

The crop model stores `crop_mode` plus 0–1 `crop_x` / `crop_y` / `crop_width` / `crop_height` and
`focal_x` / `focal_y` so the framing UI and the ad-set renderer use the same framing. Rendering cuts
the source media asset to the crop (sharpening/format conversion
via the existing image pipeline) into an output file for this ad's format. Output naming is
deterministic, e.g. `{ad_id}/{variant_format}/{position}.{ext}`.

## HTTP

Routes, `Idempotency-Key`, `base_updated_at` / `409`, and `platform_refs` omit:
[ads HTTP](../api.md). The contractor website never calls these. Ad sets are not
live-website content.

Rewrite and cleanup are the Review directed calls (`rewrite` with required `field` + `prompt`
and optional selection; `cleanup` with required `prompt`). There is no unprompted Review
`regenerate`.

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

1. input is the same approved media items: photos and, later, source video clips
2. output is a rendered video ad set per ad format (`story` 9:16, `feed_square` 1:1, `feed_portrait` 4:5)
3. assembly, not generation: cuts of approved pieces together; the LLM may add transitions or
   short generated segments for a cinematic style
4. review works like images: the assembled video is a reviewable media library copy with
   inherited supplied by and `pending_review` status until approved
5. rendering is a separate pipeline (encoding, timing, copy/subtitle overlay) and stays out of
   the first implementation

## Generation Pipeline

The "Create ad and generate" step is one endpoint that writes reviewable drafts, never approved
status:

1. gather inputs: the owner's selected ad format (exactly one — [ADR 32](ADR.md),
   [ADR 33](ADR.md)), approved media assets (review approved, tenant-owned,
   media caption already written), projects, services, service area, certifications, **top
   reviews** (by id; review citation, not a rewrite; prefer earlier `top_position`), business
   name and details, and the confirmed ideal customer profile. Create one variant row for that
   format. Changing format after generate regenerates this ad; it does not rearrange an
   existing draft. Another format is another ad.
   **Link your Facebook** on Business details is not Connect Meta.
2. draft that format for how it's used (existing structured AI assistant tooling, with
   the deterministic no-key fallback used by projects): feed is one photo and feed-length copy;
   carousel is a card sequence (2–10 images); story is overlay-short copy and a single 9:16
   image.
3. record the call through `ai_generations` tracing: reasoning, user-visible copy
   output, tool calls, usage, and cost, plus the standard inference metadata (model,
   `prompt_id`, `prompt_version`, tenant scope, actor context). See
   [LLM layer](../../../general-architecture/llm-layer.md). Cache hits record the same
   metadata so a call can still be reconstructed.
4. create `draft`/`ad_needs_review` copy variants, proposed image galleries referencing approved
   media assets, and proposed light cleanup edits as derived image variants; never write
   approved status
5. return the draft to Ads so the owner can review, edit, swap images, and adjust crops
   for this ad's format
6. after that first unprompted draft, directed Review rewrites (`rewrite` with required
   owner prompt, one copy field) and promptable cleanup (`POST /v1/media-assets/{id}/image-edits`)
   record the owner prompt in `ai_generations`. Empty prompt is rejected.

Generation results are **cached** per input, ad format, and `prompt_id` / `prompt_version` on
`ai_generations` (tool and skill format revisions on
`ai_generation_tool_revisions`). Retry of the same request while that result is still an Ad
draft or Ad needs review returns the cached generation — that is what safe to retry means.
Ad draft / Ad needs review occupancy does not roll the cache: leave-and-return keeps the
same draft.

**Roll to the next `prompt_version`** (do not reuse that cache entry) when a hit would
duplicate:

1. an ad the owner already accepted (`ad_ready_to_post`) from that cache identity
2. a Published (running) ad with that same identity — including if the agent somehow
   emitted a duplicate of one already running

Image gallery drafts: the pool is `ready` + approved photos
([processing status](../../other/media/README.md#processing-status)). The media caption
is always there once `ready`. The LLM picks from that set of media captions for this ad
(offer, format, ideal customer profile). There is no separate scoring pass on media captions.
Drafts never include non-tenant media assets. A photo the owner **adds to this ad** is
usable once the photo is uploaded (`file_id` set, not `failed`) — target about 10 seconds.
Captioning (`processing` → `ready`) continues in the background; Ads does not wait on it
and does not show **Processing…** as a use-blocker. The owner is never asked to write a
media caption.

## Validation And Approval Rules

An ad can reach `ad_ready_to_post` only when:

1. the tenant owns every referenced media asset
2. every image placement resolves to a tenant-owned media asset whose file is uploaded
   (`file_id` present, not `failed`) with a valid crop for this ad's format. A media caption
   is **not** required for a photo the owner added to this ad. A cleanup copy counts only
   once it has passed review. LLM-picked library photos still come from `ready` + approved.
3. copy satisfies character limits and `cta_label` is in the allowed set
4. sensitive marketing statements (reviews, ratings, guarantees, certifications, insurance, pricing, results)
   that the **unprompted** LLM drafted are flagged for review (`ad_needs_review`). Owner-edited
   or owner-prompted copy is allowed and does **not** block
   `ad_ready_to_post` ([ADR 18](ADR.md)). If it includes a detail, a separate Details
   tool call writes `business_profile_edits`. Character
   limits, uploads still in flight, and failed uploads still block.
5. this ad's format has a complete variant
6. the ad has a suggested ad lead form (suggestions never block approval)

Approval is explicit, audited, and final within Ads: `ad_ready_to_post` means "can be consumed
and handed to an ad platform", not "ad posting done".

## Ad Set Output

The service returns the ad set; that is the deliverable. The zip below is a temporary step for
a person doing ad posting manually, until direct transmission to Meta (future work) replaces it.

Rendering is deterministic and offline:

1. cut each approved source media asset to its crop and produce the image output for this ad's format
2. write a copy sheet (markdown or plain text) with headline, primary text, short label
   (`description`), button label, and notes for this ad's format
3. write the suggested ad lead form fields (title and include flags) as the starting point for the ad
   lead form created on Meta
4. write a mapping of each output image to its source media asset, crop, and this ad's format
5. pack as a zip; the download is a short-lived signed URL, not a public URL

The same approved ad always yields the same ad set and the same rendered images for the same
source media assets. Rendering requires no ad-platform credentials and does no ad posting.

## Frontend Ads Work

Add Ads under `/cms/ads` in the CMS (`frontend-2`):

1. ad list with status badges and last-updated
2. create-an-ad flow (name, offer/goal and service focus pickers pre-filled from the business
   profile, ideal customer profile, ad lead form, format pills before generate, daily budget
   shown but disabled) then generate drafts that one format. Existing-ad detail: duration is
   remaining days in the run window; the end date is a native browser date picker; both stay
   disabled until ad posting
3. one Facebook + Instagram **ad format preview** for the format this ad uses ([ADR 32](ADR.md),
   [ADR 35](ADR.md))
4. the media library, scoped to approved tenant media assets, with framing controls
5. copy fields with live character counts, headline sized to 40 characters, button-label select,
   and a CMS AI orb on headline / primary text / short label (required prompt, overlay)
6. Facebook + Instagram placement for this ad's format, from an existing mock kit, live
   as copy/image change; Meta-like fonts inside the placement; not Meta `generatepreviews`
7. inline validation errors next to the relevant field
8. approve and download actions
9. mobile-safe view of the story variant (9:16) without horizontal overflow

## AI And Voice Behavior

Allowed AI behavior:

1. draft headline / primary text / short label (`description`) from approved business-profile details
2. propose an image gallery by picking from the media captions of ready approved photos
3. apply light cleanup edits to selected images (remove clutter/trash, tidy backgrounds) as
   reviewable copies
4. suggest an ideal customer profile from the business profile and business research,
   asynchronously and reviewable
5. if copy includes a detail, call a Details tool (`business_profile_edits`); do not invent
   reviews, ratings, years, guarantees unprompted
6. rewrite one copy field from a required owner prompt after generate (optional selection;
   omit = whole field)
7. apply promptable light cleanup of the current photo through
   `POST /v1/media-assets/{id}/image-edits`
8. summarize the ad set into an owner-readable explanation

Blocked AI behavior:

1. inventing reviews, ratings, years, guarantees, certifications, insurance, pricing, or results
   on the **unprompted** first generate (owner edit or owner prompt is allowed)
2. selecting unreviewed library photos, non-tenant media assets, or media-caption-free items
   **for the unprompted gallery draft** (the owner may add a just-uploaded photo to this ad
   before its media caption exists)
3. generating new images or making substantive edits — adding/removing objects, changing the
   work shown, concealing damage or defects (heavy editing stays in the media library)
4. writing the ideal customer profile into the copy unprompted (e.g. "ideal for homeowners 40-55")
   — the ideal customer profile steers tone and imagery; an owner prompt may override
5. writing directly into approved variants or reaching `ad_ready_to_post` without explicit
   approval
6. running rewrite or cleanup with an empty prompt
7. auto-creating ad records from onboarding interest alone

Ads are created on demand in Ads. Onboarding and voice do not collect ad
preferences and never create ad records.

## Testing Strategy

Backend tests:

01. ads default to `draft` for new tenants
02. ad records are never created by onboarding or voice flows
03. image placements reject unreviewed library picks, cross-tenant assets, and
    media-caption-free items on the **LLM gallery draft**. An owner-added upload is
    acceptable once the photo is uploaded, without a media caption yet
04. copy validation enforces character limits and the allowed button-label set
05. unprompted sensitive marketing statements set `ad_needs_review`; they do
    not block `ad_ready_to_post` once the owner kept, edited, or prompted them. A profile
    detail writes the business profile via a tool call (`business_profile_edits`)
06. approval requires images and copy on this ad's format
07. the rendered download contains this ad's format only
08. retry of the same generate while the ad is still an Ad draft or Ad needs review returns the
    cached generation; a new generate after `ad_ready_to_post`, or one that would duplicate
    a Published ad, rolls the `prompt_version`
09. tenant isolation for ads, variants, and placements
10. LLM draft calls record `ai_generations` traces with tenant scope and actor context
11. manual edits on other fields are preserved when one field is rewritten; empty rewrite/cleanup
    prompt is rejected; Ctrl+Z restores an LLM rewrite and cleanup Accept
12. an internal caller gets the ad set through the service without the Ads UI, and the ad set
    shape is asserted by a focused service test
13. light cleanup edits produce a new media library item (a copy) that inherits `supplied_by`,
    stays `pending_review`, cannot enter an ad set until reviewed, and never modify the source media asset
14. `platform_refs` and `platform_status` default safely (empty / `not_connected`) and never
    affect approval or the ad set format
15. the ideal customer profile defaults to married couples aged 30-40, and an LLM suggestion is
    recorded, reviewable, and never auto-publishes
16. the ad set always carries suggested ad lead form fields, and they never block approval

Frontend tests:

1. Ads shows list badges (Ad draft / Creative ready / Published / Archived) and
   creation-flow labels (ad draft / ad needs review / ad ready to post) where specified
2. create flow requires an ad lead form and does not offer a website page
3. media picker only offers approved tenant media assets
4. copy fields show live character counts and blocks over-limit approval
5. Facebook and Instagram previews for the selected format render without overflow, including
   mobile story
6. approve and download actions produce the expected ad-set rendering without ad-platform
   credentials
7. AI-orb rewrite keeps other fields' manual edits, requires a prompt, and marks
   `ad_needs_review`; empty prompt does not fire; Ctrl+Z restores the previous copy
8. cleanup edit drafts render as reviewable before/after image changes and can be accepted or
   rejected per image; a different cleanup orb requires a prompt and uses shared media library cleanup;
   Ctrl+Z after Accept restores the previous photo
9. an owner-added photo is usable once the photo is uploaded (Uploading… only; hover a
   circle-and-cross, click to cancel); Ads does not
   block on a media caption or show Processing… as a wait-to-use overlay

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
