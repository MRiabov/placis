# File trees — CMS (sidebar + main area)

Left nav, `/cms` chooser, notification. Not a product feature. Screens
live in feature `file-trees.md`. High-level:
[frontend stack](../frontend-stack.md). [frontend.md](frontend.md).
Omit `*.test.*`.

Onboarding **imports** `notification.tsx`. `cms/` does not import
onboarding.

## Frontend

```text
frontend-3/src/features/cms/layout/
  CmsLayout.tsx                     # sidebar + main area
  sidebar.tsx                       # Sites / Profile / Ads / Leads
                                    # Profile disclosure (no /cms/profile)
  overlay-selector.tsx              # narrow full-screen destinations
  chooser.tsx                       # /cms two cards
  notification.tsx                  # fixed bottom-right; onboarding imports
```

`cms/` = **7** identities at the parent (`layout/`, `assistant/`,
`website/`, `profile/`, `ads/`, `leads/`, `billing/`). Do not add
`cms/components/`.
