# Sep 3 issue list — Leads

Reclassified 2026-09-03. Bold numbers are original audit ids (not
compacted). Closed 2026-09-04: items 1 and 4 (Leads screen + `ad_id`).
Closed 2026-09-06: items 2 and 3 (first-pass website-lead-only fields;
uploads parked until `file`).

## Closed

- **1. `leads.status` `contacted` / `closed`**
  Comment: only writer was insert `new`. Leads screen is specified:
  `PATCH /v1/leads/{lead_id}` writes Lead states. Keep the values and
  the status index.
  Closed: 2026-09-04.

- **2. `POST /v1/website-forms/{form_id}/uploads`**
  Comment: no `file` `field_type`, so “file fields” cannot call it.
  Closed: 2026-09-06. Parked until a `file` `field_type` exists
  ([website ADR](../../website/ADR.md) 35). Route is in leads
  [api.md](api.md) **Do not create**.

- **3. Website form field types vs four website lead columns**
  Comment: website item 7: first-pass website forms are website-lead-only
  fields.
  Closed: 2026-09-06. First-pass `field_key`s are `contact_name` /
  `marketing_phone` / `marketing_email` / `message`
  ([website ADR](../../website/ADR.md) 35). Extra types stay a later
  widen.

- **4. README overstates ads attribution**
  Comment: no `ad_id`; `source=ad` had no writer. Ads ADR 27 wanted
  per-ad ad leads.
  Action taken: `leads.ad_id` + `GET /v1/leads?source=ad`; ads detail
  links in (ads ADR 41). Ingest writer still later.
  Closed: 2026-09-04.
