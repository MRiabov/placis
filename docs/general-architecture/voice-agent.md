# Voice agent

Voice is a **channel into the same governed tools as text**, not a later milestone and not a
separate product. Everything sits behind a voice-service-neutral interface; the concrete voice
service is swappable. Text and voice both write the same business profile; `frontend-2` defaults
to voice during onboarding. After website activation the same agent can drive the website
assistant (onboarding ADR 2).

The realtime **voice agent** is the thing the owner turns on in the application: client interview
during onboarding, the website assistant, and the CMS after website activation. It asks clarifying
questions and hands off a structured instruction to the same governed tool surface as text.
Dictation / manual ASR / TTS is **not kept**: it's legacy, dropped for latency.

Never say “activate” for the voice agent — that word is website activation. The owner turns it on.

## Realtime connection — short-lived secret, audio bypasses the backend

1. The frontend asks the backend for a short-lived **realtime connection secret**.
2. The backend creates it through the voice adapter and returns only browser-safe connection
   fields.
3. The frontend connects **directly to the voice service** (e.g. `wss://…/realtime`); live audio
   never flows through the backend.
4. The browser never receives the long-lived voice API key.

Creating a client-interview realtime connection includes the current profile, checklist, extra notes,
and last `update_interview_plan`. A new socket is not a blank client interview. Do not replay the
transcript.

## Authority

Voice is transport, not authority. The agent calls the same governed, typed, validated tools as the
text assistant (plan vs continuous, instant apply vs Ask first); it cannot do website publication or bypass validation.
