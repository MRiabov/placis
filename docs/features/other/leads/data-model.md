# Leads — data model

Conventions: [data-model conventions](../../../general-architecture/data-model.md).
`form_id` points at [website forms](../../website/data-model.md).

- `leads` — `id`, `tenant_id` fk, `source` (`public_form`), `form_id` nullable fk, `contact` jsonb,
  `message`, `status` (`new`/`contacted`/`closed`), `created_at`

## Indexes

Lookup: `(tenant_id, status, created_at)`.
