# ETL pipeline — tests

Integration (Testcontainers Postgres, adapters faked). One file per
source / operation group. Go names: `TestPipelineHappyPathEtlGoogleMaps`
(and the other source stems) plus `TestPipelineHappyPathEtlFull`. Do not
require Vitest (no owner UI).

- [ETL run kind triggers](etl-run-kind-triggers.md)
- [Google Maps](google-maps.md)
- [Facebook](facebook.md)
- [Instagram](instagram.md)
- [Website crawl](website-crawl.md)
- [Projects from source](projects.md)
- [Trade registry](trade-registry.md)
- [Web search](web-search.md)
- [Photo classification](photo-classification.md)
