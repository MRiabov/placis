# Ad Generation Decision Record

Status: all entries decided as of 2026-08-14 (product owner + engineering). The spec docs in
this directory say *what* we build; this record says *why* we chose what we did, so decisions do
not get lost or re-litigated.

How to use this file: when a decision changes, update the entry (keep the old decision and date
as a note) instead of silently rewriting history. Add new entries with the next number, the
area, and the date.

## Decisions

1. **Creative package is the deliverable, not a landing page** — Ads produce a reviewable
   package (images, copy, placements, lead form suggestions, destination, ICP). Campaign landing
   pages are not planned for the contractor segment; ads link to existing published pages. This
   matches how contractors actually buy: they have no custom landings, and a Meta lead form
   captures leads without one.

2. **Formats from the start** — Square feed (1:1), portrait feed (4:5), carousel (1:1 cards),
   and story/reel (9:16). These are the standard Facebook creative slots; starting with all four
   avoids a later "can I get stories too?" rebuild. Formats without suitable approved images are
   left out of the package, never rendered empty.

3. **AI proposes, the owner decides** — AI drafts copy, proposes image galleries, and may apply
   light cleanup (remove clutter/trash, tidy backgrounds). Everything lands in reviewable drafts
   with provenance; manual edits always win. Heavy editing and image generation stay in the
   media library (epic D12).

4. **Light cleanup is cosmetic only** — Cleanup may not add/remove objects in a way that changes
   what the photo shows, must not conceal damage or defects, and must not change the work
   displayed. It creates non-destructive derived variants; the source asset is never modified.

5. **The zip download is a temporary step** — The package is machine-readable and versioned;
   the download exists only so a human can post manually until direct transmission to Meta
   (future work) replaces it. When posting lands, the platform integration reads the package
   directly and the download goes away.

6. **Ad generation is a standalone service** — The `/cms/ads` workspace is one user of it;
   future campaign management inside the CMS and later external systems call the same service.
   Platform integration is additive: stable ids, `platform_refs`, and `platform_status` exist
   from day one, so connecting a Facebook Ads Manager later does not restructure the model.
   Performance metrics attach to the stable ids.

7. **Meta lead form is suggested fields only (for now)** — The package carries a suggested
   title and questions as a starting point. The real form (including the privacy notice Meta
   requires) is finalized at posting time. Suggested fields never block approval.

8. **Ads ask for the ideal customer profile (ICP)** — The create-an-ad flow asks who the ad
   targets. The default is married couples aged 30-40, which fits most contractors (about 17 of
   20 ads). The LLM suggests an ICP asynchronously from the business profile and research,
   reviewable; ads are targeted to the confirmed ICP once a platform is connected.

9. **No ad questions during onboarding** — Onboarding never collects ad preferences
   (no `marketing.ads` profile group). Ads are created on demand in the CMS; onboarding stays
   simple.

10. **Before/after claims need a real image pair** — A before/after result is allowed only when
    backed by a real before/after image pair from the same project; the image pair is the
    evidence. No pair, no claim.

11. **The CMS is the umbrella; there is no ad 'dashboard'** — The CMS is the umbrella for
    marketing management with a website part and an ads part. The deprecated operations
    dashboard is not a concept here: campaign status, spend, leads, attribution, and billing are
    future work, not a separate surface that owns them.

12. **New ad tables, reuse by reference** — Ads need their own records (creative set, variants,
    copy, placements, lead form, review). What is not duplicated is CMS content: media,
    projects, proof, and pages stay where they are and ad records reference them by id.

13. **Approved media only, gated twice** — The picker only offers approved tenant-owned assets
    with alt text (prevention), and approval re-validates every image's current state (the
    gate), so an asset that went into review after selection, a pending cleanup edit, or missing
    alt text blocks `ready to post` with an owner-readable message.

14. **The spec directory is the single authority** — `docs/features/ads/ad-generation/` holds
    the PRD (with user stories and acceptance criteria) and the implementation plan. No epic
    file for this feature, no duplicated ad content elsewhere; older ad docs were cleaned out or
    reduced to pointers to this directory.

15. **Copy limits are shared constants, re-verified at implementation** — Headline 40, primary
    text 5000 (recommended 500 for drafts), description 30, button labels from a fixed set. The
    exact limits must be re-checked against current Meta policy when implementing.

