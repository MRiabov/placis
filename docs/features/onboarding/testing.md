# Onboarding — E2E test

One full-stack E2E: Find → Review → text client interview → wait teaser →
website preview → website activation. Guide Voice is a **separate**
full-stack E2E in [assistant testing](../assistant/testing.md)
`### Onboarding` (journey, not Route 1:1;
`assistant.thread_items`, `assistant.runs`, `ai.threads`
`thread_kind=onboarding_assistant`). Unpaid website editor prompt →
PATCH → pay is `### Onboarding website editor` there. Do not include
those journeys here. Route 1:1 is `### TestHappyPath*` below.
Pipeline Persist is [pipeline/testing](pipeline/testing/README.md).

## E2E

### Find through website activation

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. Google Maps / company registry / Facebook /
crawl and the LLM are faked. Worker **container** is up when **website**
03/04 run (`websiteRender` / `websitePublication`; no
`wrangler deploy`). No Clerk sign-in until website activation.

#### Exercise

1. **Find** — country, registry and/or Google Maps, online research
   consent, business lookup. UI: `/onboarding/find` → Review.
2. **Review** — found vs missing; Continue. UI: `/onboarding/review`.
3. **Client interview** — text path; Continue. UI:
   `/onboarding/interview`.
4. **Wait teaser** — `/onboarding/preview` until home website page copy
   done or wait cap, then `/onboarding/preview-and-edit/`. 08 share is
   optional.
5. **Website activation** — pay on the website preview (Clerk testing
   token + Stripe test webhook). First payer wins. UI: `/cms/website`.

#### Verify

UI: Find → Review → interview → wait teaser → unpaid canvas →
`/cms/website`. Handoff rows: `tenants` (`status=unactivated` after
lookup, `status=active` after pay, same `tenant_id`);
`onboarding_sessions` (`client_interviewing` then `activated`, token);
`website_activations` paid. Pipeline Persist and Route 1:1 are the
backend tests.

#### Fail

Unpublished website from 05 still opens the website preview and can be
activated.

#### Mocked

Google Maps, company registry, Facebook, crawl, LLM. Stripe test
webhook. Worker is real (container). R2 / `purge_cache` faked.

## Integration

### TestHappyPathV1OnboardingBusinessLookup — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). No `frontend-2`. No
Clerk. Consent true. Registry and/or Maps attach keys.

#### Exercise

`POST /v1/onboarding/business-lookup`

#### Verify

Response `BusinessLookupRead` (`token`, `status=client_interviewing`).
Create then GET profile returns that onboarding session on the same
token. Named persist may supplement: `tenants` (`status=unactivated`),
`onboarding_sessions` (`browser_safety_session_id`), empty
`business_profiles`.

#### Fail

Missing consent, missing both sources, or missing
`browser_safety_session_id` → 4xx; no tenant. Sixth lookup in 30
minutes with the same `browser_safety_session_id` → `429`
`browser_safety_cap`; no sixth tenant.

#### Mocked

Registry parquet. Google Maps autocomplete.

### TestHappyPathV1OnboardingFindSearchCompanyRegistry — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). No `frontend-2`. Country
`ie`. Query string set.

#### Exercise

`GET /v1/onboarding/find/search/company-registry`

#### Verify

Response `CompanyRegistryRecordRead` rows. **Omit** `raw`. No persist.

#### Mocked

Registry parquet.

### TestHappyPathV1OnboardingFindSearchGoogleMaps — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). No `frontend-2`. Country
`ie`. Query string set.

#### Exercise

`GET /v1/onboarding/find/search/google-maps`

#### Verify

Response `GoogleMapsListingRead` rows. **Omit** Maps `raw`. No
`etl.google_maps_listings` upsert.

#### Mocked

Google Maps autocomplete.

### TestHappyPathV1OnboardingSources — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Onboarding session token
from business lookup. No `frontend-2`.

#### Exercise

`PUT /v1/onboarding/sources`

#### Verify

