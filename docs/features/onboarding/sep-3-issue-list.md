# Sep 3 issue list — Onboarding

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## High

1. **Guide has its own copies of assistant thread tables**
   Issue: duplicate persistence. Action: drop
   `onboarding.assistant_conversation_items` and
   `onboarding.assistant_runs`; store on `assistant.thread_items` /
   `assistant.runs` with `thread_kind=onboarding_assistant`.
   Where:

   - [persistence.md](persistence.md) line 73 (`assistant_conversation_items`)
   - [../assistant/persistence.md](../assistant/persistence.md)
     (`thread_items`, `runs`)
   - [website-editor.md](website-editor.md) (unpaid website editor: **no new
     persistence models**)
   - [api.md](api.md) lines 193–194 (writes the onboarding copies)

   Isolation is already `thread_kind` + `onboarding_session_id`.

2. **`reviews_unavailable` has no consumer**
   Issue: persistence + DTO. Action: delete column and DTO field.
   Where:

   - [persistence.md](persistence.md) line 59
   - [api.md](api.md) line 56 (`ClientInterviewUpdate`)

   Reviews are optional in the complete gate. The “no online reviews yet”
   copy is derived from the pool, not this flag.

3. **`photos_fill` is written and never read**
   Issue: persistence + DTO + UI. Action: cut the two controls, the
   column, and the DTO field — or name the consuming River job and the
   photo threshold.
   Where:

   - [persistence.md](persistence.md) lines 59, 61
   - [api.md](api.md) line 56
   - [pipeline/04a-text-client-interview.md](pipeline/04a-text-client-interview.md)
     (Do 2–3)
   - [frontend.md](frontend.md) (“Find more online” / “Create a stand-in”)
   - [pipeline/build-profile.md](pipeline/build-profile.md) (`photos` gate)

   No photo-search / photo-generation job is triggered from this field.
   “Enough photos” is undefined.

4. **VAT rule in build-profile has no writer, reader, or gate**
   Issue: orphan rule. Action: delete the VAT paragraph, or add the writer
   and the publication blocker.
   Where:

   - [pipeline/build-profile.md](pipeline/build-profile.md) line 64
   - Columns live on
     [../business-profile/details/persistence.md](../business-profile/details/persistence.md)
     line 29 (`vat_number`, `vat_registration_status`)

   Not a complete-gate key, not on `ClientInterviewUpdate`, not on
   `OnboardingLiveBusinessProfileRead`.

5. **`onboarding_sessions.started_from` is write-only**
   Issue: persistence. Action: drop; derive from `place_id` /
   `company_number`.
   Where:

   - [persistence.md](persistence.md) lines 21, 27
   - [pipeline/01-find-business.md](pipeline/01-find-business.md) line 42
   - [pipeline/testing/01-find-business.md](pipeline/testing/01-find-business.md)
     line 9

   Enum cannot express “both”; 01 says sources can be both.

6. **5-enqueue research cap + `research_wait_until`**
   Issue: over-specified / unreachable. Action: cap at
   `POST /v1/onboarding/business-lookup` (per browser / IP); keep
   per-tenant as a silent server check; cut `research_wait_until` from
   DTOs, SSE, and Review wait copy.
   Where:

   - [pipeline/02-business-research.md](pipeline/02-business-research.md)
     lines 75–77, 101, 113
   - [api.md](api.md) lines 36, 47, 64, 107, 117, 123, 143
   - [frontend.md](frontend.md) line 46
   - [pipeline/03-confirm-data.md](pipeline/03-confirm-data.md) lines 19, 41

   Lookup mints a **new** unactivated tenant, so a per-tenant cap does
   not stop “find again”. The only re-enqueue on that onboarding is item 9.

7. **Onboarding-guide voice DTOs contradict CMS DTOs**
   Issue: DTO. Action: one name and one field set; remove `offset_seconds`
   from the request.
   Where:

   - [api.md](api.md) (Onboarding assistant DTO table:
     `AssistantVoiceTranscriptCreate` with `events`, `offset_seconds`,
     `reasoning`, `usage`; `client_secret`)
   - [../assistant/api.md](../assistant/api.md)
     (`AssistantVoiceTranscriptsCreate` with `events`, `usage`,
     `internal_reasoning`; `secret`)

