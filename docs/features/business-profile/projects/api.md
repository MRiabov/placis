# Projects HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Owned by
the Projects screen (Profile group). Table is `business_profile.projects`. Not
nested under the website editor.

Live business profile scalars: [details HTTP](../details/api.md). Media library
cover pick: [media library](../../other/media/api.md). Tools: [ADR](ADR.md) 4.
Same POST / PATCH / archive as `/cms/projects/{id}` (owner action = assistant
action). No description-patches route.

## Complete — projects

All mutating routes: **Auth** Clerk JWT, active tenant; **Idempotency-Key:**
yes.

### GET /v1/projects / POST /v1/projects

- **Callers:** `/cms/projects`. Ads and website publication read the same rows.
  `GET` lists `active` rows. Archived only when listing Archive.
  **TODO:** this live-row share is the Projects gap vs save on click-off
  (unpublished website / ad draft only — not the live website or a Published
  ad). Canonical:
  [HTTP conventions](../../../general-architecture/api.md).
- **POST** is `create_project` and first click-off on **New project**.
- **Request (create):** `title` (`minLength` 1, `maxLength` 80), `description`
  (`minLength` 1, `maxLength` 2000), optional `cover_media_asset_id`.

### GET /v1/projects/{id} / PATCH /v1/projects/{id}

- **PATCH** is owner click-off of title / description / cover, **Apply** of
  pending description hunks, `set_project_title`, and `set_project_cover`.
- **Request:** `title`, `description` (full resulting string),
  `cover_media_asset_id` (nullable). Do not send a patch object.

### POST /v1/projects/{id}/archive and …/unarchive

- **Callers:** **Archive** on `/cms/projects/{id}`, **Unarchive** on the list,
  toast Undo, `archive_project` / `unarchive_project`.
- Archive leaves the list and drops that id from every project-gallery website
  section array (then compact). Unarchive returns the row to the list (not
  automatically back onto website sections).

## Do not create

- `DELETE /v1/projects/{id}`
- `POST /v1/projects/{id}/description-patches`
- agent-only projects HTTP