Response `OnboardingProfileRead`. Attach keys replaced on the same
onboarding session. No second onboarding session.

#### Fail

Sixth `StartRun` in 30 minutes on this tenant is skipped; response
**200**. Activated owner leftover onboarding session token → `403`.

#### Mocked

Registry. Maps. ETL adapters.

### TestHappyPathV1OnboardingProfile — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Onboarding session token.
No `frontend-2`.

#### Exercise

`GET /v1/onboarding/profile`

#### Verify

Response `OnboardingProfileRead` (`fill`, `conflicts`, nested live
business profile). No ETL fetch `raw`.

#### Fail

Activated owner leftover onboarding session token → `403`.

#### Mocked

None beyond lookup fakes.

### TestHappyPathV1OnboardingInterview — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Onboarding session
`client_interviewing`. Token auth. No `frontend-2`.

#### Exercise

`PUT /v1/onboarding/interview`

#### Verify

Response `OnboardingProfileRead`. Autosave persisted. Succeeds when the
complete gate would fail.

#### Fail

Activated owner leftover onboarding session token → `403`.

#### Mocked

None required for text path.

### TestHappyPathV1OnboardingInterviewComplete — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Onboarding session
`client_interviewing`. Complete-gate keys ready (or last dirty answers
on the body). Token auth. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/interview/complete`

#### Verify

Response `OnboardingProfileRead`. Create then GET profile shows complete
handoff (`accepted_edit_id`; status
`selecting_and_copying_website_template`).

#### Fail

Required `conflict` / `empty` / `in_progress` → `409`; status stays
`client_interviewing`. Activated owner leftover onboarding session
token → `403`.

#### Mocked

None required for text path.

### TestHappyPathV1OnboardingProjectsArchive — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Token auth. An `active`
business-research origin Project on this tenant. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/projects/{projectId}/archive`

#### Verify

Create then GET profile: that Project is `archived`,
`algorithm=human`. Next-ranked `active` may appear.

#### Fail

Activated owner leftover onboarding session token → `403`.

#### Mocked

None.

### TestHappyPathV1OnboardingEventsStream — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Token auth. 02 may still
run. No `frontend-2`.

#### Exercise

`GET /v1/onboarding/events/stream`

#### Verify

Huma SSE events `business_profile` / `timeline_step` /
`website_preview_ready` as the onboarding session moves.
No unconstrained `payload`.

#### Fail

Activated owner leftover onboarding session token → `403`.

#### Mocked

ETL adapters. LLM.

### TestHappyPathV1OnboardingWebsiteEditorPages — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Unpublished website from
05. Token or Clerk unactivated. No `frontend-2`.

#### Exercise

`GET /v1/onboarding/website/editor/pages`

#### Verify

Response `WebsitePageSummaryRead` list. Per website page `blockers[]`.
No `publication_id`.

#### Fail

Activated owner → `403`.

#### Mocked

None.

### TestHappyPathV1OnboardingWebsiteEditorPage — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Unpublished website from
05. A `page_id`. Token or Clerk unactivated. No `frontend-2`.

#### Exercise

`GET /v1/onboarding/website/editor/pages/{page_id}`

#### Verify

Response `WebsitePageRead`. No `publication_id`. No
`website_manifest`.

#### Fail

Activated → `403`. Missing website page → `404`/`400`.

#### Mocked

None.

### TestHappyPathV1OnboardingWebsiteEditorPagePatch — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated.
Unpublished website from 05. A `page_id`. No `frontend-2`.

#### Exercise

`PATCH /v1/onboarding/website/editor/pages/{page_id}`

#### Verify

Response `WebsiteEditApplyRead` (website page PATCH includes
`blockers[]`).
Create then GET that website page
shows the patched slots.

#### Fail

Onboarding session token PATCH → `403`. `409 edit_history_conflict`.

#### Mocked

None.

### TestHappyPathV1OnboardingWebsiteEditorMenusPatch — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated.
Unpublished website from 05. No `frontend-2`.

#### Exercise

`PATCH /v1/onboarding/website/editor/menus`

