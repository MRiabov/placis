# Leads — data model

Website leads (and later ad leads) persist here.
Conventions: [data-model conventions](../../../general-architecture/data-model.md).
`website_form_id` points at [website forms](../../website/data-model.md).

- `leads` — `id`, `tenant_id` fk, `source` (`website_form`; later `ad`), `website_form_id` nullable fk,
  `contact` jsonb, `message`, `status` (`new`/`contacted`/`closed`), `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)`.
