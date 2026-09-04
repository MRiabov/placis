# Details HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Live business profile the rest of the app reads. Projects:
[projects HTTP](../projects/api.md). Onboarding resume is
[onboarding `GET /v1/onboarding/profile`](../../onboarding/api.md),
not this resource.

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Extra keys 4xx. Validation errors: `string[]` with
`maxLength` per item.

Profile history is typed `business_profile_edits` increments — never a
`details` jsonb dump. `GET` / `PATCH` fields are the columns and list
tables in [persistence.md](persistence.md). `update_details` and the
increment writer live in [architecture.md](architecture.md). Distinct
from `WebsiteBusinessProfileRead`
([website HTTP](../../website/api.md)) and
`OnboardingLiveBusinessProfileRead`
([onboarding HTTP](../../onboarding/api.md)).

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `BusinessProfileRead` | `trade`, `display_name`, `legal_name`, `description`, `established_year`, `company_number`, `vat_number`, `vat_registration_status`, `incorporation_date`, `registered_office`, `contact_name`, `marketing_phone`, `emergency_phone`, `marketing_email`, `existing_site_url`, `google_maps_listing_url`, `facebook_profile_url`, `founder_name`, `founder_role`, `founder_occupation`, `founder_nationality`, `founder_country_of_residence`, `founder_appointed_on`, `founder_media_asset_id`, `logo_media_asset_id`, `last_edit_id`, `services: []BusinessProfileServiceRead`, `service_areas: []BusinessProfileServiceAreaRead`, `opening_hours: []BusinessProfileOpeningHoursRead`, `linked_facebook: LinkedFacebookProfileRead`, `linked_google_maps: LinkedGoogleMapsListingRead` | Live row hydrate. Linked cards nullable until the URL is linked. No profile-history timeline. No `brand_*` / `trading_name` / `legal_form` / `company_status` / ranking columns |
| `BusinessProfileUpdate` | dirty keys of the scalar `BusinessProfileRead` fields plus `services: []BusinessProfileServiceOp`, `service_areas: []BusinessProfileServiceAreaOp`, `opening_hours: []BusinessProfileOpeningHoursOp` | PATCH body. Omit = no change. Not a full-row dump |
| `BusinessProfileServiceRead` | `id`, `name`, `description`, `website_page_path` | Featured service list row |
| `BusinessProfileServiceOp` | `op`, `id`, `name`, `description`, `website_page_path` | List-item op. `op` → `add` / `remove` / `update`. `id` required on `remove` / `update` |
| `BusinessProfileServiceAreaRead` | `id`, `locality`, `radius_km` | Google Maps territory card |
| `BusinessProfileServiceAreaOp` | `op`, `id`, `locality`, `radius_km` | List-item op. Same `op` as services |
| `BusinessProfileOpeningHoursRead` | `id`, `day_of_week`, `opens_at`, `closes_at`, `closed` | One range per weekday |
| `BusinessProfileOpeningHoursOp` | `op`, `id`, `day_of_week`, `opens_at`, `closes_at`, `closed` | List-item op. Same `op` as services |
| `LinkedFacebookProfileRead` | `name`, `photo_url`, `rating`, `review_count` | Linked Facebook card (not only the URL) |
| `LinkedGoogleMapsListingRead` | `name`, `photo_url`, `rating`, `review_count` | Linked Google Maps listing card |
| `BusinessProfileCertificationListRead` | `available: []CertificationDefinitionRead`, `selected: []BusinessProfileCertificationSelectionRead` | Certifications wrap |
| `CertificationDefinitionRead` | `id`, `name`, `short_label`, `trades`, `country`, `badge`, `registry_url` | Global definition for `available[]` |
| `BusinessProfileCertificationSelectionRead` | `id`, `certification_id`, `status` | Tenant tick. `status` → `selected` / `removed` |
| `BusinessProfileCertificationsPut` | `certification_ids[]` | PUT selected set |
| `ReviewRead` | `id`, `author_name`, `rating`, `body`, `citation`, `published_at`, `language`, `origin`, `is_top`, `top_position`, `status` | Pool / archive row. `is_top` / `top_position` hydrate from latest `business_profile_review_rankings` |
| `ReviewListGet` | `status` | Query. Defaults `in_pool` (`in_pool` / `archived`) |
| `ReviewListRead` | `reviews: []ReviewRead`, `top_reviews_provisional` | Pool hydrate; **top reviews** first when `in_pool`. `top_reviews_provisional` from the latest ranking batch, not the profile |
| `ReviewCreate` | `author_name`, `rating`, `body`, `published_at` | Owner-written create. `rating` 1–5; `body` `maxLength` 500; `published_at` optional |
| `ReviewTopUpdate` | `review_ids[]` | Featured-first ordered top set. Max 30. No `top_position` |
| `ReviewImportCreate` | | Import from the linked Maps listing and/or Facebook URL. Empty body |

