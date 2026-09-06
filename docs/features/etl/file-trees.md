# File trees — ETL

Backend only (no owner UI). High-level:
[module layout](../../general-architecture/module-layout.md).
[architecture.md](architecture.md). Per-source steps:
[pipeline README](pipeline/README.md). Package names match architecture
(`googlemaps`, `crawl`, `websearch`, `traderegistry`). River job kinds
**call** `extract/<pkg>.Run` / `transform/<pkg>.Run`. Omit `*_test.go`.

No `internal/research/`. No `onboarding/research/`. No `transform/photo`
(`describe_image` is `profile/media`).

## Backend

```text
internal/etl/
  service.go                        # StartRun (architecture: same identity as
                                    # run.go). Orchestration only.
  jobs.go                           # scheduled_etl → StartRun(trigger=scheduled)
  prompts.yaml                      # etl_crawl_parse / usable-as-a-Project
  extract/
    googlemaps/
      extract.go                    # extract/googlemaps.Run
      fake.go                       # Maps Places / scrape
    facebook/
      extract.go                    # extract/facebook.Run
      fake.go
    instagram/
      extract.go                    # extract/instagram.Run
      fake.go
    crawl/
      extract.go                    # extract/crawl.Run (Parallel Extract)
      fake.go
    websearch/
      extract.go                    # extract/websearch.Run (Gateway search)
      fake.go
    traderegistry/
      extract.go                    # extract/traderegistry.Run
      fake.go
  transform/
    googlemaps/
      transform.go                  # transform/googlemaps.Run
                                    # **calls** profile service.go
    facebook/
      transform.go
    instagram/
      transform.go
    crawl/
      transform.go
    websearch/
      transform.go
    traderegistry/
      transform.go
    projects/
      transform.go                  # transform/projects.Run (not an ETL run kind)
  store/                            # sqlc for schema etl
    queries.sql                     # runs, sources, fetches, listings,
                                    # crawl pages, imported_media,
                                    # llm_source_to_project_classifications
```

`extract/` = **6** dirs. `transform/` = **7** dirs (`projects/` extra).
ETL fast extract then ETL slow extract live in that extract package, not
in `StartRun`.
