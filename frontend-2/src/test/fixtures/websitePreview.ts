/**
 * Bellfield Construction — a compact `public_site_manifest.v1` website preview
 * used by the MSW fixtures and the parity harness. Mirrors the shape the
 * backend returns from `GET /api/v1/preview/{token}/module/website`.
 */
const websitePreviewManifest = {
  manifest_version: "public_site_manifest.v1",
  route: "/",
  title: "Bellfield Construction",
  theme: "public-theme-timbermill-classic",
  pages: [
    {
      id: "home",
      page_type: "home",
      path: "/",
      title: "Bellfield Construction — Home",
      sections: [
        {
          component_id: "public.hero.image",
          props: {
            headline: "Bellfield Construction",
            subheadline: "Trusted builders for Dublin homes",
            cta_label: "Get a quote",
            cta_link: "/contact",
          },
          design: {},
        },
        {
          component_id: "public.services_grid",
          props: {
            title: "What we build",
            items: [
              { title: "Extensions", description: "Side and rear extensions" },
              { title: "Renovations", description: "Full home renovations" },
            ],
          },
          design: {},
        },
      ],
    },
  ],
  navigation: [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services" },
  ],
  seo: {
    title: "Bellfield Construction",
    description: "Trusted builders for Dublin homes.",
  },
} as const;

export const websitePreviewModuleFixture = {
  preview_package_id: "preview-package-1",
  module: "website",
  manifest: websitePreviewManifest,
  entry_link: "/preview/preview-token/website",
  sandboxed: true,
} as const;

export const claimCheckoutFixture = {
  url: "https://checkout.stripe.test/session-1",
  provider: "stripe",
  amount: 4900,
  currency: "EUR",
  status: "created",
  message: "Checkout created.",
  payment_proof: null,
} as const;

export const claimActionResponseFixture = {
  status: "claim_started",
  message: "Tenant claim started.",
} as const;

export const activationStartedFixture = {
  status: "activation_started",
  message: "Activation started.",
} as const;

export const claimStatusFixture = {
  id: "claim-1",
  preview_package_id: "preview-package-1",
  user_id: "user-1",
  provider: "stripe",
  status: "checkout_pending",
  amount: 4900,
  currency: "EUR",
} as const;
