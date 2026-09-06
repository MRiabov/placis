# Sep 3 issue list — ETL

Reclassified 2026-09-03 against [ADR.md](ADR.md). Bold numbers are
original audit ids (not compacted).

## Doc gap

- **1. Phantom `features/other/etl/` links**
  Comment: folder does not exist.
  [../../general-prd.md](../../general-prd.md) line 46 is a second
  ETL bullet with a narrower, wrong source set.
  Action: retarget to this folder; delete the duplicate PRD bullet.
  Same as general-architecture item 1.

- **3. `module-layout.md` omits `transform/traderegistry` (and `websearch`)**
  Comment: [../../infrastructure/jobs.md](../../infrastructure/jobs.md) requires both
  `transform/traderegistry.Run` and `transform/websearch.Run`. Action: add both
  packages to the `transform/` list.

- **4. Continuing-extract source set**
  Comment: ADR 6: Google Maps + Facebook + Instagram, Mon/Wed/Fri.
  Stale text is the same PRD bullet as item 1.

## False alarms (closed)

- **`web_search_transform` “no work”** — ADR 2: extract does not write
  profile rows. [pipeline/web-search.md](pipeline/web-search.md)
  Persist gives transform the new empty `place_id` / URLs. Keep the
  River job kind. Residual: that file’s extract “persist each new
  empty detail” vs the invariant — resolve to ADR 2.
