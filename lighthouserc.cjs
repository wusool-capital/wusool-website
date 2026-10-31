// Lighthouse CI: PRD 14.4 mobile thresholds. Add a URL per template as templates ship.
const thresholds = {
  "categories:performance": ["error", { minScore: 0.95 }],
  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:best-practices": ["error", { minScore: 1 }],
  "categories:seo": ["error", { minScore: 1 }],
  "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
  "total-blocking-time": ["error", { maxNumericValue: 150 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
};

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npx wrangler dev --port 8787",
      startServerReadyPattern: "Ready on",
      url: [
        "http://localhost:8787/",
        "http://localhost:8787/sell",
        "http://localhost:8787/buyers",
        "http://localhost:8787/styleguide",
      ],
      numberOfRuns: 3,
    },
    assert: {
      // Each entry asserts on the median run, so one lucky run cannot pass.
      assertMatrix: [
        {
          matchingUrlPattern: "^(?!.*/styleguide$)",
          aggregationMethod: "median-run",
          assertions: thresholds,
        },
        // The styleguide is noindex by design, so SEO cannot reach 100 there.
        {
          matchingUrlPattern: "/styleguide$",
          aggregationMethod: "median-run",
          assertions: { ...thresholds, "categories:seo": "off" },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
