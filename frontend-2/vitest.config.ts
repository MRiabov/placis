import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@placis\/public-site-components$/,
        replacement: path.resolve(
          import.meta.dirname,
          "../packages/website-components/src/index.ts",
        ),
      },
      {
        find: /^@placis\/public-site-components\/(.*)$/,
        replacement: path.resolve(
          import.meta.dirname,
          "../packages/website-components/src/$1",
        ),
      },
      {
        find: "@",
        replacement: path.resolve(import.meta.dirname, "./src"),
      },
    ],
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
