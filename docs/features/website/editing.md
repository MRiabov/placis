# Website editing

How a user's edits reach the backend and appear in the frontend. "Think Wix": select, edit, see it
update, then save/publish.

## The loop

1. The editor canvas (the private Vite app) renders the **draft** through the shared public-site
   components — the same ones the published Astro site uses.
2. The user edits inline: click-to-edit visible text, swap an image, reorder / add / remove a
   section, change a design control, SEO, or the style preset.
3. The frontend calls a schema-validated **patch API** (`/api/v1/website/editor/...`).
4. The backend validates the change against the component contract and **upserts** the live rows.
5. The canvas re-renders from the updated editor projection.

The backend serves a typed **editor projection** — pages, sections, current slot values, validation
state, publish blockers, allowed controls, version metadata — and the frontend consumes that, never
raw records. Tokenized values (`{{business_name}}`) stay as tokens in the draft and show as small
inline variable chips in the editor.

## Edits mutate; saves version

There are two layers, not one:

- **Edit = mutation** — an edit upserts the live rows in place: text/image → `content_slots.value`,
  design/visibility → `website_sections.design` / `status`, position → `website_sections.position`,
  add/remove a section → `website_sections` + `content_slots`.
- **Save = version** — saving snapshots the live content into an immutable `website_page_versions`
  row (append-only), validates it, and advances `website_pages.current_version_id`. Versions are
  created at explicit save / approve / publish checkpoints — not on every keystroke.
- **Publish** — materializes `website_publications` + `site_manifest` from the current version.

Publish is always a separate, explicit action.

## What each action does

All editor actions are CRUD on the live CMS records; save snapshots them into a version.

| Action | Mutation (live rows) |
| --- | --- |
| edit text / image in a slot | `content_slots.value` |
| change design controls / visibility | `website_sections.design` / `status` |
| reorder sections | `website_sections.position` |
| add / remove a section | `website_sections` + `content_slots` |
| add a page | `website_pages` + `website_sections` + `content_slots` |
| swap a component | `website_sections.component_id` (preserving compatible slots) |
| change the style preset | the page's theme (applied only on explicit apply) |

Saving any of the above appends a `website_page_versions` snapshot. Publishing materializes
`website_publications` + `site_manifest`.

The Astro public runtime does **no per-edit work** — it is stateless and resolves the *published*
manifest on request. Editing only mutates draft records; the live site changes only on publish.
Previews render the draft in the editor (React + public-site-components), not through Astro.
