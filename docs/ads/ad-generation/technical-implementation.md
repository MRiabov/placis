# CMS Ad Generation Technical Implementation

Status: proposed implementation plan.

Related docs:

1. [CMS ad generation PRD](prd.md)
2. [Website CMS](../../website/README.md)
3. [Architecture and JSON standards](../../architecture.md)
4. [Backend API surface](../../planning/go-backend-rewrite.md)

## Technical Thesis

Ad generation creates ad creative for a tenant. It is not a campaign-operations system: campaign
status, spend, leads, and reporting are future work, not part of ad generation. The first
version must produce a "ready to post" package (images cropped for each platform format, plus
copy) without posting anything itself.

The key rules:

1. **Approved media only**: ad images reference CMS media assets owned by the tenant and approved
   for public use, with per-format crop/focal metadata or derived crop variants. No raw URLs, no
   unreviewed assets, no external hotlinks.
2. **AI proposes, the owner decides**: AI drafts copy, proposes image galleries, and may apply
   light cleanup to images (remove clutter/trash, tidy backgrounds). Everything lands in
   reviewable draft records with provenance. Manual edits always win and are preserved; AI never
   overwrites an approved variant silently.
3. **Empty formats are left out**: a format with no suitable approved images is omitted from the
   package, never rendered as an empty placeholder.
4. **Validation before approval**: destination, images, copy limits, and claims are validated
   before a creative set can reach `ready to post`.
5. **LLM outputs are recorded**: every AI generation call records its reasoning, user-visible
   output, and tool calls through the existing `ai_generations` trace path, with tenant scope and
   actor context.
6. **A service of its own**: ad generation is a separate service with clearly defined inputs and
   a fixed, versioned output format (the package). The `/cms/ads` workspace is one user of it;
   other internal parts of the platform (a future campaign-management feature) and later external
   systems can call the same service. For now it can live inside the main app, but it should be
   written so it can move into its own deployment or open to external callers without changing
   the package format.

## First Implementation Scope

Build the smallest real feature that produces a usable ad package as a service:

1. persisted ad creative set and variant records with `draft` as the default state
2. copy stored as structured fields with platform-aware limits and an allowed button-label set
3. image placements referencing approved CMS media assets with per-format crop metadata
4. destination references to tenant-owned published website pages
5. an AI propose step (copy + image gallery + light cleanup edits) that writes reviewable
   draft records and traces
6. format-accurate previews for square, portrait, carousel, and story
7. validation and approval gates, then the package output with a downloadable rendering for the
   human path
8. an Ads workspace under `/cms/ads` as one user of the service

Do not build: platform posting, campaign objects, budgets, audience targeting, landing page
generation, or AI image generation and substantive editing (beyond light cleanup). Those are
follow-up features documented in the PRD;
the future ads manager is expected to grow on top of this service rather than in the CMS editor.

## Proposed Domain Objects

Add ad domain records under `backend/app/ads/` (or `backend/app/cms/ads/` if it must stay inside
the CMS package for now). Persistence follows the existing CMS pattern: SQLAlchemy tables plus a
typed service layer. The records are the service's per-tenant state, not CMS page content, and
the service's inputs and outputs are clearly defined from the start so other callers can
integrate without the CMS UI.

These are new tables — the ad creative set, its variants, copy, image placements, lead form, and
review trail. They do not duplicate CMS content: media assets, projects, proof, and destination
pages stay where they are, and the ad records reference them by id (for example
`CmsAdImagePlacement.media_asset_id`).

Recommended top-level records:

1. `CmsAdCreativeSet`
2. `CmsAdVariant`
3. `CmsAdCopyVariant`
4. `CmsAdImagePlacement`
5. `CmsAdDestinationRef`
6. `CmsAdLeadForm`
7. `CmsAdReview` (review/approval trail, or reuse the existing CMS review record pattern)

