import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const roots = [
  join(repoRoot, "apps/contractor-website"),
  join(repoRoot, "packages/website-components"),
];

const sourceExtensions = new Set([".astro", ".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const forbiddenPatterns = [
  {
    pattern: /from\s+["']@placis\/frontend-2["']/,
    reason: "contractor website must not import frontend-2",
  },
  {
    pattern: /from\s+["'][^"']*frontend-2\/src[^"']*["']/,
    reason: "contractor website must not import frontend-2 source",
  },
  {
    pattern: /from\s+["']@placis\/frontend["']/,
    reason: "contractor website must not import the predecessor frontend package",
  },
  {
    pattern: /from\s+["'][^"']*frontend\/src[^"']*["']/,
    reason: "contractor website must not import predecessor frontend source",
  },
  {
    pattern: /from\s+["'][^"']*components\/ui[^"']*["']/,
    reason: "website components must not import shadcn CMS UI",
  },
  {
    pattern: /from\s+["'][^"']*kibo-ui[^"']*["']/,
    reason: "website components must not import Kibo CMS components",
  },
  {
    pattern: /from\s+["'](?:@\/|.*\/)(?:views|components)\/(?:Dashboard|Preview|Support|Setup|VoiceAdmin|Automations|Calendar|Jobs|Quotes|Invoices)/,
    reason: "contractor website must not import dashboard or website editor modules",
  },
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["dist", "node_modules", ".astro"].includes(entry.name)) {
        return [];
      }
      return walk(path);
    }
    return [path];
  });
}

function extension(path) {
  const match = path.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
}

const failures = [];
for (const root of roots) {
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    failures.push(`${relative(repoRoot, root)} does not exist`);
    continue;
  }
  for (const file of walk(root)) {
    if (!sourceExtensions.has(extension(file))) {
      continue;
    }
    const contents = readFileSync(file, "utf8");
    for (const { pattern, reason } of forbiddenPatterns) {
      if (pattern.test(contents)) {
        failures.push(`${relative(repoRoot, file)}: ${reason}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Contractor website bundle-boundary check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Contractor website bundle-boundary check passed.");
