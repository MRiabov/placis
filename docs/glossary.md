# Glossary

The **ubiquitous language** of the application — the single source of truth for what things are
called across docs, code, the API, and the UI. Read this before naming anything new.

> "By using the model-based language pervasively and not being satisfied until it flows, we
> approach a model that is complete and comprehensible, made up of simple elements that combine to
> express complex ideas." — Eric Evans, *Domain-Driven Design*
>
> Domain experts object to terms that are awkward or inadequate to convey the domain; developers
> watch for ambiguity or inconsistency that will trip up the design.

## Why

Bad names in a PRD become table, field, route, and UI names; once they ship they're hard to fix.
We name each concept once, here, and reuse the same word everywhere. If a PRD invents a new word,
it's wrong — the word should already be in this file (or be added here first).

## The rule

Product docs (PRDs) and user-facing text use the **business's own words**; implementation words
(tables, fields, routes, internals) stay in technical docs and code. The same word is used
everywhere — docs, code, API, UI — with no synonyms drifting in.

## Canonical terms

| Term | What it means | In code / internal |
| --- | --- | --- |
| business profile | everything we know about a business | `business_profiles`, `business_profile_versions`, `business_profile_services`, `business_profile_service_areas`, `business_profile_opening_hours` |
| onboarding | learning about the business and building its profile (was "setup") | `onboarding_sessions`, `internal/onboarding/` |
| research | finding out about the business from public sources | `research_sessions`/`research_runs`/`research_events`/`research_sources`, `internal/research/` |
| interview | the questions we ask | `text_interview_submissions` |
| consent | permission, asked per thing | `consent_records` |
| template | the starting point for a website | `blueprint` (a full-site template), `catalog/`, `internal/website/blueprints/` |
| website | the contractor's site | `website_pages`, `website_sections`, `content_slots`, `website_assets`, `website_forms`, `navigation_items`, `website_publications`, `internal/website/` |
| ads | the contractor's ads | `ad_creative_sets`, `ad_variants`, `ad_copy_variants`, `ad_image_placements`, `ad_lead_forms`, `internal/ads/` |
| preview | what we show before they go live | `preview_packages`, `internal/onboarding/preview/` |
| publish / go live | the site is on the internet | `website_publications` |
| claim / sign up | pay and activate | `preview_claims`, `internal/billing/` (checkout), `internal/onboarding/claim.go` |
| lead | a visitor who got in touch | `leads` |
| owner / contractor | the customer (a construction business owner) | `clerk_user_id`, `tenant_memberships.role` |
| the team / us | Placis's managed team | platform role + impersonation |
| the CMS | the app where the owner edits website + ads (the umbrella) | `internal/website/` + `internal/ads/` |

## Implementation-only words

Never in product/user-facing text or PRD prose — these live only in technical docs and code.

| Don't say | Say |
| --- | --- |
| setup | onboarding |
| fact / structured facts | detail / information |
| source reference / `source_refs` | where a detail came from |
| version / versioned / snapshot | history / a saved copy |
| state / state machine | steps / where things stand |
| normalize(d) | combine / turn into |
| materialize(d) | make a frozen copy |
| immutable | kept / never overwritten |
| artifact | what we built (or the specific deliverable) |
| idempotent | safe to retry (tech only) |
| source-first | start from an existing listing |
| propose-only | AI suggests, you decide |
| `Demo`-prefixed ops; `save` vs `update`; `Projection`/`Read`/`Summary` aliases | one verb (`Create/Update/Get/List/Delete`), one `*Read` response suffix |

## Code naming rules

- Ubiquitous language: one canonical term per concept, reused in docs, code, API, and UI.
- Database: `snake_case`, plural table names, `tenant_id` on every tenant-owned row, `*_id` foreign
  keys, `snake_case` enum values.
- Go: feature-nested packages (`internal/<domain>/<feature>/`), no package stutter (`website/pages`,
  not `website/websitepages`); the file-size guard applies (see `ci-cd.md`).
- API: `/api/v1/<domain>/...`, domain nouns in paths, `Create/Update/Get/List/Delete` verbs, one
  `*Read` response suffix.
- New terms are added to this glossary first; a PRD never invents a synonym.
