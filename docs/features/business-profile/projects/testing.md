# Projects — E2E and integration tests

Playwright e2e drives `frontend-3` against the real API and real
Postgres. Integration is **one side**. Backend: `humatest`,
Testcontainers Postgres. Frontend: Vitest `HappyPathProjectsFull`
(MSW, no Go). Persist names tables from
[persistence.md](persistence.md). Public 1:1 is specified as
`### TestHappyPath*` here; Go funcs are `leftover_tests.go` until
implementation. No pipeline (`TestPipelineHappyPathProjects*` does
not exist). No Go tests in this docs PR.

## E2E

### Draft through unarchive

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-3` against
the real API + real Postgres. Activated tenant. Zero owner
`projects` rows.

#### Exercise

1. Open `/cms/projects`. **Add project**. Title + description
   click-off.
2. **Approve** on `/cms/projects/{id}`.
3. **Archive**.
4. Unarchive from the Archive disclosure. Toast Undo is unarchive.

#### Verify

1. First click-off **persists into** `business_profile.projects`
   `status=draft`. No `project_sources` rows.
2. Approve: `status=active`. UI drops **Project draft**.
3. Archive: `status=archived`; omitted from the default list.
4. Unarchive: `status=draft` again (not silently `active`).

#### Mocked

LLM unused.

## Integration

### TestHappyPathV1Projects — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. One
`draft`, one `active`, one `archived` `projects` row.

#### Exercise

`GET /v1/projects`. Request `ProjectListGet` (default). Response
`ProjectRead[]`.

#### Verify

200. Body lists non-archived (`draft` + `active`). Archived omitted
unless `status=archived`.

### TestHappyPathV1ProjectsCreate — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant.

#### Exercise

`POST /v1/projects`. Request `ProjectCreate`. Response `ProjectRead`.

#### Verify

200. Then `GET /v1/projects` includes it `status=draft`. **persists
into** `projects`. No `project_sources`.

### TestHappyPathV1ProjectsGet — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. One
`projects` row.

#### Exercise

`GET /v1/projects/{id}`. Response `ProjectRead`.

#### Verify

200. Body is that `ProjectRead`.

#### Fail

Unknown id / other-tenant → `404`.

### TestHappyPathV1ProjectsPatch — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. A
project draft.

#### Exercise

`PATCH /v1/projects/{id}`. Request `ProjectUpdate` (title /
description / cover). Response `ProjectRead`.

#### Verify

200. Then `GET /v1/projects/{id}` shows the dirty keys. Still
`status=draft` (does not Approve).

#### Fail

Body includes `status` → 4xx.

### TestHappyPathV1ProjectsApprove — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. A
project draft.

#### Exercise

`POST /v1/projects/{id}/approve`. Empty body. Response
`ProjectRead`.

#### Verify

200. Then `GET /v1/projects/{id}` shows `status=active`.

#### Fail

Not a project draft (`active` / `archived`) → `409`. Already
`active` on retry → **200**.

### TestHappyPathV1ProjectsArchive — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. A
`draft` or `active` project, possibly on an unpublished
project-gallery website section.

#### Exercise

`POST /v1/projects/{id}/archive`. Empty body. Response
`ProjectRead`.

#### Verify

200. Then `GET /v1/projects` omits it (archive list has it).
`status=archived`. Dropped from unpublished project-gallery website
sections (then compact).

#### Fail

Unknown / other-tenant → `409`. Already `archived` → **200**.

### TestHappyPathV1ProjectsUnarchive — Route

#### Setup

Backend (`humatest`, Testcontainers Postgres). Activated tenant. An
`archived` project.

#### Exercise

`POST /v1/projects/{id}/unarchive`. Empty body. Response
`ProjectRead`.

#### Verify

200. Then `GET /v1/projects` includes it `status=draft` (not
`active`). Not restored onto website sections.

#### Fail

Unknown / other-tenant → `409`. Already non-archived → **200**.

### Two-tenant isolation

#### Setup

Backend (`humatest`, Testcontainers Postgres). Two activated
tenants, each with a `projects` row.

#### Exercise

Tenant A JWT against tenant B’s `GET` / `PATCH` / archive /
approve.

#### Verify

404 / forbidden. Tenant B `projects` unchanged.

### HappyPathProjectsFull — frontend Full

Frontend. Vitest `HappyPathProjectsFull`. Not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active. Empty list in
MSW fixtures.

#### Exercise

Open `/cms/projects`. Add project. Approve. Archive. Unarchive. MSW
`GET /v1/projects`, `POST /v1/projects`, `GET /v1/projects/{id}`,
`PATCH /v1/projects/{id}`, `POST /v1/projects/{id}/approve`,
`POST /v1/projects/{id}/archive`, `POST /v1/projects/{id}/unarchive`.

#### Verify

UI: list cards, **Project draft** badge, Approve, Archive
disclosure. MSW saw those Method+path strings. Postgres rows are
the backend test.

#### Mocked

All HTTP via MSW.
