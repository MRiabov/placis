# public.navigation.mega_menu

## Purpose

Use for larger construction groups, franchises, or multi-location contractors
whose navigation needs top-level categories and grouped child links. It is
inspired by PCL's deep corporate header, but the contract is generic: brand, top
links, optional locale label, contact CTA, and grouped menu content.

Do not use as the default small-contractor navigation. Simpler sites should stay
on `public.navigation.standard` or `public.navigation.fixed_cta`.

The component renders static, accessible links and native disclosure groups. Any
future enhanced drawer/mega-menu behavior must preserve keyboard access, stable
mobile bounds, and no dependency on source-site selectors or scripts.
