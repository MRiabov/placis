# Sep 3 issue list — General architecture

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Cross-cutting only; per-feature lists live
with the feature. Fix the cited spec, then delete the item. Delete this
file when empty.

Index of feature lists:

- [Website](../features/website/sep-3-issue-list.md)
- [Onboarding](../features/onboarding/sep-3-issue-list.md)
- [Ads](../features/ads/sep-3-issue-list.md)
- [Assistant](../features/assistant/sep-3-issue-list.md)
- [Billing](../features/billing/sep-3-issue-list.md)
- [Business profile](../features/business-profile/sep-3-issue-list.md)
- [Media library](../features/other/media/sep-3-issue-list.md)
- [Leads](../features/other/leads/sep-3-issue-list.md)
- [ETL](../features/etl/sep-3-issue-list.md)
- [Placis website](../features/placis-website/sep-3-issue-list.md)

## High

1. **Phantom `features/other/etl/` links** Issue: docs. Action: retarget to
   [../features/etl/README.md](../features/etl/README.md). Where:

   - [../general-prd.md](../general-prd.md) line 46 (second ETL bullet;
     line 37 is the correct one)
   - [README.md](README.md) (Public-source extract still links
     `features/other/etl/README.md`)

2. **Three of five `audit.md` actions have no owner**
   Issue: audit. Action: list what actually writes: website publication,
   website activation, ad approve.
   Where: [audit.md](audit.md) lines 3–6 (also impersonating, refunds,
   data export/deletion). Impersonation is Clerk-native
   ([../features/other/auth/README.md](../features/other/auth/README.md));
   Go never sees it. No refund or GDPR spec exists.

3. **`files.scan_status` has no scanner**
   Issue: persistence. Action: name scanner + job, or drop.
   Where: [files-and-s3.md](files-and-s3.md) line 26;
   [jobs.md](jobs.md) (no scan job);
   [../features/other/media/testing.md](../features/other/media/testing.md)
   line 166 (asserts `clean`).

4. **`thread_kind` CHECK lists `website_copy_generation` twice and includes
   `eval`** Issue: schema. Action: one literal; drop `eval` until an eval
   feature exists (`threads.tenant_id` nullable was for eval). Where:
   [llm-layer.md](llm-layer.md) lines 75–88, and `trace_type` `prod`/`eval`.

5. **`web_search_transform` job with no work** Issue: jobs. See
   [../features/etl/sep-3-issue-list.md](../features/etl/sep-3-issue-list.md) item 2. Where: [jobs.md](jobs.md) lines 29, 64.

## Medium

7. **`files.visibility=owner_visible` unreachable**
   Issue: persistence. Action: drop the enum value.
   Where: [files-and-s3.md](files-and-s3.md) line 26.
   Comment: **do not drop private / public.** Raw owner uploads and
   Voice recordings are `private`. Canonical WebP and thumbnails are
   `public`. `owner_visible` is the unused third; keep it until a third
   visibility is needed or ruled out.

8. **`tool_revision_kind` includes `skill`**
   Issue: persistence. Action: drop `skill`; tools are unversioned.
   Where: [llm-layer.md](llm-layer.md).
   Comment: **not now.** No agent skills this pass (prompts only). Keep
   `skill` on the enum; migrate when a skill feature exists.

9. **One-step “workflows” duplicate `## Jobs`**
   Issue: docs. Action: drop
   `reviews_ranking_for_display`, `assistant_thread_compaction`,
   `website_activation`, `scheduled_etl` from `## Workflows` if they are
   single jobs.
   Where: [jobs.md](jobs.md).

10. **`processes.md` names notifications and export generation**
    Issue: leftover SaaS language. Action: delete those two categories.
    Where: [processes.md](processes.md) lines 8–9. No notification job;
    ad-set zip is an on-request signed URL.

11. **`package-boundaries.md` lists email/SMS**
    Issue: leftover. Action: drop; contact is `mailto:`; no SMS product.
    Where: [package-boundaries.md](package-boundaries.md) line 67.

12. **Campaign-performance language in frontend notifications**
    Issue: out of scope. Action: drop “unusually profitable or lossy
    campaign”.
    Where: [frontend.md](frontend.md) line 49.

13. **`module-layout.md` transform list vs jobs.md**
    Issue: docs. Action: add `traderegistry/`; do not add `websearch/`
    transform (item 6).
    Where: [module-layout.md](module-layout.md) lines 32–34.

14. **Duplicate frontend-debloat index rows**
    Issue: docs. Action: one CMS / cross-cutting row.
    Where: [../planning/frontend-debloat.md](../planning/frontend-debloat.md).

## Keep

- Cross-cutting HTTP is only `GET /v1/health` and `GET /openapi.json`.
- Persistence owner table has no ownerless tables.
- `api.md` Do-not-create list and jsonb→HTTP table.
- Voice: no provisioned phone numbers, no inbound, no SMS, no receptionist.
- Predecessor CRM language in this tree is almost all **negative** spec —
  keep those bans.
- Apply / reject and Ask first are per-feature, not
  `ai_generations.approval_status`.
- Files: `private` (raw / Voice) vs `public` (WebP). `owner_visible`
  stays until a third visibility is needed or ruled out.
- `tool_revision_kind=skill` reserved; migrate when agent skills exist.
