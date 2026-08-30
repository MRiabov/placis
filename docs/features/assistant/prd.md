# Assistant PRD

After website activation, one **assistant** in the CMS: product guide and doer.
Voice and text are the same conversation. During onboarding, Find, Review, and
client interview is a separate Voice-only Assistant. The unpaid website preview
is a third implementation (text + Voice, five prompts) on
`/onboarding/preview-and-edit/`.

Terms: [glossary](../../glossary.md) (Assistant, Onboarding assistant,
Onboarding website editor, Assistant thread).

## Stories

1. **As an owner**, I call one assistant from any screen in The CMS
   (bottom-right **Assistant**) and talk or type so I do not hunt for a separate
   assistant per screen. Default is Voice; I can switch to text. The assistant
   can explain the product and change the unpublished website (and project rows
   **from the website editor**; `create_project` is a project draft until
   Approve). On Ads the assistant is guide plus `cleanup_image`. Inline AI
   assistance stays Ads Review / project fields on `/cms/projects/{id}`.
2. **As an owner**, I move between the website editor, Ads, Details, and other
   screens without losing the assistant thread or interrupting speech.
3. **As an owner**, when I leave Voice and open the thread, I see what was said
   and the muted tool lines, so text continues the same conversation.
4. **As an owner**, `/cms` is two choices (Do my website / Run my ads), not a
   prompt home.
5. **As a contractor**, I see **Assistant** (DustOrb) on Find, Review, and
   client interview (bottom right). Voice is off until I click; then a
   prerecorded intro plays while it starts, and I can ask questions
   after. It does not write the business profile for me. There is no text
   backup.
6. **As a contractor**, after the wait teaser I land on
   `/onboarding/preview-and-edit/`, switch website pages, talk or type to
   Assistant (five prompts, instant apply), optionally share, then pay. After
   pay I edit the same unpublished website on `/cms/website` with a new
   Assistant thread.

## In

- One assistant thread per activated tenant. Hydrate when they **call** the
  assistant (bottom-right **Assistant**), including `/cms`. Visiting `/cms`
  without calling does not hydrate. GET thread creates an empty `current` if
  needed.
- Voice and text share that thread. Tool lines land as they run. The assistant
  is an agent (up to 20 tool-using model turns after one send / utterance).
- Website editor **text:** Ask first vs instant apply, Follow (always on). Voice
  is always Ask first. No owner Plan switch on Voice.
- Ads Assistant is **guide** plus `cleanup_image`. Generate / revise / rewrite
  stay Ads UI (Create ad and generate, Revise, Review **inline AI assistance**).
  On Ads, highlight / agent-edited; Ctrl+Z’able. Not Ask first.
- Details: `update_details` is general; Follow on that screen; notification (OK
  / Revert) elsewhere.
- Guide-only on `/cms`, Projects, Certifications and reviews, media library,
  billing (usage). Called from the same bottom-right **Assistant**. Default
  Voice; switch to text. Projects **write** tools only from the website editor.
- Onboarding assistant: isolated, Voice only, not billed. Contractor copy is
  **Assistant**. Persist utterance **text** and **`offset_seconds`**; do not
  store the Voice recording.
- Onboarding website editor: five unpaid prompts, instant apply, not billed,
  same `ai.threads` (`kind=cms_assistant`) until 09 completes `current`.
- Assistant debit of billing usage credit (**×5** **their cost** on **our
  cost**). Billed work is a text LLM call, image generate/cleanup, or ads
  generate (**AI vendor cost**). Voice is **AI voice vendor cost** (xAI audio
  minutes plus text-item fees). Insufficient usage credit is **402**
  (`usage_credit_exhausted`).

## Out

- Agent-run client interview as a writer (04b tools). The contractor still types
  fields (04a).
- Migrating the onboarding conversation onto the CMS thread after website
  activation.
- Paperclip / attach on the Assistant.
- Multi-thread list UI.
- Screenshot / pixel streaming of the CMS.
- Per-tool HTTP paths (`/v1/assistant/tool/…`).
- A Go WebSocket for audio.
- Onboarding text backup / **Switch to text mode** on onboarding.
- Onboarding Voice recording files (persist utterance text + `offset_seconds`
  only).
- 24h thread discard (compaction only).
- Usage credit on auth `tenants`. Billing is its own feature and usage screen.

## Acceptance

- Hydrate after calling the assistant on website editor / Ads / Details / `/cms`
  (and other screens in The CMS) returns the same thread after Voice, including
  muted tool lines.
- `switch_assistant_screen` navigates; `get_context_about_screen` does not.
  Wrong-screen website/ads/projects-write tools are refused.
- Activated owners cannot call onboarding routes. Unactivated contractors cannot
  call `/v1/assistant/…`.
- Onboarding guide has no write tools and no text WebSocket.
- Exhausted usage credit on a billed assistant POST is **402**, not 403.
- Onboarding default is DustOrb + **Click to turn on voice**, not speaking.
- `/thread/new` while a run is in flight (including Voice) is **409**.
