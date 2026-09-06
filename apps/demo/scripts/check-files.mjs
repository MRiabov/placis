#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Look-export shim (demo.placis.com has no Go). Parent CI is
// cmd/ci/check-file-size. Decision: docs/general-architecture/ci-cd.md.
const maxLines = 800;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
      continue;
    }
    if (/\.(?:[cm]?[jt]sx?|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(root);
const over = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  const lines = text.split(/\r?\n/).length;
  if (lines > maxLines) {
    over.push(`${path.relative(root, file)}: ${lines} lines (max ${maxLines})`);
  }
}

if (over.length > 0) {
  for (const line of over) {
    console.error(line);
  }
  process.exit(1);
}

await stat(root);
console.log(`check-files: ${files.length} files under ${maxLines} lines`);
