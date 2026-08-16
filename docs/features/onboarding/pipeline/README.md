# Onboarding — pipeline

The pipeline is **async and parallel** so the contractor never waits: the moment they give us their
Google Maps listing or company-registry record and confirm, research kicks off in the background. By
the time they finish the interview, the profile and the website draft are already ready.

```text
01a. find the business (Google Maps / registry) ─┐
01b. confirm (consent)                            ├─► 02. interview (only the gaps)
02. research  (async, parallel) ──────────────────┘        │
    Google Places · registry · Facebook · crawl · photos   │
03. build the profile  ◄── research results + interview answers
04. generate the website (deterministic)  ◄── profile + blueprint
05. refine (LLM edits the draft)           ◄── draft
06. preview (SSE progress, 2–10s events)
07. claim (pay) → draft, not published
```

## Steps

- **01a/01b — start** — the contractor picks their Google Maps listing or registry record and
  confirms. Research starts **immediately**, in the background.
- **02 — interview** — while research runs, the contractor answers only what the sources didn't
  provide.
- **03 — build the profile** — research results + interview answers merge into the business profile.
- **04 — generate** — the website draft is generated deterministically from the profile + blueprint
  (no LLM).
- **05 — refine** — the LLM (the editor) drafts copy and picks images on top of the draft.
- **06 — preview** — the contractor reviews; progress is streamed over SSE every 2–10s.
- **07 — claim** — the contractor pays; the site stays a draft until they publish.
