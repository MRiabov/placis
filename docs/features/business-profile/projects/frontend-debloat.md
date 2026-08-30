# Projects `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [api.md](api.md). Shared rules:
[planning index](../../../../planning/frontend-debloat.md). Left nav:
[CMS frontend-debloat](../../../general-architecture/frontend-debloat.md).

## Code today

- `frontend-2/src/features/cms/CmsRoute.tsx` — `/cms/projects` renders
  `PlaceholderView`.
- `app/router/index.tsx` registers `/cms/projects`.
- Projects CRUD already in `cms.ts` (still includes owner-facing DELETE).

## Keep

- Working Projects screen: list plus `/cms/projects/new` and
  `/cms/projects/{id}` (title, description, cover from the media library).
  **Inline AI assistance** on title and description. Archive / Unarchive /
  Approve.
- `GET/POST/PATCH /v1/projects` and archive / unarchive / approve.

## Delete

- `PlaceholderView` once this screen is real (do not leave “next CMS port batch”
  copy).
- Owner-facing `DELETE /v1/projects/{id}`.

## Do not port

- A top-level Projects left-nav item (Profile child).
- Decorative boxed heading icon.
- Voice as the writing UI.
- The Assistant as the writing UI on `/cms/projects/{id}`.

## Retarget

| Today | Target |
| --- | --- |
| `/cms/projects` stub | list plus `/cms/projects/{id}` in [frontend.md](frontend.md) |
| Projects CRUD already in `cms.ts` | `/v1/projects` POST/PATCH + archive |

## Done when

- `/cms/projects` is the working screen in [frontend.md](frontend.md).
