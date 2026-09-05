# Placis website — E2E test

This origin has no Go API and no Postgres. The E2E is Playwright against
the built files served locally. It does not drive `frontend-3`.

## E2E

### Static origin pages

#### Setup

E2E (Playwright against the built files served locally). No Go. No
Postgres.

#### Exercise

Open `/`, `/contact/`, `/support/`, `/pricing/`, and an unknown path.
Submit the prompt box on `/`. Choose a plan. Contact sales.

#### Verify

1. **Home** — `/` shows Built for, the prompt box, Try now →
   `https://app.placis.com/onboarding/find`, Login →
   `https://app.placis.com/sign-in`. Submitting the prompt box goes to
   onboarding with `?prompt=`.
2. **Contact** — `/contact/` shows Send a message (mailto, no Go
   write).
3. **Support** — `/support/` is `mailto:help@placis.com`.
4. **Pricing** — `/pricing/` shows baked Placis Pro plan / month
   (EUR). Choose → `app.placis.com`. Enterprise plan contact sales →
   `/support/`. No Stripe on this origin. No year toggle.
5. **Unknown path** — `404.html` from the same build.
