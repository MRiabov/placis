# Website — E2E test

One full-stack E2E test: edit → assistant → website publication → live HTML
(fake R2 + fake purge) → website rollback → website form. Select and copy
the website template is the [onboarding E2E](../onboarding/testing.md).
Canceled-subscription Publish is the
[billing testing](../billing/testing.md) E2E, not this happy path. DB
asserts name the tables from [persistence.md](persistence.md) (and
[leads](../other/leads/persistence.md) for the website form).

Public and Worker 1:1 HappyPath specs live under `## Integration` (one
`### TestHappyPath*` per [api.md](api.md) Routes row). **Verify** through
HTTP. They do not replace this E2E or pipeline Full. **Do not create**
paths are omitted. Go funcs stay on `leftover_tests.go`. Catalog
`component_id` Must not: leftover predecessor IDs; `aliases` on website
component contracts. Look family Must not: leftover names; use `top_menu` /
`footer` from
[catalog.md](catalog.md#website-component-family).

## E2E

### Edit through website form

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-3` against the
real API + real Postgres. Worker **container** is up (no
`wrangler deploy`). 01/02 already ran (`website_pages` /
`website_sections` / `website_slots` / `website.menus` /
`website_forms` / `website_settings` exist). This journey does not
re-assert 02 Persist.

#### Exercise

1. **Open the website editor** — the owner opens the website editor.
2. **Edit** — the owner edits a website section's text and swaps an
   image via the media library panel (drop a file onto the left panel,
   or drag a photo onto the canvas). Request `WebsitePageUpdate`;
   Response `WebsiteEditApplyRead`.
3. **Assistant** — the owner asks the assistant to improve copy.
   **Apply** PATCHes dirty keys then `record-apply`.
4. **Website publication** — Request `WebsitePublicationCreate`;
   `PublishWebsite` **calls** `WebsitePublicationBlockers`, then
   `websitePublication` and **sends**
   `WebsitePublicationRequest`.
5. **Live website** — GET the published website copy in `latest/`.
6. **Website rollback** — the owner does a website rollback to an
   earlier **owner** website version (onboarding v1/v2 are not listed).
7. **Website form → website lead** — a website visitor submits a
   website form (reads existing `website_forms` from 02).

#### Verify

1. **Open** — UI: the website page list renders. DB: reads
   `website_pages` for **this** `website_id`.
2. **Edit** — **persists into** `website_slots.value` (new text and, on
   image swap, `media_asset_id`); `edit_history` has a human batch;
   `website_settings.edit_history_head` moved. UI: the edit is visible
   in the canvas.
3. **Assistant** — **persists into** `website_slots` through that
   PATCH; `ai_generations` records the batch (`cms_assistant` thread);
   `edit_history` has an agent batch. UI: muted tool-call rows in the
   thread. Apply / Reject pills on the canvas over the composer if Ask
   first; no revert-after-apply.
4. **Website publication** — 03 must not have written
   `website_publications` / R2. **persists into**
   `website_publications` (`status=published`, `active=true`,
   `website_manifest`, `version_number` — a website version). Fake R2
   keys `sites/hosts/{hostname}/{version_number}/` then `…/latest/`
   (CMS Publish; that destination `Host`). Fake `purge_cache` for
   live website page URLs (and sitemap, robots, WebP) on **that** host.
   No live Cloudflare. No website image
   render on the publication response. UI: the live website is shown
   when a website address is `active`; otherwise the owner still uses
   the preview website address.
5. **Live website** — fake R2 objects for the edited website page; live
   GET does not call Go.
6. **Website rollback** — an earlier `website_publications` is `active`
   again; earlier published website copies are never overwritten (both
   rows remain). Unpublished `website_pages` / `website_slots` are
   unchanged. UI: the dropdown updates from the rollback `*Read`; the
   live website shows the earlier published website copy. Website
   versions: rollback on earlier owner website versions; Preview on the
   live website version.
7. **Website form** — **persists into** `leads` (`source=website_form`,
   `website_form_id`, `contact_name`, `marketing_phone`,
   `marketing_email`, message, `status=new`) under the tenant.

#### Fail

Saving an invalid prop is rejected. UI: inline error next to the field.

#### Mocked

LLM. Cloudflare R2 / Custom Hostnames / `purge_cache`. Worker is real
(container).

### HTTP create of a second website

#### Setup

Deferred. **TBD:**
[new-website-creation-flow.md](new-website-creation-flow.md). Keep
`POST /v1/websites` as the later contract.

#### Exercise

Deferred.

#### Verify

Deferred.

## Integration

### TestHappyPathV1WebsitesReturnsWebsites — Route

Backend. Go `TestHappyPathV1WebsitesReturnsWebsites`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Onboarding website row present. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites`. Response `WebsiteRead[]`.

#### Verify

Exercise body lists this tenant’s websites. Must not: fat unpublished dump.

### TestHappyPathV1WebsitesCreatesWebsite — Route

Backend. Go `TestHappyPathV1WebsitesCreatesWebsite`. OpenAPI 1:1.
**Deferred.** Do not run this pass. **TBD:**
[new-website-creation-flow.md](new-website-creation-flow.md).

#### Setup

Deferred. When create ships: active tenant on Placis Pro Plus plan (cap
3). Onboarding website already present. Usage credit remaining. Worker
up (copy generation).

#### Exercise

Deferred. `POST /v1/websites`. Request `WebsiteCreate`. Response
`WebsiteRead`.

#### Verify

When create ships: **persists into** `websites`, `website_settings`,
`website_addresses` (`type=subdomain`). Prefix reserved in the same
transaction. Copy generation billed. Isolation vs the onboarding
website. Fail: `402 website_limit_reached` at cap; `402
usage_credit_exhausted` (no row).

### TestHappyPathV1WebsitesWebsitePrefixReturnsWebsite — Route

Backend. Go `TestHappyPathV1WebsitesWebsitePrefixReturnsWebsite`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
`websites` row present. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}`. Response `WebsiteRead`.

#### Verify

`copy_generation_status` is `running` / `done` / `failed`. Must not:
onboarding SSE wait teaser. `404` unknown prefix.

### TestHappyPathV1WebsiteEditorPagesReturnsPages — Route

Backend. Go `TestHappyPathV1WebsiteEditorPagesReturnsPages`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. One owner
`website_publications` row on this `{website_prefix}`. No
`frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/editor/pages`. Request
`WebsiteEditorGet`. Response `WebsitePageSummaryRead`. Cases:

- No query — unpublished page list.
- `publication_id` — that owner publication’s page list.

#### Verify

- No query: `WebsitePageSummaryRead` lists unpublished pages.
  Per-row page-scoped `blockers[]`. Must not: preview host GET.
- `publication_id`: body is that owner publication’s pages, not
  the unpublished tree.
Named **reads** `website_pages`, `website_sections`,
`website_slots`, `media_assets` may supplement.

#### Fail

`409` onboarding row. `403` unactivated. `404` `publication_id` that
is not a publication of this `{website_prefix}`.

### TestHappyPathV1WebsiteEditorPagesCreatesPage — Route

Backend. Go `TestHappyPathV1WebsiteEditorPagesCreatesPage`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/websites/{website_prefix}/editor/pages`. Request `WebsitePageCreate`.
Response `WebsitePageRead`.

