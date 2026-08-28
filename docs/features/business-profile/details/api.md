# Details HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md). Live business profile the rest of the app
reads. Projects: [projects HTTP](../projects/api.md). Onboarding resume is [onboarding `/profile`](../../onboarding/api.md),
not this resource.

## Serve only types on HTTP

Profile history is typed `business_profile_edits` increments — never a `details`
jsonb dump. `GET`/`PATCH` fields are the columns and list tables in
[persistence.md](persistence.md). Validation errors: `string[]` with `maxLength` per item.

## Complete

### GET /v1/business-profile

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/details` (Business details). Website editor `*Read` may
  **embed** display name / marketing phone for website placeholders; it does not
  own this resource.
- **Response:** live business profile `*Read` (who they are, contact, where,
  services, legal, opening hours, Facebook URL, Google Maps listing URL, logo).
  When Facebook or the Google Maps listing is linked, the `*Read` includes that
  profile’s name, photo, rating, and review count (not only the URL). No
  profile-history timeline.

### PATCH /v1/business-profile

- **Auth:** Clerk JWT, active tenant
- **Callers:** Business details save on click-off (no Save control).
- **Idempotency-Key:** yes.
- **Request:** dirty keys only (scalars + list-item ops), not a full-row dump.
  Writes `business_profile_edits` and the live business profile in one
  transaction. `update_details` calls this same increment function; it is not a
  second writer.
- **Must not:** profile-history timeline HTTP; merge-in-memory rewrite of the
  whole row.

### POST /v1/business-profile/edits/{id}/undo

- **Auth:** Clerk JWT, active tenant
- **Callers:** notification **Revert** after `update_details`. **OK** does not
  call this. Leaving the screen without Revert keeps the write.
- **Idempotency-Key:** yes.
- **Behavior:** undo that `business_profile_edits` increment (replay the inverse
  onto the live row, append a compensating increment). `409` if that id is
  already undone or is not the increment the notification named.
- **Must not:** website edit-history undo; a second surface-specific revert
  route.

### GET /v1/business-profile/certifications / PUT /v1/business-profile/certifications

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/certifications-and-reviews`.
- **PUT Idempotency-Key:** yes.
- **Response:** selected accreditations plus `available[]` (definitions for that
  country; do not key `available[]` off a closed trade enum). Persistence is
  `certification_definitions` + `business_profile_certification_selections`;
  those are tables, not an HTTP collection.
- **Must not:** `/v1/certification-selections` or `/v1/certifications` as a peer
  resource.

### GET /v1/business-profile/reviews

- **Auth:** Clerk JWT, active tenant
- **Callers:** Certifications and reviews screen. Website editor reviews Content
  uses this pool to **add** a review onto **that website section**; that website
  section’s ordered ids live on the website editor GET/PATCH
  (`website_slot_reviews`). Details owns the rows.
- **Response:** the **pool** (`status=in_pool`), **top reviews** first
  (`is_top`, then `top_position`). Archived rows only when listing the archive.

### PATCH /v1/business-profile/reviews (top / order)

- **Auth:** Clerk JWT, active tenant
- **Callers:** Certifications and reviews only (pin / unpin / reorder
  **top reviews** for ads). Website editor reviews Content does **not** call
  this; it PATCHes that website section’s `review_ids[]`.
- **Idempotency-Key:** yes.
- **Request:** the new top set as ordered `review_ids[]` (featured-first, max
  30, each id `in_pool`, no duplicates). The server writes `is_top` + dense
  `top_position` 1…n from that list; the request does not include
  `top_position`. New pin appends as least featured. Longer than 30, a duplicate
  id, or an id not in the pool is `400`. Does **not** rewrite
  `website_slot_reviews`.

### PATCH /v1/business-profile/reviews/{id}/archive and …/unarchive

- **Auth:** Clerk JWT, active tenant
- **Callers:** Certifications and reviews. Archive leaves the pool and top
  reviews, and drops that id from every `website_slot_reviews` array (then
  compact). Unarchive returns the row to the pool (not automatically top, not
  automatically back onto website sections). Toast Undo is unarchive.

### POST /v1/business-profile/reviews

- **Auth:** Clerk JWT, active tenant
- **Callers:** `/cms/certifications-and-reviews/new` (and later edit of
  owner-written rows).
- **Idempotency-Key:** yes.
- **Request:** owner-written review: `author_name`, `rating` 1–5, `body`
  (`maxLength` 500), optional date. `origin=owner`. Lands in the pool.
  Owner-written rows are editable after create (same fields). Imported
  Google/Facebook reviews are not patched this way.

### POST /v1/business-profile/reviews/import

- **Auth:** Clerk JWT, active tenant
- **Callers:** Certifications and reviews toolbar (Google Maps listing and the
  linked Facebook URL).
- **Idempotency-Key:** yes.
- **Request:** import from the linked `google_maps_listing_url` and/or
  `facebook_profile_url` on the live business profile. Safe to retry on external
  id. Skip `archived` rows (do not recreate). Import does **not** truncate
  `body`. The review citation is filled by the onboarding extract (or later the
  same extract); empty review citation falls back to `body` until then.

## `update_details` (one governed tool)

Not a route. One tool, one implementation: the same increment function as
`PATCH /v1/business-profile`. Website assistant, Ads generator, and later LLM
callers invoke **this** tool — not a second Ads tool and not a website-assistant
copy. Owner click-off stays PATCH (not this tool). Onboarding client interview
stays its writer. Onboarding 06 does not call it.

```text
update_details(
  field,     # live business profile field or list table
  op,        # set | clear | add | remove | update
  value?     # typed; omit on clear / remove
)
```

One field or list item per call. Applied immediately. Then the shared
[notification](../../../general-architecture/frontend.md). Revert is
`POST /v1/business-profile/edits/{id}/undo`.

## Do not create

- `/v1/website/editor/business-profile`
- `/v1/certification-selections`, `/v1/certifications`
- profile-history / replay HTTP (except
  `POST /v1/business-profile/edits/{id}/undo`)
- a second Details tool or Details-write HTTP for Ads or the website assistant
