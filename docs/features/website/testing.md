# Website — E2E test

One full-stack E2E test: edit → website assistant → website publication → resolve → website
rollback → website form. Drives `frontend-2` (Playwright) against the real API + real Postgres;
the LLM is faked. Apply the website template is the [onboarding E2E](../onboarding/testing.md).
DB asserts name the tables from [data-model.md](data-model.md) (and
[leads](../other/leads/data-model.md) for the website form).

1. **Open the website editor** — the owner opens the website editor.
   - UI: the website page list renders.
   - DB: reads `website_pages` for the tenant.

2. **Edit** — the owner edits a website section's text and swaps an image via the media library.
   - DB: `website_slots.value` (new text) and `website_sections` (new media asset id) are updated.
   - UI: the edit is visible in the canvas.

3. **Validate** — saving an invalid prop is rejected.
   - UI: inline error next to the field.

4. **Website assistant** — the owner asks the website assistant to improve copy (LLM faked).
   - DB: a website slot value changes through a governed tool; `ai_generations` records the batch.
   - UI: activity card; revert last website assistant batch is offered.

5. **Website publication** — the owner does a website publication.
   - DB: `website_publications` (status=`published`, `active=true`, `website_manifest`,
     `version_number` — a website version).
   - UI: the live website is shown.

6. **Resolve** — the live website renders the published website copy (`website_manifest`).
   - Assert: the contractor website page shows the edited content.

7. **Website rollback** — the owner does a website rollback.
   - DB: an earlier `website_publications` is `active` again; earlier published website copies are
     never overwritten (both rows remain).
   - UI: the live website shows the earlier published website copy.

8. **Website form → website lead** — a website visitor submits a website form.
   - DB: `leads` (source=`website_form`, `website_form_id`, `contact_name`, `marketing_phone`,
     `marketing_email`, message, status=`new`) under the tenant.