`trade` is open text (`minLength` 1, `maxLength` 80). Linked cards are
null when the URL is unset. `last_edit_id` is the increment Revert
names. Do not reuse `WebsiteBusinessProfileRead` or
`OnboardingLiveBusinessProfileRead` on these Routes.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/business-profile` | `/cms/details` | | `BusinessProfileRead` | `business_profiles`, `business_profile_services`, `business_profile_service_areas`, `business_profile_opening_hours`, `facebook_profiles` | | Live row. Hydrate linked cards when URLs are set. No timeline | | Website-placeholder resolve; embed on website editor GET |
| `PATCH /v1/business-profile` | Business details click-off | `BusinessProfileUpdate` | `BusinessProfileRead` | `business_profiles` | `business_profiles`, `business_profile_edits`, `business_profile_services`, `business_profile_service_areas`, `business_profile_opening_hours` | See overflow | | Profile-history timeline HTTP; merge-in-memory rewrite; `facebook_posts`; `instagram_posts` |
| `POST /v1/business-profile/edits/{id}/undo` | notification **Revert** after `update_details` | | `BusinessProfileRead` | `business_profile_edits`, `business_profiles` | `business_profiles`, `business_profile_edits` | See overflow | `409` if already undone or not the named increment | Website edit-history undo; a second surface-specific revert route |
| `GET /v1/business-profile/certifications` | `/cms/certifications-and-reviews` | | `BusinessProfileCertificationListRead` | `certification_definitions`, `business_profile_certification_selections` | | `available[]` for that country plus selected ticks | | `/v1/certification-selections`; `/v1/certifications` as a peer |
| `PUT /v1/business-profile/certifications` | `/cms/certifications-and-reviews` | `BusinessProfileCertificationsPut` | `BusinessProfileCertificationListRead` | `certification_definitions` | `business_profile_certification_selections`, `business_profile_edits` | See overflow | | Peer certification HTTP; key `available[]` off a closed trade enum |
| `GET /v1/business-profile/reviews` | Certifications and reviews; website editor reviews Content **add** | `ReviewListGet` | `ReviewListRead` | `business_profile_reviews`, `business_profile_review_rankings` | | See overflow | | Rewrite `website_slot_reviews` |
| `PATCH /v1/business-profile/reviews` | Certifications and reviews pin / unpin / reorder | `ReviewTopUpdate` | `ReviewListRead` | `business_profile_reviews`, `business_profile_review_rankings` | `business_profile_review_rankings`, `business_profile_edits` | See overflow | `400` longer than 30, duplicate id, or id not `in_pool` | Website editor pin; rewrite `website_slot_reviews` |
| `PATCH /v1/business-profile/reviews/{id}/archive` | Certifications and reviews | | `ReviewRead` | `business_profile_reviews` | `business_profile_reviews`, `business_profile_review_rankings`, `website_slot_reviews`, `business_profile_edits` | See overflow | `404` | `DELETE` |
| `PATCH /v1/business-profile/reviews/{id}/unarchive` | Toast Undo; Archive list | | `ReviewRead` | `business_profile_reviews` | `business_profile_reviews`, `business_profile_edits` | See overflow | `404` | Auto-pin; auto-add onto website sections |
| `POST /v1/business-profile/reviews` | `/cms/certifications-and-reviews/new` | `ReviewCreate` | `ReviewRead` | `business_profiles` | `business_profile_reviews`, `business_profile_edits` | See overflow | `400` | Patch imported Google/Facebook reviews |
| `POST /v1/business-profile/reviews/import` | Certifications and reviews toolbar | `ReviewImportCreate` | `ReviewListRead` | `business_profiles` | `business_profile_reviews`, `business_profile_edits` | See overflow | `409` if neither URL is linked | Truncate `body`; recreate `archived` external ids |

### PATCH /v1/business-profile

Dirty keys only (scalars + list-item ops). **calls**
`ApplyBusinessProfileIncrement` once per dirty field or list item in
one transaction (`SELECT … FOR UPDATE` the profile row). Same writer as
`update_details` ([architecture.md](architecture.md)); owner click-off
stays this PATCH, not the tool. Response is the live
`BusinessProfileRead`. Must not write `facebook_posts` or
`instagram_posts`. Must not insert `business_profile_edit_sources`
(owner increments have no junction rows).

### POST /v1/business-profile/edits/{id}/undo

Undo that `business_profile_edits` increment: replay the inverse onto
the live row, append a compensating increment. **calls**
`ApplyBusinessProfileIncrement`. **OK** does not call this. Leaving the
screen without Revert keeps the write. `409` if that id is already
undone or is not the increment the notification named.

### PUT /v1/business-profile/certifications

Replace the selected set. Unchecking is `status=removed`, not delete.
`available[]` is definitions for that country; do not key it off a
closed trade enum. Persistence is `certification_definitions` +
`business_profile_certification_selections`; those are tables, not an
HTTP collection.

### GET /v1/business-profile/reviews

Default lists the **pool** (`status=in_pool`), **top reviews** first
(`is_top`, then `top_position` from the latest ranking join), plus
`top_reviews_provisional` from that ranking batch. Archived rows only
when `ReviewListGet.status=archived`.
Website editor reviews Content uses this pool to **add** a review onto
**that website section**; that website section’s ordered ids live on
the website editor GET/PATCH (`website_slot_reviews`). Details owns the
rows.

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

- `/v1/websites/{website_prefix}/editor/business-profile`
- `/v1/certification-selections`, `/v1/certifications`
- profile-history / replay HTTP (except
  `POST /v1/business-profile/edits/{id}/undo`)
- a second Details tool or Details-write HTTP for Ads or the Assistant
