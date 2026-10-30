import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: [
      "dist/",
      ".astro/",
      ".wrangler/",
      ".lighthouseci/",
      "test-results/",
      "playwright-report/",
      "index.html",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs.recommended,
  {
    files: ["scripts/**", "*.config.*", "lighthouserc.cjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        module: "writable",
      },
    },
  },
];
