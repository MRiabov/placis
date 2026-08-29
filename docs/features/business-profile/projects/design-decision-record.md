# Projects design decision record

Look and interaction for `/cms/projects`. Product: [ADR.md](ADR.md). Screen:
[frontend.md](frontend.md). Theme:
[CMS design decision record](../../../general-architecture/cms/design-decision-record.md).
Mock: [`demo/`](../../../../demo/README.md) `/cms/projects`. HTML archive:
[cms.html](../../../design/cms.html).

Status: decided (dates on each entry). Do not silently replace the old entry.
One number is one decision. **Why** is owner-written; omit it rather than
inventing it.

## Decisions

1. **List cards clone My ads look** — Prompt-box radius, hairline, shadow,
   large inset photo, 2-up on a wide screen, one column on narrow (1100px). Copy
   is website title + description, not ads meta or performance. The whole card
   is the hit. No controls on the card. The list uses the same centered 960px
   column as Ads. (2026-08-29)

2. **Edits live on `/cms/projects/new` and `/cms/projects/{id}`** — Cover pick,
   title, description, Archive. **Add project** in the list heading opens
   `/cms/projects/new` empty. Persist on click-off. (2026-08-29)

3. **Archive is not delete** — Outline **Archive** on `/cms/projects/{id}`.
   Collapsed **Archive** on the list (chevron, default collapsed) to Unarchive.
   (2026-08-29)

4. **Empty is empty** — Heading, lede, **Add project**. No demo jobs.
   (2026-08-29)

5. **No Profile eyebrow or pill** — No compact rows, no extra photos per
   project, no source of the photo on the card. (2026-08-29)

6. **Writing is Ads AI orbs** — 44px sparkle + required prompt overlay on title
   and description at `/cms/projects/{id}`. Not Voice. Not the website assistant
   overlay. Cover is Pick from the media library. (2026-08-29)

7. **Description patches are Ask first** — Inline diff of **all** unapproved
   hunks (red deletion, green insertion) until **Apply** / **Reject**. A further
   orb adds a hunk. Do not paint **Not applied**. (2026-08-29)

8. **Cover overlay thumbs keep their ratio** — Same thumbs as `/cms/media`:
   landscape, square, and portrait; 2 columns on a narrow screen; 3 then 4 on a
   wide screen when there are more than ten. Dozens of photos. **Upload** is the
   tile, not a drop prompt. (2026-08-29)
