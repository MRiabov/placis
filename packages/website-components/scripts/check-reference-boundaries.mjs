import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const packageRoot = new URL("..", import.meta.url).pathname;
const blueprintRoot = join(packageRoot, "src/blueprints");
const registryRoot = join(packageRoot, "src/registry");
const themesRoot = join(packageRoot, "src/themes");

const genericReferenceTokens = new Set([
  "co",
  "company",
  "construction",
  "developments",
  "army",
  "beach",
  "club",
  "corps",
  "department",
  "front",
  "great",
  "inc",
  "limited",
  "ltd",
  "marine",
  "navy",
  "place",
  "project",
  "projects",
  "street",
  "west",
  "work",
]);

const forbiddenAffinityTokens = new Set([
  "builder",
  "commercial",
  "contractor",
  "corporate",
  "enterprise",
  "large",
  "larger",
  "residential",
  "small",
  "smb",
  "solo",
  "trade",
]);

function normalizeTokens(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !genericReferenceTokens.has(token));
}

function compactTokens(value) {
  const tokens = normalizeTokens(value);
  return tokens.length > 1 ? [tokens.join("")] : [];
}

function modelledAfterAliases(value) {
  if (value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  return value;
}

function containsForbiddenToken(value, tokens) {
  const normalized = normalizeTokens(value);
  return normalized.find((token) => tokens.has(token));
}

async function collectFiles(root, predicate, out = []) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(path, predicate, out);
    } else if (predicate(path)) {
      out.push(path);
    }
  }
  return out;
}

function addValueCheck(failures, filePath, label, value, tokens) {
  if (typeof value !== "string" || value.length === 0) {
    return;
  }
  const token = containsForbiddenToken(value, tokens);
  if (token) {
    failures.push(
      `${relative(packageRoot, filePath)} ${label} contains forbidden token ${JSON.stringify(token)} in ${JSON.stringify(value)}`,
    );
  }
}

const blueprintFiles = await collectFiles(
  blueprintRoot,
  (path) => path.endsWith("blueprint.json"),
);
const sourceTokens = new Set();
const failures = [];

for (const filePath of blueprintFiles) {
  const blueprint = JSON.parse(await readFile(filePath, "utf8"));
  if (!Object.hasOwn(blueprint, "modelled_after")) {
    failures.push(
      `${relative(packageRoot, filePath)} missing nullable modelled_after alias array`,
    );
    continue;
  }
  const aliases = modelledAfterAliases(blueprint.modelled_after);
  if (aliases === null) {
    failures.push(
      `${relative(packageRoot, filePath)} modelled_after must be null or an array of source aliases`,
    );
    continue;
  }
  for (const alias of aliases) {
    if (typeof alias !== "string" || alias.trim().length === 0) {
      failures.push(
        `${relative(packageRoot, filePath)} modelled_after aliases must be non-empty strings`,
      );
      continue;
    }
    for (const token of normalizeTokens(alias)) {
      sourceTokens.add(token);
    }
    for (const token of compactTokens(alias)) {
      sourceTokens.add(token);
    }
  }
}

const forbiddenTokens = new Set([...forbiddenAffinityTokens, ...sourceTokens]);

for (const filePath of blueprintFiles) {
  const blueprint = JSON.parse(await readFile(filePath, "utf8"));
  addValueCheck(failures, filePath, "blueprint id", blueprint.id, forbiddenTokens);
  addValueCheck(failures, filePath, "blueprint name", blueprint.name, forbiddenTokens);
  addValueCheck(
    failures,
    filePath,
    "blueprint description",
    blueprint.description,
    forbiddenTokens,
  );
  addValueCheck(failures, filePath, "theme", blueprint.theme, forbiddenTokens);
  addValueCheck(
    failures,
    filePath,
    "affinity_group",
    blueprint.affinity_group,
    forbiddenTokens,
  );
  for (const companion of blueprint.companion_blueprints ?? []) {
    addValueCheck(
      failures,
      filePath,
      "companion_blueprints[]",
      companion,
      forbiddenTokens,
    );
  }
  for (const form of blueprint.forms ?? []) {
    addValueCheck(failures, filePath, "form_id", form.form_id, forbiddenTokens);
  }
}

const blueprintDocs = await collectFiles(
  blueprintRoot,
  (path) => path.endsWith("BLUEPRINT.md"),
);
for (const filePath of blueprintDocs) {
  const source = await readFile(filePath, "utf8");
  const token = containsForbiddenToken(source, forbiddenTokens);
  if (token) {
    failures.push(
      `${relative(packageRoot, filePath)} blueprint guidance contains forbidden token ${JSON.stringify(token)}`,
    );
  }
}

const packageJsonPath = join(packageRoot, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
for (const key of Object.keys(packageJson.exports ?? {})) {
  addValueCheck(failures, packageJsonPath, "package export", key, forbiddenTokens);
}

const registryFiles = await collectFiles(
  registryRoot,
  (path) =>
    path.endsWith("contract.json") ||
    path.endsWith("component.tsx") ||
    path.endsWith("docs.md"),
);
for (const filePath of registryFiles) {
  const relPath = relative(packageRoot, filePath);
  const pathToken = containsForbiddenToken(relPath, forbiddenTokens);
  if (pathToken) {
    failures.push(
      `${relPath} path contains forbidden token ${JSON.stringify(pathToken)}`,
    );
  }
  if (filePath.endsWith("contract.json")) {
    const contract = JSON.parse(await readFile(filePath, "utf8"));
    addValueCheck(failures, filePath, "component id", contract.id, forbiddenTokens);
    addValueCheck(failures, filePath, "family", contract.family, forbiddenTokens);
    addValueCheck(failures, filePath, "variant", contract.variant, forbiddenTokens);
    addValueCheck(
      failures,
      filePath,
      "display_name",
      contract.display_name,
      forbiddenTokens,
    );
  }
}

const themeFiles = await collectFiles(
  themesRoot,
  (path) => path.endsWith("index.ts") || path.endsWith("style.css"),
);
for (const filePath of themeFiles) {
  const relPath = relative(packageRoot, filePath);
  const pathToken = containsForbiddenToken(relPath, forbiddenTokens);
  if (pathToken) {
    failures.push(
      `${relPath} path contains forbidden token ${JSON.stringify(pathToken)}`,
    );
  }

  const source = await readFile(filePath, "utf8");
  for (const match of source.matchAll(
    /(?:id|label|cssClass|preset):\s*"([^"]+)"/g,
  )) {
    addValueCheck(failures, filePath, "theme preset field", match[1], forbiddenTokens);
  }
  for (const match of source.matchAll(/\.public-theme-([a-z0-9-]+)/g)) {
    addValueCheck(
      failures,
      filePath,
      "theme css class",
      `public-theme-${match[1]}`,
      forbiddenTokens,
    );
  }
}

if (failures.length > 0) {
  console.error(
    [
      "Public reference boundary check failed.",
      "Keep source brands and company-size/business-type affinity out of reusable blueprint, component, and theme identifiers.",
      "Put source provenance in the nullable blueprint modelled_after alias array and source metadata instead.",
      "",
      ...failures,
    ].join("\n"),
  );
  process.exit(1);
}
