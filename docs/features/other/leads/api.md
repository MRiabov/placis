# Leads HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Website visitors submit
website forms. No CMS website-leads console in this slice. Website E2E covers website form →
website lead ([website testing](../../website/testing.md)).

## OpenAPI opacity

Website form website visitor POST: closed fields matching that website form’s `fields[]`. Extra keys
4xx. No leftover “values object”. Uploads compose the `files` table under this resource, not
`/v1/files`.

## Complete

### POST /v1/website-forms/{form_id}/submissions

- **Auth:** none. CORS allows the contractor website `Host`.
- **Callers:** contractor website React island (website form). Worker does not proxy the POST.
- **Idempotency-Key:** yes.
- **Request:** closed fields for that website form (`text` / `textarea` / `email` /
  `marketing_phone` / …). Extra keys 4xx.
- **Behavior:** insert `leads` row (source, website form, contact name, marketing phone,
  marketing email, message, status).

### POST /v1/website-forms/{form_id}/uploads

- **Auth:** none. Same CORS as submissions.
- **Callers:** website form file fields.
- **Idempotency-Key:** yes.
- **Response:** signed URL (`string` + `maxLength`). Completes onto a `files` row owned
  by this submission path.

## Do not create

- `/v1/public/forms/…`
- `/v1/files`
- CMS website-leads list/detail HTTP (later)
