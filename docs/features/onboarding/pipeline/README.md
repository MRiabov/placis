# Onboarding — pipeline

The pipeline runs async and in parallel so the contractor never waits: research kicks off the moment
they give us their listing/registry record and confirm, so by the time they finish the interview the
website draft is ready.

```text
01a. find the business (Google Maps / registry) ─┐
     confirm (consent)                            ├─► 02b. interview — "review what we have" → fill gaps
02a. research (async, parallel) ──────────────────┘
03. build the profile
04. generate the website (deterministic)
05. refine (LLM edits the draft)
06. preview (SSE progress)
07. claim → draft, not published
```

## Steps

- [01a-find-business.md](01a-find-business.md) — find the business + confirm
- [02a-research.md](02a-research.md) — research (async, parallel)
- [02b-interview.md](02b-interview.md) — interview (review + gaps)
- [03-build-profile.md](03-build-profile.md)
- [04-generate.md](04-generate.md)
- [05-refine.md](05-refine.md)
- [06-preview.md](06-preview.md)
- [07-claim.md](07-claim.md)

## Tests

Each step has a matching integration test in [testing/](testing/01a-find-business.md).
