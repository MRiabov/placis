# Leads — persistence

Website leads and ad leads persist here. Conventions:
[persistence conventions](../../../general-architecture/persistence.md)
(Postgres schema `leads`). Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
`website_form_id` points at
[website forms](../../website/persistence.md). `ad_id` points at
[ads](../../ads/persistence.md).

List by `website_prefix` **reads** `website_forms` then `websites`.
Do not denormalize `website_prefix` onto this table.

## Tables

### `leads`

- **Columns:** `id` uuid pk, `tenant_id` fk, `source` text,
  `website_form_id` uuid nullable fk → `website_forms`, `ad_id` uuid
  nullable fk → `ads`, `meta_lead_id` text nullable, `contact_name`
  text, `marketing_phone` text, `marketing_email` text, `message`
  text, `status` text, `created_at` timestamptz
- **Enums:** `source` → `website_form` / `ad`; `status` → `new` /
  `contacted` / `closed`
- **Uniques:** `id`; nullable unique `(tenant_id, meta_lead_id)`
- **Written by:** `POST /v1/website-forms/{form_id}/submissions`
  (`source=website_form`, `status=new`);
  `PATCH /v1/leads/{lead_id}` (`status`); ad-lead ingest later
  (`source=ad`, `ad_id`, `meta_lead_id`)
- **Notes:** `website_form_id` set iff `source=website_form`. `ad_id`
  set iff `source=ad`. `meta_lead_id` is Meta’s lead id; no ingest
  writer in this slice. Insert always `status=new`.

## Indexes

Lookup: `(tenant_id, source, created_at)`. Status filter:
`(tenant_id, status, created_at)`. Website list joins
`website_forms.website_id` → `websites.website_prefix`. Ad list:
`(tenant_id, ad_id, created_at)` where `ad_id` is not null.
