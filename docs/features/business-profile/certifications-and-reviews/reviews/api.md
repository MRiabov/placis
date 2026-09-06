# Reviews HTTP

Conventions: [HTTP conventions](../../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../../docs-conventions.md#named-identifiers).
One Profile **screen** with certifications:
[certifications and reviews](../README.md). [ADR](../ADR.md) 1.
Rows: [business profile persistence](../../details/persistence.md).
Go: `internal/profile/reviews/`. Dos **call** `profile` `service.go`.

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Unactivated **403** on this tree.

HTTP functions (same spelling in spec, Go, and tests):
`GetBusinessProfileReviews`, `UpdateBusinessProfileReviews`,
`ArchiveBusinessProfileReview`, `UnarchiveBusinessProfileReview`,
`CreateBusinessProfileReview`, `ImportBusinessProfileReviews`.

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `ReviewRead` | `id`, `author_name`, `rating`, `body`, `citation`, `published_at`, `language`, `origin`, `is_top`, `top_position`, `status` | Pool / archive row. `is_top` / `top_position` hydrate from latest `business_profile_review_rankings` |
| `ReviewListGet` | `status` | Query. Defaults `in_pool` (`in_pool` / `archived`) |
| `ReviewListRead` | `reviews: []ReviewRead`, `top_reviews_provisional` | Pool hydrate; **top reviews** first when `in_pool`. `top_reviews_provisional` from the latest ranking batch, not the profile |
| `ReviewCreate` | `author_name`, `rating`, `body`, `published_at` | Owner-written create. `rating` 1–5; `body` `maxLength` 500; `published_at` optional |
| `ReviewTopUpdate` | `review_ids[]` | Featured-first ordered top set. Max 30. No `top_position` |
| `ReviewImportCreate` | | Import from the linked Maps listing and/or Facebook URL. Empty body |

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/business-profile/reviews` | Certifications and reviews; website editor reviews Content **add** | `ReviewListGet` | `ReviewListRead` | `business_profile_reviews`, `business_profile_review_rankings` | | See overflow | | Rewrite `website_slot_reviews` |
| `PATCH /v1/business-profile/reviews` | Certifications and reviews pin / unpin / reorder | `ReviewTopUpdate` | `ReviewListRead` | `business_profile_reviews`, `business_profile_review_rankings` | `business_profile_review_rankings`, `business_profile_edits` | See overflow | `400` longer than 30, duplicate id, or id not `in_pool` | Website editor pin; rewrite `website_slot_reviews` |
| `PATCH /v1/business-profile/reviews/{id}/archive` | Certifications and reviews | | `ReviewRead` | `business_profile_reviews` | `business_profile_reviews`, `business_profile_review_rankings`, `website_slot_reviews`, `business_profile_edits` | See overflow | `404` | `DELETE` |
| `PATCH /v1/business-profile/reviews/{id}/unarchive` | Toast Undo; Archive list | | `ReviewRead` | `business_profile_reviews` | `business_profile_reviews`, `business_profile_edits` | See overflow | `404` | Auto-pin; auto-add onto website sections |
| `POST /v1/business-profile/reviews` | `/cms/certifications-and-reviews/new` | `ReviewCreate` | `ReviewRead` | `business_profiles` | `business_profile_reviews`, `business_profile_edits` | See overflow | `400` | Patch imported Google/Facebook reviews |
| `POST /v1/business-profile/reviews/import` | Certifications and reviews toolbar | `ReviewImportCreate` | `ReviewListRead` | `business_profiles` | `business_profile_reviews`, `business_profile_edits` | See overflow | `409` if neither URL is linked | Truncate `body`; recreate `archived` external ids |

### GET /v1/business-profile/reviews

Default lists the **pool** (`status=in_pool`), **top reviews** first
(`is_top`, then `top_position` from the latest ranking join), plus
`top_reviews_provisional` from that ranking batch. Archived rows only
when `ReviewListGet.status=archived`.
Website editor reviews Content uses this pool to **add** a review onto
**that website section**; that website section’s ordered ids live on
the website editor GET/PATCH (`website_slot_reviews`). Details owns the
rows; this Register owns the HTTP.

### PATCH /v1/business-profile/reviews

The new top set as ordered `review_ids[]` (featured-first, max 30, each
id `in_pool`, no duplicates). Inserts a ranking batch: `is_top` + dense
`top_position` 1…n from that list, `algorithm=human`,
`provisional=false`; unpinned `in_pool` rows get `is_top=false`. The
request does not include `top_position`. New pin appends as least
featured. Does **not** UPDATE pin columns on the review row. Does
**not** rewrite `website_slot_reviews`. Website editor reviews Content
does **not** call this.

### PATCH /v1/business-profile/reviews/{id}/archive

Leaves the pool and top reviews, inserts a ranking row with
`is_top=false` so latest is not a stale pin, and drops that id from
every `website_slot_reviews` array (then compact). Archive is not
delete: archived imported rows stay so re-import does not duplicate
that external id.

### PATCH /v1/business-profile/reviews/{id}/unarchive

Returns the row to the pool (not automatically top, not automatically
back onto website sections). Toast Undo is unarchive.

### POST /v1/business-profile/reviews

Owner-written review: `origin=owner`, lands in the pool. Owner-written
rows are editable after create (same fields). Imported Google/Facebook
reviews are not patched this way.

### POST /v1/business-profile/reviews/import

Import from the linked `google_maps_listing_url` and/or
`facebook_profile_url` on the live business profile. Safe to retry on
external id. Skip `archived` rows (do not recreate). Import does
**not** truncate `body`. The review citation is filled by ETL
transform; empty review citation falls back to `body` until then.

## Do not create

- Rewrite `website_slot_reviews` from this pin HTTP
- `DELETE` for archive
- a second reviews Register on Details HTTP
