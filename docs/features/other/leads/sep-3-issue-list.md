# Sep 3 issue list — Leads

Reclassified 2026-09-03. Website #87 already refused shrinking website
form `field_type` (website template catalog contracts). Leads side
remains. Bold numbers are original audit ids (not compacted). Closed
2026-09-04: items 1 and 4 (Leads screen + `ad_id`).

## Doc gap

- **3. Website form field types vs four website lead columns**
  Comment: website item 7: do not cut `field_type`. Answers to
  `address` / `select` / `date` / `checkbox` still have nowhere to
  land.
  Action: child answers table, or say first-pass website forms are
  website-lead-only fields.

## Closed

- **1. `leads.status` `contacted` / `closed`**
  Comment: only writer was insert `new`. Leads screen is specified:
  `PATCH /v1/leads/{lead_id}` writes Lead states. Keep the values and
  the status index.
  Closed: 2026-09-04.

- **4. README overstates ads attribution**
  Comment: no `ad_id`; `source=ad` had no writer. Ads ADR 27 wanted
  per-ad ad leads.
  Action taken: `leads.ad_id` + `GET /v1/leads?source=ad`; ads detail
  links in (ads ADR 41). Ingest writer still later.
  Closed: 2026-09-04.

## Actually drop

- **2. `POST /v1/website-forms/{form_id}/uploads`**
  Comment: no `file` `field_type`, so “file fields” cannot call it.
  Action: drop the route until `file` exists. Still documented; do
  not implement until `file` exists.