16. **Generation is safe to retry and recorded** — Running the same generation twice gives the
    same result, and every AI call records reasoning, user-visible output, and tool calls via
    `ai_generations` tracing.

17. **Video ads are deferred** — Future work: short cinematic-style videos assembled from
    approved photos and clips (assembly, not generation), with optional AI transitions, rendered
    per format through a separate pipeline. Noted now so the image package does not block them.

18. **Conservative claims** — No fabricated reviews, ratings, years, guarantees, certifications,
    insurance, or pricing; no stock imagery passed off as the contractor's work; photos of
    identifiable people/customer properties are usable once approved in the media library
    (that approval is the consent); no personal data in copy.

19. **Meta first, Google Ads later** — Posting (future work) starts with Meta (Facebook /
    Instagram): formats, lead forms, and ICP targeting are Meta-shaped on purpose. Google Ads
    is too early to plan for yet.

20. **Who first, how second** — The workflow decides who the ad is for (ICP, lead capture)
    before any ad mechanics. Users pick the target and the lead path; formats, crops, and
    sizes follow automatically and are not exposed as ad jargon. Approval is the last step of
    the page; AI generation is async and never blocks.

21. **One accordion wrapper, two expandable forms** — The flow and the editor are the same
    screen: an accordion wrapper shows both forms immediately — form 1 "About the ad" (open by
    default, all the questions) and form 2 "Review" (visible but locked until form 1 is
    complete, then expands; form 1 can be returned to) — then the publish block when ready.
    Current direction, under visual review via the design mock.

22. **ICP is loose; it steers generation** — The ideal customer profile is a loose profile,
    not precise targeting data. Today it tailors the ad's tone and imagery; precise targeting
    on the ICP (age, household, location) arrives with posting; internal ad logic outside Meta
    is future work and out of scope for now. The ICP never appears in the copy itself — no
    "ideal for homeowners 40-55" claims.

23. **Drop to add photos anywhere** — Dragging a photo onto the page adds it to the ad (drop
    overlay, upload through the media flow). The pattern is meant to extend across the whole
    CMS, not just the ads workspace.

24. **Reuse the existing CMS gallery** — The ad page's photo selection is the existing CMS
    media gallery (same component and tokens as the rest of the CMS), not a new parallel
    gallery. "+ Add" opens the file picker; drag-anywhere adds photos; both go through the
    existing media flow.

25. **Ad list: large cards, compress past six** — Clients rarely run more than 6 ads at once,
    so the list uses large cards (6 fill most of the screen) and compresses to dense rows
    when there are more. Default sort is active first, then newest by created time;
    spend-based sorting replaces it once performance exists.

26. **Prefetch + cache ads data** — The ads list and platform connection status are fetched as
    soon as the app/CMS loads and cached in the browser (query cache), so the ads workspace is
    already resolved by the time the user reaches it and revisits don't re-fetch. A loading
    state is a fallback only — it appears solely on direct routing to `/ads` or a bug. Connect
    buttons render only from the prefetched status.

27. **Existing-ad detail view** — Clicking an ad card opens a read-oriented detail: the ad name
    editable in place (silent input), creative previews, performance with an expected-clients
    projection ("at this spend, we expect X more leads in the next 30 days"), a **per-ad
    leads list** with **uncontacted clients marked in urgent red** (contacted muted), and the
    audience (ICP). **Approve is a creation-flow gate only** — it never appears on an existing
    ad's detail view, so Download there is always available (no approve-first tooltip).
    Audience-match detection ("are we hitting the right audience?") is disabled/deferred;
    per-ad leads are in scope, not deferred.

28. **Existing-ad statuses are not creation-flow statuses** — Existing ads display **Draft /
    Creative ready / Published / Archived**. "Needs review" and "Ready to post" are
    creation-flow labels and are invalid on existing ads; an existing ad with a complete
    creative is **Creative ready**, and the next state is **Published** once posting exists.

29. **Detail panel: inputs left, outputs right** — The existing-ad detail is a two-column
    panel. **Left (inputs)**: Creative (gallery), then **Budget** (disabled stub until
    posting is connected), then **Audience** and **Area** — read-only, not editable yet,
    placed below the creative. **Right (outputs)**: Performance with Leads under it.
    Audience and area are shown as settled facts of the ad, not as controls.
