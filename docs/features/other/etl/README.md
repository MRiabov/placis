# ETL

Public-source extract for a contractor: Google Maps listing, company and trade registries,
Facebook (reviews, **posts** when they exist), website crawl, and photos. The first run
is onboarding [02](../../onboarding/pipeline/02-business-research.md) (the full job set).
After website activation, [scheduled](pipeline/scheduled.md) keeps **listing updates**
(Maps, Facebook, Instagram) — not a repeat of 02.

Owner-facing name: **business research**. This directory is the extract machinery (Internal:
ETL).

- [ADR](ADR.md) — schema split, append-only fetches, ongoing runs
- [architecture.md](architecture.md) — extract / transform / load, watermarks, skip rules
- [persistence.md](persistence.md) — Postgres schema `etl`
- [pipeline](pipeline/README.md) — scheduled run and source-change / import triggers
- [testing.md](testing.md)

Onboarding still owns the onboarding session, the run cap during find, and the checklist. It does not
own listing tables or fetch bodies. The fold stays in
[details](../details/persistence.md). Photos land in the
[media library](../media/persistence.md).
