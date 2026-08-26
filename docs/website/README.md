# Website design

Static HTML for The CMS. Open [design/cms.html](design/cms.html) in a browser; there is no build.

The yellow strip is mock-only **per-screen states** (copy-out blocked, assistant collapsed, Ask first pending, and so on). Product destinations are the left nav. Hide the strip with `?shot=1`.

- [design/cms.html](design/cms.html) — markup
- [design/cms.css](design/cms.css) — look
- [design/cms.js](design/cms.js) — mock-only scene wiring (not product UI)

The mock is visual. Function is the website and details specs ([features/website](../features/website/README.md),
[features/other/details](../features/other/details/README.md)); when they disagree, the specs win.

Layout and spacing match `frontend-2`. Visible words follow [glossary.md](../glossary.md). The canvas is a fake homepage, not the contractor website renderer.

Product specs: [features/website](../features/website/README.md). Ads mock: [ads-workspace.html](../features/ads/ad-generation/design/ads-workspace.html).
