# Ads — E2E test

One full-stack E2E test: create → generate → review rewrite → approve →
download. Drives `frontend-2` (Playwright) against the real API + real
Postgres; the LLM is faked. DB asserts name the tables from
[persistence.md](../persistence.md). Pipeline 01–04 asserts are
[pipeline/testing](pipeline/testing/README.md); this journey does not
re-assert 01 Persist beyond the handoff the UI needs.

1. **Create** — the owner clicks "create an ad".
   - UI: routed to `/cms/ads/new`.

2. **Enter details** — offer, goal, service focus, ideal customer
   profile, ad lead form include flags, and exactly one ad format
   (before generate). Request `AdCreate`; Response `AdRead`.
   - DB: **persists into** `ads` (`status=draft`, `ad_goal`,
     `icp_age_min` / `icp_age_max` / `icp_household` /
     `icp_location_focus` / `icp_notes` / `icp_source` /
     `icp_review_status`, `origin`, `platform_status=not_connected`,
     `platform_refs` empty), `ad_lead_forms` (include flags; `title`
     empty), stub `ad_variants` (`format`, `status=draft`).

3. **Generate** — **Create ad and generate** (`POST
   /v1/ads/{ad_id}/generate`) queues `ads_generate` (faked LLM); the UI
   shows "drafting…" and lets the owner leave and return.
   - DB: **persists into** `ai_generations` on an `ads_generate`
     thread (reasoning + output + tool calls + usage + `prompt_id` /
     `prompt_version`), `ad_copy_variants` (`source=ai_proposal`),
     `ad_variants` (same row; `status=ad_needs_review`),
     `ad_image_placements` (`media_asset_id`, crop / focal,
     `media_caption`), `ad_lead_forms.title`.
   - Retry of generate while still Ad needs review hits the cache
     (same `prompt_version`). After approve (`ad_ready_to_post`), a
     new generate with the same inputs rolls the `prompt_version`.
     Same roll if the result would duplicate a Published ad.
   - UI: the ad returns for review — never `ad_ready_to_post` without
     approval.
   - Review **inline AI assistance**: Request `AdRewriteRequest`
     (`field` + `prompt`; **select to edit inline AI assistance**
     rewrites a span; no selection is the whole field).
     `ai_generations` records the owner prompt + reasoning + output +
     tool calls (`thread_kind=ads_inline_assistance`). Empty prompt
     does not fire. Ctrl+Z restores the previous copy.
     `update_details` writes the business profile when copy includes
     a detail, plus a notification (OK / Revert). Approve is not
     blocked.

4. **Approve** — the owner reviews, edits copy, approves. Request
   `AdGenerateRequest`; `ApproveAd`.
   - DB: **persists into** `ad_copy_variants.source=owner_edit` when
     they typed, `ad_variants.status=approved`,
     `ads.status=ad_ready_to_post`, `ad_reviews` (transition to
     `ad_ready_to_post`). Only after every placement has an uploaded
     photo (not `uploading`, not `failed`). A media caption is not
     required for a photo the owner added in Review.

5. **Download** — the owner downloads the ad set. Request
   `AdGenerateRequest`; `ExportAdSet`; Response `AdDownloadRead`.
   - Assert: `AdSetRead` **verbatim matches every field** — headline,
     primary text, short label (`description`), CTA label, image
     crops for this ad's format, ad lead form fields, and the note of
     source media library item — and is deterministic (same input →
     same images). `url` is a signed URL. Ad tables unchanged.
