# Sep 3 issue list — Placis website

Reclassified 2026-09-03 against [ADR.md](ADR.md). Billing #88 closed
Pricing Choose. Bold numbers are original audit ids (not compacted).

## Keep (ADR)

- **3. Staging bucket / `staging.placis.com`**
  Comment: ADR 3 + [cloudflare.md](cloudflare.md):
  `workflow_dispatch` `environment staging | production`. Not
  unused.

## Doc gap

- **2. Legal routes**
  Comment: ADR 5: legal is markup, no island. README “no legal
  routes until copy exists” is a gate, not a second decision.
  Action: reword README to “ships when copy is reviewed;
  markup-only”.

## False alarms (closed)

- **Pricing Choose does not carry the tier** — ADR 5 and billing
  architecture: display only; Choose → `app.placis.com`. 09 Website
  activation Pro/month is the v1 choosable Price (billing ADR 9 /
  18). Same as billing item 1. Bake `/pricing/` at `astro build`.