### CmsAdCreativeSet

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `name`
04. `status`: `draft`, `needs_review`, `ready_to_post`, `archived`
05. `offer` (owner-visible goal, e.g. "promote garage conversions")
06. `ad_goal`: `more_calls`, `more_quotes`, `promote_service`
07. `service_focus` (optional reference to a tenant service)
08. `destination`: `CmsAdDestinationRef` (page id or resolved public path)
09. `review_status`
10. `source_refs`
11. `created_by`
12. `updated_by`
13. `created_at`
14. `updated_at`
15. `platform_refs` (flexible JSON: platform object ids such as
    `{"facebook": {"ad_account_id": ..., "campaign_id": ..., "ad_id": ...}}`; empty until a
    platform integration exists)
16. `platform_status`: `not_connected`, `synced`, `needs_sync`, `error`
17. `icp` (typed ideal customer profile: `age_min`, `age_max`, `household` such as
    `married_couples` or `any`, `location_focus`, `notes`, `source` (`default`, `llm_suggested`,
    `owner`), `review_status`; default is married couples aged 30-40; loose by design — steers
    generation now, precise targeting comes with posting)

Flexible JSON is allowed only for AI provenance and platform-specific payload extras such as
`platform_refs`. Status, tenant ownership, offer, goal, destination, and review state are hard
typed.

### CmsAdVariant

One row per format within a creative set.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `creative_set_id`
04. `format`: `feed_square`, `feed_portrait`, `carousel`, `story`
05. `status`: `draft`, `needs_review`, `approved`, `hidden`, `archived`
06. `copy_variant_id`
07. `image_placements` (ordered list of `CmsAdImagePlacement`)
08. `position`
09. `review_status`
10. `created_at`
11. `updated_at`
12. `platform_refs` (flexible JSON: per-format platform ad object ids; empty until a platform
    integration exists)

Format-specific rules: `feed_square` and `feed_portrait` hold exactly one image placement;
`carousel` holds 2-10 square placements in order; `story` holds one or more 9:16 placements
(gallery-style stories).

### CmsAdCopyVariant

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `headline`
04. `primary_text`
05. `description`
06. `cta_label` (from allowed set: `learn_more`, `get_quote`, `call_now`, `message`)
07. `source` (e.g. `ai_proposal`, `owner_edit`, `operator_edit`, `manual`)
08. `ai_generation_ref` (trace id when AI-drafted)
09. `created_at`
10. `updated_at`

Limits live in one constants module shared by the editor UI and backend validation:

1. headline: max 40 characters
2. primary_text: max 5000 characters, recommended max 500 for generated drafts
3. description: max 30 characters (optional)
4. `cta_label` from the allowed enum set

### CmsAdImagePlacement

A reference to a CMS media asset with format-specific framing. No raw URLs.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `variant_id`
04. `media_asset_id` (must resolve to a tenant-owned approved asset)
05. `format`
06. `crop` (typed: `x`, `y`, `width`, `height` normalized, or `full`)
07. `focal_point` (`x`, `y` normalized, inherited from the source asset by default)
08. `position`
09. `alt_text` (inherited from the asset unless overridden here)

Crops are non-destructive. The source asset is never modified; either store crop/focal metadata
on the placement or create a derived crop asset through the existing media derivation pattern so
the renderer can produce the exact pixels.

Light cleanup edits follow the same pattern: AI proposes a cleanup preset (declutter, tidy
background) that produces a derived image variant of the approved source asset. The derived
variant keeps parent-asset provenance and `pending_review` status, and only an approved derived
variant can appear in a package.

### CmsAdLeadForm

Suggested fields for the Meta lead form created at posting time. One set of suggestions per
creative set.

Hard-typed fields:

01. `id`
02. `tenant_id`
03. `creative_set_id`
04. `title` (suggested)
05. `questions` (ordered structured list of a fixed set of standard fields — phone, full
    name, postcode, email — each mapped to a Meta lead form field type; phone is the
    essential default; no custom questions)
