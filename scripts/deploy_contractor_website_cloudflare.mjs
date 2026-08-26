#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = resolve(repoRoot, "apps/contractor-website");
const validEnvironments = new Set(["staging", "production"]);
const cloudflareCredentialNames = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [environment = "staging", ...flags] = args;
const dryRun = flags.includes("--dry-run");
const noBuild = flags.includes("--no-build");
const skipVarUpload = flags.includes("--skip-var-upload") || dryRun;

if (!validEnvironments.has(environment)) {
  console.error(
    "Usage: node scripts/deploy_contractor_website_cloudflare.mjs <staging|production> [--dry-run] [--no-build] [--skip-var-upload]",
  );
  process.exit(1);
}

for (const envPath of [
  resolve(repoRoot, ".env"),
  resolve(repoRoot, ".env.local"),
  resolve(appDir, ".env"),
  resolve(appDir, ".env.local"),
]) {
  loadDotEnv(envPath);
}

const apiBaseUrl = process.env.PUBLIC_SITE_API_BASE_URL ?? process.env.PLACIS_API_BASE_URL;

if (!apiBaseUrl) {
  console.error(
    "Set PUBLIC_SITE_API_BASE_URL or PLACIS_API_BASE_URL in the environment, repo .env, or apps/contractor-website/.env before deploying.",
  );
  process.exit(1);
}

if (!dryRun) {
  const missingCloudflareCredentials = cloudflareCredentialNames.filter(
    (name) => !process.env[name],
  );
  if (missingCloudflareCredentials.length > 0) {
    console.error(
      `Missing Cloudflare deploy credentials: ${missingCloudflareCredentials.join(", ")}.`,
    );
    process.exit(1);
  }
}

if (!noBuild) {
  run("pnpm", ["--dir", appDir, "build"]);
}

if (!skipVarUpload) {
  putSecret("PUBLIC_SITE_API_BASE_URL", apiBaseUrl);
  putSecret("PLACIS_API_BASE_URL", process.env.PLACIS_API_BASE_URL ?? apiBaseUrl);
}

const deployArgs = [
  "--dir",
  appDir,
  "exec",
  "wrangler",
  "deploy",
  "--env",
  environment,
  "--minify",
];
if (dryRun) {
  deployArgs.push("--dry-run");
}
run("pnpm", deployArgs);

function putSecret(name, value) {
  run(
    "pnpm",
    ["--dir", appDir, "exec", "wrangler", "secret", "put", name, "--env", environment],
    {
      input: `${value}\n`,
    },
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
    input: options.input,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function loadDotEnv(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex === -1) {
      continue;
    }

    const name = line.slice(0, delimiterIndex).trim().replace(/^export\s+/, "");
    const value = stripQuotes(line.slice(delimiterIndex + 1).trim());
    process.env[name] ??= value;
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
