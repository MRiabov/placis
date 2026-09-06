# Details HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Live business profile the rest of the app reads. Projects:
[projects HTTP](../projects/api.md). Certifications:
[certifications HTTP](../certifications/api.md).
Reviews:
[reviews HTTP](../reviews/api.md).
Onboarding resume is
[onboarding `GET /v1/onboarding/profile`](../../onboarding/api.md),
not this resource.

**Auth default:** Clerk JWT, active tenant. Mutating Routes send
`Idempotency-Key`. Unactivated **403** on this tree. Unpaid
`update_details` / Revert:
[onboarding HTTP](../../onboarding/api.md)
(`PATCH /v1/onboarding/business-profile`,
`POST /v1/onboarding/business-profile/edits/{id}/undo`). Extra keys 4xx.
Validation errors: `string[]` with `maxLength` per item.

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
| `BusinessProfileRead` | `trade`, `display_name`, `legal_name`, `description`, `established_year`, `company_number`, `vat_number`, `vat_registration_status`, `incorporation_date`, `registered_office`, `contact_name`, `marketing_phone`, `emergency_phone`, `marketing_email`, `existing_site_url`, `google_maps_listing_url`, `facebook_profile_url`, `founder_name`, `founder_role`, `founder_occupation`, `founder_nationality`, `founder_country_of_residence`, `founder_appointed_on`, `founder_media_asset_id`, `logo_media_asset_id`, `last_edit_id`, `services: []BusinessProfileServiceRead`, `service_areas: []BusinessProfileServiceAreaRead`, `opening_hours: []BusinessProfileOpeningHoursRead`, `linked_facebook: LinkedFacebookProfileRead`, `linked_google_maps: LinkedGoogleMapsListingRead` | Live row hydrate. `registered_office` is the address (`{{address}}`). Linked cards nullable until the URL is linked. No profile-history timeline. No `brand_*` / `trading_name` / `legal_form` / `company_status` / ranking columns / second location field |
| `BusinessProfileUpdate` | dirty keys of the scalar `BusinessProfileRead` fields plus `services: []BusinessProfileServiceOp`, `service_areas: []BusinessProfileServiceAreaOp`, `opening_hours: []BusinessProfileOpeningHoursOp` | PATCH body. Omit = no change. Not a full-row dump |
| `BusinessProfileServiceRead` | `id`, `name`, `description`, `website_page_path` | Featured service list row |
| `BusinessProfileServiceOp` | `op`, `id`, `name`, `description` | List-item op. `op` → `add` / `remove` / `update`. `id` required on `remove` / `update`. Must not persist `website_page_path` |
| `BusinessProfileServiceAreaRead` | `id`, `locality`, `radius_km` | Google Maps territory card |
| `BusinessProfileServiceAreaOp` | `op`, `id`, `locality`, `radius_km` | List-item op. Same `op` as services |
| `BusinessProfileOpeningHoursRead` | `id`, `day_of_week`, `opens_at`, `closes_at`, `closed` | One range per weekday |
| `BusinessProfileOpeningHoursOp` | `op`, `id`, `day_of_week`, `opens_at`, `closes_at`, `closed` | List-item op. Same `op` as services |
| `LinkedFacebookProfileRead` | `name`, `photo_url`, `rating`, `review_count` | Linked Facebook card from `facebook_profiles`. Null until transform has upserted those fields. Not `raw`. No `linked_instagram` |
| `LinkedGoogleMapsListingRead` | `name`, `photo_url`, `rating`, `review_count` | Linked Google Maps listing card from `etl.google_maps_listings` (`name` ← `display_name`; `photo_url` from the first `google_maps_listing_photos.source_url`). Null until extract has upserted the listing. Not `raw` |

`trade` is open text (`minLength` 1, `maxLength` 80). Linked cards are
null when the URL is unset. `last_edit_id` is the increment Revert
names. Do not reuse `WebsiteBusinessProfileRead` or
`OnboardingLiveBusinessProfileRead` on these Routes.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/business-profile` | `/cms/details` | | `BusinessProfileRead` | `business_profiles`, `business_profile_services`, `business_profile_service_areas`, `business_profile_opening_hours`, `facebook_profiles`, `etl.google_maps_listings`, `etl.google_maps_listing_photos` | | Live row. Hydrate `linked_facebook` from `facebook_profiles` and `linked_google_maps` from the listing when those URLs are set. No timeline. No fetch `raw` | | Website-placeholder resolve; embed on website editor GET |
| `PATCH /v1/business-profile` | Business details click-off | `BusinessProfileUpdate` | `BusinessProfileRead` | `business_profiles` | `business_profiles`, `business_profile_edits`, `business_profile_services`, `business_profile_service_areas`, `business_profile_opening_hours` | See overflow | `403` unactivated | Profile-history timeline HTTP; merge-in-memory rewrite; `facebook_posts`; `instagram_posts`; `website_page_path`; `PublishWebsite`; unpaid `PATCH /v1/onboarding/business-profile` |
| `POST /v1/business-profile/edits/{id}/undo` | notification **Revert** after `update_details` | | `BusinessProfileRead` | `business_profile_edits`, `business_profiles` | `business_profiles`, `business_profile_edits` | See overflow | `409` if already undone or not the named increment; `403` unactivated | Website edit-history undo; a second surface-specific revert route; unpaid `POST /v1/onboarding/business-profile/edits/{id}/undo` |

### PATCH /v1/business-profile

Dirty keys only (scalars + list-item ops). **calls**
`ApplyBusinessProfileIncrement` once per dirty field or list item in
one transaction (`SELECT … FOR UPDATE` the profile row). Same writer as
`update_details` ([architecture.md](architecture.md)); owner click-off
stays this PATCH, not the tool. Unpaid `update_details` uses
`PATCH /v1/onboarding/business-profile` (**calls** `UpdateBusinessProfile`),
not this Route. Response is the live
`BusinessProfileRead`. Must not write `facebook_posts` or
`instagram_posts`. Must not persist `website_page_path` on a service
op. Must not insert `business_profile_edit_sources`
(owner increments have no junction rows). Must not enqueue 04 Website
publication / **call** `PublishWebsite`. Website editor canvas hydrate uses live
`WebsiteBusinessProfileRead`; live `latest/` waits for the next 04.

### POST /v1/business-profile/edits/{id}/undo

Undo that `business_profile_edits` increment: replay the inverse onto
the live row, append a compensating increment. **calls**
`ApplyBusinessProfileIncrement`. **OK** does not call this. Leaving the
screen without Revert keeps the write. `409` if that id is already
undone or is not the increment the notification named. Unpaid Revert is
`POST /v1/onboarding/business-profile/edits/{id}/undo` (**calls**
`UndoBusinessProfileEdit`), not this Route.

## Do not create

- `/v1/websites/{website_prefix}/editor/business-profile`
- certifications or reviews HTTP (those Registers:
  [certifications](../certifications/api.md),
  [reviews](../reviews/api.md))
- profile-history / replay HTTP (except
  `POST /v1/business-profile/edits/{id}/undo`)
- a second Details tool or Details-write HTTP for Ads or the Assistant
- unactivated `/v1/business-profile` (use
  `/v1/onboarding/business-profile`)
- `LinkedInstagramProfileRead` / `linked_instagram`
