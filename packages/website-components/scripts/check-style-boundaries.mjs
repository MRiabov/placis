import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const packageRoot = new URL("..", import.meta.url).pathname;

const checks = [
  {
    label: "source-site selector names",
    pattern: /(?:bellfield-|--bellfield|bellfield_|public-pcl-|--pcl|pcl_)/i,
  },
  {
    label: "palette-named section skins",
    pattern: /public-section-panel--(?:white|cream|navy)\b/,
  },
  {
    label: "theme selectors in the base component stylesheet",
    pattern: /public-theme-navy-cream/,
    only: (filePath) => filePath === join(packageRoot, "src/styles.css"),
  },
];

const scanRoots = [
  join(packageRoot, "src/registry"),
  join(packageRoot, "src/styles.css"),
];

async function collectFiles(path) {
  if (path.endsWith(".css") || path.endsWith(".tsx") || path.endsWith(".ts")) {
    return [path];
  }

  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isDirectory() ||
          entry.name.endsWith(".css") ||
          entry.name.endsWith(".tsx") ||
          entry.name.endsWith(".ts"),
      )
      .map((entry) => collectFiles(join(path, entry.name))),
  );
  return files.flat();
}

const files = (await Promise.all(scanRoots.map(collectFiles))).flat();
const failures = [];

for (const filePath of files) {
  const source = await readFile(filePath, "utf8");
  const relPath = relative(packageRoot, filePath);

  for (const check of checks) {
    if (check.only && !check.only(filePath)) {
      continue;
    }

    const match = source.match(check.pattern);
    if (!match) {
      continue;
    }

    const line = source.slice(0, match.index).split("\n").length;
    failures.push(`${relPath}:${line} ${check.label}: ${match[0]}`);
  }
}

if (failures.length > 0) {
  console.error(
    [
      "Public component style boundary check failed.",
      "Keep source-site styling in src/themes/** and keep renderer classes semantic.",
      "",
      ...failures,
    ].join("\n"),
  );
  process.exit(1);
}
