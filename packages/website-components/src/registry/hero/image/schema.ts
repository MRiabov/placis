export type HeroImageProps = {
  eyebrow?: string;
  headline: string;
  emphasizedHeadline?: string;
  subheadline?: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  image: {
    src: string;
    alt: string;
    focalPoint?: {
      x: number;
      y: number;
    };
  };
  proofItems?: {
    value: string;
    label: string;
  }[];
};
