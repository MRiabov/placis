# Data model

Every tenant-owned row carries `tenant_id`; all primary queries include it. Cross-tenant isolation
is proven by integration tests (two tenants, assert reads/writes/files are blocked).

Full DDL lives in `migrations/`. `jsonb` is reserved for genuinely polymorphic content (component
props, slot values, research raw payloads, manifests); structural data is real columns. Columns
named `source_refs` record where each value came from; `provenance` records where an asset came
from and how it was edited.

Own ids and foreign keys are `uuid` in Postgres and `uuid.UUID` (`github.com/google/uuid`) in Go —
never strings; they serialize as strings only at the HTTP boundary. Clerk's own ids (`clerk_org_id`,
`clerk_user_id`, `clerk_subject`) are `text`/`string` — Clerk's opaque ids (`org_…`, `user_…`), not
UUIDs.

## Identity & tenancy

- `tenants` — `id` uuid pk, `clerk_org_id` unique, `slug` unique, `name`, `status`
  (`draft`/`active`/`suspended`), `created_at`, `updated_at`
- `tenant_memberships` — `id`, `tenant_id` fk, `clerk_user_id`, `role`, `created_at`;
  unique `(tenant_id, clerk_user_id)`
- `tenant_domains` — `id`, `tenant_id` fk, `hostname` unique, `type` (`subdomain`/`custom`),
  `status` (`reserved`/`pending`/`active`/`failed`), `dns_verified_at`, `activated_at`, `created_at`

## Onboarding

- `onboarding_sessions` — `id`, `tenant_id` nullable fk, `started_from` (`google_places`/
  `company_registry`), `channel` (`text`/`voice`), `status` (`created`/`interviewing`/
  `profile_draft`/`generating`/`previewing`/`claimed`/`expired`), `token` unique, `clerk_user_id`
  nullable, `consent_given_at` nullable, timestamps
- `text_interview_submissions` — `id`, `onboarding_session_id` fk, `version`, `payload` jsonb,
  `created_at`
- `voice_observability_events` — `id`, `onboarding_session_id` fk, `event_type`, `payload` jsonb
  (sanitized), `created_at`
- `research_sessions` — `id`, `onboarding_session_id` fk, `status`, `created_at`
- `research_runs` — `id`, `research_session_id` fk, `provider`, `status`, `started_at`,
  `finished_at`
- `research_events` — `id`, `research_run_id` fk, `event_type`, `payload` jsonb, `created_at`
- `research_sources` — `id`, `research_run_id` fk, `kind` (`google_places`/`company_registry`/
  `facebook`/`website_crawl`/`photo`), `external_id`, `source_ref`, `raw` jsonb, `normalized` jsonb,
  `confidence`, `created_at`
- `google_places_cache` — `id`, `place_id` unique, `payload` jsonb, `cached_at`

## Business profile

- `business_profiles` — `id`, `tenant_id` fk unique, `trade` (`roofing`/`landscaping_paving`/
  `bathroom_renovation`/`kitchen_installation`/`general_builder`/`property_maintenance`),
  `display_name`, `legal_name`, `description`, `established_year`, `company_number`, `vat_number`,
  `registered_office`, `contact_name`, `phone`, `email`, `website`, `google_profile_url`,
  `facebook_profile_url`, `founder_profile` jsonb, `brand` jsonb (colors/logo_asset_id/tone/
  typography), `current_version_id` nullable, timestamps
- `business_profile_versions` — `id`, `business_profile_id` fk, `version_number`, `details` jsonb
  (a copy of the details at this version), `source_refs` jsonb, `created_by`
  (`research`/`voice`/`text`/`human`/`llm`), `created_at`; unique `(business_profile_id, version_number)`
- `business_profile_services` — `id`, `business_profile_id` fk, `name`, `description`, `slug`
- `business_profile_service_areas` — `id`, `business_profile_id` fk, `locality`
- `business_profile_opening_hours` — `id`, `business_profile_id` fk, `day_of_week`, `opens_at`,
  `closes_at`, `closed`

## Website CMS

- `website_pages` — `id`, `tenant_id` fk, `path`, `title`, `page_type` (`standard`/`service`/
  `landing`/`legal`), `status` (`draft`/`published`/`archived`), `current_version_id` nullable,
  `published_version_id` nullable, `seo` jsonb, timestamps; unique `(tenant_id, path)`
- `website_page_versions` — `id`, `tenant_id` fk, `page_id` fk, `version_number`, `status`
  (`draft`/`approved`/`published`/`rejected`), `content` jsonb, `validation_errors` jsonb,
  `source_refs` jsonb, `created_by`, `created_at`; unique `(page_id, version_number)`
- `website_sections` — `id`, `tenant_id` fk, `page_id` fk, `component_id`, `component_version`,
  `position`, `status` (`visible`/`hidden`), `props` jsonb, `design` jsonb, `source_refs` jsonb;
  unique `(page_id, position)`
- `content_slots` — `id`, `tenant_id` fk, `section_id` fk, `slot_key`, `slot_type` (`text`/
  `rich_text`/`image`/`link`/`list`/`json`), `value` jsonb, `status` (`draft`/`reviewed`/
  `approved`/`rejected`), `source_refs` jsonb, `validation_errors` jsonb; unique `(section_id, slot_key)`
