# Onboarding — Architecture

The pipeline: find the business, business research in the background, fill the
gaps, select then copy the website template, automatic website copy generation
in the
background, contractor copy improvement on the website preview, pay. Implemented
in the predecessor (`OnCall`) and `frontend-3`; this is that loop under Placis
names.

Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

## Named identifiers

Pipeline **Do** functions (same spelling in spec, Go, and tests):

- `LookupBusiness` — `internal/onboarding`
  ([01](pipeline/01-find-business.md))
- `StartBusinessResearch` — **calls** `etl.StartRun`
  ([02](pipeline/02-business-research.md))
- `SaveTextClientInterview` / `CompleteClientInterview` —
  ([04a](pipeline/04a-text-client-interview.md))
- `MergeProfileIncrement` —
  ([build-profile](pipeline/build-profile.md))
- `SharePreviewWebsiteAddress` — **calls** `PublishWebsite` strip on
  ([08](pipeline/08-preview-website-address.md))
- `BindClerkUserToOnboardingSession` — **calls** `CreateClerkUser`;
  **persists into** `onboarding_sessions.clerk_user_id`. Nullable
  unique `clerk_user_id`: cannot attach one Google account to a
  second onboarding session/tenant.
- `CreateOnboardingWebsitePage` — **calls** `CreateWebsitePage`
  ([website-editor.md](website-editor.md))
- `UpdateOnboardingBusinessProfile` — **calls** `UpdateBusinessProfile`
- `UndoOnboardingBusinessProfileEdit` — **calls**
  `UndoBusinessProfileEdit`

05 **calls** `SelectWebsiteTemplate` then `CopyWebsiteTemplatePages`.
06 is River job kind `website_copy_generation` / `GenerateWebsiteCopy`.
09 is River job kind `website_activation` / **calls**
`AttachClerkOrganization` (if `clerk_org_id` still null),
`InsertOwnerMembership`, then `PublishWebsite` strip off. Activation
checkout **calls** `AttachClerkOrganization` and returns `clerk_org_id`.
HTTP: one function per Routes verb+noun (`LookupBusiness`,
`GetOnboardingProfile`, …). Tables:
[persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).

## The pipeline

```text
find (company registry and/or Google Maps) + online research consent
  → business research starts immediately (async)
  → Review (skippable; extra seconds for research)
  → client interview (text, 04a; voice writer 04b is **out**)
  → profile history accumulates as sources and answers arrive
  → client interview complete → select then copy the website template
    (occupancy + `website_id % len` pick; write is deterministic)
  → automatic website copy generation starts (async; `/onboarding/preview`
    waits until the home website page has copy, or the wait cap; other
    website pages finish in parallel)
  → wait-end lands on the website preview (07 contractor copy improvement)
  → 08 share writes static HTML to the host (optional; website publication v1, strip on)
  → website activation (v2 strip off, or first live write if they never shared)
```

Step docs: [pipeline/](pipeline/README.md). Numbers are DAG order: 02 starts before 03.

At most five 02 `StartRun` enqueues per tenant per rolling 30 minutes (one
enqueue = one `StartRun`, not one ETL run). A 6th scratch 01 with different
attach keys is **429** `onboarding_enqueue_cap`. Same attach keys do not
enqueue. In-flight 02 is not cancelled by Back.

## Select and copy the website template

Client-interview-complete **inserts** River job kind
`select_and_copy_website_template` (05). Website
[01](../website/pipeline/01-select-website-template.md) then
[02](../website/pipeline/02-copy-website-template-pages.md).
**Copying the website template’s pages is deterministic**: accepted profile +
chosen website template → the same unpublished website, website placeholders
kept. **Selecting** the website template is occupancy within 250 km among
production-ready website templates, then `website_id % len` tie-break —
not an LLM, not a
trade table. Website styles ship with that website template’s associated
website style catalog preset. 02 copies the website template (home, about, named
service pages, contact, privacy policy) and derives the top menu and footer.
Do not say apply the website template in prose.

**Automatic website copy generation** (06) is River job kind
`website_copy_generation` after that:
the same tools as the website editor (`update_slot`, `update_seo`, …), writing
into the existing unpublished website. Wait-end opens the website preview
([07](pipeline/07-contractor-copy-improvement.md)). 08 writes the host if they
share; copy that lands later does not SSE the host. If copy fails, the
unpublished website stays. Contractor copy improvement is Assistant on that
website preview (five unpaid prompts). The CMS **assistant**
([assistant](../assistant/README.md)) is after website activation. Website
editor tools: [website/assistant.md](../website/assistant.md). The LLM never
does website publication (08/09 call the same HTML write as CMS website
publication).

## End of onboarding: paid, host stays up

Website activation (09): the webhook **inserts** River job kind
`website_activation`, which **upgrades** the existing unactivated tenant (Clerk
organization, owner membership, `status=active`). It does not create a tenant
and does not invent `website_prefix` (05 reserved it). 09 writes website
publication without the strip (v2 if they shared, else the first live
write). The host stays up. Owner CMS website
publication is the next website version.

## Progressive progress (SSE)

From confirm through selecting and copying the website template and copy, the
backend pushes onboarding session events over SSE (on change, not faster than
~2s). The frontend refreshes Review found vs missing **and** live-fills the
client interview (untouched controls; enrichable lists —
[04a](pipeline/04a-text-client-interview.md)). On
`/onboarding/preview` it rotates a website section when current profile data can
resolve its placeholders (~2s, image fade). Do not wait for 06 to overwrite
prose. On the website preview the same stream plus unpublished GET Follow
leftover 06. The stream is a **mirror** — Postgres is authoritative. Business
research progress reads `etl.runs` **and** the live business profile transform
already wrote (ETL fast extract results appear before ETL slow extract
finishes). Interview photos are not on the `business_profile` payload —
`/onboarding/interview` re-GETs `/v1/onboarding/media-assets` on each of
those events. Ranked `projects` **are** on that nested live profile. One
stream: `GET /v1/onboarding/events/stream` on onboarding `api/`.
`websitepreview/` is 08 share HTTP only (not SSE). The contractor host is
not an SSE endpoint.

## Where things stand

`created` → `client_interviewing` →
`selecting_and_copying_website_template` → `preview_and_edit` →
`activated`
(`select_and_copy_website_template_failed` if 05 throws). Automatic website copy
generation may still be running while `preview_and_edit`. The website preview is
`/onboarding/preview-and-edit/` (app origin). The preview website address is the
optional host after 08 (no token, no TTL). The onboarding session has no
`expired` status.

## Voice

Voice is a **channel** (onboarding assistant, CMS assistant). Transport:
[voice-agent.md](../../infrastructure/ai/voice-agent.md). Client-interview **data entry** is [04a](pipeline/04a-text-client-interview.md); the agent writer
([04b](pipeline/04b-voice-client-interview.md)) is out. Applying the website template consumes the accepted profile,
never the raw transcript.
