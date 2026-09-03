# Projects

The contractor’s work shown on the website — jobs with photos — edited at
`/cms/projects` under **Profile**. Ads read the same rows. Not a website-only
table.

How the owner reaches it: [CMS frontend](../../../general-architecture/cms/frontend.md). Screen: [frontend.md](frontend.md). Look:
[design.md](design.md), [design decision record](design-decision-record.md). HTTP: [api.md](api.md). Architecture:
[architecture.md](architecture.md). Table: [persistence.md](persistence.md). Tests: [testing.md](testing.md). [ADR](ADR.md). Port:
[frontend-debloat.md](frontend-debloat.md).

A project gallery on a website section is a `json` / `list` website slot of
project ids, not this table’s dump. Slim `projects[]` in the website manifest is
baked at website publication from **active** rows only (skip `draft`).
