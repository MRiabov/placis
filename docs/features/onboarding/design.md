# Onboarding look

Static HTML for onboarding. Open [onboarding.html](../../design/onboarding.html) in a
browser; there is no build.

The yellow strip is mock-only **per-screen states**. Default **collapsed** (circle in the
top right). Open with `?dev=1`. Hide entirely with `?shot=1`. Scenes: Find, Review,
client interview, wait teaser (`?scene=find|review|interview` and `/onboarding/preview`).

- [onboarding.html](../../design/onboarding.html) — markup
- [onboarding.css](../../design/onboarding.css) — look
- [onboarding.js](../../design/onboarding.js) — mock-only scene wiring (not product UI)
- [tokens.css](../../design/tokens.css) — shared CMS tokens

The mock is visual. Function is the specs ([PRD](prd.md), [frontend.md](frontend.md),
[pipeline](pipeline/README.md)); when they disagree, the specs win. Tokens:
[tokens.css](../../design/tokens.css) ([CMS design.md](../../general-architecture/cms/design.md))
— do not invent a second palette.

Screens in the mock: Find, Review, client interview, wait teaser. Website preview and
website activation live on the [preview website address](pipeline/07-website-preview.md),
not in this file.

Visible words follow [glossary.md](../../glossary.md). The wait-teaser canvas is a fake
homepage, not the contractor website renderer.

Client interview: found photos (logo plus a few photos of the work) with **Upload photos**.
Do not paint where a photo came from. Source from the internet / AI photo only when there
are not enough. Found reviews as cards (review citation + origin). Certifications show the
definition badge; CRO registered is locked when the company registry record was picked on
Find. Heading is Certifications. Free-text services: the LLM turns them into named services.