#### Verify

`GET /v1/websites/{website_prefix}/editor/pages` lists the created page.
**persists into** `website_pages`, `website.menus` (append menu node) may
supplement.

#### Fail

`403` unactivated.

### TestHappyPathV1WebsiteEditorPagesPageIdReturnsPage — Route

Backend. Go `TestHappyPathV1WebsiteEditorPagesPageIdReturnsPage`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. One owner
`website_publications` row on this `{website_prefix}`.
`edit_history` on that website page. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/editor/pages/{page_id}`. Request
`WebsiteEditorGet`. Response `WebsitePageRead`. Cases:

- No query — unpublished canvas.
- `publication_id` — checkout of that owner publication.
- `include_edit_history=true` — hydrate with undo stacks.

#### Verify

- No query: `WebsitePageRead` hydrates the unpublished canvas.
  `has_unpublished_changes` is false right after an owner website
  publication with no later unpublished change; true after a Details /
  Projects / certifications write with `created_at` after that row’s
  `published_at` (no new `website_publications` row).
- `publication_id`: checkout body of that owner publication.
- `include_edit_history=true`: undo stacks present.
Must not: `/pages/{id}/seo`; `/settings` GET; `/menus` GET;
return `website_manifest`; both query flags; enqueue 04 from Details
PATCH; embed `media_assets[]`. Named **reads** may supplement
(`business_profile.business_profiles`,
`business_profile.business_profile_edits`).

#### Fail

`404` / `409` / `400`. `403` unactivated. `404` `publication_id` that
is not a publication of this `{website_prefix}`.

### TestHappyPathV1WebsiteEditorPagesPageIdUpdatesPage — Route

Backend. Go `TestHappyPathV1WebsiteEditorPagesPageIdUpdatesPage`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`PATCH /v1/websites/{website_prefix}/editor/pages/{page_id}`. Request
`WebsitePageUpdate`. Response `WebsiteEditApplyRead`.

#### Verify

`GET /v1/websites/{website_prefix}/editor/pages/{page_id}` shows the dirty-key
edit. Ack `blockers[]` is that website page (page-scoped). **persists into**
`website_slots`, `website_sections`, `website_pages`, `website_forms`,
`website_form_fields`, `website.menus`,
`edit_history`, `website_settings.edit_history_head` may supplement. Must not:
predecessor `POST …/sections` (see [api.md](api.md) overflow).

#### Fail

`409 edit_history_conflict`. `413`. `429`. `403` unactivated.

### TestHappyPathV1WebsiteEditorSettingsUpdatesSettings — Route

Backend. Go `TestHappyPathV1WebsiteEditorSettingsUpdatesSettings`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`PATCH /v1/websites/{website_prefix}/editor/settings`. Request
`WebsiteSettingsUpdate`. Response `WebsiteEditApplyRead`.

#### Verify

`GET /v1/websites/{website_prefix}/editor/pages/{page_id}` `website_styles`
shows the applied styles. **persists into** `website_settings`, `edit_history`
may supplement. Must not: `GET /v1/websites/{website_prefix}/editor/settings`.

#### Fail

`409 edit_history_conflict`.

### TestHappyPathV1WebsiteEditorMenusUpdatesMenus — Route

Backend. Go `TestHappyPathV1WebsiteEditorMenusUpdatesMenus`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`PATCH /v1/websites/{website_prefix}/editor/menus`. Request
`WebsiteMenusUpdate`. Response `WebsiteEditApplyRead`.

#### Verify

`GET /v1/websites/{website_prefix}/editor/pages/{page_id}` `menus` shows the
updated trees. **persists into** `website.menus`, `edit_history` may supplement.
Must not: `GET /v1/websites/{website_prefix}/editor/menus`; menus on page PATCH.

#### Fail

`409 edit_history_conflict`. `403` unactivated.

### TestHappyPathV1WebsiteEditorBlockersReturnsBlockers — Route

Backend. Go `TestHappyPathV1WebsiteEditorBlockersReturnsBlockers`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished Copy website template pages rows already present. No
`frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/editor/blockers`. Response
`WebsiteEditorBlockersRead`.

#### Verify

Exercise body: `WebsiteEditorBlockersRead` `blockers[]` is the flat
set (this website’s pages plus subscription and live-path unapproved
media library items on this website). Codes `required_slot_unresolved`,
`media_not_approved`,
`subscription_canceled`. Must not: canvas hydrate; `website_manifest`;
`publication_id`. Named **reads** may supplement.

#### Fail

`403` unactivated.

### TestHappyPathV1WebsiteEditorUrlsReturnsUrls — Route

Backend. Go `TestHappyPathV1WebsiteEditorUrlsReturnsUrls`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/editor/urls`. Response `WebsiteUrlRead`.

