# Design look

Editable look lives in [`apps/demo/`](../../apps/demo/README.md) (Vite + React + Tailwind). From that
folder: `pnpm install && pnpm dev` — <http://localhost:5176>. `?dev=1` opens the
yellow developer strip; `?shot=1` hides it.

The HTML in this directory is an **archive**. Do not start new look work
here. Specs still win when they disagree with the look
([CMS](../general-architecture/cms/README.md),
[website](../features/website/README.md),
[assistant](../features/assistant/README.md),
[onboarding](../features/onboarding/README.md),
[business profile](../features/business-profile/README.md)). Visible words follow [glossary.md](../glossary.md). The canvas is a fake
homepage, not the contractor website renderer.

## Archive (HTML mocks)

Static HTML. Open in a browser; there is no build. Shared tokens:
[tokens.css](tokens.css).

- [cms.html](cms.html) / [cms.css](cms.css) / [cms.js](cms.js)
- [onboarding.html](onboarding.html) / [onboarding.css](onboarding.css) /
  [onboarding.js](onboarding.js)
- [ads.html](ads.html) / [ads.css](ads.css) / [ads.js](ads.js)
- [details-fields.css](details-fields.css) / [details-fields.js](details-fields.js)
- [dust-orb.js](dust-orb.js) / [mock-voice.js](mock-voice.js)

Look notes: [CMS design.md](../general-architecture/cms/design.md),
[onboarding design.md](../features/onboarding/design.md),
[ad generation frontend](../features/ads/ad-generation/frontend.md),
[Projects look](../features/business-profile/projects/design.md) (`apps/demo/`
`/cms/projects`).
