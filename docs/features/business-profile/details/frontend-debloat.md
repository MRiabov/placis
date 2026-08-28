# Details `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [README.md](README.md), [persistence.md](persistence.md), [api.md](api.md). Left nav / New chat:
[CMS frontend](../../../general-architecture/cms/frontend.md) and [CMS frontend-debloat](../../../general-architecture/frontend-debloat.md). Projects:
[projects frontend-debloat](../projects/frontend-debloat.md). Certifications:
[certifications-and-reviews frontend-debloat](../certifications-and-reviews/frontend-debloat.md). Shared rules: [planning index](../../../../planning/frontend-debloat.md).

## Code today

- `frontend-2/src/features/cms/details/` — `DetailsEditor.tsx` (~693 lines),
  `DetailsView.tsx`, `Field.tsx`, `detailsModel.ts`, `collectionWorkspace.tsx`.
- Careers CSS classes reused on the Business details screen
  (`DetailsEditor.tsx`).

## Keep

- `/cms/details` — Business details (who they are, contact, where as an addable
  Google Maps service-area list, services, legal, opening hours picker, logo
  picker, Facebook and Google Maps listing as linked cards). Top menu and footer
  stay in the website editor Content tab.
- Typed Business details fields (`detailsModel.ts` `emptyForm` / `profileToForm`
  / `formToPatch`).
- Per-field loading placeholders ([general frontend](../../../general-architecture/frontend.md)).
- `GET/PATCH /v1/business-profile` ([api.md](api.md)).

## Delete

- **Save details** control — same click-off / explicit Update as the rest of
  the CMS; busy on the control, not a whole-screen swap.
- Careers class names on the Business details screen (`.cms-careers-*`).

## Do not port

- `/cms/profile` as a route. Profile is a disclosure, not a destination.
- Merging Details into the website editor.
- Renaming Sites in this pass.
- Org chooser, tenant CRUD (auth file).
- Decorative boxed heading icon. Titles are eyebrow + title (+ Open destinations
  on narrow).

## Retarget

| Today | Target |
| --- | --- |
| `GET/PATCH …/business-profile` | `/v1/business-profile` (Details) |

## Don't say / rename

- Don't say history: this screen edits the live business profile; profile
  history is not a details timeline UI.
- Don't say client: the owner / contractor, never “customer”.

## Tests

- `DetailsView.test.tsx` — drop “Save details”.
- `e2e/parity/details-parity.spec.ts` — drop with the cross-cutting parity
  suite.

## Done when

- Business details has no Save control.
- Fields match [frontend.md](frontend.md).
