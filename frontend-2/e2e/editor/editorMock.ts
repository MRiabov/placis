import type { Page } from "@playwright/test";

const pageId = "page-home";

/** Compact page projection matching the port's CmsPageProjection shape. */
const pageProjection = {
  assets: [],
  forms: [],
  navigation: [],
  page: {
    current_version_id: "version-home",
    current_version_number: 1,
    id: pageId,
    page_type: "home",
    path: "/",
    publish_blocker_count: 0,
    published_version_id: null,
    published_version_number: null,
    status: "draft",
    title: "Bellfield test home",
    updated_at: "2026-06-27T00:00:00Z",
    validation_status: "passed",
  },
  sections: [
    {
      component_family: "services",
      component_id: "public.services.tabs",
      component_schema_version: 1,
      component_variant: "tabs",
      component_version: null,
      design: {},
      design_controls: [],
      id: "section-services",
      metadata: {},
      page_id: pageId,
      position: 1,
      props: {},
      slots: [
        {
          id: "slot-services-title",
          key: "title",
          label: "Title",
          max_length: null,
          required: false,
          status: "draft",
          type: "text",
          value: { value: "Services Tabs" },
        },
      ],
      status: "draft",
      tenant_slug: "bellfield",
      visible: true,
    },
  ],
  seo: {
    title: "Bellfield Construction — Waterford",
    description: "Residential construction across Waterford.",
  },
  tenant: {
    id: "tenant-bellfield",
    name: "Bellfield Construction",
    slug: "bellfield",
  },
  validation: { errors: [], warnings: [] },
  versions: [],
} as const;

function newSection(index: number, componentId = "public.hero.split") {
  return {
    component_family: "hero",
    component_id: componentId,
    component_schema_version: 1,
    component_variant: null,
    component_version: null,
    design: {},
    design_controls: [],
    id: `section-${index}`,
    metadata: {},
    page_id: pageId,
    position: index,
    props: {},
    slots: [
      {
        id: `slot-${index}-title`,
        key: "title",
        label: "Title",
        max_length: null,
        required: false,
        status: "draft",
        type: "text",
        value: { value: componentId.includes("trust") ? "Trust Hero needs content" : "Hero Title" },
      },
    ],
    status: "draft",
    tenant_slug: "bellfield",
    visible: true,
  };
}

