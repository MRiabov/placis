# Ads — E2E test

One full-stack E2E test: create → generate → review rewrite → approve →
download. Pipeline 01–04 asserts are
[pipeline/testing](pipeline/testing/README.md); this journey does not
re-assert 01 Persist beyond the handoff the UI needs. DB asserts name
the tables from [persistence.md](../persistence.md).

Public 1:1 HappyPath specs live under `## Integration` (one
`### TestHappyPath*` per [api.md](../api.md) Routes row). **Verify**
through HTTP. They do not replace this E2E or pipeline Full. **Do not
create** paths are omitted. Go funcs stay on `leftover_tests.go`.

## E2E

### Create through download

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-3` against the real
API + real Postgres. `tenants` (`status=active`).
`business_profile.business_profiles` with at least the details Review copy can
read.

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
   `ad_goal`, `icp_household=married_couples`, `icp_age_min=30`,
   `icp_age_max=40`, `icp_source=static`, `icp_location_focus` /
   `icp_notes` / `icp_review_status`, `origin`,
   `platform_status=not_connected`, `platform_refs` empty),
   `ad_lead_forms` (include flags; `title` empty), stub `ad_variants`
   (`format`, `status=draft`).
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

### TestHappyPathV1AdsReturnsList — Route

Backend. Go `TestHappyPathV1AdsReturnsList`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One draft ad and one `status=archived` ad. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/ads`. Request `AdListGet`. Response `AdRead[]`. Cases:

- `archived` omitted / false — list.
- `archived=true` — Archive.

#### Verify

Must not: campaign metrics. Named **reads** may supplement.

- Omitted / false: draft present; `status=archived` omitted.
- `archived=true`: archived present; draft omitted.

### TestHappyPathV1AdsCreatesAd — Route

Backend. Go `TestHappyPathV1AdsCreatesAd`. OpenAPI 1:1. **calls**
`CreateAd`.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
`business_profile.business_profiles` with at least one named service. One draft
ad and one `status=archived` ad. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/ads`. Request `AdCreate`. Response `AdRead`.

#### Verify

`GET /v1/ads/{ad_id}` hydrates the new draft (`status=draft`). Prior
draft and archived rows remain. **persists into** `ads`,
`ad_lead_forms`, `ad_variants` may supplement. Must not: enqueue
generate; write copy.

#### Fail

Missing `format` → 400.

### TestHappyPathV1AdsAdIdReturnsAd — Route

Backend. Go `TestHappyPathV1AdsAdIdReturnsAd`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One draft ad. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/ads/{ad_id}`. Response `AdRead`.

#### Verify

Exercise body: `AdRead` hydrates the workspace. Must not: return
`platform_refs`. Named **reads** may supplement.

#### Fail

`404`.

### TestHappyPathV1AdsAdIdUpdatesAd — Route

Backend. Go `TestHappyPathV1AdsAdIdUpdatesAd`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One draft ad. `base_updated_at` is that row’s `ads.updated_at`. No
`frontend-3`. No Worker.

#### Exercise

`PATCH /v1/ads/{ad_id}`. Request `AdUpdate`. Response `AdRead`.

#### Verify

`GET /v1/ads/{ad_id}` shows the click-off save. **persists into**
`ads`, `ad_variants`, `ad_lead_forms` may supplement. Must not:
write a Published ad; enqueue generate.

#### Fail

`409`.

### TestHappyPathV1AdsAdIdDeletesAd — Route

Backend. Go `TestHappyPathV1AdsAdIdDeletesAd`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One draft ad. No `frontend-3`. No Worker.

#### Exercise

`DELETE /v1/ads/{ad_id}`. Request `AdGenerateRequest`.

#### Verify

`GET /v1/ads/{ad_id}` is `404`. **persists into** `ads` (delete) may
supplement. Must not: Archive.

#### Fail

`409` if not `draft`.

### TestHappyPathV1AdsAdIdVariantsReturnsVariant — Route

Backend. Go `TestHappyPathV1AdsAdIdVariantsReturnsVariant`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One ad with a stub variant. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/ads/{ad_id}/variants`. Response `AdVariantRead`.

#### Verify

Exercise body: `AdVariantRead` is one row. Must not: multi-format
list. Named **reads** may supplement.

#### Fail

`404`.

### TestHappyPathV1AdsAdIdVariantsVariantIdUpdatesVariant — Route

Backend. Go `TestHappyPathV1AdsAdIdVariantsVariantIdUpdatesVariant`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
01/02 already wrote copy and placements (`ad_needs_review`). No
`frontend-3`. No Worker.

#### Exercise

`PATCH /v1/ads/{ad_id}/variants/{variant_id}`. Request
`AdVariantUpdate`. Response `AdVariantRead`.

#### Verify

`GET /v1/ads/{ad_id}/variants` shows the retargeted placement.
**persists into** `ad_image_placements`, `ads.updated_at` may
supplement. Must not: `POST …/cleanup`.

#### Fail

`409`.

### TestHappyPathV1AdsAdIdVariantsVariantIdRewrite — Route

Backend. Go `TestHappyPathV1AdsAdIdVariantsVariantIdRewrite`. OpenAPI
1:1. **calls** `RewriteAdCopy`.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
01/02 already wrote copy. Usage credit available. No `frontend-3`. No
Worker.

#### Exercise

`POST /v1/ads/{ad_id}/variants/{variant_id}/rewrite`. Request
`AdRewriteRequest`. Response `AdCopyVariantRead`.

#### Verify

Exercise body: rewritten `headline` / `primary_text`. Then
`GET /v1/ads/{ad_id}` copy matches. **persists into**
`ad_copy_variants`, `ai_generations`, `ads.updated_at`,
`ai_use_ledger_entries` may supplement. Must not: rewrite
`cta_label` / short label; `/regenerate`.

#### Fail

`400` empty prompt. `409`. `402 usage_credit_exhausted`.

#### Mocked

LLM. Prefer fake Clerk.

### TestHappyPathV1AdsAdIdGenerate — Route

Backend. Go `TestHappyPathV1AdsAdIdGenerate`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
01 stub exists (`ads.status=draft`, stub `ad_variants.format`). Ready
and approved `media_assets` for that format. Usage credit available.
Schema `jobs`: no pending `ads_generate`. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/ads/{ad_id}/generate`. Request `AdGenerateRequest`. Response
`AdRead`.

