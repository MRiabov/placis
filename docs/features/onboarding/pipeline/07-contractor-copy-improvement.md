# 07 — Contractor copy improvement

The contractor improves generated website copy with Assistant on the
**website preview** (`/onboarding/preview-and-edit/`), after wait-end, before
they pay. Distinct from
[06 automatic website copy generation](06-website-copy-generation.md)
(the River job). Distinct from the website preview (the screen). Distinct from
[08 preview website address](08-preview-website-address.md) (Share). HTTP, auth,
tools, five-prompt cap: [website editor](../website-editor.md).

This step does not have to finish. Share (08) and website activation (09) start
from that screen and do not wait for more prompts.

## Trigger

Wait-end (06 done or the wait cap) navigates to `/onboarding/preview-and-edit/`.
Onboarding session → `previewing`. Signed-in contractor may send Assistant
prompts that PATCH unpublished website.

## Pre

Unpublished website from 05 exists. `tenant_id` is the unactivated tenant.
06 may still be `running`.

## Must not

- Call this automatic website copy generation (that is 06).
- Start a second 06 job.
- Live-update R2 (08 rewrites `latest/` on Share; 09 on pay).
- Use CMS `/v1/assistant/…`.
- Use Find / Review / interview `/v1/onboarding/assistant/…`.
- Compact this unpaid `current`.
- Block 09.
- PATCH, Send, or Voice with the onboarding session token (Clerk only).
- Count 06 toward the five unpaid prompts.

## Do

1. Land on the website preview. Hydrate `GET …/website-editor/assistant/thread`
   (onboarding session token or Clerk) so 06 `tool_summary` is visible.
2. Follow leftover 06 via the existing onboarding session SSE plus unpublished
   GET. While 06 holds `assistant.runs` `running`, owner Send / Voice is
   **409** `in_flight_run`.
3. Signed-in Send / Voice: same website editor tools as CMS, **instant apply**,
   Follow always on, five unpaid prompts. Over five: **409** `unpaid_prompt_cap`
   (pay CTA, not 402).
4. Share is [08](08-preview-website-address.md). Pay is
   [09](09-website-activation.md).

## Persist

Unpublished website PATCH; `ai.threads` (`kind=cms_assistant`) /
`assistant.thread_items` / `assistant.runs`. No `website_publications` from this
step. Onboarding session stays `previewing`.

## Fail

`in_flight_run` while 06 is running. `unpaid_prompt_cap` after five owner
prompts. Unsigned Send / Voice stay blocked until Clerk. None of these fail 05
or block 09.

## Out

08 share (optional). 09 does not wait for more prompts. 09 completes this
`current` and ends `running` in the same transaction as `tenants.status=active`.

## Invariants

- GET thread hydrate: onboarding session token or Clerk.
- Send, Voice, PATCH: Clerk + unactivated tenant, app origin.
- 06 does not count toward the five.
- This is not a second 06 River job.
