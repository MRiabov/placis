#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const stylesRoot = path.join(srcRoot, "styles");
const hex = /#(?:[0-9a-fA-F]{3,8})\b/g;
const arbitrary = /(?:bg|text|border|ring|fill|stroke|from|to|via)-\[#/g;

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

function inStyles(file) {
  return file === stylesRoot || file.startsWith(`${stylesRoot}${path.sep}`);
}

const files = await walk(srcRoot);
const hits = [];
for (const file of files) {
  if (inStyles(file)) {
    continue;
  }
  const text = await readFile(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (hex.test(line) || arbitrary.test(line)) {
      hits.push(`${path.relative(srcRoot, file)}:${index + 1}: ${line.trim()}`);
    }
    hex.lastIndex = 0;
    arbitrary.lastIndex = 0;
  });
}

if (hits.length > 0) {
  for (const hit of hits) {
    console.error(hit);
  }
  process.exit(1);
}

console.log("check-tokens: no raw colors outside src/styles");
