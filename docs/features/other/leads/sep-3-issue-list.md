# Sep 3 issue list — Leads

Reclassified 2026-09-03. Website #87 already refused shrinking website
form `field_type` (website template catalog contracts). Leads side
remains. Bold numbers are original audit ids (not compacted).

## Doc gap

- **3. Website form field types vs four website lead columns**
  Comment: website item 7: do not cut `field_type`. Answers to
  `address` / `select` / `date` / `checkbox` still have nowhere to
  land.
  Action: child answers table, or say first-pass website forms are
  website-lead-only fields.

- **4. README overstates ads attribution**
  Comment: no `ad_id`; `source=ad` has no writer. Ads ADR 27 still
  wants per-ad ad leads (ads item 2).
  Action: soften to “when ad leads exist”, or add `ad_id` with that
  ads item.

## Actually drop

- **1. `leads.status` `contacted` / `closed`**
  Comment: only writer is insert `new`. Leads screen is later.
  Action: drop those values and the status index; re-add with the
  screen (CHECK swap).

- **2. `POST /v1/website-forms/{form_id}/uploads`**
  Comment: no `file` `field_type`, so “file fields” cannot call it.
  Action: drop the route until `file` exists.
