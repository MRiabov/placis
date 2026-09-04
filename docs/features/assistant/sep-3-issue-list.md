# Sep 3 issue list — Assistant

Reclassified 2026-09-03 against [ADR.md](ADR.md). Website #87 already
closed overlapping website-editor items. Not a drop list. Bold numbers
are original audit ids (not compacted).

## Keep (ADR)

- **1. CMS Voice recordings**
  Comment: ADR 6 / 13: browser PUTs the object; CMS keeps it;
  onboarding does not. “GET thread never returns the URL” is the
  decision. Dropping is a privacy product call, not unused-spec.

- **2. `AssistantVoiceUsage.billed_text_item_count`**
  Comment: ADR 9 / 14: AI voice vendor cost is audio **plus**
  `conversation.item.create`. v1 always sends 0 because every path
  bans that event.
  Action: say “always 0 this pass” on the DTO. Do not delete the
  field.

- **3. `ai.threads.last_assistant_edit_at`**
  Comment: ADR 12 kept it when it killed the 24h discard (written on
  tool events, not a discard timer).
  Action: stop listing it as a compaction index. Keep the column.

- **5. `get_website_styles` always executable**
  Comment: ADR 3. Working copy is omitted off `website_editor`, so
  this is the website-styles read on guide screens.

- **9. `GET /v1/onboarding/assistant/thread`**
  Comment: ADR 18: may hydrate for a later Voice turn.
  Action: stop testing `items: []` as if a thread UI existed.

- **10. Ads `cleanup_image`**
  Comment: ADR 3 / 15: that is the Ads write tool; it shares the
  media library function with Review. Not a duplicate to drop.

- **12. Plan vs Ask first**
  Comment: website ADR 6: default is plan + Ask first. Assistant
  ADR 17 only removes Plan from Voice. Do not collapse.

- **14. `assistant_screen` eight values**
  Comment: ADR 10 includes `cms`; allowed set and
  `switch_assistant_screen` key off each value.

- **15. Onboarding conversation tables**
  Comment: ADR 1 / 5 / 25: isolated context. See
  [../onboarding/sep-3-issue-list.md](../onboarding/sep-3-issue-list.md)
  item 1. Dead columns *inside* those tables (guide `tools=[]`) stay
  an onboarding drop if any.

- **16. Voice on the unpaid website editor**
  Comment: ADR 28: text and Voice, forced instant apply. “E2E says
  Voice unused” is a testing gap.

## Doc gap

- **4. `AssistantWebsiteWorkingCopy` repeats `WebsitePageRead`
  fields**
  Comment: website page GET already embeds website styles, menus,
  website forms, and the profile. No ADR froze this shape.
  Action: slim working copy (current website page’s website sections
  and website slots; website styles and menus once).

- **8. `refinement_plan` / `assistant_plan` in website assistant.md**
  Comment: `POST /v1/assistant/messages` is already gone from
  testing.md. Remaining: two names with no registry entry.
  Action: say they are plan-workflow text, not tools.

- **18. Expand-a-call has no DTO**
  Comment: website assistant.md promises targets + before/after;
  `AssistantThreadItemRead` has none.
  Action: serve from `edit_history` (website ADR 12) or cut expand.

- **19. Clear context vs pending Ask first**
  Comment: website frontend trash “Discards pending Ask-first”
  vs ADR 16/19: `/thread/new` is **409** `in_flight_run`.
  Action: ADRs win; fix frontend copy.

## Actually drop

- **17. `status=skipped` / unused hydrate fields**
  Comment: `AssistantToolActivityEvent.status=skipped` has no
  producer. `AssistantThreadRead.last_activity_at` has no HTTP
  consumer (column stays on `ai.threads`). `thread_items.icon` is
  derivable — keep the DTO field, derive it.

- **20. DustOrb in the voice `replace` table**
  Comment: drop the `DustOrb → Dust Orb` pronunciation row. Keep
  the filename in frontend files.

## False alarms (closed)

- **`AssistantOwnerMessage.type`** — one-member inbound union is the
  typed contract (same as website `submit_action`).
- **`AssistantThreadRead.status`** — `completed` is real on
  `ai.threads` (ADR 4 / 26). Hydrate returns `current`; note that.
- **Projects tools on the website editor** — website #87 / Projects
  ADR 4.
