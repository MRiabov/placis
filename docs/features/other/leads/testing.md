# Leads — E2E and integration tests

One full-stack E2E when the Leads screen lands. DB asserts name the
tables from [persistence.md](persistence.md). Public 1:1 is the Route
rows below. Go `func TestHappyPath*` leftover until they exist. No Go
tests in this docs PR. Leads has no pipeline
(`TestPipelineHappyPathLeads*` does not exist).

## E2E

### Filter Leads by website and Ads

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against
the real API + real Postgres. Activated tenant. One website with a
website form. Fixture website leads and ad leads (ad-lead ingest may
insert fixture rows until Meta ingest exists).

#### Exercise

1. Open `/cms/leads` (All).
2. Source filter: that website (`source=website`, `website_prefix`).
   `GET /v1/leads`.
3. Source filter: Ads (`source=ad`).
4. From `/cms/ads/{id}`, follow the New-ad-leads count (`source=ad`,
   `ad_id`).
5. Mark one row Contacted. `PATCH /v1/leads/{lead_id}`.

#### Verify

1. All shows website leads and ad leads, newest first. UI: Leads.
2. Website filter: only that website’s website leads.
   `LeadListRead.items` `source=website`.
3. Ads filter: only ad leads. `source=ad`.
4. Ad link: only that `ad_id`.
5. **persists into** `leads.status=contacted`. New stays the urgent
   mark.

#### Mocked

Meta ingest. Stripe unused.

## Integration

### TestHappyPathV1WebsiteFormsFormIdSubmissions — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Website form fixture.
No Playwright.

#### Exercise

`POST /v1/website-forms/{form_id}/submissions`.

#### Verify

Through HTTP: Response `LeadRead` (`source=website`, `status=new`).
**persists into** `leads` (`source=website_form`). Extra keys 4xx may
supplement.

### TestHappyPathV1WebsiteFormsFormIdUploads — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres and Testcontainers
MinIO). Website form fixture. No Playwright.

#### Exercise

`POST /v1/website-forms/{form_id}/uploads`.

#### Verify

Through HTTP: Response `WebsiteFormUploadRead` (`upload_url`).
**persists into** `files`.

### TestHappyPathV1Leads — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fixture website lead
and ad lead. Clerk JWT, active tenant.

#### Exercise

`GET /v1/leads`.

#### Verify

Through HTTP: Response `LeadListRead`. `source=website` without
`website_prefix` is 4xx (may be a Fail case). Newest first.

### TestHappyPathV1LeadsLeadId — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fixture website lead
`status=new`. Clerk JWT, active tenant.

#### Exercise

`PATCH /v1/leads/{lead_id}`.

#### Verify

Through HTTP: Response `LeadRead` `status=contacted`. **persists into**
`leads.status`. Unknown id 404 may supplement.
