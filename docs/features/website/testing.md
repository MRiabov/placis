# Website — E2E test

One full-stack E2E test: edit → assistant → website publication → live HTML
(fake R2 + fake purge) → website rollback → website form. Drives `frontend-2`
(Playwright) against the real API + real Postgres; the LLM is faked. Cloudflare
is faked (Custom Hostnames, `purge_cache`, R2). Apply the website template is
the [onboarding E2E](../onboarding/testing.md). DB asserts name the tables from [persistence.md](persistence.md) (and
[leads](../other/leads/persistence.md) for the website form).

1. **Open the website editor** — the owner opens the website editor.
   - UI: the website page list renders.
   - DB: reads `website_pages` for the tenant.

2. **Edit** — the owner edits a website section's text and swaps an image via
   the media library panel (drop a file onto the left panel, or drag a photo
   onto the canvas).
   - DB: `website_slots.value` (new text) and `website_sections` (new media
     asset id) are updated; `edit_history` has a human batch;
     `website_settings.edit_history_head` moved.
   - UI: the edit is visible in the canvas.

3. **Validate** — saving an invalid prop is rejected.
   - UI: inline error next to the field.

4. **Assistant** — the owner asks the assistant to improve copy (LLM faked).
   - UI: proposal on the canvas; **Apply** PATCHes dirty keys then
     `record-apply`.
   - DB: a website slot value changes through that PATCH; `ai_generations`
     records the batch; `edit_history` has an agent batch.
   - UI: muted tool-call rows in the thread. Apply / Reject pills on the canvas
     over the composer if Ask first; no revert-after-apply.

5. **Website publication** — the owner does a website publication.
   - DB: `website_publications` (status=`published`, `active=true`,
     `website_manifest`, `version_number` — a website version).
   - Fake: R2 keys `sites/{website_prefix}/{version_number}/` then `…/latest/`,
     plus `purge_cache` for live website page URLs (and sitemap, robots, WebP)
     on every active hostname. No live Cloudflare.
   - UI: the live website is shown when a website address is `active`; otherwise
     the owner still uses the preview website address.

   Canceled-subscription Publish is the billing E2E
   ([billing testing](../billing/testing.md)), not this happy path.

6. **Live website** — the published website copy is the files in `latest/`, not
   a Go resolve.
   - Assert: fake R2 objects for the edited website page; live GET does not call
     Go.

7. **Website rollback** — the owner does a website rollback to an earlier
   **owner** website version (onboarding v1/v2 are not listed).
   - DB: an earlier `website_publications` is `active` again; earlier published
     website copies are never overwritten (both rows remain). Unpublished rows
     are unchanged.
   - UI: the dropdown updates from the rollback `*Read`; the live website shows
     the earlier published website copy. Website versions: rollback on earlier
     owner website versions; Preview on the live website version.

8. **Website form → website lead** — a website visitor submits a website form.
   - DB: `leads` (source=`website_form`, `website_form_id`, `contact_name`,
     `marketing_phone`, `marketing_email`, message, status=`new`) under the
     tenant.