#### Verify

Exercise body: `WebsiteUrlRead` list. Must not: `POST /pages` from
picker.

### TestHappyPathV1WebsiteEditorUrlsCreatesUrl — Route

Backend. Go `TestHappyPathV1WebsiteEditorUrlsCreatesUrl`. OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`POST /v1/websites/{website_prefix}/editor/urls`. Request `WebsiteUrlCreate`.
Response `WebsiteUrlRead`.

#### Verify

`GET /v1/websites/{website_prefix}/editor/urls` lists the created URL. Must not:
create a website page. **persists into** `website_urls` may supplement.

### TestHappyPathV1WebsitePublicationsReturnsPublications — Route

Backend. Go `TestHappyPathV1WebsitePublicationsReturnsPublications`.
OpenAPI 1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/publications`. Response
`WebsitePublicationRead`.

#### Verify

Exercise body: `WebsitePublicationRead` list omits onboarding rows. Must
not: return `website_manifest`.

### TestHappyPathV1WebsitePublicationsCreatesPublication — Route

Backend. Go `TestHappyPathV1WebsitePublicationsCreatesPublication`.
OpenAPI 1:1. **calls** `WebsitePublicationBlockers`; **calls**
`websitePublication`.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Unpublished 02 rows already present. Owner host `website_addresses`
row. No `frontend-3`. Worker **container** is up (this op **calls**
`websitePublication`).

#### Exercise

`POST /v1/websites/{website_prefix}/publications`. Request
`WebsitePublicationCreate`. Response `WebsitePublicationRead`. **sends**
`WebsitePublicationRequest`.

#### Verify

`GET /v1/websites/{website_prefix}/publications` lists the new owner row
(`published_by=owner`). MinIO `sites/hosts/{hostname}/{version_number}/` then
`…/latest/`. Named **persists into** may supplement.

#### Fail

`402 subscription_canceled`. `404` `website_address_id` missing,
other-website, or a `type=subdomain` row whose hostname is not this
prefix. Must not: Publish onto another website’s
`{prefix}.preview.placis.com`.

#### Mocked

LLM, Google, voice, `purge_cache`. Worker real. MinIO is real
(Testcontainers).

### TestHappyPathV1WebsitePublicationsIdRollback — Route

Backend. Go `TestHappyPathV1WebsitePublicationsIdRollback`. OpenAPI
1:1. **calls** `websitePublication` (copy that owner version onto that
host `latest/`).

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
Two owner `website_publications` rows (one `active`). No `frontend-3`.
Worker **container** is up.

#### Exercise

`POST /v1/websites/{website_prefix}/publications/{id}/rollback`. Response
`WebsitePublicationRead`.

#### Verify

`GET /v1/websites/{website_prefix}/publications` shows the earlier owner row
`active` again. Must not: rewrite unpublished rows. Named **persists into** may
supplement.

#### Fail

`402`. `409` onboarding id. `404` publication or host that is not
this `{website_prefix}`.

#### Mocked

LLM, Google, voice, `purge_cache`. Worker real. MinIO is real
(Testcontainers).

### TestHappyPathV1WebsiteAddressesReturnsAddresses — Route

Backend. Go `TestHappyPathV1WebsiteAddressesReturnsAddresses`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/addresses`. Response `WebsiteAddressRead`.

