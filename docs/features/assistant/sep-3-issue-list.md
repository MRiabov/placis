# Sep 3 issue list — Assistant

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## High

1. **CMS Voice recordings — write-only audio of the owner**
   Issue: API + persistence. Action: drop the whole path (CMS and unpaid
   website editor twins).
   Where:

   - [api.md](api.md) lines 73–74, 111–112
   - [architecture.md](architecture.md) lines 25–27, 387–395 (GET
     thread never returns the URL, never plays it, do not transcribe)
   - [persistence.md](persistence.md) line 61 (`recording_file_id`)
   - [ADR.md](ADR.md) lines 152, 156, 194
   - [../onboarding/api.md](../onboarding/api.md) lines 168–169, 245
   - [../onboarding/website-editor.md](../onboarding/website-editor.md)
     lines 65–66
   - [../../general-architecture/files-and-s3.md](../../general-architecture/files-and-s3.md)
     line 20
   - [testing.md](testing.md) (CMS §14 / verify §11)

   Reconstructability is `provider_event` + `ai_generations`. Onboarding
   already stores text, not audio.

2. **`AssistantVoiceUsage.billed_text_item_count` is always zero**
   Issue: DTO. Action: debit `audio_seconds_sent` /
   `audio_seconds_received` only.
   Where: [api.md](api.md) line 69. Spec paths ban
   `conversation.item.create`.

3. **`ai.threads.last_assistant_edit_at` is written and never read**
   Issue: persistence. Action: drop.
   Where:

   - [persistence.md](persistence.md) line 73
   - [architecture.md](architecture.md) line 407
   - [ADR.md](ADR.md) line 144 (24h discard that was its only consumer is
     dead; compaction keys off `last_activity_at`)

4. **`ai_generations.approval_status` and `applied_changes`**
   Issue: persistence. Action: drop. Real gate is
   `runs.ask_first_status`.
   Where: owned in
   [../../general-architecture/llm-layer.md](../../general-architecture/llm-layer.md)
   lines 167–168, 174 and
   [../../general-architecture/persistence.md](../../general-architecture/persistence.md)
   line 12. Listed here because implementers will build an approval
   queue on assistant traces.

5. **`AssistantWebsiteWorkingCopy` ships the same data three times** Issue: DTO.
   Action: current website page sections and website slots, not every
   `WebsitePageRead` (which already embeds website styles, menus, website forms,
   profile, blockers). Where: [api.md](api.md) lines 47–48, 64, 66.

6. **`get_website_styles` is a fourth copy of website styles**
   Issue: tool. Action: drop; website styles are on the working copy for
   `website_editor`.
   Where: [architecture.md](architecture.md) lines 228–229, 248;
   [ADR.md](ADR.md) line 34.

7. **`AssistantOwnerMessage.type` is a one-member discriminator**
   Issue: DTO. Action: drop inbound `type`; outbound union still needs
   it.
   Where: [api.md](api.md) line 47.

8. **`AssistantThreadRead.status` is always `current`**
   Issue: DTO. Action: drop, or stop claiming `completed`.
   Where: [api.md](api.md).

9. **Phantom identifiers**
   Issue: contradiction. Action: delete.
   Where:

   - [testing.md](testing.md) exercises `POST /v1/assistant/messages`
     (does not exist; sibling of banned `POST /v1/assistant/turns`)
   - [../website/assistant.md](../website/assistant.md) names
     `refinement_plan` and `assistant_plan` (no registry)

10. **`GET /v1/onboarding/assistant/thread` has no screen**
    Issue: API. Action: drop, or stop testing empty `items: []` as if a
    UI exists.
    Where: [../onboarding/api.md](../onboarding/api.md) line 194. Guide is
    Voice-only, no thread display.

11. **Ads `cleanup_image` duplicates Review inline cleanup**
    Issue: tool. Action: drop; Ads assistant stays guide.
    Where: [README.md](README.md) lines 9–11;
    [../ads/ad-generation/frontend.md](../ads/ad-generation/frontend.md).

## Medium

12. **Plan vs Ask first vs Apply (LLM drafts; the contractor publishes)** Issue:
    over-specified. Action: collapse to Ask first; drop `plan` from
    `AssistantOwnerMessage`. Where: [api.md](api.md) line 47; [../website/assistant.md](../website/assistant.md)
    (“Never `on_confirm`”).

13. **Projects write tools gated to `website_editor`**
    Issue: functionality. Action: keep `create_project` only if a gallery
    needs it; cut the other five.
    Where: [../website/assistant.md](../website/assistant.md).

14. **`assistant_screen` enum has eight values and four behaviors**
    Issue: DTO. Action: collapse to
    `website_editor | ads | details | guide`.
    Where: [api.md](api.md); [architecture.md](architecture.md).

15. **Onboarding duplicate conversation tables**
    Issue: persistence. See
    [../onboarding/sep-3-issue-list.md](../onboarding/sep-3-issue-list.md)
    item 1. Dead columns inside those tables regardless: `icon`,
    `thread_item_kind` `tool_summary` / `thinking`, `channel=text`,
    `ai_generation_id`.

16. **Voice on the unpaid onboarding website editor**
    Issue: API. Action: consider cutting Voice there (five of seven
    routes; E2E says Voice unused; five-prompt cap).
    Where: [../onboarding/website-editor.md](../onboarding/website-editor.md);
    [testing.md](testing.md).

17. **Smaller dead contract**
    - `AssistantToolActivityEvent.status=skipped` — never produced
    - `AssistantThreadRead.last_activity_at` — no consumer
    - `thread_items.icon` — derivable from `thread_item_kind`
    Where: [api.md](api.md); [persistence.md](persistence.md).

18. **Expand-a-call UI with no DTO behind it**
    Issue: gap. Action: cut the expand behavior, or say what serves
    targets / before/after.
    Where: [../website/assistant.md](../website/assistant.md) vs
    `AssistantThreadItemRead` in [api.md](api.md).

19. **Clear context vs pending Ask first**
    Issue: contradiction. Action: pick one.
    Where: website editor frontend trash “Discards pending Ask-first” vs ADR
    `/thread/new` is **409** `in_flight_run` while Ask-first is pending.

20. **DustOrb leakage**
    Issue: wording. Action: keep the DustOrb filename in frontend
    files; cut the voice `replace` table entry that would speak it.
    Where: [design-decision-record.md](design-decision-record.md);
    [../../general-architecture/voice-agent.md](../../general-architecture/voice-agent.md).

## Keep

- One `cms_assistant` thread per tenant, `thread_items`, `runs`,
  in-flight lock.
- Apply after the LLM drafts; `record-apply` / `record-reject`.
- `ai_generations` three-way recording (reasoning, output, tool
  calls).
- `offset_seconds` reconstruction; transcripts settlement at 200.
- Compaction (12h / 128K / seed-too-large).
- Voice as a channel: no Go WebSocket, no provisioned phone numbers, no
  receptionist.
- Onboarding guide: Voice-only, `tools=[]`, not billed, 403 after
  activation.
- Error map (`tenant_unactivated`, `usage_credit_exhausted`,
  `in_flight_run`, `allowed_set_rejected`).
