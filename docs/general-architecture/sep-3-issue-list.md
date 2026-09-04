# Sep 3 issue list — General architecture

Reclassified 2026-09-03. Cross-cutting only. Bold numbers are original
audit ids (not compacted). Per-feature lists:

- [Website](../features/website/sep-3-issue-list.md) (walkthrough in #87)
- [Onboarding](../features/onboarding/sep-3-issue-list.md)
- [Ads](../features/ads/sep-3-issue-list.md)
- [Assistant](../features/assistant/sep-3-issue-list.md)
- [Billing](../features/billing/sep-3-issue-list.md) (#88 open)
- [Business profile](../features/business-profile/sep-3-issue-list.md)
- [Media library](../features/other/media/sep-3-issue-list.md)
- [Leads](../features/other/leads/sep-3-issue-list.md)
- [ETL](../features/etl/sep-3-issue-list.md)
- [Placis website](../features/placis-website/sep-3-issue-list.md)

Auth punch list was applied in #86 (file removed).

## Keep (ADR)

- **4b. `thread_kind=eval`**
  Comment: `trace_type`, nullable `threads.tenant_id`, and
  skip-their-usage for eval traces. Same as reserved
  `tool_revision_kind=skill`.

## Doc gap

- **1. Phantom `features/other/etl/` links**
  Action: retarget [../general-prd.md](../general-prd.md) line 46 and
  [README.md](README.md); delete the duplicate PRD bullet (also the
  stale Mon/Wed/Fri source set).

- **3. `files.scan_status` — name the scanner**
  Comment: `confirm-upload` already branches on scan fail. Do not
  drop the lifecycle.
  Action: name in-process vs job. Same as media item 6.

- **13. `module-layout.md` transform list**
  Action: add `traderegistry/` **and** `websearch/` (ETL item 3:
  transform has work).

## Actually drop

- **4a. Duplicate `'website_copy_generation'` in the CHECK**
  Comment: [llm-layer.md](llm-layer.md) lists the literal twice. One
  stays.

- **9. One-step rows under `## Workflows`**
  Comment: a workflow is a sequence. Drop
  `reviews_ranking_for_display`, `assistant_thread_compaction`,
  `website_activation`, `scheduled_etl` from `## Workflows`; keep
  them under `## Jobs`.

- **10. `processes.md` “notifications” and “export generation”**
  Comment: no notification job; ad-set zip is an on-request signed
  URL.
  Action: delete those two categories.

- **11. `package-boundaries.md` email/SMS**
  Comment: Clerk sends auth mail; Stripe sends receipts; Go has
  neither.
  Action: drop from the integrations list.

- **12. “Lossy campaign” in frontend later-callers**
  Comment: ad posting / live performance are out of this pass.
  Action: drop that clause; keep the other later-callers.

- **14. Duplicate frontend-debloat index rows**
  Action: one CMS / cross-cutting row pointing at
  [frontend-debloat.md](frontend-debloat.md).

## False alarms (closed)

- **`audit.md` five actions** — already rewritten: website
  publication, website activation, ad approve. Impersonation is
  Clerk-native.
- **`web_search_transform` no work** — ETL ADR 2; keep both job
  rows.
- **`files.visibility=owner_visible`** — keep until a third
  visibility is needed.
- **`tool_revision_kind=skill`** — reserved.

## Keep (scope)

- Cross-cutting HTTP: `GET /v1/health`, `GET /openapi.json`.
- Apply / reject and Ask first are per-feature, not
  `ai_generations.approval_status`.
- Files: `private` (raw / Voice) vs `public` (WebP).
- Voice: no provisioned phone numbers, no inbound, no receptionist.
