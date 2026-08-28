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
- Projects CRUD already in `cms.ts`.

## Keep

- Working Projects screen: title, description, cover photo from the media
  library.
- `GET/POST/PATCH/DELETE /v1/projects`.

## Delete

- `PlaceholderView` once this screen is real (do not leave “next CMS port batch”
  copy).

## Do not port

- A top-level Projects left-nav item (Profile child).
- Decorative boxed heading icon.

## Retarget

| Today | Target |
| --- | --- |
| `/cms/projects` stub | working Projects screen (title, description, cover photo) |
| Projects CRUD already in `cms.ts` | `/v1/projects` |

## Done when

- `/cms/projects` is the working screen in [frontend.md](frontend.md).
