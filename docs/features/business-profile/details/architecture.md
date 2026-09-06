# Details — architecture

Flows and states. Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Tables: [persistence.md](persistence.md). HTTP: [api.md](api.md). Look:
[design decision record](design-decision-record.md). Decisions:
[ADR.md](ADR.md).

## Named identifiers

HTTP (same spelling in spec, Go, and tests), `internal/profile/details/`
**calls** `profile` `service.go`:

- `GetBusinessProfile` — hydrates `linked_facebook` from
  `facebook_profiles` and `linked_google_maps` from
  `etl.google_maps_listings` (photo from listing photos). Not fetch
  `raw`.
- `UpdateBusinessProfile` — **calls** `ApplyBusinessProfileIncrement`
- `UndoBusinessProfileEdit` — **calls** `ApplyBusinessProfileIncrement`

Certifications HTTP: `internal/profile/certifications/`
([certifications HTTP](../certifications/api.md)).
Reviews HTTP: `internal/profile/reviews/`
([reviews HTTP](../reviews/api.md)).

Tables: [persistence.md](persistence.md). DTOs and Routes:
[api.md](api.md). River job kind `reviews_ranking_for_display`:
[jobs.md](../jobs.md).

**Not Routes, still named:**

- `ApplyBusinessProfileIncrement` — one increment writer. `SELECT … FOR
  UPDATE` the profile row, insert one `business_profile_edits` row per
  field or list item actually set, `UPDATE` only those live columns or
  list rows in the same transaction. Owner click-off
  `PATCH /v1/business-profile` **calls** this. `update_details`
  **calls** this same function; it is not a second writer. Undo
  **calls** it with the inverse.
- `update_details` — one governed tool. Not a route. Website assistant,
  Ads generator, and later LLM callers invoke **this** tool — not a
  second Ads tool and not a website-assistant copy. Owner click-off
  stays PATCH (not this tool). Onboarding client interview stays its
  writer. Onboarding 06 does not call it. Unpaid website editor
  `update_details` **calls** this same function via
  `PATCH /v1/onboarding/business-profile` (**calls**
  `UpdateBusinessProfile`). Unpaid Revert is
  `POST /v1/onboarding/business-profile/edits/{id}/undo`. CMS
  `/v1/business-profile` stays **403** unactivated.

```text
update_details(
  field,     # live business profile field or list table
  op,        # set | clear | add | remove | update
  value?     # typed; omit on clear / remove
)
```

One field or list item per call. Applied immediately. Then the shared
[notification](../../../general-architecture/frontend.md). Revert is
`POST /v1/business-profile/edits/{id}/undo` (CMS) or
`POST /v1/onboarding/business-profile/edits/{id}/undo` (unpaid).
