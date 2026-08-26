# Website `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[frontend.md](frontend.md), [editing.md](editing.md), [assistant.md](assistant.md),
[technical-implementation.md](technical-implementation.md), [api.md](api.md).
Shared rules: [planning index](../../../planning/frontend-debloat.md).
Projects and certifications screens: [details frontend](../other/details/frontend.md).
Media library: [media library](../other/media/frontend-debloat.md).
Contractor website API: [port-contractor-website.md](port-contractor-website.md). Remaining
cuts: [contractor-website-debloat.md](contractor-website-debloat.md).

## Code today

- `frontend-2/src/features/cms/editor/` — canvas, workspace, editing panel, media library
  workspace, assistant modal, `EditorHeader.tsx`, `CmsEditorLayout.tsx`.
- Don't say inspector: `frontend-2/src/features/cms/editor/inspector/`
  (Don't say inspector: `Inspector.tsx`, `SlotControls.tsx`, `SeoInspector.tsx`, `DesignInspector.tsx`,
  `FormsInspector.tsx`, `HistoryInspector.tsx`, `inspectorModel.ts`).
- Don't say inspector: `useEditorInspectorHandlers.ts`.
- CMS API module: `frontend-2/src/features/cms/api/cms.ts` (~793 lines) — website
  pages/sections/slots **and** unused blog / careers / website-template leftovers.
- Queries: `frontend-2/src/features/cms/queries.ts` (`useSaveEditorPage`,
  `useEditorPosts`, `usePublishEditorPage`).
- Route: `/cms/website` in `routing.ts` + `app/router/index.tsx`.
- Stubs: `/cms/projects` renders `PlaceholderView`.

## Keep

- `/cms/website` three surfaces: canvas, workspace (website pages, media library,
  website styles, top menu, footer), editing panel (website slots, design, SEO,
  website forms, website versions).
- Canvas via the shared contractor-website component package.
- Website assistant chat in this workspace (plan vs continuous; instant apply vs
  Ask first). Apply / Reject are one-way.
- Media library as a **workspace item** (same library as `/cms/media`).
- `PagesWorkspacePanel`, `StylesWorkspacePanel`, `MenuWorkspacePanel` (tree editor for
  top menu / footer),
  `EditorCanvas`, `CmsEditorLayout`.

## Delete

- `EditorHeader` **Save** / Saving control (and e2e that clicks Save).
- Single **Publish** toolbar button — replace with the website publication
  **dropdown** in [frontend.md](frontend.md).
- Don't say inspector: JSON slot fallback in `SlotControls.tsx` (`JSON.stringify`,
  `parseJsonLoose`).
- From `cms.ts` / `queries.ts` (no blog, no careers, no leftover website-template
  apply API in the CMS):
  - Don't say blueprint: `listEditorBlueprints`, `applyEditorBlueprintDraft`,
    `CmsBlueprint*` types.
  - `listEditorPosts`, `createEditorPost`, `saveEditorPost`, publish/hide/archive
    post, `runEditorPostAssistant`, `useEditorPosts`.
  - `getEditorCareers`, careers assistant, career settings, career openings CRUD.
  - `createEditorRealtimeVoiceSession` (voice is later; not an editor surface).
  - `revertEditorAssistant` if Apply/Reject is one-way with in-memory undo + PATCH
    only ([assistant.md](assistant.md)).
- Don't say inspector: folder and symbol names (see rename).

## Do not port

- Don't say blueprint: website templates as CMS “blueprint” rows. Catalog data is
  `catalog/`; applying a website template is onboarding step 04.
- Blog posts (`page_type=blog_post`) and `website_career_*`.
- `/undo` `/redo` `/edit-history` routes. Undo is in RAM, seeded from website
  edit history on open.
- GET-after-PATCH that replaces the website editor projection (`useSaveEditorPage`
  `onSuccess` `setQueryData` of the full body).
- `/v1/tenants/{website_address}/website/…` for the CMS.

## Retarget

| Today | Constrained API |
| --- | --- |
| `GET/PATCH /api/v1/website/editor/pages…` | `GET/PATCH /v1/website/editor/pages…`; GET may pass `publication_id` (continue editing from an owner website version, then PATCH). PATCH body is dirty keys including page `status`; response `{ edit_history_head, batch_id }` plus assigned ids |
| `POST …/publish` | `POST /v1/website/publications` (no destination). Live website rollback: `POST /v1/website/publications/{id}/rollback`. Do not port restore-unpublished. |
| Sections/slots/assets/assistant | fields on the page PATCH; top menu / footer on `/v1/website/editor/menus`; assistant start under `/v1/website/editor/pages/{page_id}/assistant`; Apply/Reject are `record-apply` / `record-reject` (metadata) plus the same PATCH. Media library: `/v1/media-assets` |
| `GET/PATCH …/business-profile` | `/v1/business-profile` (Details) |
| Projects CRUD already in `cms.ts` | `/v1/projects` |
| Certifications helpers already in `cms.ts` | `/v1/business-profile/certifications` |

Connect website address is a **modal on `/cms/website`** (no extra route). Add with
the website Go phase (Cloudflare custom hostname + DNS rows).

`/cms/media` is owned by [media library](../other/media/frontend-debloat.md).

## Don't say / rename

- Don't say inspector: `editor/inspector/` → `editor/editing-panel/`;
  Don't say inspector: `Inspector.tsx` → editing-panel root; `useEditorInspectorHandlers` → editing-panel handlers.
- Don't say inspector: `SeoInspector` / `DesignInspector` / `FormsInspector` /
  `HistoryInspector` → SEO / design / website-forms / website-versions panels.
- Don't say header: keep the file if needed but the control is the website-editor
  toolbar, not a “Save”.
- Don't say publish: toolbar copy is **website publication**.
- Don't say blueprint: any leftover type or route.
- Don't say proof: `/cms/proof` is details’ delete list; certifications live at
  `/cms/certifications-and-reviews`.

## Tests

- `e2e/editor/editor.spec.ts` clicks Save — retarget to click-off PATCH / publication
  dropdown.
- `SlotControls.test.tsx`, `inspectorModel.test.ts` — follow the editing-panel rename.
- `useEditorPosts` tests (if any) go with the delete.
- One E2E ([testing.md](testing.md)): edit → website assistant → website publication
  → live R2 keys + fake purge → website rollback → website form.

## Done when

- No Save / Saving / Saved on `/cms/website`.
- Projection is hydrated once; PATCH does not round-trip the fold.
- `cms.ts` has no blog, careers, or leftover website-template-apply wrappers.
- Don't say inspector: no leftover folder or type names in this feature.
- Publication dropdown + blockers panel match [frontend.md](frontend.md).
