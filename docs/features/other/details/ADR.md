# Details Decision Record

Status: decided (2026-08-19, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently rewriting history.

## Decisions

1. **Profile history is typed increments, not a dump** — Each applied change is a
   `business_profile_edits` row: one field or list item, `set`/`clear`/`add`/`remove`/`update`,
   typed value columns, who, where it came from, request/job id. The live `business_profiles` row
   is the fold. Reads load the fold; they do not replay the log. Writers `SELECT … FOR UPDATE`,
   insert only what they set, and update only those fold columns. No writer may submit a full
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

3. **Founder and brand are columns** — `founder_name` / `founder_role` / `founder_occupation` /
   `founder_nationality` / `founder_country_of_residence` / `founder_appointed_on` /
   `founder_media_asset_id`, and `logo_media_asset_id` / `brand_tone` / `brand_typography` /
   `brand_primary_color` / `brand_accent_color`, live on `business_profiles`. They are ordinary
   fold columns and ordinary `business_profile_edits.field` values. Business research extras (confidence,
   evidence) stay on ETL fetch metadata / the Facebook or Instagram profile row, not a founder blob. (2026-08-19;
   2026-08-27: `business_research_sources` removed.)
