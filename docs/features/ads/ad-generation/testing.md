# Ads — E2E test

One full-stack E2E test: create → generate → approve → download. Drives
`frontend-2` (Playwright) against the real API + real Postgres; the LLM is
faked. DB asserts name the tables from
[persistence.md](../persistence.md).

1. **Create** — the owner clicks "create an ad".
   - UI: routed to `/cms/ads/new`.

2. **Enter details** — offer, goal, service focus, ideal customer profile, ad
   lead form, and exactly one ad format (before generate).
   - DB: `ads` written (status=`draft`, `ad_goal`, `icp_age_min` / `icp_age_max`
     / `icp_household` / `icp_location_focus` / `icp_notes` / `icp_source` /
     `icp_review_status`, `origin`, `platform_status=not_connected`,
     `platform_refs` empty), `ad_lead_forms` (title, include_marketing_phone /
     include_full_name / include_postcode / include_email).

3. **Generate** — **Create ad and generate** queues the background job (faked
   LLM); the UI shows a progressive "drafting…" step and lets the owner leave
   and return.
   - DB: `ai_generations` on an `ads_generate` thread (reasoning + output +
     tool calls + usage + `prompt_id` / `prompt_version`),
     `ad_copy_variants` (source=`ai_proposal`),
     `ad_variants` (format, status=`ad_needs_review`), `ad_image_placements`
     (`media_asset_id`, crop_mode / crop_x / crop_y / crop_width / crop_height,
     focal_x / focal_y, media_caption), `ad_lead_forms` (title, include flags).
   - Retry of generate while still Ad needs review hits the cache (same
     `prompt_version`). After approve (`ad_ready_to_post`), a new generate with
     the same inputs rolls the `prompt_version` so it is not a duplicate. Same
     roll if the result would duplicate a Published ad.
   - UI: the ad returns for review — never `ad_ready_to_post` without approval.
   - Review **inline AI assistance**: owner prompts a copy-field rewrite (prompt
     required); **select to edit inline AI assistance** rewrites a span; no
     selection is the whole field; `ai_generations` records the owner prompt +
     reasoning + output + tool calls (`thread_kind=ads_inline_assistance`).
     Empty prompt does not fire. Ctrl+Z restores the previous copy.
     `update_details` writes the business profile when copy includes a detail,
     plus a notification (OK / Revert). Approve is not blocked.

4. **Approve** — the owner reviews, edits copy, approves.
   - DB: `ad_copy_variants.source=owner_edit`, `ad_variants.status=approved`,
     `ads.status=ad_ready_to_post` — only after every placement has an uploaded
     photo (not `uploading`, not `failed`). A media caption is not required for
     a photo the owner added in Review.

5. **Download** — the owner downloads the ad set.
   - Assert: the download **verbatim matches every field** — headline, primary
     text, short label (`description`), CTA label, image crops for this ad's
     format, ad lead form fields, and the note of source media library item —
     and is deterministic (same input → same images).
