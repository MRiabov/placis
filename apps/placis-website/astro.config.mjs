import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react()],
  output: "static",
  site: "https://placis.com",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
