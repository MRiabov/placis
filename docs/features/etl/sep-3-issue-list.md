# Sep 3 issue list — ETL

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## High

1. **Phantom duplicate ETL tree `docs/features/other/etl/`**
   Issue: docs. Action: point every link at this folder; delete the
   second ETL bullet in the product PRD.
   Where:

   - [../../general-prd.md](../../general-prd.md) line 37 (correct:
     `features/etl/README.md`)
   - [../../general-prd.md](../../general-prd.md) line 46 (broken:
     `features/other/etl/README.md`, narrower scope)
   - [../../general-architecture/README.md](../../general-architecture/README.md)
     (Public-source extract still links `features/other/etl/README.md`)
   - Media library README already points at this folder (`../etl/README.md`).
     Only the product PRD and general-architecture README still name
     `features/other/etl/`.

   Folder `docs/features/other/etl/` does not exist. An implementer
   reading the PRD sees two ETL features.

2. **`web_search_transform` is a River job kind with no work**
   Issue: jobs. Action: make `web_search` extract-only; delete the
   transform River job kind.
   Where:

   - [../../general-architecture/jobs.md](../../general-architecture/jobs.md)
     lines 29, 64 (`transform/websearch.Run`)
   - [pipeline/web-search.md](pipeline/web-search.md) line 52 (“Do not
     write Parallel prose onto the profile. New details are enough.”)
   - Extract already persists new empty details as they arrive
   - [../../general-architecture/module-layout.md](../../general-architecture/module-layout.md)
     lines 32–34 (`transform/` has no `websearch/`)

## Medium

3. **Missing `transform/traderegistry` in module layout** Issue: docs. Action:
   add it to the `transform/` list. Where: [../../general-architecture/jobs.md](../../general-architecture/jobs.md)
   line 72 requires `transform/traderegistry.Run`;
   [../../general-architecture/module-layout.md](../../general-architecture/module-layout.md) lines 32–34 omit it.

4. **Continuing-extract source set disagrees**
   Issue: contradiction. Action: Google Maps + Facebook + Instagram
   (ETL ADR 6), not the stale PRD bullet that omits Instagram and Maps.
   Where: [../../general-prd.md](../../general-prd.md) line 46 vs
   [README.md](README.md) and ETL ADR 6.

## Keep

- Instagram, website crawl, trade registry, web-search **extract** —
  each has a named downstream consumer.
- `etl.sources` and typed junctions.
- `llm_source_to_project_classifications`.
- Onboarding 04b kept as a negative spec (not an ETL file; do not
  delete it thinking it is an orphan).
