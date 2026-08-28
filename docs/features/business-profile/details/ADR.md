# Details Decision Record

Status: decided (2026-08-19, product owner + engineering). Update an entry
(keeping the old decision + date) instead of silently rewriting history.

## Decisions

1. **Profile history is typed increments, not a dump** — Each applied change is
   a `business_profile_edits` row: one field or list item,
   `set`/`clear`/`add`/`remove`/`update`, typed value columns, who, where it
   came from, request/job id. The live `business_profiles` row is the current
   profile. Reads load that row; they do not replay the log. Writers
   `SELECT … FOR UPDATE`, insert only what they set, and update only those live
   profile columns. No writer may submit a full profile. (2026-08-19)

   The predecessor stored profile history as a details blob / full merge. Under
   a race (client interview and business research at the same time) one write
   omitted a field the other had set; the UI went from 7 populated fields to 6
   with no explicit edit. Last snapshot wins. Increments keep both writes; a
   dropped field is a `clear` or an overwrite of that field, visible in the log.
   Same field with disagreeing values is a research conflict, not a silent
   last-write.

2. **Profile groups Details and Projects** — moved to [CMS ADR](../../../general-architecture/cms/ADR.md) 1 (2026-08-27).
   The Details screen stays. Top menu and footer stay in the website editor, not
   Details. (2026-08-19; Profile children 2026-08-20; media library child
   2026-08-26)

3. **Founder and brand are columns** — `founder_name` / `founder_role` /
   `founder_occupation` / `founder_nationality` / `founder_country_of_residence`
   / `founder_appointed_on` / `founder_media_asset_id`, and
   `logo_media_asset_id` / `brand_tone` / `brand_typography` /
   `brand_primary_color` / `brand_accent_color`, live on `business_profiles`.
   They are ordinary live profile columns and ordinary
   `business_profile_edits.field` values. Business research extras (confidence,
   evidence) stay on ETL fetch metadata / the Facebook or Instagram profile row,
   not a founder blob. (2026-08-19; 2026-08-27: `business_research_sources`
   removed.)

4. **Reviews have origin, top, archive, and citation** — each
   `business_profile_reviews` row has `origin` (`google_maps_listing` /
   `facebook_business_page` / `owner`), `is_top` + `top_position` (dense 1…n, n
   ≤ 30; 1 = most featured; unique per profile when set), `status` (`in_pool` /
   `archived`), and `citation` (`maxLength` 500). Archive is not delete;
   re-import skips archived external ids. Owner-written reviews are editable
   after create; imported Google/Facebook reviews are not. Cards, the website,
   and ads paint citation (fallback `body` if empty). Pin / reorder replaces the
   whole ordered id list in one transaction; it does not assign one
   `top_position` at a time. (2026-08-26; unique top set 2026-08-26) `is_top` is
   the **ads** featured list (and the top band on Certifications and reviews).
   It does **not** copy onto every reviews website section. Each reviews website
   section has its own ordered `website_slot_reviews` from the pool, capped by
   that website component. (2026-08-26)

5. **Facebook and Google Maps listing are Details links** — Business details
   owns `facebook_profile_url` and `google_maps_listing_url`.
   **Link your Facebook** / Google Maps listing when unlinked (paste a public
   URL this pass; type-to-search TBD); when linked, a **card** (name, photo,
   rating, review count) plus **Change**, not the raw URL. Same URLs feed review
   import on Certifications and reviews. Not Ads Connect Meta, not Facebook
   Login, no autoposting. (2026-08-26; linked card 2026-08-27)

6. **Opening hours are when they pick up the marketing phone** — per day: Opens
   / Closes / Closed. Shown on the contact website page. There is no `note`
   column and no Appointment note field. Logo is picked from the media library
   (`logo_media_asset_id`). Persist on click-off; no Save details. Picker look
   is in [design decision record](design-decision-record.md). (2026-08-26) One Opens / Closes / Closed per
   weekday — do not add several ranges per day. Drop extra time blocks from the
   mock. (2026-08-27)

7. **Certification definitions and ticks are Details tables** — Global
   `certification_definitions` and tenant
   `business_profile_certification_selections` live in Postgres schema
   `details`. They are not `website` tables and are not named
   `website_certification_*`. HTTP stays
   `GET`/`PUT /v1/business-profile/certifications`. The website paints selected
   rows at website publication; ads read the same live business profile.
   (2026-08-26)

8. **Trade is open text** — `business_profiles.trade` is not a closed enum.
   Certification `available[]` by trade/country must not depend on a closed
   trade list. There is **no** business-location column; service areas cover
   where they work. Service areas are a Google Maps territory lookup;
   `radius_km` is for Meta when ad posting exists. Featured services are the
   `business_profile_services` list, not a textarea. (2026-08-27)

9. **Notification Revert undoes that profile-history increment** — One governed
   tool, `update_details` ([api.md](api.md)). Website assistant, Ads generator, and
   later LLM callers invoke **that** tool — one implementation (the same
   increment function as click-off `PATCH /v1/business-profile`). The write is
   applied. **OK** keeps it. **Revert** is
   `POST /v1/business-profile/edits/{id}/undo` (that `business_profile_edits`
   increment). Leaving the screen without clicking keeps the write. Not website
   undo. Shared [notification](../../../general-architecture/frontend.md). (2026-08-27) Previous (same day): any governed
   tool that writes a detail uses the same Details writer. Previous (same day):
   Ads may write a detail via a tool call. OK keeps it. Revert is that undo
   route. Leaving the screen keeps the write. Not website undo.