/** Stub the port's CMS editor API surface. */
export async function stubEditorApi(page: Page): Promise<void> {
  let projection = JSON.parse(JSON.stringify(pageProjection));

  function withSections(sections: unknown[]) {
    return { ...projection, sections };
  }

  await page.route("**/api/v1/me", (route) =>
    route.fulfill({
      json: {
        platform_role: "platform_admin",
        selected_org_slug: "bellfield",
      },
    }),
  );
  await page.route("**/api/v1/me/orgs", (route) =>
    route.fulfill({
      json: [{ name: "Bellfield Construction", slug: "bellfield" }],
    }),
  );
  await page.route("**/api/v1/website/editor/business-profile", (route) =>
    route.fulfill({
      json: {
        business_location: "Unit 4, Waterford Business Park",
        business_name: "Bellfield Construction",
        company_number: "123456",
        created_at: "2026-01-01T00:00:00Z",
        description:
          "Residential construction, extensions, and refurbishment projects.",
        email: "hello@bellfield.example",
        established_year: 2016,
      },
    }),
  );
  await page.route("**/api/v1/website/editor/pages", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        json: {
          items: [
            {
              ...projection.page,
              current_version_id: "version-home",
              id: pageId,
              page_type: "home",
              path: "/",
              publish_blocker_count: 0,
              published_version_id: null,
              published_version_number: null,
              status: "draft",
              title: "Bellfield test home",
              updated_at: "2026-06-27T00:00:00Z",
              validation_status: "passed",
            },
          ],
          next_cursor: null,
        },
      });
    }
    return route.fulfill({ json: projection });
  });
  await page.route(`**/api/v1/website/editor/pages/${pageId}`, (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return route.fulfill({ json: projection });
    }
    const body = route.request().postDataJSON?.();
    if (method === "POST" && route.request().url().includes("/publish")) {
      projection = { ...projection, page: { ...projection.page, status: "published" } };
      return route.fulfill({ json: projection });
    }
    if (method === "POST" && body) {
      return route.fulfill({ json: { ...projection, ...body } });
    }
    return route.fulfill({ json: projection });
  });
  await page.route(
    `**/api/v1/website/editor/pages/${pageId}/sections`,
    (route) => {
      if (route.request().method() !== "POST") {
        return route.fulfill({ json: { items: projection.sections } });
      }
      const body = route.request().postDataJSON?.() ?? {};
      const sections = [
        ...projection.sections,
        newSection(projection.sections.length + 1, body.component_id),
      ];
      projection = withSections(sections);
      return route.fulfill({ json: projection });
    },
  );
  await page.route(
    `**/api/v1/website/editor/pages/${pageId}/sections/*`,
    (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === "DELETE") {
        const sectionId = url.split("/").at(-1);
        projection = withSections(
          projection.sections.filter(
            (section: { id: string }) => section.id !== sectionId,
          ),
        );
        return route.fulfill({ json: projection });
      }
      return route.fulfill({ json: projection });
    },
  );
  await page.route(
    `**/api/v1/website/editor/pages/${pageId}/sections/order`,
    (route) => {
      const body = route.request().postDataJSON?.() ?? {};
      const order = (body.section_ids ?? []) as string[];
      const reordered = order
        .map((id) => projection.sections.find((section: { id: string }) => section.id === id))
        .filter(Boolean);
      projection = withSections(reordered);
      return route.fulfill({ json: projection });
    },
  );
  await page.route("**/api/v1/website/editor/assets", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ json: { items: projection.assets ?? [] } });
    }
    const body = route.request().postDataJSON?.() ?? {};
    const asset = {
      alt_text: body.alt_text ?? null,
      asset_type: "image",
      can_remove: true,
      can_replace: true,
      created_at: "2026-06-27T00:00:00Z",
      id: "asset-uploaded",
      preview_url: body.source_url ?? "https://assets.example/bellfield/upload.jpg",
      provenance: body.provenance ?? {},
      review_status: "pending_review",
      source: body.source ?? "upload",
      source_url: body.source_url ?? "https://assets.example/bellfield/upload.jpg",
      status: "ready",
    };
    return route.fulfill({ json: asset });
  });
  await page.route("**/api/v1/website/editor/files/uploads", (route) =>
    route.fulfill({
      json: {
        category: "cms_media_asset",
        content_type: "image/jpeg",
        created_at: "2026-06-27T00:00:00Z",
        filename: "roof-upload.jpg",
        id: "file-upload-1",
        metadata: {},
        status: "pending_upload",
        tenant_slug: "bellfield",
      },
    }),
  );
  await page.route("**/api/v1/website/editor/files/*/signed-url", (route) =>
    route.fulfill({
      json: {
        expires_in_seconds: 900,
        fields: {},
        method: "PUT",
        url: "https://storage.local/upload/bellfield/roof-upload.jpg",
      },
    }),
  );
  await page.route("**/api/v1/website/editor/files/*/complete", (route) =>
    route.fulfill({
      json: {
        category: "cms_media_asset",
        content_type: "image/jpeg",
        created_at: "2026-06-27T00:00:00Z",
        filename: "roof-upload.jpg",
        id: "file-upload-1",
        metadata: {
          public_url: "https://assets.example/bellfield/upload.jpg",
        },
        public_url: "https://assets.example/bellfield/upload.jpg",
        status: "uploaded",
        tenant_slug: "bellfield",
      },
    }),
  );
  await page.route(`**/api/v1/website/editor/pages/${pageId}/assistant`, (route) =>
    route.fulfill({
      json: {
        activity: [],
        applied: false,
        assumptions: [],
        mode: "plan",
        open_questions: [],
        plan_markdown: "## Plan\n- Add an emergency callout to the hero",
        reply: "Here is a plan to focus the homepage on emergency callouts.",
      },
    }),
  );
}
