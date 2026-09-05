# Projects HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Owned by the Projects screen (Profile group). Table is
`business_profile.projects`. Not nested under the website editor.

Live business profile scalars: [details HTTP](../details/api.md). Media
library cover pick: [media library](../../other/media/api.md). Tools:
[ADR](ADR.md) 4 and 5. Same POST / PATCH / archive / approve as
`/cms/projects/{id}` (owner action = assistant action for the tools).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Unactivated onboarding reads ranked cards on
[`OnboardingLiveBusinessProfileRead.projects`](../../onboarding/api.md) and Archives via
`POST /v1/onboarding/projects/{projectId}/archive`. These CMS routes stay
**403** unactivated. Extra keys 4xx. No description-patches route. No `PATCH`
with `status`. No PUT.

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `ProjectRead` | `id`, `title`, `description`, `cover_media_asset_id`, `status`, `origin`, `created_at`, `updated_at` | Item hydrate; list row; PATCH / approve / archive / unarchive response |
| `ProjectListGet` | `status` | Query. Omit = non-archived (`draft` + `active`). `archived` lists Archive |
| `ProjectCreate` | `title`, `description`, `cover_media_asset_id` | POST body. `title` `minLength` 1, `maxLength` 80; `description` `minLength` 1, `maxLength` 2000; `cover_media_asset_id` optional |
| `ProjectUpdate` | `title`, `description`, `cover_media_asset_id` | PATCH omit = no change. Full resulting `description` string. `cover_media_asset_id` nullable. Do not send a patch object. Do not send `status` |

`status` is `draft` / `active` / `archived`. Extra keys 4xx. List
returns `ProjectRead[]`.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/projects` | `/cms/projects`; ads and website publication read the same rows | `ProjectListGet` | `ProjectRead[]` | `projects` | | Default lists non-archived (`draft` + `active`). Archived only when listing Archive | `403` unactivated | Paginate; nest under website editor; call while unactivated |
| `POST /v1/projects` | `/cms/projects` first click-off on **New project**; `create_project` | `ProjectCreate` | `ProjectRead` | | `projects` | See overflow | | Insert `active`; copy ETL cites |
| `GET /v1/projects/{id}` | `/cms/projects/{id}` | | `ProjectRead` | `projects` | | One row | `404` | |
| `PATCH /v1/projects/{id}` | click-off of title / description / cover; **Apply** of pending hunks; `set_project_title`; `set_project_cover` | `ProjectUpdate` | `ProjectRead` | `projects` | `projects` | See overflow | `404` | Send `status`; description-patches object; Approve |
| `POST /v1/projects/{id}/approve` | **Approve** on `/cms/projects/{id}` | | `ProjectRead` | `projects` | `projects` | See overflow | `409` if not a project draft; `404` | Assistant tool this pass; Publish on this screen |
| `POST /v1/projects/{id}/archive` | **Archive** on `/cms/projects/{id}`; `archive_project` | | `ProjectRead` | `projects` | `projects`, `website_slots` | See overflow | `409` if unknown / other-tenant | `DELETE`; `PUT`; `PATCH` with `status` |
| `POST /v1/projects/{id}/unarchive` | **Unarchive** on the list; toast Undo; `unarchive_project` | | `ProjectRead` | `projects` | `projects` | See overflow | `409` if unknown / other-tenant | Silently set `active`; restore onto website sections |

### POST /v1/projects

`create_project` and first click-off on **New project**. Inserts
`status=draft`. Owner drafts have **no** `project_sources` rows.
Website editor and ads still read the live table (including project
drafts). Only the **live website** bake filters.

### PATCH /v1/projects/{id}

Owner click-off of title / description / cover, **Apply** of pending
description hunks, `set_project_title`, and `set_project_cover`.
Editing a project draft does **not** Approve it. Request is the full
resulting `description` string when that key is dirty. Do not send a
patch object. Do not send `status`.

### POST /v1/projects/{id}/approve

Same verb as ads (`POST /v1/ads/{ad_id}/approve`). Empty body. Not an
assistant tool this pass. Sets `status=active`. Then the row is ready
for the **next** website publication bake. No Publish on the project
screen. `409` if the row is not a project draft (`active` /
`archived`). Already `active` on retry: **200** (safe to retry).

### POST /v1/projects/{id}/archive

Empty body. `draft` or `active` → `archived`. Drops that id from every
unpublished project-gallery website section (then compact). Live
gallery waits for the next website publication. Already `archived`:
**200**. `409` if the id is unknown / other-tenant.

### POST /v1/projects/{id}/unarchive

Empty body. `archived` → **project draft** (`status=draft`), not
silently `active`. Returns to the list, not onto website sections.
Owner must **Approve** again before the next bake. Already
non-archived: **200**.

## Do not create

- `DELETE /v1/projects/{id}`
- `PUT /v1/projects/{id}` / `PATCH` with `status`
- `POST /v1/projects/{id}/description-patches`
- agent-only projects HTTP
- `POST /v1/inline-ai`
