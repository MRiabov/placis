# 01a — Find the business

Unauthenticated. The contractor picks a **country** (Ireland / United Kingdom / United States;
default Ireland), finds the business, and gives online research consent. Confirm creates the
onboarding session and returns immediately — business research (02a) runs in the background.

## Sources

Either, or both when they describe the same business:

- **Company registry** (optional if Maps is selected) — debounced search of the offline parquet
  copy (CRO / CORE for IE, Companies House for GB, US state registry). Shows legal name, company
  number, status, registered office. Country is a **search parameter**, not an onboarding session
  column.
- **Google Maps** (optional if registry is selected) — debounced autocomplete + place picker.
  Pre-fills trading name, category, marketing phone, photos, reviews.

Confirm is allowed with registry only, Maps only, or both. A single checkbox:
"I agree that Placis can collect public information about this business to prepare the website
preview." Without it, business research does not start.

## What confirm does

1. `POST /api/v1/onboarding-sessions` — no Clerk required. Status `created`. Token unique.
2. Record online research consent (`online_research_consent_at`).
3. Registry selected → persist the company registry record. Maps selected → attach the place (same
   onboarding session if registry already ran).
4. Initialize a [business profile](../../other/details/data-model.md) **shell**: a
   `business_profiles` row with `tenant_id` null, empty/unknown details, `last_edit_id` and
   `accepted_edit_id` null. Registry confirm fills legal identity (legal name, company number, registered office,
   company status) into that shell; Maps confirm fills contact/listing fields. Both: registry
   wins for legal identity (03).
5. Kick off 02a. Move the UI to **Review** (`/onboarding/review`). Status → `client_interviewing`.

Do **not** apply the website template or create a website preview here.

- **Persists** `onboarding_sessions` (`started_from` = `google_maps_listing` / `company_registry` /
  both via sources, `channel` still unset, `status=client_interviewing`, `token`, `online_research_consent_at`,
  `clerk_user_id` null, `tenant_id` null) and the profile shell.
