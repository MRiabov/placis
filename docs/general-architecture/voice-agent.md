# Voice agent

Voice is a **later milestone**, but its architecture is recorded now so it isn't reconstructed from
scratch. Everything sits behind a voice-service-neutral interface; the concrete voice service is
swappable.

The realtime **voice agent** is the thing the owner turns on in the application: client interview
during onboarding, the website assistant, and the CMS after website activation. It asks clarifying
questions and hands off a structured instruction to the same governed tool surface as text.
Dictation / manual ASR / TTS is **not kept**: it's legacy, dropped for latency.

Never say “activate” for the voice agent — that word is website activation. The owner turns it on.

## Realtime connection — minted secret, audio bypasses the backend

1. The frontend asks the backend for a short-lived **realtime connection secret**.
2. The backend mints it through the voice adapter and returns only browser-safe connection
   fields.
3. The frontend connects **directly to the voice service** (e.g. `wss://…/realtime`); live audio
   never flows through the backend.
4. The browser never receives the long-lived voice API key.

## Authority

Voice is transport, not authority. The agent calls the same governed, typed, validated tools as the
text assistant (plan mode or continuous mode); it cannot do website publication or bypass validation.
