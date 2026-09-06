import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Don't say blueprint: leftover scrap dumps
const leftoverDumpRoot = fileURLToPath(
  // Don't say blueprint: leftover scrap dumps
  new URL("../src/blueprints/", import.meta.url),
);

const contactFormComponentIds = new Set([
  "public.contact.form_location",
  "public.form.callback_bar",
  "public.form.lead",
  "public.form.project_planner",
  "public.hero.form",
]);

const reviewComponentIds = new Set([
  "public.reviews.panel",
  "public.reviews.cards",
]);

function hasWord(value, words) {
  return words.some((word) =>
    new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, "i").test(value),
  );
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

function isReviewPage(page) {
  const descriptor = pageDescriptor(page);
  return (
    page.page_type === "reviews" ||
    page.page_type === "testimonials" ||
    hasWord(descriptor, ["review", "reviews", "testimonial", "testimonials"])
  );
}

function isDeferredBlogOrCareersPage(page) {
  const pagePath = String(page.path ?? "").split("#", 1)[0];
  const key = String(page.key ?? "");
  return (
    page.page_type === "careers" ||
    page.page_type === "news" ||
    page.page_type === "blog" ||
    page.page_type === "blog_post" ||
    key === "careers" ||
    key === "news" ||
    key === "blog" ||
    pagePath === "/careers" ||
    pagePath === "/news" ||
    pagePath === "/blog" ||
    pagePath.startsWith("/careers/") ||
    pagePath.startsWith("/news/") ||
    pagePath.startsWith("/blog/")
  );
}

function hasContactForm(sections) {
  return sections.some((section) =>
    contactFormComponentIds.has(componentId(section)),
  );
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

async function findDumpFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findDumpFiles(nextPath)));
      continue;
    }

    // Don't say blueprint: leftover dump filename
    if (entry.name === "blueprint.json") {
      files.push(nextPath);
    }
  }

  return files;
}

function formatPage({ file, dump, page, sections }) {
  const ids = sections.map(componentId).filter(Boolean);
  return [
    `${path.relative(leftoverDumpRoot, file)} (${dump.id ?? "unknown dump"})`,
    `page ${page.key ?? "(no key)"} at ${page.path ?? "(no path)"}`,
    `components: ${ids.length > 0 ? ids.join(", ") : "(none)"}`,
  ].join(" :: ");
}

const failures = [];
const counts = {
  contact: 0,
  reviews: 0,
};

for (const file of (await findDumpFiles(leftoverDumpRoot)).sort()) {
  const dump = JSON.parse(await readFile(file, "utf8"));

  for (const page of dump.pages ?? []) {
    const sections = page.sections ?? [];

    if (isContactPage(page)) {
      counts.contact += 1;
      if (!hasContactForm(sections)) {
        failures.push(
          `Contact page is missing a contact form website component: ${formatPage({
            file,
            dump,
            page,
            sections,
          })}`,
        );
      }
    }

    if (isDeferredBlogOrCareersPage(page)) {
      failures.push(
        `Blog and careers website pages are deferred: ${formatPage({
          file,
          dump,
          page,
          sections,
        })}`,
      );
    }

    if (isReviewPage(page)) {
      counts.reviews += 1;
      if (!hasReviews(sections)) {
        failures.push(
          `Reviews page is missing a reviews website component: ${formatPage({
            file,
            dump,
            page,
            sections,
          })}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Leftover dump intent checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Leftover dump intent checks passed (contact=${counts.contact}, reviews=${counts.reviews}).`,
);
