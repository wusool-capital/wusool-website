import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.wusoolcapital.com",
  trailingSlash: "never",
  build: {
    format: "file",
    // External stylesheets only, so the CSP needs no 'unsafe-inline'.
    inlineStylesheets: "never",
  },
  // External scripts only, so the CSP needs no 'unsafe-inline'.
  vite: { build: { assetsInlineLimit: 0 } },
});