#### Verify

Exercise body: `AdRead`. Then `GET /v1/ads/{ad_id}` the ad exists.
**persists into** `jobs` (`ads_generate`) may supplement. Must not:
write `ad_ready_to_post`. Copy and placement Persist is pipeline 02.

#### Fail

`409` while that job is pending/running. Empty format.
`402 usage_credit_exhausted`.

#### Mocked

LLM. Prefer fake Clerk.

### TestHappyPathV1AdsAdIdApprove — Route

Backend. Go `TestHappyPathV1AdsAdIdApprove`. OpenAPI 1:1. **calls**
`ApproveAd`.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
02 already wrote `ads` (`status=ad_needs_review`), copy, and
placements on uploaded `media_assets`. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/ads/{ad_id}/approve`. Request `AdGenerateRequest`. Response
`AdRead`.

#### Verify

`GET /v1/ads/{ad_id}` shows `status=ad_ready_to_post`. **persists
into** `ads`, `ad_variants`, `ad_reviews`. Must not: ad posting.

#### Fail

`400` blockers. `409`.

### TestHappyPathV1AdsAdIdAdSet — Route

Backend. Go `TestHappyPathV1AdsAdIdAdSet`. OpenAPI 1:1. **calls**
`ExportAdSet`.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
03 already wrote `ads` (`status=ad_ready_to_post`). No `frontend-3`.
No Worker.

#### Exercise

`POST /v1/ads/{ad_id}/ad-set`. Request `AdGenerateRequest`. Response
`AdSetRead`.

#### Verify

Exercise body: `AdSetRead`. Must not: ad posting; write ad tables.

#### Fail

`409` if not `ad_ready_to_post`.

### TestHappyPathV1AdsAdIdDownload — Route

Backend. Go `TestHappyPathV1AdsAdIdDownload`. OpenAPI 1:1. **calls**
`ExportAdSet`.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
03 already wrote `ads` (`status=ad_ready_to_post`). Source
`media_assets` files exist. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/ads/{ad_id}/download`. Request `AdGenerateRequest`. Response
`AdDownloadRead`.

#### Verify

Exercise body: `AdDownloadRead.url` is a signed URL. **persists into**
`files`. Must not: public URL; ad posting.

#### Fail

`409` if not `ad_ready_to_post`.

#### Mocked

Ad platforms. MinIO is real (Testcontainers). Prefer fake Clerk.

### TestHappyPathV1AdsAdIdArchive — Route

Backend. Go `TestHappyPathV1AdsAdIdArchive`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One ad that is not archived. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/ads/{ad_id}/archive`. Request `AdGenerateRequest`. Response
`AdRead`.

#### Verify

`GET /v1/ads/{ad_id}` shows `status=archived`. **persists into**
`ads`, `ad_reviews`. Must not: hard
delete.

#### Fail

`409`.

### TestHappyPathV1AdsAdIdUnarchive — Route

Backend. Go `TestHappyPathV1AdsAdIdUnarchive`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One archived ad. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/ads/{ad_id}/unarchive`. Request `AdGenerateRequest`.
Response `AdRead`.

#### Verify

`GET /v1/ads/{ad_id}` shows `draft` when no approved variant, else
`ad_ready_to_post`. **persists into** `ads`, `ad_reviews`.

#### Fail

`409`.

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

Backend (`humatest`, Testcontainers Postgres + MinIO). No `frontend-3`.
No Worker.

#### Exercise

Ordered ads pipeline 01→04.

#### Verify

Postgres holds each step’s Persist plus the export signed URL. Ad
tables unchanged on 04.

#### Mocked

LLM, ad platforms.

### Two-tenant isolation

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Two activated
tenants A and B. A has one ad. B has zero `ads`. No Playwright. No
`frontend-3`.

#### Exercise

As B: `GET /v1/ads`, `GET /v1/ads/{A’s id}`,
`PATCH /v1/ads/{A’s id}`, generate / rewrite / approve / archive /
download on A’s id.

#### Verify

404 or forbidden. Never A’s `AdRead`. B’s list empty. A’s `ads` /
`ad_variants` / `ad_copy_variants` / `ad_image_placements` /
`ad_lead_forms` / `ad_reviews` unchanged. A’s queries stay
`tenant_id = A`.

#### Fail

B must not receive A’s copy or `AdDownloadRead.url`.

#### Mocked

LLM. Prefer fake Clerk. MinIO is real (Testcontainers).
