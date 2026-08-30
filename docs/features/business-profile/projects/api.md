# Projects HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Owned by
the Projects screen (Profile group). Table is `business_profile.projects`. Not
nested under the website editor.

Live business profile scalars: [details HTTP](../details/api.md). Media library
cover pick: [media library](../../other/media/api.md). Tools: [ADR](ADR.md) 4
and 5. Same POST / PATCH / archive / approve as `/cms/projects/{id}` (owner
action = assistant action for the tools). No description-patches route. No
`PATCH` with `status`. No PUT.

## Complete — projects

All mutating routes: **Auth** Clerk JWT, active tenant; **Idempotency-Key:**
yes.

### GET /v1/projects / POST /v1/projects

- **Callers:** `/cms/projects`. Ads and website publication read the same rows.
  Website editor and ads still read the live table (including project drafts).
  Only the **live website** bake filters.
- **GET** default lists non-archived (`draft` + `active`). Archived only when
  listing Archive.
- **POST** is `create_project` and first click-off on **New project**. Inserts
  `status=draft`.
- **Request (create):** `title` (`minLength` 1, `maxLength` 80), `description`
  (`minLength` 1, `maxLength` 2000), optional `cover_media_asset_id`.

### GET /v1/projects/{id} / PATCH /v1/projects/{id}

- **PATCH** is owner click-off of title / description / cover, **Apply** of
  pending description hunks, `set_project_title`, and `set_project_cover`.
  Editing a project draft does **not** Approve it.
- **Request:** `title`, `description` (full resulting string),
  `cover_media_asset_id` (nullable). Do not send a patch object. Do not send
  `status`.

### POST /v1/projects/{id}/approve

- **Callers:** **Approve** on `/cms/projects/{id}`. Same verb as ads
  (`POST /v1/ads/{ad_id}/approve`). Empty body. Not an assistant tool this pass.
- Sets `status=active`. Then the row is ready for the **next** website
  publication bake. No Publish on the project screen.
- **409** if the row is not a project draft (`active` / `archived`). Already
  `active` on retry: **200** (safe to retry).

### POST /v1/projects/{id}/archive and …/unarchive

- **Callers:** **Archive** on `/cms/projects/{id}`, **Unarchive** on the list,
  toast Undo, `archive_project` / `unarchive_project`. Empty body. Not PUT, not
  `PATCH` with `status`, not `DELETE`.
- **Archive** — `draft` or `active` → `archived`. Drops that id from every
  unpublished project-gallery website section (then compact). Live gallery waits
  for the next website publication. Already `archived`: **200**. **409** if the
  id is unknown / other-tenant.
- **Unarchive** — `archived` → **project draft** (`status=draft`), not silently
  `active`. Returns to the list, not onto website sections. Owner must
  **Approve** again before the next bake. Already non-archived: **200**.

## Do not create

- `DELETE /v1/projects/{id}`
- `PUT /v1/projects/{id}` / `PATCH` with `status`
- `POST /v1/projects/{id}/description-patches`
- agent-only projects HTTP
- `POST /v1/inline-ai`
