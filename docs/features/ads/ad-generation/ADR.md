# Ad Generation Decision Record

Status: all entries decided as of 2026-08-14 (product owner + engineering). The spec docs in
this directory say *what* we build; this record says *why* we chose what we did, so decisions do
not get lost or re-litigated.

How to use this file: when a decision changes, update the entry (keep the old decision and date
as a note) instead of silently rewriting history. Add new entries with the next number, the
area, and the date.

## Decisions

1. **Ad set is the deliverable, not a landing page** — Ads produce a reviewable
   ad set (images, copy, placements, ad lead form suggestions, ad destination, ideal customer
   profile). Campaign landing pages are not planned for the contractor segment; ads link to
   existing published website pages. This matches how contractors actually buy: they have no
   custom landings, and an ad lead form captures ad leads without one.

2. **Ad formats from the start** — Square feed (1:1), portrait feed (4:5), carousel (1:1 cards),
   and Story (9:16). These are the standard Facebook ad formats; starting with all four
   avoids a later "can I get stories too?" rebuild. Ad formats without suitable approved images
   are left out of the ad set, never rendered empty.

3. **The LLM drafts; the owner edits** — The LLM drafts copy, proposes image galleries, and may
   apply light cleanup (remove clutter/trash, tidy backgrounds). Everything lands in reviewable
   drafts with where it came from; manual edits always win. Heavy editing and image generation
   stay in the media library (epic D12).

4. **Light cleanup is cosmetic only** — Cleanup may not add/remove objects in a way that changes
   what the photo shows, must not conceal damage or defects, and must not change the work
   displayed. It creates non-destructive derived variants; the source media is never modified.

5. **The zip download is a temporary step** — The ad set is machine-readable and has a version number;
   the download exists only so a human can do ad posting manually until direct transmission to
   Meta (future work) replaces it. When ad posting lands, the ad-platform integration reads the
   ad set directly and the download goes away.

6. **Ad generation is a standalone service** — Ads under `/cms/ads` is one caller of it;
   future campaign management and later external systems call the same service.
   Ad-platform integration is additive: stable ids, `platform_refs`, and `platform_status` exist
   from day one, so connecting a Facebook Ads Manager later does not restructure the model.
   Performance metrics attach to the stable ids.

7. **Ad lead form is suggested fields only (for now)** — The ad set carries a suggested
   title and questions as a starting point. The real ad lead form (including the privacy notice
   Meta requires) is finalized at ad posting. Suggested fields never block approval.

8. **Ads ask for the ideal customer profile** — The create-an-ad flow asks who the ad
   targets. The default is married couples aged 30-40, which fits most contractors (about 17 of
   20 ads). The LLM suggests an ideal customer profile asynchronously from the business profile
   and business research, reviewable; ads are targeted to the confirmed ideal customer profile
   once an ad platform is connected.

9. **No ad questions during onboarding** — Onboarding never collects ad preferences
   (no `marketing.ads` profile group). Ads are created on demand in Ads; onboarding stays
   simple.

10. **Before/after claims need a real image pair** — A before/after result is allowed only when
    backed by a real before/after image pair from the same project; the image pair is the
    evidence. No pair, no claim.

11. **There is no ad 'dashboard'** — Website editor, Ads, Details, and Media library sit
    alongside each other. The deprecated operations dashboard is not a concept here: campaign
    status, spend, ad leads, attribution, and billing are future work, not a separate surface
    that owns them.

12. **New ad tables, reuse by reference** — Ads need their own records (ad, variants,
    copy, placements, ad lead form, review). Internal: Creative set is images + text (not Ad);
    today stored as `ads` plus variants. What is not duplicated is media library, projects, certifications, reviews, and
    website pages: they stay where they are and ad records reference them by id.

13. **Approved media only, gated twice** — The picker only offers approved media owned by that
    contractor with a media caption (prevention), and approval re-validates every image's current
    review (the gate), so a media item that went into review after selection, a pending cleanup
    edit, or a missing media caption blocks **ad ready to post** with an owner-readable message.

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
    per ad format through a separate pipeline. Noted now so the image ad set does not block them.

