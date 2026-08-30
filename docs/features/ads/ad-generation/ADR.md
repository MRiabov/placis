# Ad Generation Decision Record

Status: all entries decided as of 2026-08-26 (product owner + engineering). The
spec docs in this directory say *what* we build; this record says *why* we chose
what we did, so decisions do not get lost or re-litigated.

How to use this file: when a decision changes, update the entry (keep the old
decision and date as a note) instead of silently replacing the old entry. Add
new entries with the next number, the area, and the date.

## Decisions

1. **Ad set is the deliverable, not a website page** (updated 2026-08-19) — Ads
   produce a reviewable ad set (images, copy, placements, ad lead form
   suggestions, ideal customer profile). Campaign landing website pages are not
   planned for the contractor segment. Ads capture ad leads through a Meta ad
   lead form; they do not send people to a website page in the first pass. This
   matches how contractors actually buy: they have no custom campaign website
   pages, and an ad lead form captures ad leads without one. Previous decision
   (2026-08-14): ads linked to existing published website pages as the ad
   destination. Website-page click-through is deferred (see decision 30).

2. **Ad formats from the start** (updated 2026-08-25) — Square feed (1:1),
   portrait feed (4:5), carousel (1:1 cards), and Story (9:16). These are the
   standard Facebook ad formats; starting with all four avoids a later "can I
   get stories too?" rebuild. One ad is one format (decision 32). Never produce
   an empty format. If the chosen format hasn't enough ready photos, generate
   does not succeed — exact UX is an open question in [ads README](../README.md#open-questions). Previous
   decision: ad formats without suitable approved images were left out of a
   multi-format ad set, never rendered empty.

3. **The LLM drafts; the owner edits** — The LLM drafts copy, proposes image
   galleries, and may apply light cleanup (remove clutter/trash, tidy
   backgrounds). Everything lands in reviewable drafts with where it came from;
   manual edits always win. Heavy editing and image generation stay in the media
   library (epic D12).

4. **Light cleanup is cosmetic only** — Cleanup may not add/remove objects in a
   way that changes what the photo shows, must not conceal damage or defects,
   and must not change the work displayed. It creates a new media library item
   (a copy) that inherits supplied by; the source media library item is never
   modified. Ads call the same AI cleanup as `/cms/media` and the assistant
   `cleanup_image`; there is no ads-only cleanup.

5. **The zip download is a temporary step** — The ad set is machine-readable and
   has an ad set format number; the download exists only so a human can do ad
   posting manually until direct transmission to Meta (future work) replaces it.
   When ad posting lands, the ad-platform integration reads the ad set directly
   and the download goes away.

6. **Ad generation is a standalone service** — Ads under `/cms/ads` is one
   caller of it; future campaign management and later external systems call the
   same service. Ad-platform integration is additive: stable ids,
   `platform_refs`, and `platform_status` exist from day one, so connecting a
   Facebook Ads Manager later does not restructure the model. Performance
   metrics attach to the stable ids.

7. **Ad lead form is suggested fields only (for now)** (updated 2026-08-26) —
   The ad set carries a suggested title and questions as a starting point. The
   title is edited in Review with the other copy (decision 38). The real ad lead
   form (including the privacy notice Meta requires) is finalized at ad posting.
   Suggested fields never block approval.

8. **Ads ask for the ideal customer profile** — The create-an-ad flow asks who
   the ad targets. The default is married couples aged 30-40, which fits most
   contractors (about 17 of 20 ads). The LLM suggests an ideal customer profile
   asynchronously from the business profile and business research, reviewable;
   ads are targeted to the confirmed ideal customer profile once an ad platform
   is connected.

9. **No ad questions during onboarding** — Onboarding never collects ad
   preferences (no `marketing.ads` profile group). Ads are created on demand in
   Ads; onboarding stays simple.

10. **Before/after ads are future, currently low-priority** (updated 2026-08-19)
    — Not current product. A project does not need before/after photos. Current
    ads: the LLM must not invent results. When this work is picked up it will
    need a defined pair and an owner control; do not design those now. Previous
    decision (2026-08-14): before/after marketing statements need a real image
    pair from the same project. That pair and an owner request were never
    defined, so the rule is deferred rather than treated as a current gate.

11. **There is no ad 'dashboard'** — Website editor, Ads, Details, and Media
    library sit alongside each other. The deprecated operations dashboard is not
    a concept here: campaign status, spend, ad leads, attribution, and billing
    are future work, not a separate surface that owns them.

12. **New ad tables, reuse by reference** — Ads need their own records (ad,
    variants, copy, placements, ad lead form, review). Internal: images + text
    as a set, not Ad; today stored as `ads` plus variants. What is not
    duplicated is media library, projects, certifications, reviews, and website
    pages: they stay where they are and ad records reference them by id.

13. **We label photos; the owner never sees media caption or review chores**
    (updated 2026-08-25) — Placis writes the media caption (LLM) for the media
    library and for later LLM picks. The contractor is never asked to label a
    photo and never sees "has no media caption". A photo already in the ad is
    not shown as "still in review". After the owner
    **uploads a photo into an ad**, captioning is not a gate: they just chose
    it. **Uploading…** is only while the photo is uploading. Hover the thumb: a
    circle-and-cross button (same overlay as `/cms/media` and the website editor
    media library); click it to abort — no media library item is left. As soon
    as `file_id` is set (not `failed`), that photo is usable in this ad — target
    **about 10 seconds**, not an LLM media caption wait. Do not show
    **Processing…** as a wait-to-use overlay in Ads. The media caption still
    writes in the background (`processing` → `ready` on the media item) so
    `/cms/media` and the next generate can use it. Approve waits on failed
    uploads and photos that have not finished uploading; it does not wait for a
    media caption on an owner-added photo. Previous decision (same day): newly
    added files showed **Uploading…** then **Processing…** until the media
    caption was written, and Approve waited until thumbs were `ready`. Before
    that: the picker only offered approved items with a media caption, and
    approval blocked **ad ready to post** with owner-readable "no media caption"
    / "still in review" messages.

14. **The spec directory is the single authority** —
    `docs/features/ads/ad-generation/` holds the PRD (with user stories and
    acceptance criteria) and the implementation plan. No epic file for this
    feature, no duplicated ad content elsewhere; older ad docs were cleaned out
    or reduced to pointers to this directory.

15. **Copy limits are shared constants, re-verified at implementation** —
    Headline 40, primary text 5000 (recommended 500 for drafts), short label 30
    (owner-facing; stored as `description`, Meta `link_data.description`),
    button labels from a fixed set. The exact limits must be re-checked against
    current Meta policy when implementing.

16. **Generation is cached and recorded** — Results are cached per input, ad
    format, and `prompt_id` / `prompt_version` on `ai_generations`. Retry of the
    same request while the ad is still an Ad draft or Ad needs review returns
    that cached generation. If the owner has already accepted it
    (`ad_ready_to_post`) or a Published (running) ad already occupies that cache
    identity — including if the agent somehow emitted a duplicate of one already
    running — roll to the next `prompt_version` instead of cloning. Every call,
    including a cache hit, records reasoning, user-visible output, tool calls,
    and the standard inference metadata via `ai_generations`.

17. **Video ads are deferred** — Future work: short cinematic-style videos
    assembled from approved photos and clips (assembly, not generation), with
    optional AI transitions, rendered per ad format through a separate pipeline.
    Noted now so the image ad set does not block them.

18. **Conservative marketing statements** (updated 2026-08-25) — Unprompted
    generation does not invent reviews, ratings, years, guarantees,
    certifications, insurance, pricing, or results; no stock imagery passed off
    as the contractor's work; photos of identifiable people or third-party
    properties are usable once approved in the media library (that is owner
    approval); no personal data in copy. If the owner types a marketing
    statement, or **prompts** the Review AI orb to write one, we allow it.
    Approve is not blocked. If that copy includes a detail (years in business vs
    `established_year`, and the same class of Details fields), the ads generator
    calls **`update_details`** (one tool, one implementation — also website
    editor tools; [details HTTP](../business-profile/details/api.md)). Recorded in `ai_generations` as its own tool
    call. Not a side effect of the ads PATCH, Approve, or the copy-rewrite tool.
    A **notification** (OK / Revert) appears bottom-right; leaving the screen
    keeps the write. Character limits, uploads still in flight, and failed
    uploads still block. (2026-08-27): `update_details` is the shared Details
    tool, not an Ads-only writer. Previous decision (same day): owner-typed or
    owner-prompted copy warned inline and did not write the business profile;
    the warning pointed the owner to Details. Previous decision: unsupported
    marketing statements blocked **ad ready to post** until owner or
    done-for-you review.

19. **Meta first, Google Ads later** — Ad posting (future work) starts with Meta
    (Facebook / Instagram): ad formats, ad lead forms, and
    ideal-customer-profile targeting are Meta-shaped on purpose. Google Ads is
    too early to plan for yet.

20. **Who first, how second** (updated 2026-08-25) — The workflow decides who
    the ad is for (ideal customer profile) before any ad mechanics. Ad-lead
    capture is always a Meta ad lead form; the owner does not pick a
    website-page path. The owner picks one ad format as owner-facing pills
    before generate (decisions 32 and 33); crops still follow from the stored
    focal point, and ratios stay out of the UI. Approval is the last step of the
    flow; LLM generation is async and never blocks. Previous decision
    (2026-08-19): ad formats, crops, and sizes followed automatically and were
    not exposed. Previous decision (2026-08-14): the owner picked the target and
    the ad-lead path (ad lead form or website page).

21. **One accordion wrapper, two expandable steps** — The flow and the Ads
    screen are the same screen: an accordion wrapper shows both steps
    immediately — step 1 "About the ad" (open by default, all the questions) and
    step 2 "Review" (visible but locked until step 1 is complete, then expands).
    After generate, About the ad is confirmed (locked). **Revise** sits on the
    generate row with **Generate again** (after the first generate only — not on
    the About the ad title, and not before the first generate). Revise unlocks
    format, audience, offer, or the ad lead form questions; Generate again
    applies. Changing format regenerates this ad. Then the approve block when
    the ad is ad ready to post. Current direction, under visual review via the
    design mock.

22. **Ideal customer profile is loose; it steers generation** — The ideal
    customer profile is a loose profile, not precise targeting data. Today it
    tailors the ad's tone and imagery; precise targeting on the ideal customer
    profile (age, household, location) arrives with ad posting; internal ad
    logic outside Meta is future work and out of scope for now. The ideal
    customer profile never appears in the copy itself — no "ideal for homeowners
    40-55" marketing statements.

23. **Drop to add photos anywhere** — Dragging a photo onto the ad adds it (drop
    overlay, upload through the media library flow). The pattern is meant to
    extend across the website editor, Details, Media library, and Ads, not just
    Ads.

24. **Reuse the existing media library gallery** — The ad's photo selection is
    the existing media library gallery (same gallery and tokens as the rest of
    the app), not a new parallel gallery. "+ Add" opens the file picker;
    drag-anywhere adds photos; both go through the existing media library flow.
    The LLM proposes photos; the owner always has a strip to change the pick.
    Hiding that strip on one-image formats would leave only the LLM choice.

25. **Ad list: large cards, compress past six** — Contractors rarely run more
    than 6 ads at once, so the list uses large cards (6 fill most of the screen)
    and compresses to dense rows when there are more. Default sort is active
    first, then newest by created time; spend-based sorting replaces it once
    performance exists.

26. **Prefetch + cache ads data** — The ads list and ad-platform connection
    status are fetched as soon as the app loads and cached in the browser (query
    cache), so Ads is already resolved by the time the owner reaches it and
    revisits don't re-fetch. A loading state is a fallback only — it appears
    solely on direct routing to `/ads` or a bug. Connect buttons render only
    from the prefetched status.

27. **Existing-ad detail view** — Clicking an ad card opens a read-oriented
    detail: the ad name editable in place (silent input), image previews,
    performance with an expected ad-lead projection ("at this spend, we expect X
    more ad leads in the next 30 days"), a **per-ad ad-leads list** with
    **uncontacted ad leads marked in urgent red** (contacted muted), and the
    audience (ideal customer profile). **Approve is a creation-flow gate only**
    — it never appears on an existing ad's detail view, so Download there is
    always available (no approve-first tooltip). Audience-match detection ("are
    we hitting the right audience?") is disabled/deferred; per-ad ad leads are
    in scope, not deferred.

28. **Existing-ad statuses are not creation-flow statuses** — Existing ads
    display **Draft / Creative ready / Published / Archived**. "Ad needs review"
    and "Ad ready to post" are creation-flow labels and are invalid on existing
    ads; an existing ad with a complete ad is **Creative ready**, and the next
    status is **Published** once ad posting exists. (2026-08-29): Archived ads
    leave the grid and sit under **Archive**. They are not a badge on the
    active cards.

29. **Detail panel: inputs left, outputs right** — The existing-ad detail is a
    two-column panel. **Left (inputs)**: Images, then **Budget**, then
    **Audience** and **Area** — audience and area are read-only, not editable
    yet, placed below the images. A one-image ad shows that photo, not a
    thumbnail gallery; changing it is Edit (the workspace photo strip). Carousel
    detail shows the cards as viewable thumbs. Daily budget stays a disabled
    stub until ad posting is connected. Duration is remaining days in the run
    window (for example `4 days left (15 Aug to 29 Aug)`), not a length like "2
    weeks". The end date uses the native browser date picker — also disabled
    until ad posting. **Right (outputs)**: Performance with Ad leads under it.
    Audience and area are shown as settled details of the ad, not as controls.

30. **Meta ad lead form only; website-page click-through is deferred**
    (2026-08-19) — The first pass does not let the owner send people to a
    website page. Every ad carries a suggested Meta ad lead form. Website-page
    click-through (and a thank-you redirect onto a website page) may return
    later; it is deferred, not cancelled. Shipped-initially design, frontend
    spec, data model, and tests do not include an ad destination picker, a
    Website page toggle, or destination columns. Mention of the later option
    belongs only here and in PRD Post-MVP.

31. **No website-style undo log; `updated_at` is enough** (updated 2026-08-25) —
    Do not copy website edit history onto ads. Ads is a review workspace (few
    fields, LLM draft then accept / edit / reject, then Approve), not a canvas
    of many small writes. Native text-field undo covers typing. LLM rewrite and
    cleanup Accept are Ctrl+Z reversible while they are in Ads (decision 36) —
    not a website-style undo table. Last writer on copy is
    `ad_copy_variants.source`. Approve is the checkpoint (`ad_ready_to_post`).
    Later posting “revision” is a new post to Meta, not undo in Ads.

    Two tabs (or two devices) still need a cheap conflict check: every write
    that changes the ad set bumps `ads.updated_at` (including variant / copy /
    image / ad lead form patches). Mutating requests send the last-seen
    `base_updated_at`. Match → write and return the new `updated_at`. Mismatch →
    `409`; the frontend re-GETs; no merge. No undo table, no undo/redo routes,
    no hydrate of 200 batches. Previous decision (2026-08-23): native text-field
    undo plus reject / AI-orb rewrite was the whole undo story (JS-applied LLM
    output was not Ctrl+Z’able).

32. **One ad is one format** (updated 2026-08-25) — A single creative is a
    single ad. The owner picks exactly one ad format (Square feed, Portrait
    feed, Carousel, or Story). Want another format? Create another ad. Square
    feed, Portrait feed, and Carousel remain **posts**; Story remains
    **stories** — that is Meta grouping, not a multi-format ad. Previous
    decision (same day): one ad was posts or stories (several formats in one
    family).

33. **The format is chosen before generate; drafted for how it's used** (updated
    2026-08-25) — The owner picks that one format in About the ad, as clickable
    pills (single select), **before** Create ad and generate. The draft matches
    that format: feed is one photo and feed-length copy; carousel is 2–10 cards;
    story is almost always one 9:16 image with shorter overlay copy. Changing
    format after generate regenerates this ad's creative; it does not rearrange
    an existing draft into a different format. After generate, the format pills
    are locked until the owner hits **Revise** next to **Generate again**. Photo
    crops still follow from the stored focal point. Previous decision (same
    day): several formats per ad, each drafted on its own; before that, one LLM
    contract for the whole set.

34. **First generate is unprompted; Review is promptable** (updated 2026-08-25)
    — Create ad and generate stays one unprompted draft from About the ad. After
    that, each copy field (headline, primary text, short label — not the Meta
    CTA enum) and the current photo’s cleanup get a CMS AI orb. Click reveals a
    prompt-only **overlay** (not inline under the field). Selecting a span in a
    copy field opens the same overlay above that selection; the prompt rewrites
    that span. Orb with no selection rewrites the whole field (Ctrl+Z restores
    the previous text). Prompt text is required. Copy rewrite is per-field;
    optional selection on `POST …/rewrite` (omit = whole field). Image cleanup:
    first upload already ran a tailored default from visual-issue
    classification; the orb is a **different** cleanup via
    `POST /v1/media-assets/{id}/image-edits` (`prompt`). Not the assistant chat.
    Not `POST /v1/ads/…/cleanup`. Reject is `POST /v1/media-assets/{id}/reject`.
    This replaces unprompted Review **Regenerate**. Record the owner prompt with
    reasoning, output, and tool calls in `ai_generations`. (2026-08-27) Previous
    decision (same day): prompt form was inline in the field, wrapping with the
    row. (2026-08-28) Short label has no AI orb. (2026-08-30) Same day, later:
    say **inline AI assistance**; **select to edit inline AI assistance** is the
    span path. Click with no selection stays the whole field.

35. **Review ad format preview is Facebook and Instagram placement** (updated
    2026-08-25) — The selected format is shown as both Facebook and Instagram
    placements, using an existing dual-platform mock kit (MIT preferred), not a
    generic CMS card. Desktop shows both; narrow screens toggle. Placement type
    is Meta-like (Helvetica on Facebook, system UI on Instagram), not Satoshi.
    Meta `generatepreviews` iframes stay posting-time (need a Marketing API
    creative; cannot update as the owner types). (2026-08-28) Narrow Facebook |
    Instagram toggle uses the platform mark plus the name.

36. **LLM actions are Ctrl+Z reversible** (2026-08-25) — All copy in Review
    fields is Ctrl+Z’able, including orb and highlight rewrites. Cleanup Accept
    is the same: Ctrl+Z restores the previous photo. Restore of the last LLM
    apply while they are in Ads, then the ordinary PATCH. Default: LLM actions
    are revertable. Native typing already undoes; JS-applied LLM output does
    not, which is why this is tested. Still no website-style undo log (decision
    31).

37. **Ideal customer profile and area start from the last ad** (2026-08-26) — On
    a new ad, the Who it's for comboboxes (ideal customer profile, Where they
    are) are filled from the last ad the owner created. They can still pick
    another. If this is their first ad, use the default ideal customer profile
    (decision 8) and the service area on the business profile. What are you
    promoting? is the field they fill. The service list is still known services
    from onboarding; that is the options, not the selected value.

38. **Ad lead form title is Review copy** (2026-08-26) — The suggested ad lead
    form title is creative copy: it lives in Review with headline / primary text
    / short label, not in About the ad. About the ad keeps How people get in
    touch as the include/exclude questions only (phone number, full name,
    postcode, email). Generate still writes a suggested title; the owner edits
    it after generate. Previous decision: the title sat in About the ad under
    How people get in touch.

39. **Archive is not delete** — `POST /v1/ads/{id}/archive` sets
    `status=archived`. `POST …/unarchive` restores `draft` when the ad has no
    approved variant, otherwise `ad_ready_to_post` (Creative ready). Archived
    ads leave the list. Unarchive returns the row to the list. Toast Undo is
    unarchive. `DELETE /v1/ads/{id}` stays ad draft only. Look: [design
    decision 1](design-decision-record.md). (2026-08-29)
