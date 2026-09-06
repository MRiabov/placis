# Ads HTTP

Conventions: [HTTP conventions](../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Ad generation service routes. Spec authority:
[ad-generation](ad-generation/ADR.md). Contractor website never calls
these.

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key` and `base_updated_at` (last-seen `ads.updated_at`).
Match → bump and return the new `updated_at`. Mismatch → `409`;
`frontend-3` re-GETs. No undo.

Serve-only jsonb (not a DTO field dump): `platform_refs` is **omit**
from first-slice DTOs. After ad posting, named fields (`meta_ad_id`,
…), not a string map. LLM traces **omit**. Download signed URL is a
`string`. Copy fields use platform character limits as Go `maxLength`
later; not in the DTO table.

Photo cleanup is media library HTTP
(`POST /v1/media-assets/{id}/image-edits`), then PATCH the placement.
Approve / archive / unarchive write `ad_reviews`. Download writes
`files` (zip). External API keys are future work and must not change
the ad set format.

`CreateAd` / `GenerateAdDraft` / `ApproveAd` / `ExportAdSet`:
[pipeline](ad-generation/pipeline/README.md).

## DTOs

### Ad

| DTO | Fields | Description |
| --- | --- | --- |
| `AdListGet` | `archived` | Query; list vs Archive |
| `AdRead` | `id`, `name`, `status`, `offer`, `ad_goal`, `service_focus_id`, `icp_age_min`, `icp_age_max`, `icp_household`, `icp_location_focus`, `icp_notes`, `icp_source`, `icp_review_status`, `origin`, `platform_status`, `updated_at`, `created_at`, `variant: AdVariantRead`, `lead_form: AdLeadFormRead`, `copy: AdCopyVariantRead` | Hydrate; omit `platform_refs` |
| `AdCreate` | `name`, `offer`, `ad_goal`, `service_focus_id`, `icp_location_focus`, `format`, `include_marketing_phone`, `include_full_name`, `include_postcode`, `include_email` | About the ad; no lead-form `title`; ideal customer profile is server-set `icp_source=static` (not on the body) |
| `AdUpdate` | `base_updated_at`, `name`, `offer`, `ad_goal`, `service_focus_id`, `icp_location_focus`, `format`, `include_marketing_phone`, `include_full_name`, `include_postcode`, `include_email`, `title` | Click-off; `title` is Review; no ideal customer profile fields |
| `AdLeadFormRead` | `title`, `include_marketing_phone`, `include_full_name`, `include_postcode`, `include_email` | Nested on `AdRead.lead_form` |
| `AdGenerateRequest` | `base_updated_at` | Create ad and generate / Generate again |

Extra keys 4xx. List returns `AdRead[]`.

### Review

| DTO | Fields | Description |
| --- | --- | --- |
| `AdVariantRead` | `id`, `format`, `status`, `placements: []AdImagePlacementRead` | Nested on `AdRead.variant` |
| `AdVariantUpdate` | `base_updated_at`, `placements: []AdImagePlacementRead` | Crop / swap / order |
| `AdCopyVariantRead` | `headline`, `primary_text`, `description`, `cta_label`, `source` | Nested on `AdRead.copy` |
| `AdImagePlacementRead` | `id`, `media_asset_id`, `format`, `crop_mode`, `crop_x`, `crop_y`, `crop_width`, `crop_height`, `focal_x`, `focal_y`, `position`, `media_caption` | One placement |
| `AdRewriteRequest` | `base_updated_at`, `field`, `prompt`, `selection_start`, `selection_end` | `field` is `headline` / `primary_text`; omit selection = whole field |

### Ad set

| DTO | Fields | Description |
| --- | --- | --- |
| `AdSetRead` | `format_number`, `format`, `headline`, `primary_text`, `description`, `cta_label`, `placements: []AdImagePlacementRead`, `lead_form: AdLeadFormRead` | Machine-readable ad set |
| `AdDownloadRead` | `url` | signed URL for the zip |

## Routes

### Ad

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/ads` | CMS list; Archive | `AdListGet` | `AdRead` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms` | | `archived=false` omits `status=archived`; `true` is Archive only | | Campaign metrics |
| `POST /v1/ads` | About the ad create | `AdCreate` | `AdRead` | | `ads`, `ad_lead_forms`, `ad_variants` | **calls** `CreateAd`; stub variant `format`; lead-form include flags; `status=draft` | | Enqueue generate; write copy |
| `GET /v1/ads/{ad_id}` | workspace hydrate; detail | | `AdRead` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms` | | | `404` | Return `platform_refs` |
| `PATCH /v1/ads/{ad_id}` | click-off; Revise | `AdUpdate` | `AdRead` | `ads`, `ad_variants`, `ad_lead_forms` | `ads`, `ad_variants`, `ad_lead_forms` | Save on click-off of the ad draft; format change after generate waits for generate again | `409` | Write a Published ad; enqueue generate |
| `DELETE /v1/ads/{ad_id}` | discard draft | `AdGenerateRequest` | | `ads` | `ads` (delete) | Ad draft only | `409` if not `draft` | Archive |

### PATCH /v1/ads/{ad_id}

Save on click-off of the ad draft. Does not write a Published ad. After
the first generate, About the ad is locked until **Revise**; then
**Generate again** is `POST …/generate`. `title` on this body is the
suggested ad lead form title (Review copy, [ADR 38](ad-generation/ADR.md)).

### Review

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/ads/{ad_id}/variants` | workspace | | `AdVariantRead` | `ad_variants`, `ad_image_placements` | | One row | `404` | Multi-format list |
| `PATCH /v1/ads/{ad_id}/variants/{variant_id}` | Review crop / swap | `AdVariantUpdate` | `AdVariantRead` | `ad_variants`, `ad_image_placements` | `ad_image_placements`, `ads.updated_at` | After media library cleanup, retarget `media_asset_id` | `409` | `POST …/cleanup` |
| `POST /v1/ads/{ad_id}/variants/{variant_id}/rewrite` | Review inline AI assistance | `AdRewriteRequest` | `AdCopyVariantRead` | `ad_copy_variants` | `ad_copy_variants`, `ai_generations`, `ads.updated_at`, `ai_use_ledger_entries` | **calls** `RewriteAdCopy`; `bill_usage=billed` (`usage_category=text`); `thread_kind=ads_inline_assistance`; omit selection = whole field | `400` empty prompt; `409`; `402 usage_credit_exhausted` | Rewrite `cta_label` / short label; `/regenerate` |
| `POST /v1/ads/{ad_id}/generate` | Create ad and generate; Generate again | `AdGenerateRequest` | `AdRead` | `ads`, `ad_variants` | `jobs` (`ads_generate`) | **calls** `GenerateAdDraft`; remaining 0 → **402** before enqueue; `bill_usage=billed` on the job generate; 409 while that job is pending/running | `409`; empty format; `402 usage_credit_exhausted` | Write `ad_ready_to_post` |

### POST /v1/ads/{ad_id}/generate

Enqueues River job `ads_generate`. Retry while Ad draft / Ad needs
review returns the cached generation. After `ad_ready_to_post`, or if
the result would duplicate a Published ad, roll `prompt_version`.
`GenerateAdDraft` uses `bill_usage=billed` (`usage_category=text`). See
[02](ad-generation/pipeline/02-generate-ad-draft.md).

### Ad set

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/ads/{ad_id}/approve` | Approve | `AdGenerateRequest` | `AdRead` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms` | `ads`, `ad_variants`, `ad_reviews` | **calls** `ApproveAd` | `400` blockers; `409` | Ad posting |
| `POST /v1/ads/{ad_id}/ad-set` | service caller; CMS | `AdGenerateRequest` | `AdSetRead` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms` | | **calls** `ExportAdSet`; no zip | `409` if not `ad_ready_to_post` | Ad posting; write ad tables |
| `POST /v1/ads/{ad_id}/download` | Download | `AdGenerateRequest` | `AdDownloadRead` | `ads`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms` | `files` | **calls** `ExportAdSet`; signed URL | `409` if not `ad_ready_to_post` | Public URL; ad posting |

Worker auth does not apply. Not on the contractor website.

### POST /v1/ads/{ad_id}/approve

Blockers: character limits, uploads still in flight, failed uploads. A
media caption is not a blocker for a photo the owner added to this ad.
Sensitive unprompted copy does not block once the owner kept, edited, or
prompted it. See [03](ad-generation/pipeline/03-approve-ad.md).

### Archive

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/ads/{ad_id}/archive` | Archive on detail | `AdGenerateRequest` | `AdRead` | `ads` | `ads`, `ad_reviews` | `status=archived`; leaves the list | `409` | Hard delete |
| `POST /v1/ads/{ad_id}/unarchive` | Archive list Undo | `AdGenerateRequest` | `AdRead` | `ads`, `ad_variants` | `ads`, `ad_reviews` | `draft` when no approved variant, else `ad_ready_to_post` | `409` | |

### POST /v1/ads/{ad_id}/archive

[ADR 39](ad-generation/ADR.md). Toast Undo is unarchive.

## Do not create

- campaign console / budgets / targeting / scheduling HTTP
- ad posting HTTP
- undo/redo
- `package` path (the deliverable is an **ad set**)
- `platform_refs` as a string map on first-slice DTOs
- `POST /v1/ads/{ad_id}/variants/{variant_id}/cleanup` (use
  `POST /v1/media-assets/{id}/image-edits`, then PATCH the placement)
- `POST /v1/ads/…/reject` or `/accept` for a photo (use
  `POST /v1/media-assets/{id}/reject`)
- unprompted `POST /v1/ads/{ad_id}/regenerate` (use rewrite)
- `GET /v1/ads/audiences` / `POST /v1/ads/audiences` (audience picker
  deferred; [ADR 40](ad-generation/ADR.md))
- `GET /v1/offers`
- `GET /v1/locations`