- `website_assets` — `id`, `tenant_id` fk, `asset_type` (`image`/`logo`/`document`/
  `generated_image`), `source` (`upload`/`generated`/`imported`/`external`), `status` (`draft`/
  `active`/`archived`), `file_id` nullable, `source_url`, `alt_text`, `focal_point` jsonb, `crop`
  jsonb, `provenance` jsonb, `review_status` (`pending_review`/`approved`/`rejected`), `created_at`
- `website_forms` — `id`, `tenant_id` fk, `form_key`, `title`, `status` (`active`/`disabled`),
  `submit_action` (`create_lead`), `fields` jsonb, `privacy_notice`; unique `(tenant_id, form_key)`
- `navigation_items` — `id`, `tenant_id` fk, `parent_id` nullable fk, `page_id` nullable fk,
  `location` (`primary`/`footer`/`campaign`), `label`, `path`, `url`, `position`, `status`
  (`visible`/`hidden`)
- `website_publications` — `id`, `tenant_id` fk, `version_number`, `status` (`published`/
  `archived`/`rolled_back`), `active`, `manifest_version`, `site_manifest` jsonb,
  `validation_report` jsonb, `published_by`, `rollback_of_publication_id` nullable, `published_at`;
  unique `(tenant_id, version_number)`
- `website_projects` — `id`, `tenant_id` fk, `title`, `description`, `cover_asset_id` nullable fk,
  `status` (`draft`/`published`), timestamps
- `website_certification_selections` — `id`, `tenant_id` fk, `certification_id`, `status`
  (`selected`/`removed`), `created_at`

## Ads

- `ad_creative_sets` — `id`, `tenant_id` fk, `name`, `status` (`draft`/`needs_review`/
  `ready_to_post`/`archived`), `offer`, `ad_goal` (`more_calls`/`more_quotes`/`promote_service`),
  `service_focus_id` nullable fk, `destination_page_id` nullable fk, `destination_path`, `icp`
  jsonb (typed ideal-customer profile), `review_status`, `source_refs` jsonb, `created_by`,
  `updated_by`, `platform_refs` jsonb, `platform_status` (`not_connected`/`synced`/`needs_sync`/
  `error`), timestamps
- `ad_variants` — `id`, `tenant_id` fk, `creative_set_id` fk, `format` (`feed_square`/
  `feed_portrait`/`carousel`/`story`), `status` (`draft`/`needs_review`/`approved`/`hidden`/
  `archived`), `copy_variant_id` fk, `position`, `review_status`, `platform_refs` jsonb, timestamps
- `ad_copy_variants` — `id`, `tenant_id` fk, `headline`, `primary_text`, `description`, `cta_label`
  (`learn_more`/`get_quote`/`call_now`/`message`), `source` (`ai_proposal`/`owner_edit`/
  `operator_edit`/`manual`), `ai_generation_ref`, timestamps
- `ad_image_placements` — `id`, `tenant_id` fk, `variant_id` fk, `media_asset_id` fk, `format`,
  `crop` jsonb, `focal_point` jsonb, `position`, `alt_text`
- `ad_lead_forms` — `id`, `tenant_id` fk, `creative_set_id` fk, `title`, `questions` jsonb,
  timestamps
- `ad_reviews` — review/approval trail (actor, transition, note); sensitive mutations also write
  `audit_events`

## Preview & claim

- `preview_packages` — `id`, `onboarding_session_id` fk, `token` unique, `status` (`draft`/
  `claimed`/`expired`), `personas` jsonb, `unresolved_fields` jsonb, `created_at`
- `preview_events` — `id`, `preview_package_id` fk, `event_type`, `payload` jsonb, `created_at`
- `preview_claims` — `id`, `preview_package_id` fk, `clerk_subject`, `checkout_session_id`,
  `payment_state` (`pending`/`paid`/`failed`/`refunded`), `tenant_id` nullable fk, `activated_at`,
  `created_at`; unique webhook key (safe to replay)

## Leads

- `leads` — `id`, `tenant_id` fk, `source` (`public_form`), `form_id` nullable fk, `contact` jsonb,
  `message`, `status` (`new`/`contacted`/`closed`), `created_at`

## Cross-cutting

- `ai_generations` — `id`, `tenant_id` nullable fk, `generation_type`, `model`, `prompt_id`,
  `prompt_version`, `input` jsonb, `internal_reasoning` jsonb, `output` jsonb, `tool_calls` jsonb,
  `usage` jsonb, `status` (`running`/`succeeded`/`failed`), `error` nullable, `created_at`
- `files` — `id`, `tenant_id` fk, `owner_type`, `owner_id`, `storage_key`, `original_filename`,
  `content_type`, `byte_size`, `checksum`, `visibility` (`private`/`customer_visible`/`public`),
  `scan_status` (`pending`/`clean`/`failed`/`skipped`), `created_at`
- `audit_events` — `id`, `tenant_id` nullable fk, `actor`, `action`, `entity_type`, `entity_id`,
  `before` jsonb, `after` jsonb, `request_id`, `created_at`
- `stripe_events` — `id`, `event_id` unique, `type`, `payload` jsonb, `processed`, `created_at`
- River-managed tables for the job queue.

## Indexes & constraints

Unique: `tenants.clerk_org_id`, `tenants.slug`, `(tenant_id, website_pages.path)`,
`(tenant_id, website_forms.form_key)`, `(tenant_id, website_publications.version_number)`,
`stripe_events.event_id`. Lookup: `(tenant_id, status, created_at)` on sessions/pages/leads;
`(tenant_id, owner_type, owner_id)` on files; `(tenant_id, entity_type, entity_id, created_at)` on
audit. Use DB check constraints for stable enums; state-transition tests before production use.
