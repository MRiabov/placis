# Onboarding PRD

Status: proposed product scope for onboarding — learning about a business and
building its profile.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[persistence](persistence.md).

## Problem

A contractor wants a done-for-you website and ads. Before we build anything, we
need to know the business: what it does, where it works, and how website
visitors reach it. We start from what they already have — their Google Maps
listing or their company registry record (e.g. Companies House) — then ask a few
questions to fill the gaps, and do business research from public sources.

## Goals

1. Start from their **Google Maps listing or company registry record**
   (Companies House / CRO), which pre-fills what we already know.
2. Ask a few questions to fill in what's missing — their services, the areas
   they cover, their contact details and opening hours.
3. **Business research** from public sources: Google Maps, the company registry,
   Facebook (reviews and posts when they exist), their current website, and
   photos of their work. When a post, crawled URL, or review is a past named
   job, onboarding already has **Projects** (up to four on the client interview
   and first gallery). After website activation, the same public sources are
   extracted again so new posts and photos land in the media library and the
   review pool. New Projects insert on the Profile; they do not rewrite the
   first website gallery.
4. Combine their answers with what we found into one clear **business profile**,
   each detail noting where it came from.
5. When their answer disagrees with what we found,
   **show the research conflict and let them decide**.
6. Build their website and ads from that profile.

## Non-goals

- No CRM/operations work — no quotes, invoices, jobs, or schedules. Website
  leads are collected later from website forms, not during onboarding.
- No ad preferences during onboarding — ads are made later, on demand.
- No per-contractor code — the profile is a description of the business, not a
  generated app.

## How it starts

The contractor picks a **country** (Ireland, UK, or US), then finds their
business:

1. **Company registry** — Companies House (UK), CRO (Ireland), or the US state
   registry. They type the corporate name and pick the right company registry
   record; it pre-fills the legal name, company number, status, and registered
   office.
2. **Google Maps (optional)** — they can also match their Google Maps listing;
   it pre-fills the name, category, marketing phone, photos, and reviews.

They can select either, or both when they describe the same business. Then a
single checkbox for **online research consent**: "I agree that Placis can
collect public information about this business to prepare the website preview."

A short set of questions then fills in what the Google Maps listing and company
registry record don't cover. Text and voice write the same business profile.

## What we know about the business

By the end, the business profile holds:

- **Who they are** — display name, legal name, trade, established year, and a
  short description.
- **Legal details** — company number, VAT number, registered office.
- **Contact** — contact name, marketing phone, marketing email, existing site
  URL, opening hours, and their Google Maps listing and Facebook profiles.
  Emergency contact is how we reach the owner (unpublished; may be the personal
  number).
- **What they do** — their main trade and the services they offer, plus the
  service areas they cover.
- **Certifications and reviews** — accreditations and certifications, the
  founder, and reviews.
- **Photos** — their work, logo, and project photos.
- **Projects** — named past jobs found online (title, description, cover), shown
  as cards in the client interview when business research found any. Optional.
  Archive removes a card. Not editable during the client interview.

Each detail notes where it came from (the company registry, Google Maps, the
client interview, or business research).

## Happy path

```text
find the business (company registry and/or Google Maps) + online research consent
-> business research starts in the background
-> review what we found → questions to fill the gaps
-> one clear business profile (their answers + what we found, side by side)
-> apply the website template → automatic website copy generation fills in in the background
-> `/onboarding/preview` (complete website sections rotate until copy is done or the wait cap)
-> the preview website address (static HTML, website-activation strip)
-> website activation (pay) → same host stays up without the strip; owner website publication later in the website editor
```

## Online research consent

A simple ask before we do business research — one acknowledgement that we'll
look the business up and use the public information to build their profile. It
is a checkbox on find, required on business lookup, not a client interview
question.

## User stories

1. **As a contractor**, I want to start from my Google Maps listing or company
   registry record, so I don't have to re-type what's already known.
   - Searching my place or my company registry record pre-fills the name,
     category, and contact details. Gaps I have not typed yet, and lists that
     can grow (reviews, photos, Projects, services), fill on the client
     interview as business research lands — I do not re-type them.
2. **As a contractor**, I want to answer a few questions to fill in the gaps, so
   the profile is complete and correct.
   - My answers and the researched information are shown together, each tagged
     with where it came from.
3. **As a contractor**, I want research conflicts between what I said and what
   was found to be shown to me, so I decide which is right.
   - Differences appear as research conflicts; I confirm or edit during the
     client interview before applying the website template.
4. **As a contractor**, I want the profile to keep profile history, so we can
   see how it changed and where each detail came from.
   - Each change is kept, so nothing is lost.
5. **As a contractor**, I want to watch complete website sections while the
   words are written, then land on the real host, so I am not staring at a
   spinner and I am not on a throwaway URL.
   - `/onboarding/preview` rotates filled website sections until website copy
     generation finishes or a short cap. Then the preview website address is the
     website preview (pay strip on the website). If copy is still running after
     that, the host does not live-update. Anyone with the URL may pay.
6. **As a contractor**, I want to close the tab and continue later on the same
   browser, so I don't start over.
   - Reload lands on the same step with answers, extra notes, and remaining
     questions kept. Business lookup runs once. After 07 the host URL works
     without this browser’s storage.

## Acceptance criteria

1. Onboarding starts from a Google Maps listing or company registry record and
   pre-fills what's already known.
2. The researched information is kept with where it came from and how confident
   we are.
3. The business profile keeps profile history, so we can see how it changed.
4. When the contractor's answer disagrees with what we found, both are shown
   side by side so the contractor picks the right one.
5. After they answer the questions they wait on `/onboarding/preview` (complete
   website sections) until automatic website copy generation finishes or the
   wait cap, then land on the preview website address. If copy fails or the cap
   hits first, they can still open the host and do website activation.
6. Closing the tab and coming back on the same browser continues where they left
   off. Business lookup does not start a second run. Clearing storage before 07
   hides the pointer on that browser; the data stays. The host has no token and
   no TTL. Coming back mid-client-interview keeps answers, extra notes, and
   remaining questions. A new voice connection does not re-ask filled checklist
   rows.
7. The client interview Details block is Business details: same fields, same
   controls, same writes (`/onboarding/interview` == `/cms/details` for that
   subset).
