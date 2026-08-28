# Design mocks

Static HTML. Open the HTML in a browser; there is no build.

Shared tokens: [tokens.css](tokens.css). CMS is the source of truth; onboarding and Ads
import this file and do not keep a second palette.

The yellow strip is mock-only **per-screen states**. Default **collapsed**
(circle in the top right). Open with `?dev=1`. Hide entirely with `?shot=1`.

## The CMS

- [tokens.css](tokens.css) — shared `:root` (CMS, onboarding, Ads)
- [cms.html](cms.html) — markup
- [cms.css](cms.css) — look
- [cms.js](cms.js) — mock-only scene wiring (not product UI)

The mock is visual. Function is the specs ([CMS](../general-architecture/cms/README.md),
[website](../features/website/README.md),
[business profile](../features/business-profile/README.md)); when they disagree, the specs win. Tokens: [CMS design.md](../general-architecture/cms/design.md).

Layout and spacing match `frontend-2`. Visible words follow [glossary.md](../glossary.md). The
canvas is a fake homepage, not the contractor website renderer.

## Onboarding

- [onboarding.html](onboarding.html) — markup
- [onboarding.css](onboarding.css) — look
- [onboarding.js](onboarding.js) — mock-only scene wiring (not product UI)

Look notes: [onboarding design.md](../features/onboarding/design.md). Specs: [onboarding frontend](../features/onboarding/frontend.md). Tokens:
[tokens.css](tokens.css).

## Ads

- [ads.html](ads.html) — markup
- [ads.css](ads.css) — look
- [ads.js](ads.js) — mock-only scene wiring (not product UI)

Look notes: [ad generation frontend](../features/ads/ad-generation/frontend.md). Tokens: [tokens.css](tokens.css). Facebook/Instagram
placement colors stay platform-native.
