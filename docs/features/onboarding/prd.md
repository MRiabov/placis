# Onboarding PRD

Status: proposed product scope for onboarding — learning about a business and building its profile.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[data model](../../general-architecture/data-model.md).

## Problem

A contractor wants a done-for-you website and ads. Before we build anything, we need to know the
business: what it does, where it works, and how customers reach it. We start from what they already
have — their Google Maps listing or their company-registry record (e.g. Companies House) — then ask
a few questions to fill the gaps, and research the rest from public sources.

## Goals

1. Start from their **Google Maps listing or company-registry record** (Companies House / CRO),
   which pre-fills what we already know.
2. Ask a few questions to fill in what's missing — their services, the areas they cover, their
   contact details and opening hours.
3. **Research the business** from public sources: Google Maps, the company registry, Facebook,
   their current website, and photos of their work.
4. Combine their answers with what we found into one clear **business profile**, each detail noting
   where it came from.
5. When their answer disagrees with what we found, **show the difference and let them decide**.
6. Build their website and ads from that profile.

## Non-goals

- No CRM/operations work — no leads, quotes, invoices, jobs, or schedules.
- No ad preferences during onboarding — ads are made later, on demand.
- No per-customer code — the profile is a description of the business, not a generated app.

## How it starts

The contractor picks a **country** (Ireland, UK, or US), then finds their business:

1. **Company registry** — Companies House (UK), CRO (Ireland), or the US state registry. They type
   the corporate name and pick the right record; it pre-fills the legal name, company number,
   status, and registered office.
2. **Google Maps (optional)** — they can also match their Google Maps place; it pre-fills the name,
   category, phone, photos, and reviews.

They can select either, or both when they describe the same business. Then a single checkbox:
"I agree that Placis can collect public information about this business to prepare the website
preview."

A short interview then fills in what the listing and registry record don't cover. Voice is a later
way to answer it.

## What we know about the business

By the end, the business profile holds:

- **Who they are** — display name, legal name, trade, established year, and a short description.
- **Legal details** — company number, VAT number, registered office.
- **Contact** — contact name, phone, email, website, opening hours, and their Google and Facebook
  profiles.
- **What they do** — their main trade and the services they offer, plus the areas they cover.
- **Proof** — accreditations and certifications, the founder, and reviews.
- **Photos** — their work, logo, and project photos.

Each detail notes where it came from (the registry, Maps, the interview, or research).

## Happy path

```text
start from their Google Maps listing or company-registry record
-> a few questions to fill the gaps
-> research the business (in the background)
-> one clear business profile (their answers + what we found, side by side)
-> generate a website draft
-> reserve their web address and share a preview
-> apply their approved content
-> claim (pay) -> go live -> publish
```

## Consent

A simple ask before we research them — one acknowledgement that we'll look the business up and use
the public information to build their profile. It's part of the interview, not a separate flow.

## User stories

1. **As a contractor**, I want to start from my Google Maps listing or company-registry record, so
   I don't have to re-type what's already known.
   - Searching my place or my registry entry pre-fills the name, category, and contact details.
2. **As a contractor**, I want to answer a few questions to fill in the gaps, so the profile is
   complete and correct.
   - My answers and the researched information are shown together, each tagged with where it came
     from.
3. **As a contractor or the team**, I want disagreements between what I said and what was found to
   be shown to me, so I decide which is right.
   - Differences appear during review; I confirm or edit before anything is generated.
4. **As the team**, I want the profile to keep its history, so we can see how it changed and where
   each detail came from.
   - Each change is kept, so nothing is lost.

## Acceptance criteria

1. Onboarding starts from a Google Maps listing or company-registry record and pre-fills what's
   already known.
2. The researched information is kept with where it came from and how confident we are.
3. The business profile keeps its history, so we can see how it changed.
4. When the contractor's answer disagrees with what we found, both are shown side by side so the
   contractor picks the right one.
