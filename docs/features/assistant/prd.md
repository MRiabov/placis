# Assistant PRD

After website activation, one **assistant** in the CMS: product guide and doer.
Voice and text are the same conversation. The contractor during onboarding gets
a separate **onboarding assistant** (guide only).

Terms: [glossary](../../glossary.md) (Assistant, Onboarding assistant, Assistant thread, Assistant
screen context, Assistant screen switch).

## Stories

1. **As an owner**, I call one assistant from any screen in The CMS
   (bottom-right **Assistant**) and talk or type so I do not hunt for a separate
   chatbot per screen. Default is Voice; I can switch to text.
2. **As an owner**, I move between the website editor, Ads, Details, and other
   screens without losing the assistant thread or interrupting speech.
3. **As an owner**, when I leave Voice and open the thread, I see what was said
   and the muted tool lines, so text continues the same conversation.
4. **As an owner**, `/cms` is two choices (Do my website / Run my ads), not a
   prompt home.
5. **As a contractor**, I see a voice-guide orb on Find, Review, and client
   interview (bottom right). Voice is off until I click; then a prerecorded
   intro plays while the guide starts, and I can ask questions after. It does
   not write the business profile for me.

## In

- One assistant thread per activated tenant. Hydrate when they **call** the
  assistant (bottom-right **Assistant**), including `/cms`. Visiting `/cms`
  without calling does not hydrate.
- Voice and text share that thread. Tool lines land as they run.
- Website editor: plan vs continuous, Ask first vs instant apply, Follow (canvas
  snap).
- Ads overlay is **guide**. Generate / revise / rewrite stay Ads UI (Create ad
  and generate, Revise, Review copy orbs). On Ads the assistant write tool is
  media-library `cleanup_image` (then placement PATCH); highlight /
  agent-edited; Ctrl+Z’able. Not Ask first.
- Details: `update_details` is general; Follow on that screen; notification (OK
  / Revert) elsewhere.
- Guide-only on `/cms`, Projects, Certifications and reviews, media library,
  billing (usage). Called from the same bottom-right **Assistant**. Default
  Voice; switch to text.
- Onboarding assistant: isolated, read-only this pass, not billed.
- Assistant debit of billing usage credit (**×5** on our cost). Billed work is
  a text LLM call, image generate/cleanup, or ads generate. Voice is xAI
  **audio minutes** (plus text-item fees). Insufficient usage credit is **402**
  (`usage_credit_exhausted`).

## Out

- Agent-run client interview as a writer (04b tools). The contractor still types
  fields (04a).
- Migrating the onboarding conversation onto the CMS thread after website
  activation.
- Paperclip / attach on the overlay.
- Multi-thread list UI.
- Screenshot / pixel streaming of the CMS.
- Per-tool HTTP paths (`/v1/assistant/tool/…`).
- A Go WebSocket for audio.
- Usage credit on auth `tenants`. Billing is its own feature and usage screen.

## Acceptance

- Hydrate after calling the assistant on website editor / Ads / Details / `/cms`
  (and other screens in The CMS) returns the same thread after Voice, including
  muted tool lines.
- `switch_assistant_screen` navigates; `get_context_about_screen` does not.
  Wrong-screen website/ads tools are refused.
- Activated owners cannot call onboarding routes. Unactivated contractors cannot
  call `/v1/assistant/…`.
- Onboarding guide has no write tools.
- Exhausted usage credit on a billed assistant POST is **402**, not 403.
- Onboarding default is the orb + **Click to turn on voice**, not speaking.