18. **Conservative claims** — No fabricated reviews, ratings, years, guarantees, certifications,
    insurance, or pricing; no stock imagery passed off as the contractor's work; photos of
    identifiable people or third-party properties are usable once approved in the media library
    (that approval is the consent); no personal data in copy.

19. **Meta first, Google Ads later** — Ad posting (future work) starts with Meta (Facebook /
    Instagram): ad formats, ad lead forms, and ideal-customer-profile targeting are Meta-shaped
    on purpose. Google Ads is too early to plan for yet.

20. **Who first, how second** — The workflow decides who the ad is for (ideal customer profile,
    ad-lead capture) before any ad mechanics. The owner picks the target and the ad-lead path;
    ad formats, crops, and sizes follow automatically and are not exposed as ad jargon. Approval
    is the last step of the page; LLM generation is async and never blocks.

21. **One accordion wrapper, two expandable steps** — The flow and the editor are the same
    screen: an accordion wrapper shows both steps immediately — step 1 "About the ad" (open by
    default, all the questions) and step 2 "Review" (visible but locked until step 1 is
    complete, then expands; step 1 can be returned to) — then the approve block when the ad is ad ready to post.
    Current direction, under visual review via the design mock.

22. **Ideal customer profile is loose; it steers generation** — The ideal customer profile is a
    loose profile, not precise targeting data. Today it tailors the ad's tone and imagery;
    precise targeting on the ideal customer profile (age, household, location) arrives with ad
    posting; internal ad logic outside Meta is future work and out of scope for now. The ideal
    customer profile never appears in the copy itself — no "ideal for homeowners 40-55" claims.

23. **Drop to add photos anywhere** — Dragging a photo onto the page adds it to the ad (drop
    overlay, upload through the media library flow). The pattern is meant to extend across the
    website editor, Details, Media library, and Ads, not just Ads.

24. **Reuse the existing media library gallery** — The ad page's photo selection is the existing
    media library gallery (same component and tokens as the rest of the app), not a new parallel
    gallery. "+ Add" opens the file picker; drag-anywhere adds photos; both go through the
    existing media library flow.

25. **Ad list: large cards, compress past six** — Contractors rarely run more than 6 ads at once,
    so the list uses large cards (6 fill most of the screen) and compresses to dense rows
    when there are more. Default sort is active first, then newest by created time;
    spend-based sorting replaces it once performance exists.

26. **Prefetch + cache ads data** — The ads list and ad-platform connection status are fetched as
    soon as the app loads and cached in the browser (query cache), so Ads is
    already resolved by the time the owner reaches it and revisits don't re-fetch. A loading
    state is a fallback only — it appears solely on direct routing to `/ads` or a bug. Connect
    buttons render only from the prefetched status.

27. **Existing-ad detail view** — Clicking an ad card opens a read-oriented detail: the ad name
    editable in place (silent input), image previews, performance with an expected ad-lead
    projection ("at this spend, we expect X more ad leads in the next 30 days"), a **per-ad
    ad-leads list** with **uncontacted ad leads marked in urgent red** (contacted muted), and the
    audience (ideal customer profile). **Approve is a creation-flow gate only** — it never appears
    on an existing ad's detail view, so Download there is always available (no approve-first
    tooltip). Audience-match detection ("are we hitting the right audience?") is
    disabled/deferred; per-ad ad leads are in scope, not deferred.

28. **Existing-ad statuses are not creation-flow statuses** — Existing ads display **Draft /
    Creative ready / Published / Archived**. "Ad needs review" and "Ad ready to post" are
    creation-flow labels and are invalid on existing ads; an existing ad with a complete
    ad is **Creative ready**, and the next status is **Published** once ad posting exists.

29. **Detail panel: inputs left, outputs right** — The existing-ad detail is a two-column
    panel. **Left (inputs)**: Images (gallery), then **Budget** (disabled stub until
    ad posting is connected), then **Audience** and **Area** — read-only, not editable yet,
    placed below the images. **Right (outputs)**: Performance with Ad leads under it.
    Audience and area are shown as settled details of the ad, not as controls.
