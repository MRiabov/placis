# Projects HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Owned by the Projects screen (Profile group).
Table is `business_profile.projects`. Not nested under the website editor.

Live business profile scalars: [details HTTP](../details/api.md). Media library cover pick:
[media library](../../other/media/api.md).

## Complete — projects

### GET /v1/projects / POST /v1/projects

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/projects`. Ads and website publication read the same rows.
- **POST Idempotency-Key:** yes.
- **Request (create):** title, description, cover media library item id.

### GET /v1/projects/{id} / PATCH /v1/projects/{id} / DELETE /v1/projects/{id}

- **Auth:** Clerk JWT, active tenant
- **PATCH Idempotency-Key:** yes.
