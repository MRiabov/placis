# Details — data model

The **business profile** — the one set of tables the rest of the application draws from.
Onboarding builds it; this view edits it; the website shows it; ads read it.

Conventions: [data-model conventions](../../../general-architecture/data-model.md). Decisions:
[ADR.md](ADR.md).

A **detail** is a column (or a row in a list table). Their existing site URL is a detail; it is not
**Website** and not **Placis website**.

Draft contact split (TBD further): **marketing phone** and **marketing email** are on the website
and in ads (where leads call / write). **Emergency phone** is how we contact the owner (personal;
may be the same number). The owner’s sign-in email is Clerk’s, not a profile column.

The live `business_profiles` row plus the list tables is the **fold** of profile history. Website,
ads, Details, and apply-the-website-template (when the fold has not moved past
`accepted_edit_id`) **read the fold**. They do not replay edits on every call.

- `business_profiles` — `id`, `tenant_id` fk unique, `trade` (`roofing`/`landscaping_paving`/
  `bathroom_renovation`/`kitchen_installation`/`general_builder`/`property_maintenance`),
  `display_name`, `trading_name`, `legal_name`, `legal_form`, `company_status`, `description`,
  `established_year`, `company_number`, `vat_number`, `vat_registration_status`,
  `incorporation_date`, `registered_office`, `contact_name`, `marketing_phone`, `emergency_phone`,
  `marketing_email`, `existing_site_url`, `google_maps_listing_url`,
  `facebook_profile_url`,
  `founder_profile` jsonb, `brand` jsonb (colors/logo_media_asset_id/tone/typography),
  `last_edit_id` nullable fk, `accepted_edit_id` nullable fk, timestamps

`founder_profile` / `brand` jsonb stay the existing onboarding ADR exception.

- `business_profile_edits` — Profile history. Append-only typed increments. Never `details` jsonb
  and never a full-row dump of the profile. Each row is one field or one list-item change.

  `id`, `tenant_id` fk, `business_profile_id` fk,
  `op` (`set`/`clear`/`add`/`remove`/`update`),
  `field` nullable (scalar column when `op` is `set`/`clear`: `trade`, `display_name`,
  `trading_name`, `legal_name`, `legal_form`, `company_status`, `description`, `established_year`,
  `company_number`, `vat_number`, `vat_registration_status`, `incorporation_date`,
  `registered_office`, `contact_name`, `marketing_phone`, `emergency_phone`, `marketing_email`,
  `existing_site_url`, `google_maps_listing_url`, `facebook_profile_url`),
  `list` nullable (`services`/`service_areas`/`opening_hours` when the op is a list change),
  `list_item_id` nullable,
  `text_value`, `int_value`, `date_value`, `bool_value` (check: the column that matches `field` is
  set; the others are null — not a json `value`),
  `created_by` (`business_research`/`voice`/`text`/`human`/`llm`),
  origin (where it came from: `google_maps_listing`/`company_registry_record`/`client_interview`/
  `business_research`/`owner`),
  `request_id`, `business_research_run_id` nullable,
  `created_at`

This table is the audit for profile edits. Generic `audit_events` stays for website publication /
website activation / etc.

**Write:** `SELECT … FOR UPDATE` the profile row, insert one increment per field or list item the
writer actually set (never the whole profile), `UPDATE` only those fold columns or list rows in the
same transaction. Client interview and business research run at the same time; the row lock
serializes them. Different fields both persist. Same field: both edits stay in the log; if the
values disagree, that is a research conflict (show both). Do not read the whole profile, merge in
memory, and write it back.

**Replay** the edit list only to rebuild a damaged fold, to show Profile history, or to reconstruct
the profile as of `accepted_edit_id` (client interview complete).

- `business_profile_services` — `id`, `tenant_id` fk, `business_profile_id` fk, `name`,
  `description`, `website_page_path`
- `business_profile_service_areas` — `id`, `tenant_id` fk, `business_profile_id` fk, `locality`
- `business_profile_opening_hours` — `id`, `tenant_id` fk, `business_profile_id` fk, `day_of_week`,
  `opens_at`, `closes_at`, `closed`
