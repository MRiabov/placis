# Website — E2E test

One full-stack E2E test: edit → website publication → resolve → website rollback → public website
form. Drives `frontend-2` (Playwright) against the real API + real Postgres; the LLM is faked. DB
asserts name the tables from [data-model.md](data-model.md) (and
[leads](../other/leads/data-model.md) for the public website form).

1. **Open the website editor** — the owner opens the website editor.
   - UI: the website page list renders.
   - DB: reads `website_pages` for the tenant.

2. **Edit** — the owner edits a website section's text and swaps an image via the media library.
   - DB: `website_slots.value` (new text) and `website_sections` (new media asset id) are updated.
   - UI: the edit is visible in the canvas.

3. **Validate** — saving an invalid prop is rejected.
   - UI: inline error next to the field.

4. **Website publication** — the owner does a website publication.
   - DB: `website_publications` (status=`published`, `active=true`, `website_manifest`,
     `version_number`); `website_pages.published_version_id` updated.
   - UI: the live website is shown.

5. **Resolve** — the live website renders the published website copy (`website_manifest`).
   - Assert: the public website page shows the edited content.

6. **Website rollback** — the owner does a website rollback.
   - DB: an earlier `website_publications` is `active` again; earlier published website copies are
     never overwritten (both rows remain).
   - UI: the live website shows the earlier published website copy.

7. **Public website form → website lead** — a website visitor submits a website form.
   - DB: `leads` (source=`public_form`, form_id, `contact` jsonb, message, status=`new`) under the
     tenant.