#### Verify

Exercise body: `WebsiteAddressRead` list. Does not create subdomain.

### TestHappyPathV1WebsiteAddressesCreatesAddress — Route

Backend. Go `TestHappyPathV1WebsiteAddressesCreatesAddress`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
No `frontend-3`. No Worker.

#### Exercise

`POST /v1/websites/{website_prefix}/addresses`. Request `WebsiteAddressCreate`.
Response `WebsiteAddressRead`. `type=custom` only.

#### Verify

`GET /v1/websites/{website_prefix}/addresses` lists the custom host. Must not:
`type=subdomain`; reserve `website_prefix`. **persists into**
`website_addresses` may supplement.

### TestHappyPathV1WebsiteAddressesIdReturnsAddress — Route

Backend. Go `TestHappyPathV1WebsiteAddressesIdReturnsAddress`. OpenAPI
1:1.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Active tenant.
One `website_addresses` row. No `frontend-3`. No Worker.

#### Exercise

`GET /v1/websites/{website_prefix}/addresses/{id}`. Response
`WebsiteAddressRead`.

#### Verify

Exercise body: `WebsiteAddressRead`. DNS rows copyable. Must not:
nameserver mutation.

#### Fail

`404` other-website `website_address_id`.

### TestHappyPathInternalWebsiteRender — Route

