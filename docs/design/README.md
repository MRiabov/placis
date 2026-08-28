# Design mocks

Static HTML. Open the HTML in a browser; there is no build.

Shared tokens: [tokens.css](tokens.css). CMS is the source of truth; onboarding and Ads
import this file and do not keep a second palette.

The yellow strip is mock-only **per-screen states**. Default **collapsed**
(circle in the top right). Open with `?dev=1`. Hide entirely with `?shot=1`.

## The CMS

- [tokens.css](tokens.css) — shared `:root` (CMS, onboarding, Ads)
- [dust-orb.js](dust-orb.js) — particle DustOrb (vanilla port of placis-web) + OrbDemo scale
- [mock-voice.js](mock-voice.js) — prerecorded greeting + microphone noise
  level; denied access calls `onDenied` (CMS restores the chatbot; onboarding
  returns to the cue). Greeting / intro plays on the first start; a later start
  more than 5s after that does not replay it.
- [cms.html](cms.html) — markup (`/cms` two cards; assistant overlay on the website
  editor)
- [cms.css](cms.css) — look
- [cms.js](cms.js) — mock-only scene wiring (not product UI)
- [details-fields.css](details-fields.css) / [details-fields.js](details-fields.js) — owner field controls, buttons,
  combobox, labels, yellow strip, plus Details widgets (territory cards, service
  list, hours picker). cms.html, onboarding.html, and ads.html.

The mock is visual. Function is the specs ([CMS](../general-architecture/cms/README.md),
[website](../features/website/README.md),
[assistant](../features/assistant/README.md),
[onboarding](../features/onboarding/README.md),
[business profile](../features/business-profile/README.md)); when they disagree, the specs win. Tokens: [CMS design.md](../general-architecture/cms/design.md).

Layout and spacing match `frontend-2`. Visible words follow [glossary.md](../glossary.md). The
canvas is a fake homepage, not the contractor website renderer.

## Onboarding

- [onboarding.html](onboarding.html) — markup (bottom-right voice guide orb)
- [onboarding.css](onboarding.css) — look
- [onboarding.js](onboarding.js) — mock-only scene wiring (not product UI)
- [details-fields.css](details-fields.css) / [details-fields.js](details-fields.js) — shared with The CMS
- DustOrb: [dust-orb.js](dust-orb.js)

Look notes: [onboarding design.md](../features/onboarding/design.md). Look decisions:
[onboarding design decision record](../features/onboarding/design-decision-record.md). Specs: [onboarding frontend](../features/onboarding/frontend.md) (interview
Details == [Business details](../features/business-profile/details/frontend.md)). Tokens: [tokens.css](tokens.css). Header and the
website-activation strip use
[placis-mark.png](placis-mark.png).
`?scene=generated` mocks the preview website with the website-activation strip
sticky at the bottom. After pay, the mock opens [cms.html](cms.html)
(`?scene=website&publication=1&from=activation`) — website editor, **Publish**.

## Ads

- [ads.html](ads.html) — markup (also the Ads destination inside [cms.html](cms.html))
- [ads.css](ads.css) — look
- [ads.js](ads.js) — mock-only scene wiring (not product UI)

Open `cms.html?scene=ads` to see Ads in the CMS. `ads.html` stays a
standalone file so it can be embedded (`?embed=1`) or opened on its own.

Look notes: [ad generation frontend](../features/ads/ad-generation/frontend.md). Tokens: [tokens.css](tokens.css). Owner field
controls: [details-fields.css](details-fields.css) ([CMS design decision](../general-architecture/cms/design-decision-record.md) 6). Facebook/Instagram
placement colors stay platform-native.
