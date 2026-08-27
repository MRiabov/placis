# Details `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [README.md](README.md), [persistence.md](persistence.md),
[api.md](api.md).
Projects and certifications field specs:
[website frontend](../../website/frontend.md).
Shared rules: [planning index](../../../../planning/frontend-debloat.md).

This file also owns the **CMS left nav** change (Profile disclosure + Ads).

## Code today

- Don't say shell: `frontend-2/src/features/cms/CmsDashboardShell.tsx` — leftover flat nav:
  New chat, Sites, Details (no AI tools).
- `frontend-2/src/features/cms/types.ts` / `routing.ts` — Don't say proof: views include `proof`.
- `frontend-2/src/features/cms/CmsRoute.tsx` — `/cms/proof` and `/cms/projects`
  render `PlaceholderView`.
- `frontend-2/src/features/cms/views/PlaceholderView.tsx`.
- `frontend-2/src/features/cms/details/` — `DetailsEditor.tsx` (~693 lines),
  `DetailsView.tsx`, `Field.tsx`, `detailsModel.ts`, `collectionWorkspace.tsx`.
- `app/router/index.tsx` registers `/cms/proof` and `/cms/projects`.
- Careers CSS classes reused on the Business details screen (`DetailsEditor.tsx`).

## Keep

- `/cms/details` — Business details (who they are, contact, where, services, legal,
  opening hours picker, logo picker, Facebook URL, Google Maps listing). Top menu and footer
  stay in the website editor Content tab.
- CMS layout (sidebar + main area) copies placis-web `DashboardShell` (narrow overlay
  selector; wide collapsed rail + hover peek + pin) and the same dashboard theme
  ([website design-decisions](../../website/design-decisions.md) 16–17).
  New chat prompt is full width of the main column, max `42rem` (default `PlacisPromptBox`).
- Typed Business details fields (`detailsModel.ts` `emptyForm` / `profileToForm` / `formToPatch`).
- Per-field loading placeholders ([general frontend](../../../general-architecture/frontend.md)).
- `GET/PATCH /v1/business-profile` ([api.md](api.md)).

## Delete

- Don't say proof: `/cms/proof` route, `proof` `CmsView`, and the Proof `PlaceholderView`.
- `PlaceholderView` once projects and certifications are real screens (do not
  leave “next CMS port batch” copy).
- **Save details** control — same click-off / explicit Update as the rest of
  the CMS; busy on the control, not a whole-screen swap.
- Careers class names on the Business details screen (`.cms-careers-*`).
- **AI tools** left-nav item (it was a second Sites; cleanup is `/cms/media`).

## Do not port

- `/cms/profile` as a route. Profile is a disclosure, not a destination.
- Restoring `/cms/proof`.
- Restoring an **AI tools** left-nav item.
- Merging Details into the website editor.
- Renaming Sites in this pass ([frontend.md](frontend.md) out of scope).
- Org chooser, tenant CRUD (auth file).

## Retarget

| Today | Target |
| --- | --- |
| Top-level Details nav item | Profile disclosure: Business details, Projects, Certifications and reviews, Media library |
| `/cms/proof` stub | `/cms/certifications-and-reviews` (website feature; wire in website port) |
| `/cms/projects` stub | working Projects screen (title, description, cover photo) |
| Ads missing from nav | left-nav **Ads** → `/cms/ads` (ads feature implements the screens) |
| Media library | Profile child at `/cms/media`; attach from Content |

Recommended left nav:

```text
New chat
Sites
Profile
  Business details
  Projects
  Certifications and reviews
  Media library
Ads
```

Do not rename Sites here. Do not restore **AI tools**.

## Don't say / rename

- Don't say shell: `CmsDashboardShell` → CMS layout (sidebar + main area);
  Don't say shell: CSS `cms-dashboard-shell` → CMS layout class.
- Don't say proof: view id, route, and heading.
- Don't say history: this screen edits the live business profile; profile history
  is not a details timeline UI.
- Don't say client: the owner / contractor, never “customer”.

## Tests

- `CmsRoute.test.tsx` — Don't say proof: drop that view; Profile disclosure; Ads dest.
- `DetailsView.test.tsx` — drop “Save details”.
- `e2e/parity/details-parity.spec.ts` — drop with the cross-cutting parity suite.
- `e2e/parity/cms-parity.spec.ts` — retarget nav labels.

## Done when

- No `/cms/proof`. No top-level Details item.
- Profile disclosure matches [frontend.md](frontend.md) (expanded/collapsed,
  `aria-current` on the child).
- Ads is a left-nav destination (screens may still be later).
- No **AI tools** left-nav item.
- Business details has no Save control.
- CMS layout type and color match [website design-decisions](../../website/design-decisions.md) 17.
