# Onboarding look

Editable look: [`apps/demo/`](../../../apps/demo/README.md) `/onboarding/*`.

[Design decision record](design-decision-record.md). The yellow strip is
mock-only **per-screen states**. Default **collapsed** (circle in the top
right). Open with `?dev=1`. Hide entirely with `?shot=1`. Scenes: Find,
Review, client interview, wait teaser, generated-website mock. Don't say
preview. Wait teaser is `?scene=preview` (not a website preview);
`?scene=generated` is the generated-website mock.

- [`apps/demo/`](../../../apps/demo/README.md) `/onboarding/*` — markup and look
- [`theme.css`](../../../apps/demo/src/styles/theme.css) — shared CMS tokens and owner field controls (also `/cms` and
  `/cms/ads`)
- [`placis-mark.png`](../../../apps/demo/public/placis-mark.png) — orb lockup in the wordmark and on the website-activation
  strip

The mock is visual. Function is the specs ([PRD](prd.md), [frontend.md](frontend.md), [pipeline](pipeline/README.md));
when they disagree, the specs win. Tokens: [`theme.css`](../../../apps/demo/src/styles/theme.css) ([CMS design.md](../../general-architecture/cms/design.md)) — do
not invent a second palette.

Screens in the mock: Find, Review, client interview, wait teaser, unpaid website
preview (`/onboarding/preview-and-edit`). The generated scene is a mock of the
[preview website address](pipeline/08-preview-website-address.md) (website-activation strip sticky at the bottom). After
pay it opens [`apps/demo/`](../../../apps/demo/README.md) `/cms/website` — website editor with **Publish**.

The **onboarding assistant** (owner copy: **Assistant**) is a DustOrb bottom
right: **visible**, voice off, cue **Click to turn on voice**. Particle orb from
[`DustOrb.tsx`](../../../apps/demo/src/ui/DustOrb.tsx); hover / tap scale 1.03. Click plays a prerecorded intro
([onboarding-guide-intro.mp3](../../../apps/demo/public/onboarding-guide-intro.mp3)) after the microphone is granted, while the
connection starts, and grows more particles from owner noise; they ask questions
after. Denied microphone returns to the cue
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

Client interview: logo tile plus the media library gallery for work photos (same
gallery as `/cms/media`, website Content, and Projects cover pick). **Upload**
on that gallery. Do not paint where a photo came from. Do not offer Find more
online / Create a stand-in. Many found photos (Maps) scroll in the card; four
columns so tiles stay small. Continue with no work photos opens a complete
warning ([design decision](design-decision-record.md) 15). Found reviews look like Google reviews
([design decision](design-decision-record.md) 4). Project cards reuse the `/cms/projects` card (cover
`h-44` / `rounded-[18px]`, title, short description, prompt radius + hairline +
shadow) in two columns ([design decision](design-decision-record.md) 17). **Archive** is the top-right icon
on the card, not a button under the description. Omit the whole Projects block
when nested `profile.projects` is empty. Extra notes owner copy is
**Anything else we should know?** with a helper about generating a better
website or running ads ([design decision](design-decision-record.md) 5). Certifications show the definition
badge; CRO registered is locked when the company registry record was picked on
Find. Heading is Certifications. Featured services and service areas use the
same Details field controls as `/cms/details` on the white onboarding card
([design decision](design-decision-record.md) 12): a service-name list (paste splits into rows) and one
Maps territory card per region. Hours use that picker (one range per day). We’ll
turn each service name into a website page. Onboarding Details == Business
details (same fields and controls; the white card is the look difference).
