# Onboarding look

Editable look: [`demo/`](../../../demo/README.md) `/onboarding/*`. HTML archive:
[onboarding.html](../../design/onboarding.html).

[Design decision record](design-decision-record.md). The yellow strip is
mock-only **per-screen states**. Default **collapsed** (circle in the top
right). Open with `?dev=1`. Hide entirely with `?shot=1`. Scenes: Find,
Review, client interview, wait teaser, generated-website mock. Don't say
preview. Wait teaser is `?scene=preview` (not a website preview);
`?scene=generated` is the generated-website mock.

- [onboarding.html](../../design/onboarding.html) — markup
- [onboarding.css](../../design/onboarding.css) — look
- [onboarding.js](../../design/onboarding.js) — mock-only scene wiring (not product UI)
- [details-fields.css](../../design/details-fields.css) / [details-fields.js](../../design/details-fields.js) — owner field controls plus Details
  widgets (also cms.html and ads.html)
- [tokens.css](../../design/tokens.css) — shared CMS tokens
- [placis-mark.png](../../design/placis-mark.png) — orb lockup in the wordmark and on the website-activation
  strip

The mock is visual. Function is the specs ([PRD](prd.md), [frontend.md](frontend.md), [pipeline](pipeline/README.md));
when they disagree, the specs win. Tokens: [tokens.css](../../design/tokens.css) ([CMS design.md](../../general-architecture/cms/design.md)) — do
not invent a second palette.

Screens in the mock: Find, Review, client interview, wait teaser. The generated
scene is a mock of the [preview website address](pipeline/07-website-preview.md) (website-activation strip
sticky at the bottom), so Skip generation has somewhere to land. After pay it
opens [`demo/`](../../../demo/README.md) `/cms/website` — website editor with **Publish**. Product
website preview and website activation still live on that host, not on
`/onboarding/preview`.

The **onboarding assistant** (owner copy: **voice guide**) is a DustOrb bottom
right: **visible**, voice off, cue **Click to turn on voice**. Particle orb from
[dust-orb.js](../../design/dust-orb.js); scale matches placis-web OrbDemo (hover 1.03, speaking 1.10).
Click plays a prerecorded intro ([onboarding-guide-intro.mp3](../../design/onboarding-guide-intro.mp3)) after the
microphone is granted, while the connection starts, and bounces from owner noise
level; they ask questions after. Denied microphone returns to the cue
(**Allow microphone access in your browser**); click the orb retries. The
realtime connection is not created. The intro plays on the first turn-on;
turning the guide on again more than **5 seconds** after that intro began does
not replay it. Close → **Enable voice guide**. Not on the preview website
address / website-activation strip. Hidden on the wait teaser in this mock. See
[assistant design decision 6](../assistant/design-decision-record.md). Denied microphone: [design decision 8](../assistant/design-decision-record.md). Greeting:
[design decision 9](../assistant/design-decision-record.md). Realtime after microphone:
[design decision 10](../assistant/design-decision-record.md).

Visible words follow [glossary.md](../../glossary.md) and [design decision](design-decision-record.md) 6 (owner language, not
PRD phrasing). Type: [design decision](design-decision-record.md) 9 (screen title, then a heading block per
card, then quieter field labels). Website activation on the generated mock:
[design decision](design-decision-record.md) 10 (white strip, Placis orb lockup, headline, price, activate
CTA; after pay → website editor, **Publish**). Delight: [design decision](design-decision-record.md) 11
(wait-teaser hero uses the job-site photo; timeline tracks the 15s cap). The
wait-teaser canvas is a fake homepage, not the contractor website renderer.

Client interview: found photos (logo plus a few photos of the work) with
**Upload photos**. Do not paint where a photo came from. Find more online /
Create a stand-in only when there are not enough. Found reviews look like Google
reviews ([design decision](design-decision-record.md) 4). Extra notes owner copy is
**Anything else we should know?** with a helper about generating a better
website or running ads ([design decision](design-decision-record.md) 5). Certifications show the definition
badge; CRO registered is locked when the company registry record was picked on
Find. Heading is Certifications. Featured services and service areas use the
same Details field controls as `/cms/details` on the white onboarding card
([design decision](design-decision-record.md) 12): a service-name list (paste splits into rows) and one
Maps territory card per region. Hours use that picker (one range per day). We’ll
turn each service name into a website page. Onboarding Details == Business
details (same fields and controls; the white card is the look difference).
