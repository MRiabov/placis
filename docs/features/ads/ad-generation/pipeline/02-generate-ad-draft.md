# 02 — Generate ad draft

Async River job after 01. Drafts copy and an image gallery. Never
`ad_ready_to_post`. Distinct from Review rewrite
(`RewriteAdCopy` on Routes).

## Trigger

`POST /v1/ads/{ad_id}/generate` (**Create ad and generate** /
**Generate again**). One River job `ads_generate`. Unique key:
`(tenant_id, ad_id)` while pending/running. A second enqueue is **409**
from River unique-insert (do not HTTP-check before insert).

## Pre

- 01 stub exists: `ads.status=draft` or `ad_needs_review`;
  `ad_variants.format` set; `ad_lead_forms` include flags set.
- Pool for the LLM gallery: `media_assets` `ready` + `approved`,
  tenant-owned, media caption written.
- Carousel needs 2–10 ready photos; one-image formats need one. Empty
  format does not succeed ([Open questions](../../README.md#open-questions)).

## Must not

- Write `ads.status=ad_ready_to_post` or `ad_variants.status=approved`.
- Insert a second `ad_variants` row. Fill the 01 stub.
- Select unreviewed library photos, non-tenant media library items, or
  media-caption-free items **for the unprompted gallery**.
- `POST /v1/ads/…/cleanup`. Light cleanup is
  `POST /v1/media-assets/{id}/image-edits` (child `media_assets`,
  `pending_review`).
- Empty rewrite prompt (rewrite is not this job).
- Invent reviews, ratings, years, guarantees, certifications,
  insurance, pricing, or results on the **unprompted** draft.
- Write the ideal customer profile into the copy unprompted.
- Ad posting. Campaign objects.

## Do

`GenerateAdDraft` writes reviewable drafts on the 01 stub. River job
remains `ads_generate`. `prompt_id=ads_generate`.

1. Load About the ad + ready approved media captions + projects +
   services + **top reviews** (by id; review citation) + live details.
2. Draft that format: feed is one photo and feed-length copy; carousel
   is 2–10 cards; story is overlay-short copy and one 9:16 image.
3. Record `ai.threads` `thread_kind=ads_generate` (insert before the
   first generate; schema-repair retries reuse it) and `ai_generations`
   (reasoning, output, tool calls, usage, `prompt_id` /
   `prompt_version`). Cache hits record the same metadata.
4. Persist `ad_copy_variants` (`source=ai_proposal`), placements on the
   stub variant, suggested `ad_lead_forms.title`. Set
   `ads.status=ad_needs_review` and `ad_variants.status=ad_needs_review`.
5. If copy includes a detail, **call** `update_details` (shared Details
   tool). Approve is not blocked.
6. Cache per input, format, and `prompt_id` / `prompt_version`. Retry
   while Ad draft / Ad needs review returns that cache. After
   `ad_ready_to_post`, or if the result would duplicate a Published ad,
   roll `prompt_version`.

## Reads

`ads`, `ad_variants`, `ad_lead_forms`, `media_assets` (ready +
approved), details / projects / top reviews.

## Calls

`update_details` when copy includes a detail. Media library cleanup HTTP
for proposed light cleanup copies. **Calls** `RecordAIUseSpend`
(`usage_category=text`).

## Persist

`ad_copy_variants`, `ad_image_placements`, the existing `ad_variants`
row, `ads.status=ad_needs_review`, `ad_lead_forms.title`, `ai.threads` /
`ai_generations`; `ai_use_ledger_entries` `entry_kind=spend`. Optional child
`media_assets` for cleanup (`pending_review`, `parent_media_asset_id` set).
Schema `jobs`: `ads_generate` completed (or still running until Persist).

## Fail

Empty format / not enough ready photos → generate does not succeed; 01
rows kept; no `ad_ready_to_post`. LLM failure keeps the stub; retry
hits cache or a new generate.

## Out

Owner Review on Routes, then [03 approve ad](03-approve-ad.md).

## Invariants

- Never `ad_ready_to_post` without `ApproveAd`.
- One variant row per ad. Generate again after Revise updates that
  row.
- Cache identity includes `prompt_id` / `prompt_version`.
