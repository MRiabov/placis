# Projects

The contractor’s work shown on the website — jobs with photos — edited at `/cms/projects` under
**Profile**. Ads read the same rows. Not a website-only table.

How the owner reaches it: [CMS frontend](../../../general-architecture/cms/frontend.md). Screen:
[frontend.md](frontend.md). HTTP: [api.md](api.md). Table: [persistence.md](persistence.md).
Decisions: [ADR.md](ADR.md). Port: [frontend-debloat.md](frontend-debloat.md).

A project gallery on a website section is a `json` / `list` website slot of project ids, not
this table’s dump. Slim `projects[]` in the website manifest is baked at website publication.