8. **`website_activations` unused columns and enum values**
   Issue: persistence. Action: `payment_status` → `pending` / `paid`;
   drop `refunded`, `failed`, `failure_reason`, `amount`, `currency`,
   `activated_at`, `stripe_events.processed`.
   Where:

   - [persistence.md](persistence.md) lines 112, 124
   - [api.md](api.md) line 181 (webhook handles
     `checkout.session.completed` only)
   - [pipeline/testing/09-website-activation.md](pipeline/testing/09-website-activation.md)
     line 25 (`processed` asserted)

   Related: `WebsiteActivationStatusRead.checkout_url` has no column;
   the browser already holds the URL from POST checkout.

## Medium

9. **`PUT /v1/onboarding/sources` has no screen**
   Issue: API. Action: add “change the business” to Review, or drop the
   route.
   Where:

   - [api.md](api.md) lines 107, 109
   - [pipeline/01-find-business.md](pipeline/01-find-business.md) line 49
   - [frontend-debloat.md](frontend-debloat.md) line 86
   - [frontend.md](frontend.md) Screens (no control)

10. **Two website preview routes do one job**
    Issue: duplication. Action: consider landing on
    `/onboarding/preview-and-edit/` at 05 completion.
    Where: [frontend.md](frontend.md) §4 and §5;
    [website-editor.md](website-editor.md) Surfaces.

11. **Onboarding 06 restates website 03**
    Issue: spec duplication. Action: 06 = trigger + DAG position; lock
    and invariants stay in website 03.
    Where:
    [pipeline/06-website-copy-generation.md](pipeline/06-website-copy-generation.md);
    [../website/pipeline/03-website-copy-generation.md](../website/pipeline/03-website-copy-generation.md).

12. **`channel` is degenerate (04b is out)**
    Issue: persistence. Action: drop `voice` from the enums this pass;
    consider dropping `onboarding_sessions.channel`.
    Where: [persistence.md](persistence.md) (`onboarding_sessions.channel`,
    `assistant_runs.channel`).

13. **Unpaid `create_page` and `update_details` are dead paths**
    Issue: contradiction. Action: drop from the unpaid allowed set (409
    `allowed_set_rejected`).
    Where: [website-editor.md](website-editor.md) Allowed tools;
    [api.md](api.md) Website route table (no unpaid POST pages);
    [../website/api.md](../website/api.md) (`POST /v1/website/editor/pages`
    is 403 unactivated);
    [../business-profile/details/api.md](../business-profile/details/api.md)
    (`update_details` = active-tenant PATCH).

14. **`OnboardingLiveBusinessProfileRead` missing projects and photos**
    Issue: gap (missing field, not spare). Action: add them, or name the
    separate route.
    Where: [api.md](api.md) line 50 vs
    [pipeline/04a-text-client-interview.md](pipeline/04a-text-client-interview.md)
    live fill; [frontend.md](frontend.md) §3; [testing.md](testing.md)
    Exercise 3.

15. **Client interview photo upload has no route** Issue: gap. Action:
    onboarding media library wrapper, or drop upload from 04a. Where:
    [frontend.md](frontend.md) §3 (“Upload photos is always available”);
    [../other/media/api.md](../other/media/api.md) (Clerk JWT, **active** tenant); onboarding [api.md](api.md)
    (no media library routes).

16. **Stale ADR / debloat / billing step numbers** Issue: contradiction. Action:
    correct the current sentences (where things stand). Where:

    - [ADR.md](ADR.md) 12, 16 still number activation as 08
    - [frontend-debloat.md](frontend-debloat.md) “Done when: website
      activation copy and routes match 07”
    - [../billing/prd.md](../billing/prd.md) non-goal 1 still says 08

17. **`OnboardingGuideRealtimeConnectionCreate.visible_fields`**
    Issue: DTO. Action: keep `step`; drop `visible_fields`.
    Where: [api.md](api.md); [assistant.md](assistant.md).

18. **Write-only leftovers**
    - `BusinessLookupRead.id` — [api.md](api.md) line 36 (“`id` for logs”).
      Drop.
    - `OnboardingProfileRead.preview_website_address` — [api.md](api.md)
      line 47. Name the reader or drop.

## Keep

- Core loop 01–09. Keep 04b files as **out** tombstones.
- Complete gate, research conflicts, derived fill status (no
  `checklist_rows`).
- Unpaid website editor as a policy wrapper (auth, allowlist, instant
  apply, five-prompt cap).
- Stripe surface: checkout POST, status GET, signed webhook. No
  `preview_claims` / `website_previews` resurrection.
- `POST /v1/onboarding/projects/{projectId}/archive`.
