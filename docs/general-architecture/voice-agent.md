# Voice agent

Voice is a **later milestone**, but its architecture is recorded now so it isn't reconstructed from
scratch. Everything sits behind a provider-neutral interface; the concrete provider is swappable.

Only the realtime **voice agent** is kept — a duplex client interview where the assistant asks clarifying
questions and hands off a structured instruction to the same governed tool surface as the text
assistant. Dictation / manual ASR / TTS is **not kept**: it's legacy, dropped for latency.

## Realtime connection — minted secret, audio bypasses the backend

1. The frontend asks the backend for a short-lived **realtime client secret**.
2. The backend mints it through the voice provider adapter and returns only browser-safe connection
   fields.
3. The frontend connects **directly to the provider** (e.g. `wss://…/realtime`); live audio never
   flows through the backend.
4. The browser never receives the long-lived provider API key.

## Authority

Voice is transport, not authority. The agent calls the same governed, typed, validated tools as the
text assistant (plan mode or continuous mode); it cannot do website publication or bypass validation.

