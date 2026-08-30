# Onboarding design decision record

Look and interaction for contractor-facing onboarding. Architecture stays in
[ADR.md](ADR.md). Screens: [frontend.md](frontend.md). Tokens:
[CMS design.md](../../general-architecture/cms/design.md). Mock:
[onboarding.html](../../design/onboarding.html).

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision. **Why** is owner-written; omit it rather than
inventing it.

## Decisions

1. **One screen layout** — Find, Review, client interview, and the wait teaser
   share one layout: heading and lede, then `.onb-card` wells, then a sticky
   footer in the same place. The primary action (Business lookup / Continue)
   always sits in that footer. Inner blocks are not a second card type; they
   sit inside the well. **Why:** buttons were placed differently on all four
   screens, and some sections had cards while others did not.
   (2026-08-28)

2. **No missing-topics queue on Review** — Review does not paint a “Next /
   Client interview” aside listing remaining topics. Continue is in the shared
   footer. Missing rows stay in the found-vs-missing list. **Why:** that queue
   appeared unnecessary.
   (2026-08-28)

3. **Wordmark uses the Placis orb** — The onboarding wordmark is the orb lockup
   (`placis-mark.png`: black squircle, white globe, lowercase placis), not a
   reconstructed line-art globe. Favicon is the orb. **Why:** the orb was not
   used.
   (2026-08-28)

4. **Found reviews look like Google reviews** — Avatar initial, name, source
   mark (Google or Facebook), yellow stars, relative date, then the review
   citation. Not a generic quote card. **Why:** reviews should look more like
   Google reviews.
   (2026-08-28) Profile photo when we have one; letter initial only as
   fallback. The look export always has photos. **Why:** expect actually
   profile images here.
   (2026-08-28)

5. **Extra notes owner copy is a question** — The field is still extra notes
   (`additional_notes`). Owner heading is **Anything else we should know?**
   Helper: optional; parking, languages spoken, or anything that did not fit
   above; stays off the website unless they ask. Not the label Additional
   notes. **Why:** Additional notes was unclear.
   (2026-08-28) Helper is what would help us generate a better website or run
   ads. Not parking or languages. Not “stays off the website unless you ask.”
   **Why:** this should be relevant to what we as a company are doing.
   (2026-08-28)

6. **Visible copy is owner language** — Onboarding screens do not show PRD or
   pipeline phrasing (no “text is the default, voice is listed and deferred”,
   no “unpublished website can be trusted”, no “wait cap”). Specs keep those
   words; the mock and product UI do not. (2026-08-28)

7. **Wait teaser shows a 15-second progress bar** — `/onboarding/preview`
   paints elapsed wait toward the ~15s cap in the shared footer. Copy names
   the remaining seconds. When the cap hits (or copy finishes), the browser
   goes to the preview website address. `?shot=1` does not auto-advance.
   **Why:** the wait is capped at 15 seconds and that was invisible.
   (2026-08-28) The fill paints every animation frame (~10ms-class), not a
   200ms timeout. Copy still names whole seconds. **Why:** the progress bar
   is way too coarse; the design should be 10ms responsive.
   (2026-08-28)

8. **Dev skip generation** — Mock-only. The yellow strip has **Skip
   generation**; `?scene=generated` opens a mock of the generated website
   (website-activation strip sticky at the bottom of the host). Not product UI.
   **Why:** skip generation and route directly to a generated website or a mock
   of it.
   (2026-08-28)

9. **Headings are the card focal, labels recede** — Screen title is `2rem`.
   Each card opens with a heading block (title `1.25rem` / 600 plus a short
   lede), separated from fields by a hairline. Field labels are `13px` / 450
   and secondary ink, not the same size or weight as the heading. Find source
   titles and the Review company name use the same heading size. **Why:**
   headings and labels were indistinguishable, so “Your business” did not read
   as a focal point next to “Display name”.
   (2026-08-28) The hairline is close to the fields, not a second padded band.
   (2026-08-28) No hairline under card headings. Size and weight separate the
   heading from labels. Don't say form. **Why:** every heading having a
   horizontal line in forms is unusual.
   (2026-08-28)

10. **Website-activation strip is sticky to the bottom** — On the preview
    website address the strip stays at the bottom of the viewport while the
    website scrolls. Create an account, then pay EUR 4,900
    (one-time; then about €50 / month). Copy is website activation. After pay
    the strip is gone. Don't say page. **Why:** it was specified to be sticky
    to the bottom of the page.
    (2026-08-28) The strip is a white sales bar with the Placis orb lockup
    (`placis-mark.png`), a headline, the price, and the activate CTA. Not a
    reconstructed globe, not a thin dark toolbar. The onboarding wordmark is
    hidden on this host, so the lockup lives on the strip. Don't say claim.
    **Why:** the pay to claim strip is very basic; where is our brand orb?
    (2026-08-28) Unsigned strip has **Create account**, not Sign in. An
    existing Clerk session skips to pay. **Why:** sign in obviously shouldn't
    be here.
    (2026-08-28) After pay the browser goes to `/cms/website` with **Publish**
    (website publication). The strip is gone on the host. **Why:** one has
    paid, so it should transfer us to the website editor with the option
    to actually deploy.
    (2026-08-28)

11. **Delight is “this is already my business, and something is happening”** —
    Not extra wrapper. Wait fill is frame-smooth (design decision 7). Reviews
    show profile photos (design decision 4). Extra notes are about website and
    ads (design decision 5). The wait-teaser hero uses the same job-site photo
    as the site they will open. The wait timeline moves from writing the website
    pages to opening the site as the cap ends. `prefers-reduced-motion`: no
    carousel loop, bar jumps in second steps, no spin. Product later: found-%
    eases in with research SSE; client interview footer flashes Saved after
    autosave; Find empty loading placeholder is not a filled demo name; wait
    carousel uses real website components; hours copy-forward on the first open
    day. Voice stays listed as coming later. **Why:** make it more delightful to
    use. (2026-08-28)

12. **Client interview uses Details field controls on the white card canvas**
    — Featured services, Maps territory cards, and the hours picker are the
    same controls as Business details. Onboarding keeps the white `.onb-card`
    layout and heading type (`1.25rem` / 600). Details keeps the Details panel.
    **Why:** unify the details in onboarding and details; the white
    onboarding canvas, the Details field look.
    (2026-08-28) Onboarding Details == Business details: same fields and
    controls; the card look is the look difference. **Why:** onboarding
    should == details.
    (2026-08-28)

13. **Wait teaser lands on the website preview** — `/onboarding/preview` then
    `/onboarding/preview-and-edit/`. Custom top-left nested website page list
    (this website preview only; Services nests website pages). Top-right:
    **Share**. Pay is the sticky website-activation strip (same bar as the
    preview website address). Assistant is the CMS canvas Assistant
    (bottom-right of the pane, DustOrb / composer). Canvas top-menu/footer
    clicks stay on this route. No Content / website styles rail. Static host
    mock stays `/onboarding/generated`. (2026-08-30) Same day, later: website
    page list and Share float on the canvas (not a separate bar). Assistant
    starts as text; **Voice** is in the composer. Send and Voice need **Sign
    in**. The website-activation strip stacks on a narrow pane: copy and price,
    then the activate control. (2026-08-30)
