# Details — data model

The **business profile** — the one set of tables the rest of the application draws from.
Onboarding builds it; this view edits it; the website shows it; ads read it.

Conventions: [data-model conventions](../../../general-architecture/data-model.md).

- `business_profiles` — `id`, `tenant_id` fk unique, `trade` (`roofing`/`landscaping_paving`/
  `bathroom_renovation`/`kitchen_installation`/`general_builder`/`property_maintenance`),
  `display_name`, `trading_name`, `legal_name`, `legal_form`, `company_status`, `description`,
  `established_year`, `company_number`, `vat_number`, `vat_registration_status`,
  `incorporation_date`, `registered_office`, `contact_name`, `phone`, `emergency_phone`, `email`,
  `public_contact_email`, `website`, `google_profile_url`, `facebook_profile_url`,
  `founder_profile` jsonb, `brand` jsonb (colors/logo_media_asset_id/tone/typography),
  `current_version_id` nullable, timestamps
- `business_profile_versions` — `id`, `business_profile_id` fk, `version_number`, `details` jsonb
  (a copy of the details at this version), `source_refs` jsonb, `created_by`
  (`research`/`voice`/`text`/`human`/`llm`), `created_at`; unique `(business_profile_id, version_number)`
- `business_profile_services` — `id`, `business_profile_id` fk, `name`, `description`, `slug`
- `business_profile_service_areas` — `id`, `business_profile_id` fk, `locality`
- `business_profile_opening_hours` — `id`, `business_profile_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`
