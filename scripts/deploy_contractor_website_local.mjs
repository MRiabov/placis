#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = resolve(repoRoot, "apps/contractor-website");
const componentsDir = resolve(repoRoot, "packages/website-components");
const flags = process.argv.slice(2).filter((arg) => arg !== "--");
const dryRun = flags.includes("--dry-run");
const noBuild = flags.includes("--no-build");

for (const envPath of [
  resolve(repoRoot, ".env"),
  resolve(repoRoot, ".env.local"),
  resolve(appDir, ".env"),
  resolve(appDir, ".env.local"),
]) {
  loadDotEnv(envPath);
}

const apiBaseUrl =
  optionValue("--api-base-url") ??
  process.env.PUBLIC_SITE_API_BASE_URL ??
  process.env.PLACIS_API_BASE_URL;
const hostOverride =
  optionValue("--host-override") ?? process.env.PUBLIC_SITE_HOST_OVERRIDE;
const staticBucket =
  optionValue("--r2-bucket") ?? process.env.PLACIS_PUBLIC_SITE_STATIC_BUCKET;
const localHost = optionValue("--host") ?? process.env.PUBLIC_SITE_LOCAL_HOST ?? "127.0.0.1";
const localPort = optionValue("--port") ?? process.env.PUBLIC_SITE_LOCAL_PORT ?? "8788";

if (!apiBaseUrl) {
  console.error(
    "Set --api-base-url, PUBLIC_SITE_API_BASE_URL, or PLACIS_API_BASE_URL before running the local contractor website Worker.",
  );
  process.exit(1);
}

if (!noBuild) {
  run(componentBinary("tsc"), ["-p", resolve(componentsDir, "tsconfig.json")], {
    cwd: componentsDir,
  });
  run(appBinary("astro"), ["check"], { cwd: appDir });
  run(appBinary("astro"), ["build"], { cwd: appDir });
}

const config = {
  $schema:
    "https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/config-schema.json",
  name: "placis-contractor-website-local",
  main: resolve(appDir, "dist/_worker.js/index.js"),
  compatibility_date: "2026-06-26",
  compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"],
  assets: {
    binding: "ASSETS",
    directory: resolve(appDir, "dist"),
  },
  observability: {
    enabled: true,
    head_sampling_rate: 0.05,
  },
  vars: {
    PUBLIC_SITE_ENV: "local",
    PUBLIC_SITE_API_BASE_URL: apiBaseUrl,
    PLACIS_API_BASE_URL: process.env.PLACIS_API_BASE_URL ?? apiBaseUrl,
    CMS_STATIC_SITE_KEY_PREFIX: process.env.PLACIS_PUBLIC_SITE_STATIC_KEY_PREFIX ?? "sites",
    ...(hostOverride ? { PUBLIC_SITE_HOST_OVERRIDE: hostOverride } : {}),
  },
};

if (staticBucket) {
  config.r2_buckets = [
    {
      binding: "CMS_STATIC_SITE_BUCKET",
      bucket_name: staticBucket,
    },
  ];
}

const configPath = resolve(tmpdir(), "placis-contractor-website-local.wrangler.json");
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

const devArgs = [
  "dev",
  "--config",
  configPath,
  "--ip",
  localHost,
  "--port",
  localPort,
];

console.log(`Local contractor website Worker: http://${localHost}:${localPort}`);
if (hostOverride) {
  console.log(`Resolving contractor website as host: ${hostOverride}`);
}

if (dryRun) {
  console.log(`Dry run: ${appBinary("wrangler")} ${devArgs.join(" ")}`);
  process.exit(0);
}

run(appBinary("wrangler"), devArgs, { cwd: appDir });

function appBinary(name) {
  return resolve(appDir, "node_modules", ".bin", name);
}

function componentBinary(name) {
  return resolve(componentsDir, "node_modules", ".bin", name);
}

function run(command, args, { cwd = repoRoot } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function optionValue(name) {
  const index = flags.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  const value = flags[index + 1];
  if (!value || value.startsWith("--")) {
    console.error(`${name} requires a value.`);
    process.exit(1);
  }
  return value;
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
