// Lighthouse CI: PRD 14.4 mobile thresholds. Add a URL per template as templates ship.
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npx wrangler dev --port 8787",
      startServerReadyPattern: "Ready on",
      url: ["http://localhost:8787/"],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
