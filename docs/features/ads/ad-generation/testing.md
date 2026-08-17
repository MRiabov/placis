# Ads — E2E test

One full-stack E2E test: create → generate → approve → download. Drives `frontend-2` (Playwright)
against the real API + real Postgres; the LLM is faked. DB asserts name the tables from
[data-model.md](../data-model.md).

1. **Create** — the user clicks "create an ad".
   - UI: routed to `/cms/ads/new`.

2. **Enter details** — offer, goal, service focus, ICP, destination page.
   - DB: `ad_creative_sets` written (status=`draft`, `ad_goal`, `icp` jsonb, `destination_page_id`,
     `platform_status=not_connected`, `platform_refs` empty).

3. **Generate** — "Generate ad ideas" queues the background job (faked LLM); the UI shows a
   progressive "drafting…" state and lets the user leave and return.
   - DB: `ai_generations` (reasoning + output + tool calls + usage), `ad_copy_variants`
     (source=`ai_proposal`), `ad_variants` (format, status=`needs_review`), `ad_image_placements`
     (media_asset_id, crop, focal_point, alt_text), `ad_lead_forms` (title, questions).
   - UI: the proposal returns for review — never `ready_to_post` without approval.

4. **Approve** — the user reviews, edits copy, approves.
   - DB: `ad_copy_variants.source=owner_edit`, `ad_variants.status=approved`,
     `ad_creative_sets.status=ready_to_post` — only after every placement resolves to an approved,
     captioned asset.

5. **Download** — the user downloads the package.
   - Assert: the download **verbatim matches every field** — headline, primary text, description,
     CTA label, per-format image crops, destination URL, lead-form fields, and the manifest note of
     source assets — and is deterministic (same input → same bytes).
