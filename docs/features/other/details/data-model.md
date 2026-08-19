# Details — data model

The **business profile** — the one set of tables the rest of the application draws from.
Onboarding builds it; this view edits it; the website shows it; ads read it.

Conventions: [data-model conventions](../../../general-architecture/data-model.md).

Their current site URL (not the Placis **Website**) is a detail in the profile, not a dedicated
column.

- `business_profiles` — `id`, `tenant_id` fk unique, `trade` (`roofing`/`landscaping_paving`/
  `bathroom_renovation`/`kitchen_installation`/`general_builder`/`property_maintenance`),
  `display_name`, `trading_name`, `legal_name`, `legal_form`, `company_status`, `description`,
  `established_year`, `company_number`, `vat_number`, `vat_registration_status`,
  `incorporation_date`, `registered_office`, `contact_name`, `phone`, `emergency_phone`, `email`,
  `public_contact_email`, `google_maps_listing_url`, `facebook_profile_url`,
  `founder_profile` jsonb, `brand` jsonb (colors/logo_media_asset_id/tone/typography),
  `current_history_id` nullable, timestamps
- `business_profile_history` — `id`, `business_profile_id` fk, `details` jsonb
  (the details at this history row), `source_refs` jsonb, `created_by`
  (`business_research`/`voice`/`text`/`human`/`llm`), `created_at`
- `business_profile_services` — `id`, `business_profile_id` fk, `name`, `description`,
  `website_page_path`
- `business_profile_service_areas` — `id`, `business_profile_id` fk, `locality`
- `business_profile_opening_hours` — `id`, `business_profile_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`
