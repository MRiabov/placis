import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const blueprintsRoot = fileURLToPath(
  new URL("../src/blueprints/", import.meta.url),
);

const contactFormComponentIds = new Set([
  "public.contact.form_location",
  "public.form.callback_bar",
  "public.form.lead",
  "public.form.project_planner",
  "public.hero.form",
]);

const postComponentIds = new Set([
  "public.posts.detail",
  "public.posts.list",
]);
const reviewComponentIds = new Set([
  "public.proof.review_panel",
  "public.proof.testimonials",
]);

const footerOrNavigationPattern = /^public\.(footer|navigation)\./;

function hasWord(value, words) {
  return words.some((word) =>
    new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, "i").test(value),
  );
}

function stringifyProps(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function componentId(section) {
  return section.component_id ?? section.component ?? "";
}

function pageDescriptor(page) {
  return [page.key, page.path, page.page_type, page.title]
    .filter((value) => typeof value === "string")
    .join(" ");
}

function isContactPage(page) {
  const descriptor = pageDescriptor(page);
  return (
    page.page_type === "quote_contact" ||
    page.page_type === "contact" ||
    hasWord(descriptor, ["contact"])
  );
}

function isCareerPage(page) {
  const descriptor = pageDescriptor(page);
  return (
    page.page_type === "careers" || hasWord(descriptor, ["career", "careers"])
  );
}

function isNewsPage(page) {
  const descriptor = pageDescriptor(page);
  return (
    page.page_type === "news" ||
    page.page_type === "blog" ||
    page.page_type === "blog_post" ||
    hasWord(descriptor, ["blog", "news", "post", "posts"])
  );
}

function isReviewPage(page) {
  const descriptor = pageDescriptor(page);
  return (
    page.page_type === "reviews" ||
    page.page_type === "testimonials" ||
    hasWord(descriptor, ["review", "reviews", "testimonial", "testimonials"])
  );
}

function hasContactForm(sections) {
  return sections.some((section) => contactFormComponentIds.has(componentId(section)));
}

function hasCareerContent(sections) {
  return sections.some((section) => {
    const id = componentId(section);
    if (footerOrNavigationPattern.test(id)) {
      return false;
    }

    return (
      /(^|[._-])careers?([._-]|$)/i.test(id) ||
      hasWord(stringifyProps(section.props), [
        "career",
        "careers",
        "hiring",
        "job",
        "jobs",
        "opening",
        "openings",
        "role",
        "roles",
      ])
    );
  });
}

function hasBlogPosts(sections) {
  return sections.some((section) => {
    const id = componentId(section);
    if (
      postComponentIds.has(id) ||
      /^public\.posts\./.test(id) ||
      /(^|[._-])(blog|news|posts?)([._-]|$)/i.test(id)
    ) {
      return true;
    }

    return (
      (id === "public.gallery.grid" || id === "public.gallery.poster_grid") &&
      Array.isArray(section.props?.items) &&
      section.props.items.length > 0 &&
      hasWord(stringifyProps(section.props.items), ["blog", "news", "post", "posts"])
    );
  });
}

function hasReviews(sections) {
  return sections.some((section) => {
    const id = componentId(section);
    return (
      reviewComponentIds.has(id) ||
      /(^|[._-])(reviews?|testimonials?)([._-]|$)/i.test(id)
    );
  });
}

async function findBlueprintFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findBlueprintFiles(nextPath)));
      continue;
    }

    if (entry.name === "blueprint.json") {
      files.push(nextPath);
    }
  }

  return files;
}

function formatPage({ file, blueprint, page, sections }) {
  const ids = sections.map(componentId).filter(Boolean);
  return [
    `${path.relative(blueprintsRoot, file)} (${blueprint.id ?? "unknown blueprint"})`,
    `page ${page.key ?? "(no key)"} at ${page.path ?? "(no path)"}`,
    `components: ${ids.length > 0 ? ids.join(", ") : "(none)"}`,
  ].join(" :: ");
}

const failures = [];
const counts = {
  contact: 0,
  careers: 0,
  news: 0,
  reviews: 0,
};

for (const file of (await findBlueprintFiles(blueprintsRoot)).sort()) {
  const blueprint = JSON.parse(await readFile(file, "utf8"));

  for (const page of blueprint.pages ?? []) {
    const sections = page.sections ?? [];

    if (isContactPage(page)) {
      counts.contact += 1;
      if (!hasContactForm(sections)) {
        failures.push(
          `Contact page is missing a contact form component: ${formatPage({
            file,
            blueprint,
            page,
            sections,
          })}`,
        );
      }
    }

    if (isCareerPage(page)) {
      counts.careers += 1;
      if (!hasCareerContent(sections)) {
        failures.push(
          `Careers page is missing career-rendering content: ${formatPage({
            file,
            blueprint,
            page,
            sections,
          })}`,
        );
      }
    }

    if (isNewsPage(page)) {
      counts.news += 1;
      if (!hasBlogPosts(sections)) {
        failures.push(
          `News/blog page is missing a blog-post rendering component: ${formatPage({
            file,
            blueprint,
            page,
            sections,
          })}`,
        );
      }
    }

    if (isReviewPage(page)) {
      counts.reviews += 1;
      if (!hasReviews(sections)) {
        failures.push(
          `Reviews/testimonials page is missing a review component: ${formatPage({
            file,
            blueprint,
            page,
            sections,
          })}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Blueprint intent checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Blueprint intent checks passed (contact=${counts.contact}, careers=${counts.careers}, news=${counts.news}, reviews=${counts.reviews}).`,
);
