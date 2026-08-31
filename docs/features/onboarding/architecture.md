# Onboarding — Architecture

The pipeline: find the business, business research in the background, fill the
gaps, select then copy the website template, automatic website copy generation
in the
background, contractor copy improvement on the website preview, pay. Implemented
in the predecessor (`OnCall`) and `frontend-2`; this is that loop under Placis
names.

## The pipeline

```text
find (company registry and/or Google Maps) + online research consent
  → business research starts immediately (async)
  → Review (skippable; extra seconds for research)
  → client interview (text, 04a; voice writer 04b is **out**)
  → profile history accumulates as sources and answers arrive
  → client interview complete → select then copy the website template (occupancy + hash pick; write is deterministic)
  → automatic website copy generation starts (async; `/onboarding/preview`
    waits until the home website page has copy, or the wait cap; other
    website pages finish in parallel)
  → wait-end lands on the website preview (07 contractor copy improvement)
  → 08 share writes static HTML to the host (optional; website publication v1, strip on)
  → website activation (v2 strip off, or first live write if they never shared)
```

Step docs: [pipeline/](pipeline/README.md). Numbers are DAG order: 02 starts before 03.

At most five 02 `StartRun` enqueues per tenant per rolling 30 minutes (one
enqueue = one `StartRun`, not one ETL run). A 6th enqueue waits until the oldest
of those five is 30 minutes old. Business lookup still returns; the wait is a
quiet inline note on Review, not a blocker.

## Select and copy the website template

Client-interview-complete enqueues this step (05). Website
[01](../website/pipeline/01-select-website-template.md) then
[02](../website/pipeline/02-copy-website-template-pages.md).
**Copying the website template’s pages is deterministic**: accepted profile +
chosen website template → the same unpublished website, website placeholders
kept. **Selecting** the website template is occupancy within 250 km among
production-ready website templates, then hash tie-break — not an LLM, not a
trade table. Website styles ship with that website template’s associated
website style catalog preset. 02 copies the website template (home, about, named
service pages, contact, privacy policy) and derives the top menu and footer.
Do not say apply the website template in prose.

**Automatic website copy generation** (06) is a separate River job after that:
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

Website activation (09) **upgrades** the existing unactivated tenant (Clerk
organization, owner membership, `status=active`). It does not create a tenant
and does not invent `website_prefix` (08 reserved it if they shared; otherwise
09 reserves). 09 writes website publication without the strip (v2 if they
shared, else the first live write). The host stays up. Owner CMS website
publication is the next website version.

## Progressive progress (SSE)

From confirm through selecting and copying the website template and copy, the
backend pushes onboarding session events over SSE (on change, not faster than
~2s). The frontend refreshes the Review checklist **and** live-fills the client
interview (untouched controls; enrichable lists — [04a](pipeline/04a-text-client-interview.md)). On
`/onboarding/preview` it rotates a website section when current profile data can
resolve its placeholders (~2s, image fade). Do not wait for 06 to overwrite
prose. On the website preview the same stream plus unpublished GET Follow
leftover 06. The stream is a **mirror** — Postgres is authoritative. Business
research progress reads `etl.runs` **and** the live business profile transform
already wrote (ETL fast extract results appear before ETL slow extract
finishes). The contractor host is not an SSE endpoint.

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
[voice-agent.md](../../general-architecture/voice-agent.md). Client-interview **data entry** is [04a](pipeline/04a-text-client-interview.md); the agent writer
([04b](pipeline/04b-voice-client-interview.md)) is out. Applying the website template consumes the accepted profile,
never the raw transcript.
