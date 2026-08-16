# Website — E2E test

One full-stack E2E test: edit → publish → resolve → rollback → public form. Drives `frontend-2`
(Playwright) against the real API + real Postgres; the LLM is faked. DB asserts name the tables
from the data model.

1. **Open the editor** — the user opens the CMS.
   - UI: the page list renders.
   - DB: reads `website_pages` for the tenant.

2. **Edit** — the user edits a section's text and swaps an image via the media gallery.
   - DB: `content_slots.value` (new text) and `website_sections` (new asset id) are updated.
   - UI: the edit is visible in the canvas.

3. **Validate** — saving an invalid prop is rejected.
   - UI: inline error next to the field.

4. **Publish** — the user publishes.
   - DB: `website_publications` (status=`published`, `active=true`, `site_manifest`,
     `version_number`); `website_pages.published_version_id` updated.
   - UI: the site is live.

5. **Resolve** — the public site renders the published manifest.
   - Assert: the public page shows the edited content.

6. **Rollback** — the user rolls back.
   - DB: an earlier `website_publications` is `active` again; history is untouched (both rows
     remain).
   - UI: the public site shows the earlier version.

7. **Public form → lead** — a visitor submits a form.
   - DB: `leads` (source=`public_form`, form_id, `contact` jsonb, message, status=`new`) under the
     tenant.
