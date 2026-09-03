# Sep 3 issue list — Placis website

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## Medium

1. **Pricing Choose does not carry the tier into onboarding** Issue:
   functionality. Action: query param that 09 honors, or say on Pricing that the
   grid is display-only. Where:

   - [ADR.md](ADR.md) line 36 (Choose → `app.placis.com`)
   - [testing.md](testing.md) lines 18, 31
   - [../billing/architecture.md](../billing/architecture.md) lines 179–181
   - [../onboarding/pipeline/09-website-activation.md](../onboarding/pipeline/09-website-activation.md)
     line 125 (hardcodes Placis Pro plan)

   Same item as billing punch list item 1.

2. **Legal routes contradict each other**
   Issue: contradiction. Action: pick one.
   Where:

   - [README.md](README.md) line 19 (no legal routes until copy exists)
   - [ADR.md](ADR.md) line 37 (legal under markup)
   - [cloudflare.md](cloudflare.md) line 73 (legal listed)

3. **Staging bucket / `staging.placis.com` may be v1-unnecessary**
   Issue: ops. Action: drop if deploys stay `workflow_dispatch` with no PR
   previews; or name the consumer.
   Where: [cloudflare.md](cloudflare.md) lines 110, 113, 135; [ADR.md](ADR.md)
   decision 3.

## Keep

- Islands list (TopBar, RotatingWord, PlacisPromptBox, `/contact`
  mailto, pricing toggle).
- Do-not-port: OrbDemo, DustOrb, voice, enrichment, geo detection, Clerk
  sign-in on this origin, dashboard.
- `/support` and `/contact` as `mailto:` with no Go POST.
- No Go HTTP on this origin.
