# Website — E2E test

One full-stack E2E test: edit → assistant → website publication → live HTML
(fake R2 + fake purge) → website rollback → website form. Select and copy
the website template is the [onboarding E2E](../onboarding/testing.md).
Canceled-subscription Publish is the
[billing testing](../billing/testing.md) E2E, not this happy path. DB
asserts name the tables from [persistence.md](persistence.md) (and
[leads](../other/leads/persistence.md) for the website form).

## E2E

### Edit through website form

#### Setup

Playwright drives `frontend-2` against the real API + real Postgres.
Worker **container** is up (no `wrangler deploy`). 01/02 already ran
(`website_pages` / `website_sections` / `website_slots` /
`website.menus` / `website_forms` / `website_settings` exist). This
journey does not re-assert 02 Persist.

#### Invoke

1. **Open the website editor** — the owner opens the website editor.
2. **Edit** — the owner edits a website section's text and swaps an
   image via the media library panel (drop a file onto the left panel,
   or drag a photo onto the canvas). Request `WebsitePageUpdate`;
   Response `WebsiteEditApplyRead`.
3. **Assistant** — the owner asks the assistant to improve copy.
   **Apply** PATCHes dirty keys then `record-apply`.
4. **Website publication** — Request `WebsitePublicationCreate`;
   `PublishWebsite` **calls** `websitePublication` and **sends**
   `WebsitePublicationRequest`.
5. **Live website** — GET the published website copy in `latest/`.
6. **Website rollback** — the owner does a website rollback to an
   earlier **owner** website version (onboarding v1/v2 are not listed).
7. **Website form → website lead** — a website visitor submits a
   website form (reads existing `website_forms` from 02).

#### Assert

1. **Open** — UI: the website page list renders. DB: reads
   `website_pages` for the tenant.
2. **Edit** — **persists into** `website_slots.value` (new text and, on
   image swap, `media_asset_id`); `edit_history` has a human batch;
   `website_settings.edit_history_head` moved. UI: the edit is visible
   in the canvas.
3. **Assistant** — **persists into** `website_slots` through that
   PATCH; `ai_generations` records the batch (`cms_assistant` thread);
   `edit_history` has an agent batch. UI: muted tool-call rows in the
   thread. Apply / Reject pills on the canvas over the composer if Ask
   first; no revert-after-apply.
4. **Website publication** — 03 must not have written
   `website_publications` / R2. **persists into**
   `website_publications` (`status=published`, `active=true`,
   `website_manifest`, `version_number` — a website version). Fake R2
   keys `sites/{website_prefix}/{version_number}/` then `…/latest/`,
   plus `purge_cache` for live website page URLs (and sitemap, robots,
   WebP) on every active hostname. No live Cloudflare. No website image
   render on the publication response. UI: the live website is shown
   when a website address is `active`; otherwise the owner still uses
   the preview website address.
5. **Live website** — fake R2 objects for the edited website page; live
   GET does not call Go.
6. **Website rollback** — an earlier `website_publications` is `active`
   again; earlier published website copies are never overwritten (both
   rows remain). Unpublished `website_pages` / `website_slots` are
   unchanged. UI: the dropdown updates from the rollback `*Read`; the
   live website shows the earlier published website copy. Website
   versions: rollback on earlier owner website versions; Preview on the
   live website version.
7. **Website form** — **persists into** `leads` (`source=website_form`,
   `website_form_id`, `contact_name`, `marketing_phone`,
   `marketing_email`, message, `status=new`) under the tenant.

#### Fail

Saving an invalid prop is rejected. UI: inline error next to the field.

#### Mocked

LLM. Cloudflare R2 / Custom Hostnames / `purge_cache`. Worker is real
(container).
