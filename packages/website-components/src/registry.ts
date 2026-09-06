import type {
  LoadedPublicSiteComponent,
  PublicSiteComponentDefinition,
  PublicSiteSection,
} from "./types";
import { componentId } from "./utils";

export const publicSiteRegistry: PublicSiteComponentDefinition[] = [
  {
    id: "public.navigation.center_logo",
    family: "navigation",
    variant: "center_logo",
    load: () => import("./registry/navigation/center_logo/component"),
  },
  {
    id: "public.navigation.mega_menu",
    family: "navigation",
    variant: "mega_menu",
    load: () => import("./registry/navigation/mega_menu/component"),
  },
  {
    id: "public.hero.media_carousel",
    family: "hero",
    variant: "media_carousel",
    load: () => import("./registry/hero/media_carousel/component"),
  },
  {
    id: "public.hero.scroll_story",
    family: "hero",
    variant: "scroll_story",
    load: () => import("./registry/hero/scroll_story/component"),
  },
  {
    id: "public.content.intro_metrics",
    family: "content",
    variant: "intro_metrics",
    load: () => import("./registry/content/intro_metrics/component"),
  },
  {
    id: "public.content.system_cards",
    family: "content",
    variant: "system_cards",
    load: () => import("./registry/content/system_cards/component"),
  },
  {
    id: "public.content.image_tiles",
    family: "content",
    variant: "image_tiles",
    load: () => import("./registry/content/image_tiles/component"),
  },
  {
    id: "public.services.sector_tabs",
    family: "services",
    variant: "sector_tabs",
    load: () => import("./registry/services/sector_tabs/component"),
  },
  {
    id: "public.gallery.project_showcase",
    family: "gallery",
    variant: "project_showcase",
    load: () => import("./registry/gallery/project_showcase/component"),
  },
  {
    id: "public.media.video_feature",
    family: "media",
    variant: "video_feature",
    load: () => import("./registry/media/video_feature/component"),
  },
  {
    id: "public.footer.multi_column",
    family: "footer",
    variant: "multi_column",
    load: () => import("./registry/footer/multi_column/component"),
  },
  {
    id: "public.content.metric_mosaic",
    family: "content",
    variant: "metric_mosaic",
    load: () => import("./registry/content/metric_mosaic/component"),
  },
  {
    id: "public.navigation.fixed_cta",
    family: "navigation",
    variant: "fixed_cta",
    load: () => import("./registry/navigation/fixed_cta/component"),
  },
  {
    id: "public.hero.type_first_trust",
    family: "hero",
    variant: "type_first_trust",
    load: () => import("./registry/hero/type_first_trust/component"),
  },
  {
    id: "public.gallery.edge_grid",
    family: "gallery",
    variant: "edge_grid",
    load: () => import("./registry/gallery/edge_grid/component"),
  },
  {
    id: "public.reviews.panel",
    family: "reviews",
    variant: "panel",
    load: () => import("./registry/reviews/panel/component"),
  },
  {
    id: "public.contact.cta_panel",
    family: "contact",
    variant: "cta_panel",
    load: () => import("./registry/contact/cta_panel/component"),
  },
  {
    id: "public.footer.logo_nav",
    family: "footer",
    variant: "logo_nav",
    load: () => import("./registry/footer/logo_nav/component"),
  },
  {
    id: "public.hero.image",
    aliases: ["public.hero.v1"],
    family: "hero",
    variant: "image",
    load: () => import("./registry/hero/image/component"),
  },
  {
    id: "public.hero.overlay_title",
    family: "hero",
    variant: "overlay_title",
    load: () => import("./registry/hero/overlay_title/component"),
  },
  {
    id: "public.navigation.standard",
    family: "navigation",
    variant: "standard",
    load: () => import("./registry/navigation/standard/component"),
  },
  {
    id: "public.marquee.services",
    family: "marquee",
    variant: "services",
    load: () => import("./registry/marquee/services/component"),
  },
  {
    id: "public.hero.form",
    family: "hero",
    variant: "form",
    load: () => import("./registry/hero/form/component"),
  },
  {
    id: "public.hero.type_first",
    family: "hero",
    variant: "type_first",
    load: () => import("./registry/hero/type_first/component"),
  },
  {
    id: "public.services.grid",
    aliases: ["public.services.v1", "public.services_grid.v1"],
    family: "services",
    variant: "grid",
    load: () => import("./registry/services/grid/component"),
  },
  {
    id: "public.services.tabs",
    family: "services",
    variant: "tabs",
    load: () => import("./registry/services/tabs/component"),
  },
  {
    id: "public.services.cards",
    family: "services",
    variant: "cards",
    load: () => import("./registry/services/cards/component"),
  },
  {
    id: "public.services.simple_list",
    family: "services",
    variant: "simple_list",
    load: () => import("./registry/services/simple_list/component"),
  },
  {
    id: "public.content.intro",
    family: "content",
    variant: "intro",
    load: () => import("./registry/content/intro/component"),
  },
  {
    id: "public.content.split",
    family: "content",
    variant: "split",
    load: () => import("./registry/content/split/component"),
  },
  {
    id: "public.content.story_split",
    family: "content",
    variant: "story_split",
    load: () => import("./registry/content/story_split/component"),
  },
  {
    id: "public.content.story_text",
    family: "content",
    variant: "story_text",
    load: () => import("./registry/content/story_text/component"),
  },
  {
    id: "public.content.feature_grid",
    family: "content",
    variant: "feature_grid",
    load: () => import("./registry/content/feature_grid/component"),
  },
  {
    id: "public.statement.words",
    family: "statement",
    variant: "words",
    load: () => import("./registry/statement/words/component"),
  },
  {
    id: "public.service_area.coverage",
    family: "service_area",
    variant: "coverage",
    load: () => import("./registry/service_area/coverage/component"),
  },
  {
    id: "public.service_area.region_map_stats",
    family: "service_area",
    variant: "region_map_stats",
    load: () => import("./registry/service_area/region_map_stats/component"),
  },
  {
    id: "public.process.steps",
    family: "process",
    variant: "steps",
    load: () => import("./registry/process/steps/component"),
  },
  {
    id: "public.content.bar",
    aliases: ["public.trust.v1", "public.service_summary.v1"],
    family: "content",
    variant: "bar",
    load: () => import("./registry/content/bar/component"),
  },
  {
    id: "public.content.logo_strip",
    family: "content",
    variant: "logo_strip",
    load: () => import("./registry/content/logo_strip/component"),
  },
  {
    id: "public.content.leadership_grid",
    family: "content",
    variant: "leadership_grid",
    load: () => import("./registry/content/leadership_grid/component"),
  },
  {
    id: "public.reviews.cards",
    family: "reviews",
    variant: "cards",
    load: () => import("./registry/reviews/cards/component"),
  },
  {
    id: "public.certifications.row",
    family: "certifications",
    variant: "row",
    load: () => import("./registry/certifications/row/component"),
  },
  {
    id: "public.gallery.grid",
    aliases: ["public.gallery.v1"],
    family: "gallery",
    variant: "grid",
    load: () => import("./registry/gallery/grid/component"),
  },
  {
    id: "public.gallery.poster_grid",
    family: "gallery",
    variant: "poster_grid",
    load: () => import("./registry/gallery/poster_grid/component"),
  },
  {
    id: "public.faq.accordion",
    family: "faq",
    variant: "accordion",
    load: () => import("./registry/faq/accordion/component"),
  },
  {
    id: "public.faq.list",
    family: "faq",
    variant: "list",
    load: () => import("./registry/faq/list/component"),
  },
  {
    id: "public.form.lead",
    aliases: ["public.lead_form.v1"],
    family: "form",
    variant: "lead",
    load: () => import("./registry/form/lead/component"),
  },
  {
    id: "public.form.callback_bar",
    family: "form",
    variant: "callback_bar",
    load: () => import("./registry/form/callback_bar/component"),
  },
  {
    id: "public.form.project_planner",
    family: "form",
    variant: "project_planner",
    load: () => import("./registry/form/project_planner/component"),
  },
  {
    id: "public.cta.band",
    family: "cta",
    variant: "band",
    load: () => import("./registry/cta/band/component"),
  },
  {
    id: "public.contact.panel",
    aliases: ["public.contact_panel.v1", "public.contact.v1"],
    family: "contact",
    variant: "panel",
    load: () => import("./registry/contact/panel/component"),
  },
  {
    id: "public.contact.form_location",
    family: "contact",
    variant: "form_location",
    load: () => import("./registry/contact/form_location/component"),
  },
  {
    id: "public.footer.standard",
    family: "footer",
    variant: "standard",
    load: () => import("./registry/footer/standard/component"),
  },
  {
    id: "public.footer.centered_social_nav",
    family: "footer",
    variant: "centered_social_nav",
    load: () => import("./registry/footer/centered_social_nav/component"),
  },
  {
    id: "public.privacy.notice",
    aliases: ["public.privacy_notice.v1"],
    family: "privacy",
    variant: "notice",
    load: () => import("./registry/privacy/notice/component"),
  },
];

export function findPublicSiteComponent(
  id: string,
  registry: PublicSiteComponentDefinition[] = publicSiteRegistry,
): PublicSiteComponentDefinition | null {
  return (
    registry.find(
      (definition) => definition.id === id || definition.aliases?.includes(id),
    ) ?? null
  );
}

export async function loadPublicSiteComponents(
  sections: PublicSiteSection[],
  registry: PublicSiteComponentDefinition[] = publicSiteRegistry,
): Promise<LoadedPublicSiteComponent[]> {
  const ids = Array.from(new Set(sections.map(componentId).filter(Boolean)));
  const definitions = ids
    .map((id) => findPublicSiteComponent(id, registry))
    .filter(
      (definition): definition is PublicSiteComponentDefinition =>
        definition !== null,
    );
  const loaded = await Promise.all(
    definitions.map(async (definition) => {
      const module = await definition.load();
      return {
        aliases: definition.aliases,
        Component: module.default,
        family: definition.family,
        id: definition.id,
        variant: definition.variant,
      };
    }),
  );
  return loaded;
}