#### Verify

Response `WebsiteEditApplyRead`. Create then GET that website page
shows the patched menus. Must not: `GET /v1/onboarding/website/editor/menus`.

#### Fail

Onboarding session token PATCH → `403`. `409 edit_history_conflict`.

#### Mocked

None.

### TestHappyPathV1OnboardingWebsitePublications — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Wait-end
(`preview_and_edit`). Token or Clerk unactivated. Worker container
(**calls** `websitePublication`). No `frontend-2`.

#### Exercise

`POST /v1/onboarding/website/publications`

#### Verify

Response `PreviewWebsiteAddressRead`. Create then GET website editor
pages still lists unpublished website pages. Prefix reserved.

#### Mocked

`purge_cache`. MinIO is real. Worker is real.

### TestHappyPathV1OnboardingWebsiteAssistantThread — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Unpublished website from
05. Onboarding session token. No `frontend-2`.

#### Exercise

`GET /v1/onboarding/website/assistant/thread`

#### Verify

Response `AssistantThreadRead` (`items`; omits `runs`). Empty is
`items: []`.

#### Fail

Activated → `403`.

#### Mocked

None.

### TestHappyPathV1OnboardingWebsiteAssistantThreadWs — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated. 06
idle. No `frontend-2`.

#### Exercise

`GET /v1/onboarding/website/assistant/thread/ws`

#### Verify

Text socket accepts one owner send. HTTP body / stream shows the
applied turn.

#### Fail

Onboarding session token send → `403`. Sixth prompt → `409`
`unpaid_prompt_cap`.

#### Mocked

Assistant LLM.

### TestHappyPathV1OnboardingWebsiteAssistantVoiceRealtimeConnection — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated. 06
idle. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/website/assistant/voice/realtime-connection`

#### Verify

Response `AssistantVoiceRealtimeConnectionRead`.

#### Fail

Onboarding session token Voice → `403`. Cap → `409`
`unpaid_prompt_cap`.

#### Mocked

Voice.

### TestHappyPathV1OnboardingWebsiteAssistantVoiceToolCalls — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated. Voice
connection on. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/website/assistant/voice/tool-calls`

#### Verify

Tool event reaches the voice-service socket. HTTP 2xx.

#### Fail

Activated → `403`.

#### Mocked

Voice. Assistant tools.

### TestHappyPathV1OnboardingWebsiteAssistantVoiceTranscripts — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated.
Committed Voice events. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/website/assistant/voice/transcripts`

#### Verify

HTTP 2xx. Create then GET unpaid thread includes transcript items
(GET omits `provider_event`).

#### Mocked

Voice.

### TestHappyPathV1OnboardingWebsiteAssistantVoiceRecordings — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated. Voice
off after a turn. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/website/assistant/voice/recordings`

#### Verify

Response recording create. HTTP 2xx.

#### Fail

Activated → `403`. Guide Voice must not use this Route.

#### Mocked

Voice. Object storage for the signed URL.

### TestHappyPathV1OnboardingWebsiteAssistantVoiceRecordingComplete — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Clerk unactivated. A
recording id from create. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/website/assistant/voice/recordings/{id}/complete`

#### Verify

HTTP 2xx. Recording marked complete.

#### Fail

Activated → `403`.

#### Mocked

Voice.

### TestHappyPathV1OnboardingActivationCheckout — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Wait-end. Clerk JWT
unactivated (app origin or Host / `website_prefix`). No `frontend-2`.

#### Exercise

`POST /v1/onboarding/activation/checkout`

#### Verify

Response `WebsiteActivationCheckoutRead` (`checkout_url`,
`clerk_org_id`). Tenant still `unactivated`. Create then GET status is
not paid yet.

#### Mocked

Stripe test-mode. Clerk fake Principal for org attach.

### TestHappyPathV1OnboardingActivationStatus — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Checkout already created.
Clerk JWT. No `frontend-2`.

#### Exercise

`GET /v1/onboarding/activation/status`

#### Verify

Response `WebsiteActivationStatusRead` (`payment_status`,
`checkout_url` if still needed).

#### Mocked

Stripe test-mode.

### TestHappyPathV1WebhooksStripe — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Checkout pending.
Stripe test signature. Worker container (**calls**
`websitePublication` on activation). No `frontend-2`.

#### Exercise

`POST /v1/webhooks/stripe`

#### Verify

HTTP 2xx. Create then GET activation status is `paid`. Replay is safe
to retry.

#### Fail

Invalid signature → no paid `website_activations`; tenant still
`unactivated`.

#### Mocked

Stripe test-mode. `purge_cache`. Worker is real. MinIO is real.

### TestHappyPathV1OnboardingAssistantVoiceRealtimeConnection — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Unactivated onboarding
session. Token auth. Country from Find. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/assistant/voice/realtime-connection`

