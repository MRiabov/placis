# Frontend stack

`frontend-3` is the owner CMS and onboarding app. Types come from the
served `/openapi.json` (`openapi-typescript` + `openapi-fetch`).
Predecessor OpenAPI is not a typegen source.

Greenfield. Delete `frontend-2/` before the first owner-UI
implementation. Do not open `frontend-2`, copy from it, or use it as a
reference. [ADR](ADR.md) 3. Withdrawn port lists:
[planning/frontend-debloat.md](../planning/frontend-debloat.md). UI
rules: [frontend.md](frontend.md). Look:
[`apps/demo/`](../../apps/demo/README.md).

`frontend-3` is a **thin typed wrapper** over Go. Screens bind generated
OpenAPI types (`src/generated/` + `openapi-fetch` in `src/shared/api.ts`).
Policy, caps, auth modes, 402, allowlists, and writes live in Go. Do not
add a third TypeScript model layer, TypeScript copies of pipeline Dos,
or HTTP that is not in a feature `api.md`. TanStack Query caches fetches;
it is not a second business layer. Look (`apps/demo`) stays mock-only.

| Layer | Choice |
| --- | --- |
| App | Vite + React |
| Routing / data | TanStack Router / Query |
| Auth | Clerk |
| API types | `openapi-typescript` from `/openapi.json`; `openapi-fetch` + Clerk token in `src/shared/api.ts` |
| Folders | `src/generated/`, `src/shared/`, `src/styles/`, `src/features/`, `src/routes/` |

Keep `src/features/` (deliberate). Do not flatten into one screens tree.
Do not copy modules from `frontend-2`. [ADR](ADR.md) 3.

Website preview (the unpaid website editor) is
`/onboarding/preview-and-edit/` in `frontend-3`. The preview website
address is `apps/contractor-website`
([website Cloudflare](../features/website/cloudflare.md)): static HTML in
R2, same app as live. `/onboarding/preview` is the wait carousel in this
app, then the browser navigates to `/onboarding/preview-and-edit/`.

The file-size guard and folder fan-out apply to `frontend-3` too
([CI and delivery](ci-cd.md)): a nested dir under `src/` may hold at most
**9** entries (tracked files + child dirs); `src/` root may hold at most
**15**. **Exclude `*.test.*`**. Nest only when necessary: a `.tsx` file
in the parent until ~800 or a real split. Folder names are glossary
terms (hyphenated). No `pipeline/`, `service/`, `knowledge/`,
`infrastructure/`, or `shared/components/` on the SPA. `generated/` is
the huma DTO layer (do not hand-write `dto.ts` or hand-split that dump at
800). HTTP I/O is `src/shared/api.ts`; nest to `shared/api/` only at
~800. Feature folders do not grow a second openapi-fetch client.
`src/routes/` are thin TanStack file routes that **import** feature
screens.

**Import DAG:** onboarding **imports** `cms/` (mostly **Profile**).
`cms/` does not import onboarding.

## `src/` tree

```text
frontend-3/src/
  generated/                          # openapi-typescript; do not edit
  shared/
    api.ts                            # openapi-fetch + Clerk token; nest to api/ if it grows
    auth/                             # Clerk; Sign up
    ui/                               # second-caller controls; not a dump
  styles/
    theme.css                         # CMS tokens (copy from apps/demo; cms/design.md wins)
  features/
    onboarding/
      layout.tsx                      # Find / Review / client interview shared layout
      find/
      review/
      client-interview/               # Details imported from cms/profile/details
      wait-teaser/                    # route /onboarding/preview
      website-preview/                # onboarding website editor: route + workspace
      assistant/                      # Onboarding assistant (Find / Review / client interview)
    cms/
      layout/                         # The CMS (sidebar + main area): Sites, Profile, Ads, Leads
                                      # notification.tsx (onboarding imports this)
      assistant/                      # CMS Assistant (website preview **imports** this)
      website/
        WebsiteEditor.tsx
        canvas.tsx                    # website editor canvas (stage)
        publish.tsx                   # Publish + Connect website address
        workspace/                    # CMS website editor workspace (not on the website editor canvas)
                                      # content/ TBD; composes cms/assistant
      profile/                        # Profile (disclosure; no /cms/profile route)
        details/
        projects/
        certifications/               # ticks; composed on /cms/certifications-and-reviews
        reviews/                      # pool / top reviews; same screen
        media/                        # media library (/cms/media)
      ads/
        list.tsx                      # Ad list + Connect; Archive disclosure
        workspace.tsx                 # ad workspace (About the ad + Review); not website editor workspace
        detail.tsx                    # existing ad; Edit opens workspace
      leads/
      billing/                        # Usage & billing (account menu)
  routes/
```

