# Leads — persistence

Website leads (and later ad leads) persist here. Conventions:
[persistence conventions](../../../general-architecture/persistence.md) (Postgres schema `leads`). `website_form_id` points at
[website forms](../../website/persistence.md).

- `leads` — `id`, `tenant_id` fk, `source` (`website_form`; later `ad`),
  `website_form_id` nullable fk, `contact_name`, `marketing_phone`,
  `marketing_email`, `message`, `status` (`new`/`contacted`/`closed`),
  `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)`.

Later console filters website leads by website via join
`leads.website_form_id` → `website_forms.website_id`. Do not add
`leads.website_id`.