#### Verify

Response `AssistantVoiceRealtimeConnectionRead`. Region from business
country. `tools=[]`.

#### Fail

Activated → `403`. Second in-flight → `409` `in_flight_run`.

#### Mocked

Voice.

### TestHappyPathV1OnboardingAssistantVoiceTranscripts — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Token auth. Committed
guide Voice events. No `frontend-2`.

#### Exercise

`POST /v1/onboarding/assistant/voice/transcripts`

#### Verify

HTTP 200 (settlement). Create then GET guide thread includes items
(GET omits `provider_event`). No recording object.

#### Mocked

Voice.

### TestHappyPathV1OnboardingAssistantThread — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Token auth. No
`frontend-2`.

#### Exercise

`GET /v1/onboarding/assistant/thread`

#### Verify

Response `AssistantThreadRead`. Empty is `200` with `items: []`. Omits
`runs` and `provider_event`.

#### Fail

Activated → `403`.

#### Mocked

None.

### HappyPathOnboardingFull — frontend Full

Frontend. Vitest `HappyPathOnboardingFull`. Not nine files named 01–09.
Not a 1:1 row. 02 has no screen. 05/06 are the wait teaser.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go).

#### Exercise

Find → Review → Interview → wait teaser → preview/pay. MSW fixtures /
profile / SSE (`POST /v1/onboarding/business-lookup`,
`GET /v1/onboarding/profile`, `GET /v1/onboarding/events/stream`,
`POST /v1/onboarding/interview/complete`,
`POST /v1/onboarding/activation/checkout`).

#### Verify

UI routes through those screens. MSW saw those Method+path strings.
Postgres rows are the backend test.

#### Mocked

All HTTP via MSW.

### Find consent and Maps

Frontend branching. Not `Full`.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `/onboarding/find`.

#### Exercise

Registry and/or Maps. Consent required before business lookup. Opening
Find with no stored token does not POST. Stored token restores instead
of a second lookup. Typeahead debounce: registry and Maps search do
not fire per keystroke. Lookup body includes `browser_safety_session_id`
from `localStorage`. Sixth lookup in 30 minutes stays on Find.

#### Verify

Lookup disabled without consent. With consent, MSW
`POST /v1/onboarding/business-lookup`. Mount does not POST. Restore
uses `GET /v1/onboarding/profile`. Debounced typeahead uses MSW
`GET /v1/onboarding/find/search/company-registry` and
`GET /v1/onboarding/find/search/google-maps`; those GETs are not
per keystroke. `429` `browser_safety_cap` does not navigate.

#### Mocked

All HTTP via MSW.

### Review skip

Frontend branching. Not `Full`. 03 Persist none.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `/onboarding/review`. SSE may
still fill.

#### Exercise

Continue immediately (skip). Linger then Continue.

#### Verify

Continue enabled in all cases. No Review POST. Skip does not stop 02.
No research-wait UI. MSW `GET /v1/onboarding/profile` / SSE.

#### Mocked

All HTTP via MSW.

### Interview live fill

Frontend branching. Not `Full`.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `/onboarding/interview`. SSE
still filling.

#### Exercise

