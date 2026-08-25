import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: {
      configPath: "./wrangler.jsonc",
    },
  }),
  integrations: [react()],
  output: "server",
  session: false,
  vite: {
    plugins: [tailwindcss()],
  },
});
