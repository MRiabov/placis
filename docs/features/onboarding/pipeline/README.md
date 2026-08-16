# Onboarding — pipeline

The pipeline is async and parallel so the contractor never waits: the moment they pick their
company, fast pre-search + research kick off in the background and the review state returns
immediately. By the time they finish the interview, the profile and the website draft are ready.

```text
01a. find the business (registry parquet + Google Maps, debounced) + consent
02a. fast pre-search + research (async, parallel, streaming progress)
02b. interview — review the checklist ("what we have") → fill gaps
03. build the profile (source ingestion + merge rules)
04. generate (deterministic, after the interview completes)
05. refine (LLM edits via CMS assistant tools)
06. preview (SSE progress)
07. claim → draft, not published
```

## Steps

- [01a-find-business.md](01a-find-business.md) — find the business + confirm
- [02a-research.md](02a-research.md) — fast pre-search + research (async, parallel)
- [02b-interview.md](02b-interview.md) — checklist review + fill gaps
- [03-build-profile.md](03-build-profile.md) — source ingestion + merge rules
- [04-generate.md](04-generate.md)
- [05-refine.md](05-refine.md)
- [06-preview.md](06-preview.md)
- [07-claim.md](07-claim.md)

## Tests

Each step has a matching integration test in [testing/](testing/01a-find-business.md).
