import type { PublicComponentFixture } from "../../types";
import type { HeroImageProps } from "./schema";

export const heroImageFixtures = [
  {
    name: "Contractor hero with project image",
    props: {
      eyebrow: "Waterford & South East Ireland",
      headline: "You Dream,",
      emphasizedHeadline: "We Build.",
      subheadline: "New builds, extensions, renovations, and shop fit-outs",
      primaryCta: {
        label: "Plan my project",
        href: "/quote",
      },
      secondaryCta: {
        label: "087 998 28 64",
        href: "tel:+353879982864",
      },
      image: {
        src: "/fixtures/bellfield/construction-site.jpg",
        alt: "Construction site for a residential build",
      },
      proofItems: [
        { value: "5th", label: "Generation Trade" },
        { value: "100+", label: "Projects Completed" },
        { value: "15", label: "Trade Specialists" },
        { value: "4", label: "Accreditations" },
      ],
    },
  },
] satisfies PublicComponentFixture<HeroImageProps>[];
