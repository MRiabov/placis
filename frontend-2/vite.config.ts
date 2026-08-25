import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Share the old app's env (frontend/.env.local has VITE_CLERK_PUBLISHABLE_KEY
  // and VITE_API_BASE_URL; untracked, never committed). Only VITE_* vars are
  // exposed to import.meta.env; server-only vars stay server-side.
  envDir: "../frontend",
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
  server: {
    hmr: {
      host: "127.0.0.1",
      port: Number(process.env.PLACIS_FRONTEND2_PORT) || 5174,
    },
    port: Number(process.env.PLACIS_FRONTEND2_PORT) || 5174,
  },
});