Owner-typed field vs research increment on another field. Zero
`active` Projects omits the Project block. Archive an `active`
Project. The onboarding guide does not Archive.

#### Verify

Typed field kept. Untouched field takes live fill. Zero `active`
omits the Project block. Archive uses MSW
`POST /v1/onboarding/projects/{projectId}/archive`; next-ranked
`active` may appear. The onboarding guide does not Archive. MSW SSE /
`PUT /v1/onboarding/interview`.

#### Mocked

All HTTP via MSW.

### Interview lists and photos

Frontend branching. Not `Full`. Contractor only.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `/onboarding/interview`. SSE
still filling.

#### Exercise

Paste one-per-line or comma-separated service names. Maps territory
cards for service areas. Upload photos. Find more online / Create a
stand-in only when photos are not enough (`photos_fill`). Extra notes
are contractor-only.

#### Verify

Paste splits into list rows with no LLM. Territory cards render from
Maps areas (`locality` + `radius_km`). **Upload photos** is always
shown. **Find more online** and **Create a stand-in** only when
`photos_fill` says photos are not enough. Extra notes stay
contractor-only. MSW SSE / `PUT /v1/onboarding/interview`.

#### Mocked

All HTTP via MSW.

### Wait teaser cap

Frontend branching. Not `Full`.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `/onboarding/preview`.

#### Exercise

06 done before ~15s vs cap first.

#### Verify

Navigates to `/onboarding/preview-and-edit/` in both cases.

#### Mocked

All HTTP via MSW.

### Share

Frontend branching. Not `Full`.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `/onboarding/preview-and-edit/`.

#### Exercise

Click Share. Skip Share and pay (Full already pays without 08).

#### Verify

Share uses MSW `POST /v1/onboarding/website/publications`. Preview
website address shown. Skip Share still reaches pay.

#### Mocked

All HTTP via MSW.

### Resume

Frontend branching. Not `Full`. Screen map:
[pipeline README](pipeline/README.md).

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). `localStorage` token + last-step
hint.

#### Exercise

Restore each onboarding session status. Restore with failing profile
GET. Reload while `selecting_and_copying_website_template` or
copy-failed.

#### Verify

No token → `/onboarding/find`. `client_interviewing` with no interview
started → `/onboarding/review`. Interview in progress →
`/onboarding/interview`. Selecting / copy-failed →
`/onboarding/preview`, reconnects SSE, finishes the same remaining
wait-teaser cap (not a new ~15s). `preview_and_edit` →
`/onboarding/preview-and-edit/`. `activated` → clear storage,
`/cms/website`. Profile GET failing: keep the token, loading
placeholder, retry; no replacement POST.

#### Mocked

All HTTP via MSW.

### TestPipelineHappyPathOnboardingFull — pipeline Full

Backend. Go `TestPipelineHappyPathOnboardingFull`. Per-step names:
[pipeline/testing](pipeline/testing/README.md). Skip 04b (**Do not
run**). Skip 03 (Persist none).

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). No `frontend-2`.
Worker container only when a step **calls** `websiteRender` /
`websitePublication`.

#### Exercise

Ordered onboarding DAG 01→09 (03 and 04b out) on Testcontainers.

#### Verify

Postgres holds each step’s Persist. MinIO keys on 08/09 publication
objects. `purge_cache` faked.

#### Mocked

Google, registry, Facebook, crawl, LLM, Stripe test-mode, `purge_cache`.
MinIO is real (Testcontainers).

### Two-tenant isolation

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Two onboarding
sessions (second unactivated tenant). No Playwright. No `frontend-2`.

#### Exercise

Read the first tenant's profile, website pages, and publication objects
as the second tenant, before and after the first tenant's website
activation (08/09 MinIO keys).

#### Verify

The first tenant's profile, website pages, and files are not readable
under the second tenant. First tenant's `business_profiles` /
`website_pages` / MinIO keys unchanged.

#### Mocked

Google, registry, LLM, Stripe test-mode, `purge_cache`. MinIO is real.