`src/` root = **5**. `shared/` = **3** (`api.ts`, `auth/`, `ui/`).
`onboarding/` = **7**. `cms/` = **7**. `website/` = **4**. `profile/` =
**5**. `ads/` = **3**. Deeper files: feature `file-trees.md` (website
workspace rail + Content union; `shared/ui/` stays DustOrb until a
second caller).

## `shared/ui/` admission

Tokens live in `src/styles/theme.css`. Canonical values:
[CMS design.md](cms/design.md). Look iterates in
[`apps/demo/src/styles/theme.css`](../../apps/demo/src/styles/theme.css).
`frontend-3` has **one** `src/styles/theme.css` (same CSS variables; copy
from demo when tokens change; specs win on conflict). Do not fork a
`styles/cms/` dump. Website editor canvas paint is website styles +
`packages/website-components`, not these CMS tokens. Do not import
`apps/demo`. Copy the pattern into `frontend-3` when that app exists. Do
not seed a 21-file `shared/ui/` dump in this docs pass.

A control is extracted the way a querier is shared: **second real
caller**, same **interaction**, not similar CSS.

| Home | Test | Examples |
| --- | --- | --- |
| `src/shared/ui/` | Same control, ≥2 callers | DustOrb; **inline AI assistance** (glossary; not demo `PromptOrb`); `Button` (including `variant="danger"` for detail Archive); Field; `card()` / prompt-card **classes**; Archive **disclosure** (chevron + region; children stay in the feature); Combo if Find / Ads / Content share the same control |
| Owner feature, one-way | Same module on two routes | Details hours / services / areas: `cms/profile/details/` → client interview ([onboarding ADR 19](../features/onboarding/ADR.md)). Media library thumbs / cover pick: `cms/profile/media/` → Ads, Projects, Content, onboarding |
| Stay in the feature | Same tokens, different innards | Ads vs Projects **cards** (performance strip, compact rows). Format pills, ad format preview. Project Ask-first **diff**. `cms/assistant/` (not `ui/CmsAssistant`) |

Never: `cms/ads` importing `cms/profile/projects` or the reverse **for
look**. No `ListCard` flags. No `ArchiveButton`. No `cms/components/`
kit. Demo `ui/` putting HoursPicker / FeaturedServices in the shared
layer is the anti-pattern; those stay Details.

Loading placeholders: already in [frontend.md](frontend.md); a class on
the waiting field/row/slot, not a loading-placeholder folder in `shared/ui/`.

**Website editor canvas** vs **website editor workspace** (Internal;
[website ADR](../features/website/ADR.md) 33): the website editor canvas is only the painted unpublished
website page. Workspace is every editing control that is not that stage. Both
the CMS website editor and the onboarding website editor have a workspace.
Workspace is never a child of the website editor canvas.

- **CMS** (`/cms/website/{website_prefix}`): workspace = rail (website
  pages, SEO, website styles, website versions), **Content**
  (`cms/website/workspace/content/`), click-to-edit, Assistant UI.
  Content replaces the rail list on a website editor canvas click. Files:
  [website file trees](../features/website/file-trees.md).
- **Onboarding** (`/onboarding/preview-and-edit/`): workspace = Assistant UI,
  website-activation strip, Share, custom website-page switcher. No Content, no
  website styles rail, no click-to-edit. Website-page switcher and Share may sit
  on website editor canvas **corners**; they are still workspace. Lives in
  `onboarding/website-preview/` (composes `cms/website/canvas.tsx` +
  `cms/assistant/`).

**Ads:** three surfaces — Ad list (`/cms/ads`), **ad workspace**
(`/cms/ads/new` and Edit; not website editor workspace), Ad detail
(`/cms/ads/{id}`). Review is step 2 of the accordion, not a route. Look
mock **My ads / New ad / Review** is a dev scene switcher; do not ship.
Format pills and ad format preview stay in `cms/ads/`. Nest `workspace/`
at ~800.

Look stays [`apps/demo/`](../../apps/demo/README.md). Contractor HTML
[`apps/contractor-website/`](../../apps/contractor-website/README.md).
Placis site [`apps/placis-website/`](../../apps/placis-website/README.md).

## Dependencies

Same policy as the [backend stack](backend-stack.md): latest stable of
Vite, React, TanStack, Clerk, typegen, and the rest of this app’s
packages. Greenfield — do not freeze an older major in these docs. Do
not add Dependabot, Renovate, or other automated dependency PRs. Bump
`frontend-3` (and shared JS: `packages/website-components`, contractor
website, Placis website) about every two weeks as a deliberate pass.
