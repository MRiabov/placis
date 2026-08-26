# Details Decision Record

Status: decided (2026-08-19, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently rewriting history.

## Decisions

1. **Profile history is typed increments, not a dump** — Each applied change is a
   `business_profile_edits` row: one field or list item, `set`/`clear`/`add`/`remove`/`update`,
   typed value columns, who, where it came from, request/job id. The live `business_profiles` row
   is the current profile. Reads load that row; they do not replay the log. Writers `SELECT … FOR UPDATE`,
   insert only what they set, and update only those live profile columns. No writer may submit a full
   profile. (2026-08-19)

   The predecessor stored profile history as a details blob / full merge. Under a race (client interview and
   business research at the same time) one write omitted a field the other had set; the UI went
   from 7 populated fields to 6 with no explicit edit. Last snapshot wins. Increments keep both
   writes; a dropped field is a `clear` or an overwrite of that field, visible in the log. Same
   field with disagreeing values is a research conflict, not a silent last-write.

2. **Profile groups Details and Projects** — The left nav does not give Projects its own
   top-level item. Details is also opened infrequently, so both sit under **Profile**:
   **Business details** (`/cms/details`) and **Projects** (`/cms/projects`). Profile is a
   disclosure, not a destination of its own; there is no `/cms/profile`. The Details screen stays.
   Projects stays until a Projects view ships. (2026-08-19)

   (2026-08-20): Projects is a working Projects screen in the website first slice, still under
   Profile. **Certifications and reviews** (`/cms/certifications-and-reviews`) is a third Profile
   child. No `/cms/proof`. Top menu and footer stay in the website editor, not Details.

   (2026-08-26): **Media library** (`/cms/media`) is a fourth Profile child. It is not a
   top-level peer of Sites. Crop / focal / cleanup stay on that screen; attach/pick from
   Content is unchanged.

3. **Founder and brand are columns** — `founder_name` / `founder_role` / `founder_occupation` /
   `founder_nationality` / `founder_country_of_residence` / `founder_appointed_on` /
   `founder_media_asset_id`, and `logo_media_asset_id` / `brand_tone` / `brand_typography` /
   `brand_primary_color` / `brand_accent_color`, live on `business_profiles`. They are ordinary
   live profile columns and ordinary `business_profile_edits.field` values. Business research extras (confidence,
   evidence) stay on ETL fetch metadata / the Facebook or Instagram profile row, not a founder blob. (2026-08-19;
   2026-08-27: `business_research_sources` removed.)

4. **Reviews have origin, top, archive, and citation** — each `business_profile_reviews` row
   has `origin` (`google_maps_listing` / `facebook_business_page` / `owner`), `is_top` +
   `top_position` (dense 1…n, n ≤ 30; 1 = most featured; unique per profile when set), `status` (`in_pool` / `archived`),
   and `citation` (`maxLength` 500). Archive is not delete; re-import skips archived external
   ids. Owner-written reviews are editable after create; imported Google/Facebook reviews
   are not. Cards, the website, and ads paint citation (fallback `body` if empty).
   Pin / reorder replaces the whole ordered id list in one transaction; it does not assign
   one `top_position` at a time. (2026-08-26; unique top set 2026-08-26)
   `is_top` is the **ads** featured list (and the top band on Certifications and reviews). It
   does **not** copy onto every reviews website section. Each reviews website section has its
   own ordered `website_slot_reviews` from the pool, capped by that website component.
   (2026-08-26)

5. **Facebook and Google Maps listing are Details links** — Business details owns
   `facebook_profile_url` and `google_maps_listing_url`. **Link your Facebook** /
   Google Maps listing when unlinked (paste a public URL this pass; type-to-search TBD);
   URL + **Change** when linked. Same URLs feed review import on Certifications and reviews.
   Not Ads Connect Meta, not Facebook Login, no autoposting. (2026-08-26)

6. **Opening hours are when they pick up the marketing phone** — per day: Opens / Closes /
   Closed. Shown on the contact website page. There
   is no `note` column and no Appointment note field. Logo is picked from the media library
   (`logo_media_asset_id`). Persist on click-off; no Save details. Picker look is in
   [website design-decisions](../../website/design-decisions.md). (2026-08-26)

7. **Certification definitions and ticks are Details tables** — Global `certification_definitions`
   and tenant `business_profile_certification_selections` live in Postgres schema `details`.
   They are not `website` tables and are not named `website_certification_*`. HTTP stays
   `GET`/`PUT /v1/business-profile/certifications`. The website paints selected rows at
   website publication; ads read the same live business profile. (2026-08-26)
