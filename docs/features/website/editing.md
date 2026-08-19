# Website editing

How an owner's edits reach the backend and appear in the frontend. "Think Wix": select, edit, see
it update, then website publication.

## The loop

1. The website editor canvas (`frontend-2`) renders the **unpublished website** through the
   shared contractor-website component package — the same ones the live website (Astro) uses.
2. The owner edits inline: click-to-edit visible text, swap an image, reorder / add / remove a
   website section, change a design control, SEO, or the website style catalog preset.
3. The frontend calls a schema-validated **patch API** (`/api/v1/website/editor/...`).
4. The backend validates the change against the website component contract and **upserts** the
   unpublished website rows.
5. The canvas re-renders from the updated website editor projection.

The backend serves a typed **website editor projection** — website pages, website sections, current
website slot values, validation status, website publication blockers, allowed controls — and the
frontend consumes that, never raw records. Tokenized values
(`{{business_name}}`) stay as tokens in the unpublished website and show as small inline variable
chips in the website editor.

## Edits mutate unpublished rows; website publication writes a website version

- **Edit = mutation** — an edit upserts the unpublished website rows in place: text/image →
  `website_slots.value`, design/visibility → `website_sections.design` / `status`, position →
  `website_sections.position`, add/remove a website section → `website_sections` + `website_slots`.
- **Website publication** — writes a website version: `website_publications` + `website_manifest`
  (a published website copy) from the current unpublished website.

Website publication is always a separate, explicit action. Do not write a per-page version table.

## Models

The website editor is one typed **projection** (read) and one **patch** (write).

### Read — the website editor projection

`GET /api/v1/website/editor/pages/{page_id}` returns:

- `tenant` (id, website address, name); `page` (id, path / website page path, title,
  page_type, status, validation status,
  website-publication-blocker count).
- `seo_title`, `seo_description`, `seo_og_title`, `seo_og_description`, `seo_canonical_url`,
  `seo_noindex`, `seo_primary_keyword`; `theme` (website style catalog preset + overrides).
- `sections[]` — each: `id`, `page_id`, `component_id` (+ `component_version`, `schema_version`,
  `family`, `variant`), `position`, `status`, `visible`, `props`, `design`, `slots[]`,
  `design_controls[]`, `origin`, `unsupported_component`.
- `media_assets[]`, `forms[]` (website forms), top menu and footer
  (`top_menu_items`, `footer_items`).
- `publication` (active website version + `has_unpublished_changes`),
  `validation`.
- `preview_url`, live website URL. The website editor canvas is not a website preview.

A **website slot** (`sections[].slots[]`): `id`, `key`, `type`, `label`, `required`, `max_length`,
`value` (typed), `status`, `origin`, `validation_errors`.

A **design control** (`sections[].design_controls[]`): `key`, `type`, `label`, `values[]`, `default`,
`value`.

### Write — the patch

`PATCH /api/v1/website/editor/pages/{page_id}` takes a website page patch whose `sections[]` carry
the edits. To update a website slot you send:

```json
{ "sections": [ { "id": "<section id>", "slots": [
    { "key": "headline", "type": "text", "value": "Roof repairs across Dublin", "status": "unpublished" }
] } ] }
```

- **website slot patch** — `key`, `type`, `value`, `status` (`label` optional).
- **website section patch** — `id`, `component_id` (optional swap), `component_version`, `visible`,
  `design`, `slots[]`.
- **website section create** — `component_id`, `component_version`, `position`, `props`, `design`,
  `origin`.
- **website section order** — `ordered_section_ids[]`.
- **website page create** — `path`, `title`, `page_type`, SEO columns, unpublished content.
- **website form patch** — `website_form_id`, `title`, `submit_action`, `fields[]` (typed form
  field rows), `privacy_notice`.

## What each action does

All website editor actions are CRUD on the unpublished website records. Website publication writes
a website version.

| Action | Mutation (unpublished website rows) |
| --- | --- |
| edit text / image in a website slot | `website_slots.value` |
| change design controls / visibility | `website_sections.design` / `status` |
| reorder website sections | `website_sections.position` |
| add / remove a website section | `website_sections` + `website_slots` |
| add a website page | `website_pages` + `website_sections` + `website_slots` |
| swap a website component | `website_sections.component_id` (preserving compatible website slots) |
| change the website style catalog preset | the website page's theme (applied only on explicit apply) |

Website publication writes `website_publications` + `website_manifest` (a website version).

The Astro contractor website application (`apps/public-site`) does **no per-edit work** — it is
stateless and resolves the *published website copy* (`website_manifest`) on request. Editing only
mutates unpublished website records; the live website changes only on website publication. The
website editor canvas renders the unpublished website (React + that package), not
through Astro. That canvas is not a website preview.
