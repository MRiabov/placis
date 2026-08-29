# Assistant design decision record

Look and interaction for the CMS assistant overlay and the onboarding assistant
launcher. Architecture: [ADR.md](ADR.md). Tokens: [CMS design.md](../../general-architecture/cms/design.md). CMS nav:
[CMS design decision record](../../general-architecture/cms/design-decision-record.md). Mocks: [cms.html](../../design/cms.html), [onboarding.html](../../design/onboarding.html).

Status: decided (2026-08-28). One number is one decision. Related amendments
(same surface, same topic — orb widths, then the hit target) stay on that
number. A later call on a **different** topic is a new number. **Why** is
owner-written; omit it rather than inventing it.

## Decisions

1. **CMS overlay is today’s website-editor assistant** — Collapsed one-line
   composer (chevrons, field, Plan / Send or **Voice** when empty). Expand /
   reduce. Clear context trash while expanded. Same overlay on every CMS
   assistant screen’s main area. Plan / Ask first switches are
   **website editor only**. Placement: bottom-right of the canvas / overlay
   (website design decision 18 geometry), not a full-screen takeover.
   (2026-08-28) (2026-08-29): The **call** is the **Assistant**
   button (design decision 11), not hunting for this overlay. Orb / chatbot look
   stays this overlay once they have called. Closed until they call. Same day,
   later: that button is bottom-right of the main pane, not top-right.

2. **Look is DustOrb** — Empty field fades to the particle orb. Not website
   design decision 18’s “soft glowing circle” HTML stand-in. Not the 44px Ads
   Review rewrite orb. Canonical file: `frontend-2/src/shared/ui/DustOrb.tsx`
   (bring across in the frontend pass). (2026-08-28) Same day, later: HTML mocks
   run the particle orb from [dust-orb.js](../../design/dust-orb.js) (vanilla port of that DustOrb). The
   orb **bounces** when they hover or tap it, and while they speak with it.
   Reduced motion: no bounce. Same day, later: scale matches placis-web OrbDemo
   (`hover:scale-[1.03]`, speaking `scale-110`, 500ms round transform). Dust
   recycles from the centre; the cursor pulls it. Not a bounce squash. Same day,
   later: Voice asks for the microphone and bounces the orb from owner noise
   level (skip `?shot=1`). (2026-08-28)

3. **`/cms` is two cards** — **Do my website…** → `/cms/website`, **Run my ads**
   → `/cms/ads`. New chat / prompt home is gone. Not a composer, not Voice, not
   a first-turn assistant POST. Connect (ad accounts) stays. Hide New chat in
   the left nav. (2026-08-28)

4. **Follow is default on** — Owner cannot turn it off. Website editor: canvas
   snaps to the website slot the **agent** is editing. Field-list screens
   (Details and other field lists): distinct agent-edited field notice (example:
   the field reads blue). Ads copy highlight can share that notice.
   `update_details` off Details: notification (OK / Revert), not Follow.
   Headless 06: Follow does not apply. (2026-08-28)

5. **Assistant screen switch does not reset the thread** — Overlay stays. Speech
   is not interrupted. Clicks during an in-flight answer coalesce to the screen
   they ended on; that notice rides with the **next** owner turn. (2026-08-28)

6. **Onboarding launcher is bottom right, always turnable on** — Grow
   [onboarding.html](../../design/onboarding.html). Every onboarding screen in that mock (Find, Review, client
   interview, wait teaser). Not the CMS overlay cloned onto onboarding. Not
   empty-composer-only. Not “Start voice client interview” as data entry.
   DustOrb when on. Preview website address / website-activation strip stays out
   of this file. (2026-08-28) Same day, later: DustOrb is
   **visible by default**, voice **off**. Cue: squiggly arrow +
   **Click to turn on voice**. Click the orb: cue gone, play a
   **prerecorded intro** (not the live model) while the realtime connection
   starts; they talk after that. Close (×) hides the orb; a quieter
   **Enable voice guide** stays. Owner-facing onboarding copy is **guide** /
   **voice guide**, never **Assistant**. Not on the wait teaser. Mock:
   `?guide=1` listening, no autoplay. Same day, later:
   **The agent is on the right.** Onboarding DustOrb is bottom-right, same side
   as the CMS voice orb. Native button paint is stripped so a click does not
   flash a browser control. Cue sits to the left of the orb. (2026-08-28)

7. **Website-editor orb size and click target** — Website-editor orb is
   **50vw** at ≤480px (`min(50vw, 50dvh)`), **30vw** on wider viewports
   (`min(30vw, 24rem)`). (2026-08-28) Same day, later: wider viewports are
   `min(5.5rem, 30vw)` again (same size as the onboarding guide). ≤480px stays
   **50vw**. Voice Apply / Reject / Restore chatbot stay a compact cluster to
   the left of the orb; they do not stretch across the canvas. Same day, later:
   desktop / tablet **click** target is a **2.75rem circle** (particle wrap
   stays `min(5.5rem, 30vw)`); clicks outside that circle pass through to the
   canvas. Close and Restore chatbot still capture. ≤480px hit is
   `min(12rem, 42vw)`. (2026-08-28)

8. **Denied microphone uses the shared notification** — CMS: restore the
   chatbot and the Ads/Details **notification** (**Allow microphone access in
   your browser to talk. You can keep typing.**). Revert is hidden (nothing to
   undo). Onboarding: return to the cue (**Allow microphone access in your
   browser**); click the orb retries. (2026-08-28) Same day, later: CMS stays
   on Voice until they pick. Buttons are **Try again** (retry the microphone)
   and **Switch to text mode** (Restore chatbot). Not Revert / OK. Onboarding
   cue is unchanged. (2026-08-28)

9. **Prerecorded greeting / intro plays once** — HTML mocks:
   `cms-voice-greeting.mp3` when the website-editor orb comes on;
   `onboarding-guide-intro.mp3` on guide turn-on. Silent when `?shot=1`. The
   file plays on the first start. Starting Voice / the guide again more than
   **5 seconds** after that play began does not replay it. (2026-08-28)

10. **Realtime connection waits for the microphone** — Create
    `POST …/voice/realtime-connection` only after the microphone is granted.
    Denied microphone never POSTs it. (2026-08-28)

11. **CMS assistant is called from the top-right of the main pane** — Every
    screen in The CMS, including `/cms`, has a pinned top-right **Assistant**
    button on the main pane (not a left-nav item). Click calls Voice (DustOrb +
    Restore chatbot). Switch to text is Restore chatbot / **Voice** in the
    composer. Close returns to the button. Not the onboarding bottom-right
    voice guide. Website-editor Plan / Ask first stay on `/cms/website` only,
    and only while the chatbot is showing. Architecture: [ADR](ADR.md) 10.
    (2026-08-29) Same day, later: **bottom-right** of the main pane, not
    top-right. On a narrow website editor it sits above the workspace bar.
