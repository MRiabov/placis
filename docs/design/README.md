# Design mocks

Static HTML for The CMS. Open [cms.html](cms.html) in a browser; there is no build.

The yellow strip is mock-only **per-screen states** (copy-out blocked, assistant collapsed, Ask first pending, and so on). Product destinations are the left nav. Default **collapsed** (circle in the top right). Open with `?dev=1`. Hide entirely with `?shot=1`.

- [cms.html](cms.html) — markup
- [cms.css](cms.css) — look
- [cms.js](cms.js) — mock-only scene wiring (not product UI)

The mock is visual. Function is the specs ([CMS](../general-architecture/cms/README.md),
[website](../features/website/README.md),
[business profile](../features/business-profile/README.md)); when they disagree, the specs win.
Tokens: [CMS design.md](../general-architecture/cms/design.md).

Layout and spacing match `frontend-2`. Visible words follow [glossary.md](../glossary.md). The canvas is a fake homepage, not the contractor website renderer.

Ads mock (this pass): [ads-workspace.html](../features/ads/ad-generation/design/ads-workspace.html).

TODO: consolidate that Ads mock here as `ads.html` (share CMS tokens; not a restyle). A later standalone `demo.placis.com` repo is out of this tree.
