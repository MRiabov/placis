# Placis website — E2E test

This origin has no Go API and no Postgres. The E2E is Playwright against the built
files served locally. It does not drive `frontend-2`.

1. **Home** — `/` shows Built for, the prompt box, Try now →
   `https://app.placis.com/onboarding/find`, Login → `https://app.placis.com/sign-in`.
   Submitting the prompt box goes to onboarding with `?prompt=`.
2. **Contact** — `/contact/` shows Send a message (mailto, no Go write).
3. **Support** — `/support/` is `mailto:help@placis.com`.
4. **Unknown path** — `404.html` from the same build.
