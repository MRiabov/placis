# Ads — Architecture

How an ad is created, drafted, approved, and exported as an ad set.
Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

## Named identifiers

Pipeline **Do** functions (same spelling in spec, Go, and tests):

- `CreateAd` — `internal/ads/`
  ([01](ad-generation/pipeline/01-create-ad.md))
- `GenerateAdDraft` — River job `ads_generate`
  ([02](ad-generation/pipeline/02-generate-ad-draft.md))
- `ApproveAd` — `internal/ads/`
  ([03](ad-generation/pipeline/03-approve-ad.md))
- `ExportAdSet` — `internal/ads/`
  ([04](ad-generation/pipeline/04-export-ad-set.md))

CMS HTTP: one function per Routes verb+noun (`ListAds`, `GetAd`,
`UpdateAd`, `DeleteAd`, `ArchiveAd`, `UnarchiveAd`, `ListAdVariants`,
`UpdateAdVariant`, `RewriteAdCopy`, `GetAdSet`, …). Tables:
[persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).
Prompts: `internal/ads/prompts.yaml` (`prompt_id=ads_generate` /
`ads_inline_assistance`, same spelling as `thread_kind`).

CMS assistant on Ads is `cleanup_image` only. Generate / Revise /
rewrite stay Ads UI
([assistant architecture](../assistant/architecture.md)).

## The content model

An **ad** is one offer in one ad format. Records reference the business
profile, media library, and projects by id — they do not copy them.

- **ad** — `ads`: name, offer, goal, service focus, ideal customer
  profile, `status`, `platform_status`. `platform_refs` stays empty
  until ad posting.
- **ad variant** — `ad_variants`: one row per ad; `format` is chosen
  before generate. 01 writes a stub; 02 fills copy and placements.
- **ad copy variant** — `ad_copy_variants`: headline, primary text,
  short label (`description`), button label.
- **ad image placements** — `ad_image_placements`: approved media
  assets with crop/focal for this ad's format.
- **ad lead form** — `ad_lead_forms`: suggested title and include
  flags. Every ad has one. Ads do not send people to a website page.
- **ad reviews** — `ad_reviews`: approve / archive trail.

`updated_at` on `ads` is the conflict token for the whole ad set
([ADR 31](ad-generation/ADR.md)).

## Create, draft, approve, export

1. **Create ad** — About the ad (offer, goal, service focus, ideal
   customer profile, ad lead form include flags, exactly one format).
   `CreateAd` persists `ads` + `ad_lead_forms` + stub `ad_variants`.
   Save on click-off. Does not call an LLM
   ([01](ad-generation/pipeline/01-create-ad.md)).
2. **Generate ad draft** — **Create ad and generate** enqueues
   `ads_generate`. The LLM drafts copy and an image gallery from ready
   approved media captions, with light cleanup as reviewable copies.
   Never `ad_ready_to_post`
   ([02](ad-generation/pipeline/02-generate-ad-draft.md)).
3. **Review** — owner PATCH / rewrite / media library cleanup. Routes,
   not a pipeline step. Rewrite is `RewriteAdCopy` (`headline` /
   `primary_text` only). Cleanup is
   `POST /v1/media-assets/{id}/image-edits`.
4. **Approve ad** — `ApproveAd` is the checkpoint
   (`ad_ready_to_post`). Not ad posting
   ([03](ad-generation/pipeline/03-approve-ad.md)).
5. **Export ad set** — `ExportAdSet` returns `AdSetRead` and, for the
   human path, a signed URL for the zip
   ([04](ad-generation/pipeline/04-export-ad-set.md)).

## Where things stand

- create flow: `draft` → `ad_needs_review` → `ad_ready_to_post` →
  `archived`
- existing-ad badges: Draft / Creative ready / Published / Archived
  ("Creative ready" = the ad is done; "Published" once ad posting
  exists)
