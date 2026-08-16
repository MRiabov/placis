# Onboarding PRD

Status: proposed product scope for onboarding — learning about a business and building its profile.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[tenancy/auth/data model](../tenancy-auth-and-data-model.md).

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

Onboarding always starts from a **source** the contractor already has:

1. **Google Maps listing** — search and pick their place; it pre-fills the name, category, phone,
   photos, and reviews.
2. **Company-registry record** — their Companies House (UK) or CRO (Ireland) name or number; it
   pre-fills the legal name and registered details.

Then a short interview fills in what the sources don't cover (services, areas, hours, and anything
the contractor wants to correct). Voice is a later way to answer those questions.

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
   - Each change is kept; the profile always points at the current version.

## Acceptance criteria

1. Onboarding starts from a Google Maps listing or company-registry record and pre-fills known
   details.
2. Research sources are behind one interface with fakes for testing; results are stored with where
   they came from and how confident we are.
3. The business profile keeps its history and always points at the current version.
4. Conflicting answers are shown for review, never silently resolved.
5. One end-to-end test covers start → interview → research → profile → generate, with outside
   services mocked but the core logic real.
