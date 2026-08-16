# Onboarding PRD

Status: proposed product scope for onboarding — learning about a business and building its profile.

Related: [ADR](ADR.md), [technical-implementation.md](technical-implementation.md),
[tenancy/auth/data model](../tenancy-auth-and-data-model.md).

## Problem

A contractor wants a done-for-you website and ads. Before we build anything, we need to know the
business: what it does, where it works, and how customers reach it. The contractor shouldn't fill
a long form — we find out about the business from public sources and ask a few questions, then put
it all into one clear profile they can check.

## Goals

1. Learn about the business three ways: a short **text interview**, **starting from an existing
   listing** (their Google Maps page or company-registry record), or **voice** (later).
2. Ask for **consent** before anything sensitive — recording, transcription, AI help, or research.
3. **Research the business** from public sources: Google Maps, the company registry, Facebook,
   their current website, and photos of their work.
4. Combine what the contractor said with what we found into one clear **business profile** — the
   services they offer, the areas they cover, their contact details and opening hours — each with a
   note of where it came from.
5. When the contractor's answer disagrees with what we found, **show the difference and let them
   decide** — never guess for them.
6. Build their website and ads from that profile.

## Non-goals

- No CRM/operations work — no leads, quotes, invoices, jobs, or schedules.
- No ad preferences during onboarding — ads are made later, on demand.
- No per-customer code — the profile is a description of the business, not a generated app.

## Channels

1. **Text interview** — a short form; answers are saved as the contractor goes.
2. **Start from an existing listing** — begin from their Google Maps page or company-registry
   record, which pre-fills what we already know.
3. **Voice** — later; the wiring is reserved but the phone agent isn't built yet.

## Happy path

```text
start (text, or from an existing listing)
-> ask for consent
-> a few questions
-> research the business (in the background)
-> one clear business profile (their answers + what we found, side by side)
-> generate a website draft
-> reserve their web address and share a preview
-> apply their approved content
-> claim (pay) -> go live -> publish
```

## Consent

Consent is asked per thing — recording, transcription, AI help, research — and each is its own
answer. In the EU we don't start research or AI work until the matching consent is given.
Withdrawing consent is recorded, never erased.

## User stories

1. **As a contractor**, I want to describe my business once, so the system researches it and gives
   me a profile to check.
   - Starting from my Google Maps page or registry record pre-fills what's already known.
   - My answers and the researched information are shown together, each tagged with where it came
     from.
2. **As a contractor**, I want consent to be clear and per-thing, so I know what Placis does with
   my information.
   - Research and AI never start before the matching consent.
   - Withdrawing consent is recorded and audited.
3. **As a contractor or the team**, I want disagreements between what I said and what was found to
   be shown to me, so I decide which is right.
   - Differences appear during review; I confirm or edit before anything is generated.
4. **As the team**, I want the profile to keep its history, so we can see how it changed and where
   each detail came from.
   - Each change is kept; the profile always points at the current version.

## Acceptance criteria

1. Onboarding records how the business was described, what consent was given, and where things
   stand, as a clear set of steps.
2. Research sources are behind one interface with fakes for testing; results are stored with where
   they came from and how confident we are.
3. The business profile keeps its history and always points at the current version.
4. Conflicting answers are shown for review, never silently resolved.
5. Consent is per-thing and enforced before research or AI work.
6. One end-to-end test covers start → consent → interview → research → profile → generate, with
   outside services mocked but the core logic real.
