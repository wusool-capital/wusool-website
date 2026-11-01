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
        "http://localhost:8787/industries/technology",
        "http://localhost:8787/insights",
        "http://localhost:8787/insights/gcc-padel-report-2026",
        "http://localhost:8787/reports",
        "http://localhost:8787/reports/padel-in-the-gulf",
        "http://localhost:8787/team",
        "http://localhost:8787/careers/senior-analyst-ma-advisory-dubai",
        "http://localhost:8787/styleguide",
      ],
      numberOfRuns: 3,
    },
    assert: {
      // Each entry asserts on the median run, so one lucky run cannot pass.
      assertMatrix: [
        {
          matchingUrlPattern: "^(?!.*/styleguide$)(?!.*/reports/)",
          aggregationMethod: "median-run",
          assertions: thresholds,
        },
        // The styleguide is noindex by design, so SEO cannot reach 100 there.
        {
          matchingUrlPattern: "/styleguide$",
          aggregationMethod: "median-run",
          assertions: { ...thresholds, "categories:seo": "off" },
        },
        // The tools app allows framing only from wusoolcapital.com, so the
        // report reader logs a console error on localhost and staging.
        {
          matchingUrlPattern: "/reports/",
          aggregationMethod: "median-run",
          assertions: {
            ...thresholds,
            // Every other Best Practices audit still has to pass.
            "categories:best-practices": "off",
            ...Object.fromEntries(
              [
                "is-on-https",
                "geolocation-on-start",
                "notification-on-start",
                "paste-preventing-inputs",
                "image-aspect-ratio",
                "image-size-responsive",
                "viewport",
                "font-size",
                "doctype",
                "charset",
                "deprecations",
                "third-party-cookies",
              ].map((id) => [id, ["error", { minScore: 1 }]]),
            ),
          },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
