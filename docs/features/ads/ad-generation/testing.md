# Ads — E2E test

One full-stack E2E test: create → generate → review rewrite → approve →
download. Pipeline 01–04 asserts are
[pipeline/testing](pipeline/testing/README.md); this journey does not
re-assert 01 Persist beyond the handoff the UI needs. DB asserts name
the tables from [persistence.md](../persistence.md).

## E2E

### Create through download

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. `tenants` (`status=active`).
`business_profiles` with at least the details Review copy can read.

#### Exercise

1. **Create** — the owner clicks "create an ad". UI: routed to
   `/cms/ads/new`.
2. **Enter details** — offer, goal, service focus, ideal customer
   profile, ad lead form include flags, and exactly one ad format
   (before generate). Request `AdCreate`; Response `AdRead`.
3. **Generate** — **Create ad and generate**
   (`POST /v1/ads/{ad_id}/generate`) queues `ads_generate`; the UI
   shows "drafting…" and lets the owner leave and return. Retry of
   generate while still Ad needs review. After approve
   (`ad_ready_to_post`), a new generate with the same inputs. Review
   **inline AI assistance**: Request `AdRewriteRequest` (`field` +
   `prompt`; **select to edit inline AI assistance** rewrites a span;
   no selection is the whole field). Empty prompt does not fire.
   Ctrl+Z restores the previous copy. `update_details` when copy
   includes a detail.
4. **Approve** — the owner reviews, edits copy, approves. Request
   `AdGenerateRequest`; `ApproveAd`.
5. **Download** — the owner downloads the ad set. Request
   `AdGenerateRequest`; `ExportAdSet`; Response `AdDownloadRead`.

#### Verify

1. **Enter details** — **persists into** `ads` (`status=draft`,
   `ad_goal`, `icp_age_min` / `icp_age_max` / `icp_household` /
   `icp_location_focus` / `icp_notes` / `icp_source` /
   `icp_review_status`, `origin`, `platform_status=not_connected`,
   `platform_refs` empty), `ad_lead_forms` (include flags; `title`
   empty), stub `ad_variants` (`format`, `status=draft`).
2. **Generate** — **persists into** `ai_generations` on an
   `ads_generate` thread (reasoning + output + tool calls + usage +
   `prompt_id` / `prompt_version`), `ad_copy_variants`
   (`source=ai_proposal`), `ad_variants` (same row;
   `status=ad_needs_review`), `ad_image_placements` (`media_asset_id`,
   crop / focal, `media_caption`), `ad_lead_forms.title`. Retry while
   still Ad needs review hits the cache (same `prompt_version`). After
   approve, a new generate with the same inputs rolls the
   `prompt_version`. Same roll if the result would duplicate a
   Published ad. UI: the ad returns for review — never
   `ad_ready_to_post` without approval. Inline AI assistance:
   `ai_generations` records the owner prompt + reasoning + output +
   tool calls (`thread_kind=ads_inline_assistance`). `update_details`
   writes the business profile plus a notification (OK / Revert).
   Approve is not blocked.
3. **Approve** — **persists into** `ad_copy_variants.source=owner_edit`
   when they typed, `ad_variants.status=approved`,
   `ads.status=ad_ready_to_post`, `ad_reviews` (transition to
   `ad_ready_to_post`). Only after every placement has an uploaded
   photo (not `uploading`, not `failed`). A media caption is not
   required for a photo the owner added in Review.
4. **Download** — `AdSetRead` **verbatim matches every field** —
   headline, primary text, short label (`description`), CTA label,
   image crops for this ad's format, ad lead form fields, and the note
   of source media library item — and is deterministic (same input →
   same images). `url` is a signed URL. Ad tables unchanged.

#### Mocked

LLM.

## Integration

### HappyPathAdsFull — frontend Full

Frontend. Vitest `HappyPathAdsFull`. Not four files named 01–04.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Active tenant. Profile details
Review copy can read.

#### Exercise

List → new → About the ad → generate (MSW delayed) → Review unlocks →
approve → download. MSW: `POST /v1/ads`, `POST /v1/ads/{ad_id}/generate`,
`POST /v1/ads/{ad_id}/approve`, `POST /v1/ads/{ad_id}/ad-set` /
download.

#### Verify

UI: list, workspace accordion, drafting, Review unlocked, download.
MSW saw those Method+path strings. Postgres rows are the backend test.

#### Fail

Empty prompt does not fire. Generate still drafting: leave and return.
Approve 4xx.

#### Mocked

All HTTP via MSW.

### TestPipelineHappyPathAdsFull — pipeline Full

Backend. Go `TestPipelineHappyPathAdsFull`. Per-step names:
[pipeline/testing](pipeline/testing/README.md).

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). No `frontend-2`.
No Worker.

#### Exercise

Ordered ads pipeline 01→04.

#### Verify

Postgres holds each step’s Persist plus the export signed URL. Ad
tables unchanged on 04.

#### Mocked

LLM, ad platforms.
