# Projects look

Static HTML for Projects. Open [cms.html](../../../design/cms.html)
(`?scene=projects`) in a browser; there is no build.

[Design decision record](design-decision-record.md). The yellow strip is
mock-only **per-screen states**. Default **collapsed**. Open with `?dev=1`. Hide
with `?shot=1`. Scenes: list (`?scene=projects`), project
(`?scene=project`). Dev: empty, populated, cover picker, Archive, stacked
description diffs.

- [cms.html](../../../design/cms.html) — markup (list + project)
- [cms.css](../../../design/cms.css) — look (My ads cards, orbs, inline diff)
- [cms.js](../../../design/cms.js) — mock-only scene wiring (not product UI)
- [details-fields.css](../../../design/details-fields.css) — owner field
  controls and buttons
- [tokens.css](../../../design/tokens.css) — shared tokens

The mock is visual. Function is the specs ([frontend.md](frontend.md),
[ADR](ADR.md), [api.md](api.md)); when they disagree, the specs win. Tokens:
[CMS design.md](../../../general-architecture/cms/design.md) — do not invent a
second palette.

Visible words follow [glossary.md](../../../glossary.md). Don't say portfolio,
gallery (except website **project gallery** in Content), form, page, Remove, or
Delete. Writing is Ads AI orbs on `/cms/projects/{id}`, not Voice and not the
website assistant overlay.
