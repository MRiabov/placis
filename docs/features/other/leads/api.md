# Leads HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`.

**Auth none:** website-form POST. CORS allows the contractor website
`Host`. Worker does not proxy the POST.

Website form website visitor POST: named fields matching that website
form’s `field_key`s (`contact_name`, `marketing_phone`,
`marketing_email`, `message`). Extra keys 4xx. No leftover “values
object”. `POST /v1/website-forms/{form_id}/uploads` is parked until a
`file` `field_type` exists.

The list query **is** the source filter. Do not invent a second “by
website vs ads” route. HTTP `source` is `website` / `ad`. Persistence
`source` is `website_form` / `ad`.

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `LeadListQuery` | `source`, `website_prefix`, `ad_id`, `status` | List query. `source` optional `website` / `ad`. `status` optional `new` / `contacted` / `closed` |
| `LeadRead` | `id`, `source`, `website_prefix`, `ad_id`, `contact_name`, `marketing_phone`, `marketing_email`, `message`, `status`, `created_at` | List row. `source` is `website` / `ad`. `website_prefix` nullable. `ad_id` nullable |
| `LeadListRead` | `items: []LeadRead` | Newest first |
| `LeadUpdate` | `status` | `new` / `contacted` / `closed` |
| `WebsiteFormSubmissionCreate` | `contact_name`, `marketing_phone`, `marketing_email`, `message` | Public POST body. Named fields matching that website form’s `field_key`s |

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/website-forms/{form_id}/submissions` | contractor website React island (website form) | `WebsiteFormSubmissionCreate` | `LeadRead` | `website_forms`, `website_form_fields` | `leads` | Insert `source=website_form`, `status=new`, map named fields onto `contact_name`, `marketing_phone`, `marketing_email`, `message` | Extra keys 4xx | Values object; Worker proxy |
| `GET /v1/leads` | Leads; ads-detail link | `LeadListQuery` | `LeadListRead` | `leads`, `website_forms`, `websites`, `ads` | | See overflow | `source=website` without `website_prefix` 4xx; `source=website` with `ad_id` 4xx; `source=ad` with `website_prefix` 4xx | A second list route |
| `PATCH /v1/leads/{lead_id}` | Leads row status | `LeadUpdate` | `LeadRead` | `leads` | `leads.status` | Status only | Unknown id 404 | Contact fields; `source` |

### GET /v1/leads

Omit `source` for All. `source=website` **reads** `websites` where
`website_prefix` matches (required). `source=ad` lists ad leads;
`ad_id` optional (omit = every ad). `status` is secondary. Newest
`created_at` first.

## Do not create

- `/v1/public/forms/…`
- `/v1/files`
- `POST /v1/website-forms/{form_id}/uploads` until a `file` `field_type`
  exists
- A per-ad list route besides `GET /v1/leads?source=ad&ad_id=`