06. `created_at`
07. `updated_at`

These are suggestions only. They never block approval, and the real form (including the privacy
notice Meta requires) is finalized when posting.

## Format And Crop Model

Supported formats and target ratios:

1. `feed_square`: `1:1`
2. `feed_portrait`: `4:5`
3. `carousel`: `1:1` cards, 2-10 images
4. `story`: `9:16`

The crop model stores normalized crop and focal point so previews and the package renderer use
the same framing. Rendering cuts the source asset to the crop (sharpening/format conversion via
the existing image pipeline) into a per-format output file. Output naming is deterministic, e.g.
`{creative_set_slug}/{variant_format}/{position}.{ext}`.

## Backend API Surface

Ad generation is a service of its own, exposed to the platform over HTTP. The routes below are
what the Ads workspace uses; the same service code is what internal callers use, and what a
future public API would expose. All routes use `/api/v1` and stable `operation_id` values.

Service-level rules:

1. inputs are per tenant and clearly defined: profile facts, approved media asset ids, service
   focus, ad goal, ideal customer profile, and destination page id
2. the output is the package (creative set, variants, copy, image placements, lead form,
   destination, icp) with a version number and the stable creative set/variant ids in the
   response, so a platform integration can map its own objects back to the ad
3. generation is safe to retry: running the same request twice gives the same result
4. for now only internal callers (the platform's own session/actor context) can use it; external
   API keys are future work and must not change the package format

Recommended private editor routes (the CMS client):

1. `GET /api/v1/website/editor/ads`
2. `POST /api/v1/website/editor/ads`
3. `GET /api/v1/website/editor/ads/{creative_set_id}`
4. `PATCH /api/v1/website/editor/ads/{creative_set_id}`
5. `DELETE /api/v1/website/editor/ads/{creative_set_id}` for draft-only removal
6. `GET /api/v1/website/editor/ads/{creative_set_id}/variants`
7. `PATCH /api/v1/website/editor/ads/{creative_set_id}/variants/{variant_id}`
8. `POST /api/v1/website/editor/ads/{creative_set_id}/variants/{variant_id}/regenerate` (AI
   propose for copy and/or image gallery on one variant)
9. `POST /api/v1/website/editor/ads/{creative_set_id}/approve`
10. `POST /api/v1/website/editor/ads/{creative_set_id}/package` (returns the package)
11. `POST /api/v1/website/editor/ads/{creative_set_id}/download` (renders and returns a signed
    package download for the human path)

Mutating routes that can be retried accept `Idempotency-Key`. Approve/package/download/archive
mutations audit. Public runtime never calls these routes; ad packages are not public site content.

## Future Users Of The Service

Expected later consumers, without changing the package format:

1. campaign management inside the CMS reading approved packages for campaign creation
2. a platform posting service (Facebook/Google) uploading package images and copy
3. external API clients integrating Placis ad generation into their own tooling

Ads-manager capabilities (budgets, bidding, targeting, scheduling, A/B testing, retargeting,
reporting) are out of scope for the first implementation but are expected later, built on top of
this service rather than inside the CMS editor.

## Ready For Platform Integration

Connecting a platform (like a Facebook Ads Manager) later should be additive, not a
restructure. The model is ready for it from the start:

1. every creative set and variant has a stable id and a `platform_refs` map for platform object
   ids (ad account, campaign, ad), plus a `platform_status` on the creative set
2. a future integration writes platform object ids and syncs status; it does not change the
   creative model or the package format
3. performance metrics (impressions, clicks, spend, results) attach to the stable creative
   set/variant ids, so they can be shown next to each approved ad without changing the creative
   records
4. the package already carries suggested lead form fields and the confirmed ICP, so posting
   creates the final form and targets by age range, household, and location without extra data
   entry

Once posting exists, the zip download is no longer needed: the platform integration reads the
package directly.

Internal ad logic outside Meta (custom rules deciding when or how an ad runs) is future work
and out of scope for now; the ICP and package are shaped so that logic can attach later.

## Future Work: Video Ads

Video ads are deferred future work, noted here so the image package does not block them later.
Making good videos is a real challenge for contractors, so this is likely worth building after
the first implementation.

1. input is the same approved media: photos and, later, source video clips
2. output is a rendered video package per format (story/reel 9:16, feed 1:1, 4:5)
3. assembly, not generation: templates cut approved pieces together; AI may add transitions or
   short generated segments for a cinematic style
4. review works like images: the assembled video is a reviewable derived artifact with
   provenance and `pending_review` status until approved
5. rendering is a separate pipeline (encoding, timing, copy/subtitle overlay) and stays out of
   the first implementation

## Generation Pipeline

The "generate ad ideas" step is one endpoint that writes reviewable drafts, never approved state:

1. gather inputs: approved media assets (review state approved, tenant-owned, alt text present),
   portfolio projects, services, service area, proof, business name and details, the confirmed
   ICP, and the destination page's public copy
2. call the existing structured AI assistant tooling (provider-backed with the deterministic
   no-key fallback used by careers/posts) with a clearly defined ad-copy response schema
3. record the call through `ai_generations` tracing: reasoning, user-visible copy output, tool
   calls, provider usage, and cost, with tenant scope and actor context
4. create `draft`/`needs_review` copy variants, proposed image galleries referencing approved
   media assets, and proposed light cleanup edits as derived image variants; never write
   approved state
5. return the proposal to the editor so the owner can review, edit, swap images, and adjust crops
   per format

Image gallery proposals use deterministic scoring first (project/service relevance, review
state, alt text presence, aspect suitability) with model assistance for ranking where useful.
Proposals never include unreviewed, non-tenant, or alt-text-free assets.

## Validation And Approval Rules

A creative set can reach `ready_to_post` only when:

1. the tenant owns every referenced media asset and destination page
2. every image placement resolves to an approved tenant-owned asset with alt text and a valid
   crop for its format; a cleanup-edited derived variant counts only once it has passed review
3. the destination, if set, is a tenant-owned published (or scheduled-to-publish) page; drafts
   or hidden pages are invalid destinations
4. copy satisfies character limits and `cta_label` is in the allowed set
5. sensitive claims (reviews, ratings, guarantees, certifications, insurance, pricing, results,
   before/after outcomes) are source-backed or explicitly owner/operator approved; for
   before/after, source-backed means a real image pair from the same project. Anything AI-drafted
   resembling such a claim sets `needs_review`
6. at least one format has a complete variant; empty formats are left out of the package

Approval is explicit, audited, and final within the CMS: `ready_to_post` means "can be consumed
and handed to an ad platform", not "posted".

## Creative Package Output

The service returns the package; that is the deliverable. The zip below is a temporary step for
a person posting manually, until direct transmission to Meta (future work) replaces it.

Rendering is deterministic and offline:

1. cut each approved source asset to its crop and produce the per-format image output
2. write a copy sheet (markdown or plain text) with headline, primary text, description, button
   label, destination URL, and per-format notes
3. write the suggested lead form fields (title, questions) as the starting point for the form
   created on Meta
4. write a manifest mapping each output image to its source asset, crop, and format
5. package as a zip; the download is a signed short-lived read artifact, not a public URL

The same approved ad always yields the same package and the same rendered bytes for the same
source assets. Rendering requires no platform credentials and posts nothing.

## Frontend CMS Work

Add an Ads workspace under `/cms/ads` in the private Vite app:

1. ad list with status badges and last-updated
2. publish-an-ad flow (name, offer/goal and service focus pickers pre-filled from the profile,
   ICP, Meta lead form by default, optional destination page, budget/schedule shown but
   disabled) then generation
3. variant tabs for square, portrait, carousel, and story
4. the existing CMS media gallery, scoped to approved tenant assets, with framing controls
5. copy editor with live character counts and button-label select
6. format-accurate previews rendered from the backend response — one card per variant returned;
   only formats with approved images appear, empty formats are omitted (never rendered as
   placeholders); rendered from the same projection the package renderer uses
7. inline validation errors next to the relevant field
8. approve and download actions
9. mobile-safe preview of the story variant (9:16) without horizontal overflow

The destination picker lists tenant pages that are published or scheduled, defaulting to the
contact/quote page or the matching service page.

## AI And Voice Behavior

Allowed AI behavior:

1. draft headline/primary text/description from approved business facts and destination copy
2. propose an image gallery from approved media with relevance/quality ranking
3. apply light cleanup edits to selected images (remove clutter/trash, tidy backgrounds) as
   reviewable derived variants
4. suggest an ideal customer profile from the business profile and research, asynchronously and
   reviewable
5. flag sensitive claims in generated copy for review
6. summarize the ad package into an owner-readable explanation

Blocked AI behavior:

1. inventing reviews, ratings, years, guarantees, certifications, insurance, pricing, or results
   — including before/after results without a real before/after image pair
2. selecting unreviewed, non-tenant, or alt-text-free assets
3. generating new images or making substantive edits — adding/removing objects, changing the
   work shown, concealing damage or defects (heavy editing stays in the media library)
4. writing the ICP into the copy (e.g. "ideal for homeowners 40-55") — the ICP steers tone and
   imagery, never the text
5. writing directly into approved variants or reaching `ready_to_post` without explicit approval
6. auto-creating ad records from onboarding interest alone

Ads are created on demand in the CMS Ads workspace. Onboarding and voice do not collect ad
preferences and never create ad records.

## Testing Strategy

Backend tests:

01. ad creative sets default to `draft` for new tenants
02. ad records are never created by onboarding or voice flows
03. image placements reject unreviewed, cross-tenant, and alt-text-free assets
04. destination validation rejects draft, hidden, and cross-tenant pages
05. copy validation enforces character limits and the allowed button-label set
06. sensitive AI-drafted claims set `needs_review` and block `ready_to_post`
07. approval requires a valid destination, images, and copy on at least one format
08. empty formats are left out of the package and the rendered download
09. the package is stable across repeated generation calls (safe to retry)
10. tenant isolation for creative sets, variants, placements, and destinations
11. AI proposal calls record `ai_generations` traces with tenant scope and actor context
12. manual edits are preserved when a variant is regenerated
13. an internal caller gets the package through the service without the CMS UI, and the package
    shape is asserted by a focused service test
14. light cleanup edits produce non-destructive derived variants with provenance and
    `pending_review`, cannot enter a package until reviewed, and never modify the source asset
15. `platform_refs` and `platform_status` default safely (empty / `not_connected`) and never
    affect approval or the package format
16. the ICP defaults to married couples aged 30-40, and an LLM suggestion is recorded,
    reviewable, and never auto-publishes
17. the package always carries suggested lead form fields, and they never block approval

Frontend tests:

1. Ads workspace shows draft/needs-review/ready-to-post states
2. create flow requires a destination before approval
3. media picker only offers approved tenant assets
4. copy editor shows live character counts and blocks over-limit approval
5. square, portrait, carousel, and story previews render without overflow, including mobile story
6. approve and download actions produce the expected package rendering without platform
   credentials
7. regeneration keeps manual edits and marks the result `needs_review`
8. cleanup edit proposals render as reviewable before/after image changes and can be accepted or
   rejected per image

Contract checks:

1. run `rtk just openapi-export` after API schema changes
2. run `rtk just frontend-typegen`
3. run `rtk just api-contract-check`

Relevant broader checks:

1. `rtk just backend-typecheck`
2. targeted backend tests for the ads service/routes
3. `rtk pnpm --dir frontend check`
4. one E2E test: create → generate → review/edit → approve → use the package (via the service
   and the human download), with external/paid integrations mocked but core domain logic unmocked