Backend / Worker. Go `TestHappyPathInternalWebsiteRender`. Worker
OpenAPI 1:1. Extra-keys and swapped-path 4xx:
[worker-internal.md](pipeline/testing/worker-internal.md).

#### Setup

Backend (`humatest` not on `cmd/api`). Real Worker container. Testcontainers
MinIO. Unpublished dump + `WebsiteBusinessProfileRead` that can resolve
Common variables. No `wrangler deploy`.

#### Exercise

`POST /internal/website-render`. Request `WebsiteRenderRequest`.
Response `WebsiteRenderResponse`.

#### Verify

Exercise body: website image render (`image`, or `before_image` +
`after_image`). Does not write R2. Response has no HTML body. Request
body has no image files. Must not: persist HTML onto unpublished slots;
`websitePublication`.

#### Fail

Extra keys 4xx.

#### Mocked

`purge_cache`. MinIO is real (Testcontainers). Not the Worker.

### TestHappyPathInternalWebsitePublication — Route

Backend / Worker. Go `TestHappyPathInternalWebsitePublication`. Worker
OpenAPI 1:1. Extra-keys and swapped-path 4xx:
[worker-internal.md](pipeline/testing/worker-internal.md).

#### Setup

Backend (`humatest` not on `cmd/api`). Real Worker container. Testcontainers
MinIO. Unpublished dump + `WebsiteBusinessProfileRead`. No
`wrangler deploy`.

#### Exercise

`POST /internal/website-publication`. Request
`WebsitePublicationRequest`. Response `WebsitePublicationResponse`.
Cases:

- CMS — host tree.
- Unpaid until cutover — prefix tree.

#### Verify

Exercise body: no website image render. Must not: persist HTML onto
unpublished slots; `websiteRender`; write every active hostname.

- CMS: MinIO `sites/hosts/{hostname}/{version_number}/` then
  `…/latest/`.
- Unpaid until cutover: `sites/{website_prefix}/`.

#### Fail

Extra keys 4xx.

#### Mocked

`purge_cache`. MinIO is real (Testcontainers). Not the Worker.

### HappyPathWebsiteFull — frontend Full

Frontend. Vitest `HappyPathWebsiteFull`. Not OpenAPI 1:1, not pipeline
01–04.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active. Unpublished
website pages already in MSW fixtures (01/02 already ran).

#### Exercise

Open `/cms/website` (redirects to
`/cms/website/{website_prefix}`). Edit a website section. Publish. MSW:
`GET /v1/websites/{website_prefix}/editor/pages`,
`PATCH /v1/websites/{website_prefix}/editor/pages/{page_id}`,
`POST /v1/websites/{website_prefix}/publications`.

#### Verify

UI: canvas shows the edit; Publish succeeds. MSW saw those Method+path
strings. Postgres rows are the backend test.

#### Fail

PATCH 4xx: inline error. Leave while copy-out in flight: confirm
discard.

#### Mocked

All HTTP via MSW.

### TestPipelineHappyPathWebsiteFull — pipeline Full

Backend. Go `TestPipelineHappyPathWebsiteFull`. Per-step names live in
[pipeline/testing](pipeline/testing/README.md).

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). No `frontend-3`.
Do not start the Worker container until 03/04 **call** `websiteRender`
/ `websitePublication`.

#### Exercise

Ordered website pipeline 01→04 on this tenant.

#### Verify

Postgres holds each step’s Persist plus the 04 handoff. MinIO keys for
publication objects (not an in-memory R2 stub).

#### Mocked

LLM, Google, voice, `purge_cache`. Worker real on 03/04. MinIO is real
(Testcontainers).
