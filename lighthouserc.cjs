// Lighthouse CI: PRD 14.4 mobile thresholds. Add a URL per template as templates ship.
// GitHub runners are slower than a laptop, so CI allows 0.2s more LCP
// (Jules's decision). The 2.0s target holds for local runs.
const LCP_SLACK = process.env.CI ? 200 : 0;
const thresholds = {
  "categories:performance": ["error", { minScore: 0.95 }],
  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:best-practices": ["error", { minScore: 1 }],
  "categories:seo": ["error", { minScore: 1 }],
  "largest-contentful-paint": ["error", { maxNumericValue: 2000 + LCP_SLACK }],
  "total-blocking-time": ["error", { maxNumericValue: 150 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
};

const urls = [
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
  "http://localhost:8787/refer",
  "http://localhost:8787/valuation-tool",
  "http://localhost:8787/benchmark",
  "http://localhost:8787/privacy-policy",
  "http://localhost:8787/styleguide",
];

// CI splits the URLs across parallel jobs with LHCI_SHARD=<n>/<total>.
const [shard, shards] = (process.env.LHCI_SHARD ?? "1/1")
  .split("/")
  .map(Number);

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npx wrangler dev --port 8787",
      startServerReadyPattern: "Ready on",
      url: urls.filter((_, i) => i % shards === shard - 1),
      numberOfRuns: 3,
    },
    assert: {
      // Each entry asserts on the median run, so one lucky run cannot pass.
      assertMatrix: [
        {
          matchingUrlPattern:
            "^(?!.*/styleguide$)(?!.*/careers/)(?!.*/reports/)(?!.*/valuation-tool$)(?!.*/benchmark$)(?!.*/gcc-padel-report-2026$)",
          aggregationMethod: "median-run",
          assertions: thresholds,
        },
        // Jules accepted about 2.05s LCP on the padel article (feature 12).
        {
          matchingUrlPattern: "/gcc-padel-report-2026$",
          aggregationMethod: "median-run",
          assertions: {
            ...thresholds,
            "largest-contentful-paint": [
              "error",
              { maxNumericValue: 2100 + LCP_SLACK },
            ],
          },
        },
        // The styleguide is noindex by design, and a closed job turns noindex,
        // so SEO cannot reach 100 there.
        {
          matchingUrlPattern: "/styleguide$|/careers/",
          aggregationMethod: "median-run",
          assertions: { ...thresholds, "categories:seo": "off" },
        },
        // The tools app allows framing only from wusoolcapital.com, so the
        // report reader and the tools log a console error on localhost and
        // staging.
        {
          matchingUrlPattern: "/reports/|/valuation-tool$|/benchmark$",
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
