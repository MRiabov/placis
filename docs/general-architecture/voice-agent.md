# Voice agent

Voice is a **channel into the same governed tools as text**, not a later
milestone and not a separate product. Everything sits behind a
voice-service-neutral interface; the concrete voice service is swappable. Text
and voice both write through the same tools. Never say “activate” for the voice
agent — that word is website activation. The owner turns it on.

Dictation / manual ASR / TTS is **not kept**: it's legacy, dropped for latency.

## Surfaces (v1)

- **Website editor** (`/cms/website`): empty composer turns the canvas orb on.
  Governed website assistant tools. Also **explains the current screen** from
  the product knowledge base.
- **Ads** (`/cms/ads` list and workspace): product **guide** (what they are
  looking at / how to use this screen) plus **promptable** field edits (required
  overlay prompt, same rule as Review AI orbs). First generate on Create ad
  stays unprompted. Existing field orbs stay.
- **Onboarding guide:** talk them through the current onboarding screen so they
  are not staring at a silent onboarding screen (example on Find: hello, we will
  help you create a website, enter your Google Maps listing and company
  registry). Not `confirm_conflict` / client-interview tools. Not a second
  client interview after website activation.
- **Onboarding client-interview voice: out.** Text 04a stays the writer. Do not
  ship 04b as v1. `/cms` Start client interview stays hidden.

`/cms` two-card home is not a voice surface. Details / Media library / Usage &
billing can be explained from the knowledge base; they are not the main v1 tool
surface.

## Knowledge base

A small set of owner-facing markdown docs loaded **into memory**. Not a large
retrieved knowledge base. Cannot unvalidated-write or skip website publication
validation.

## Realtime connection — short-lived secret, audio bypasses the backend

1. The frontend asks the backend for a short-lived
   **realtime connection secret** (`POST /v1/voice/realtime-connection`).
2. The backend creates it through the voice adapter and returns only
   browser-safe connection fields.
3. The frontend connects **directly to the voice service** (e.g.
   `wss://…/realtime`); live audio never flows through the backend.
4. The browser never receives the long-lived voice API key.

Creating a connection includes what that surface needs (website editor: current
website page + thread; onboarding guide: current onboarding screen). A new
socket is not a blank client interview. Do not replay a transcript.

Record reasoning, owner-visible output, and tool calls ([llm-layer](llm-layer.md)).

## Authority

Voice is transport, not authority. The agent calls the same governed, typed,
validated tools as the text assistant (plan vs continuous, instant apply vs Ask
first); it cannot do website publication or bypass validation.

Onboarding ADR 2 previously defaulted `frontend-2` to voice during onboarding
and treated voice as a second client-interview writer. That client-interview
default is out (2026-08-27); keep the old entry.
