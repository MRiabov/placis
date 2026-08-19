# Ads — E2E test

One full-stack E2E test: create → generate → approve → download. Drives `frontend-2` (Playwright)
against the real API + real Postgres; the LLM is faked. DB asserts name the tables from
[data-model.md](../data-model.md).

1. **Create** — the owner clicks "create an ad".
   - UI: routed to `/cms/ads/new`.

2. **Enter details** — offer, goal, service focus, ideal customer profile, ad lead form.
   - DB: `ads` written (status=`draft`, `ad_goal`, `ideal_customer_profile` jsonb,
     `platform_status=not_connected`, `platform_refs` empty), `ad_lead_forms` (title, questions).

3. **Generate** — "Generate ad ideas" queues the background job (faked LLM); the UI shows a
   progressive "drafting…" step and lets the owner leave and return.
   - DB: `ai_generations` (reasoning + output + tool calls + usage), `ad_copy_variants`
     (source=`ai_proposal`), `ad_variants` (format, status=`ad_needs_review`), `ad_image_placements`
     (`media_asset_id`, crop, focal_point, media_caption), `ad_lead_forms` (title, questions).
   - UI: the ad returns for review — never `ad_ready_to_post` without approval.

4. **Approve** — the owner reviews, edits copy, approves.
   - DB: `ad_copy_variants.source=owner_edit`, `ad_variants.status=approved`,
     `ads.status=ad_ready_to_post` — only after every placement resolves to approved media items
     with a media caption.

5. **Download** — the owner downloads the ad set.
   - Assert: the download **verbatim matches every field** — headline, primary text, description,
     CTA label, per-ad-format image crops, ad lead form fields, and the note of
     source media library item — and is deterministic (same input → same bytes).
