# Website editing

How a user's edits reach the backend and appear in the frontend. "Think Wix": select, edit, see it
update, then save/publish.

## The loop

1. The editor canvas (the private Vite app) renders the **draft** through the shared public-site
   components — the same ones the published Astro site uses.
2. The user edits inline: click-to-edit visible text, swap an image, reorder / add / remove a
   section, change a design control, SEO, or the style preset.
3. The frontend calls a schema-validated **patch API** (`/api/v1/website/editor/...`).
4. The backend validates the change against the component contract, writes a **new draft page
   version**, and returns the updated editor projection.
5. The canvas re-renders from the returned projection.

The backend serves a typed **editor projection** — pages, sections, current slot values, validation
state, publish blockers, allowed controls, version metadata — and the frontend consumes that, never
raw records. Tokenized values (`{{business_name}}`) stay as tokens in the draft and show as small
inline variable chips in the editor.

## Every edit is a draft mutation

Each edit creates or updates a `website_page_versions` row; nothing is edited in place. Save,
publish, rollback, and approval all use the same versioning + audit path. Publish is always a
separate, explicit action.

## What each action does

All editor actions are CRUD on CMS records, but they differ in how much they touch:

| Action | Writes |
| --- | --- |
| edit text / image in a slot | `content_slots.value` + a new page version |
| change design controls / visibility | `website_sections.design` / `status` + a new page version |
| reorder sections | `website_sections.position` + a new page version |
| add / remove a section | `website_sections` + `content_slots` + a new page version |
| add a page | `website_pages` + `website_page_versions` + `website_sections` + `content_slots` |
| swap a component | a new draft version, preserving compatible slots |
| change the style preset | the draft's theme (applied only on explicit apply) |
| publish | materialize `website_publications` + `site_manifest` |

The Astro public runtime does **no per-edit work** — it is stateless and resolves the *published*
manifest on request. Editing only mutates draft records; the live site changes only on publish.
Previews render the draft in the editor (React + public-site-components), not through Astro.
