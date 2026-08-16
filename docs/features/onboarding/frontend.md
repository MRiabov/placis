# Onboarding Frontend

Status: proposed frontend spec for onboarding. Onboarding is well-defined — the flow, screens, and
fields below come from the reference app and are reused in `frontend-2`.

Related: [PRD](prd.md), [ADR](ADR.md), [technical-implementation.md](technical-implementation.md).

## Purpose

The contractor-facing onboarding surface in `frontend-2` (`src/features/setup/`), reused mostly and
adapted to the huma OpenAPI. Onboarding is: find the business (their Google Maps listing or
company-registry record), answer a few questions, review.

## Screens

### 1. Start — find the business

- **Country** — Ireland / United Kingdom / United States.
- **Company registry** — type the corporate name and pick the right record (shows legal name,
  company number, status, registered office). Companies House for GB, CRO for IE, state registry
  for US.
- **Google Maps** (optional) — search and pick the place; pre-fills name, category, phone, photos,
  and reviews. Either one, or both when they describe the same business.
- **Consent** — a single checkbox: "I agree that Placis can collect public information about this
  business to prepare the website preview."
- **Confirm and review** — the primary action.

### 2. Interview — a few questions

The interview never re-asks what we already know. In the **text interview** the known fields are
prefilled from what they gave us and the contractor fills in the gaps; in the **voice interview**
the agent is told what's known and what's left, so it asks only the missing questions.

Fields they already gave us — the Google Maps place and the company-registry record — are shown
as **prefilled and locked** (grayed out, not editable). The contractor is only asked for what they
didn't provide.

Missing fields, autosaved as the contractor answers:

- **Who they are** — display name, trade, established year, a short description.
- **Contact** — contact name, phone, email, website.
- **What they do** — main services, and the areas they cover.
- **Opening hours** — per day: open time, close time, and a note.
- **Photos** — use the found ones, take them from Google, upload later, or use neutral ones.
- **Proof** — accreditations/certifications, reviews, and any extra notes.

### 3. Review — what we found vs. what's missing

- The profile is a checklist grouped by: who they are, legal details, contact, services, area,
  proof, photos.
- Each item is either **found** (from the registry, Maps, or research) or **missing** (needs an
  answer).
- When the contractor's answer disagrees with what we found, both are shown side by side and they
  pick.

### 4. Progress — research and generation

- Research and generation progress are shown as they run; the contractor can leave and come back.

## Components (`frontend-2`)

- `FindBusinessPanel` — country, registry search, optional Maps match, consent checkbox.
- `TextInterviewForm` — the interview fields, with autosave.
- `CompanyChecklistPanels` / `CompanyChecklistValues` — the found-vs-missing review.
- `AvailabilityPicker` — opening hours.
- `WebsiteImagesField` — photo choice.
- `ReviewHighlights` — review candidates.
- `PreviewProgressPanels` — research/generation progress.

## Voice (later)

Voice is a later way to answer the interview; the frontend reserves the realtime/observability
wiring but no phone UI ships in the first pass.
