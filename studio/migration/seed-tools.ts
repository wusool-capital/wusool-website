// Creates the Valuation, Deal Readiness and Benchmark tool pages: live meta,
// a short indexable hero, the tool from the tools app and, on Benchmark, the
// live FAQ. Never overwrites a page that exists.
//
//   npx sanity exec migration/seed-tools.ts
import { createClient } from "@sanity/client";
import { projectId, dataset } from "../env";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

let n = 0;
const key = () => `k${(n++).toString(36)}`;
type Doc = { _id: string; _type: string; [k: string]: unknown };
const page = (
  id: string,
  title: string,
  seo: { title: string; description: string },
  hero: { title: string; sub: string },
  tool: string,
  extra: Record<string, unknown>[] = [],
  closingCta?: Record<string, unknown>,
): Doc => ({
  _id: `page-${id}`,
  _type: "page",
  title,
  slug: { _type: "slug", current: id },
  seo,
  ...(closingCta && { closingCta }),
  sections: [
    { _key: key(), _type: "heroSection", visual: "none", ...hero },
    { _key: key(), _type: "toolSection", tool },
    ...extra,
  ],
});

const docs = [
  page(
    "valuation-tool",
    "Valuation tool",
    {
      title: "Free Business Valuation Tool | UAE & GCC | Wusool Capital",
      description:
        "Find out what your business is worth in 60 seconds. Free instant valuation tool built for UAE & GCC founders.",
    },
    {
      title: "Free business valuation tool",
      sub: "Find out what your business is worth in 60 seconds. Built for UAE and GCC founders.",
    },
    "valuation",
    [],
    {
      title: "Want an advisor to check the number?",
      text: "We review your valuation with you, free and with no commitment.",
      button: { label: "Talk to us", form: "get-started" },
    },
  ),
  page(
    "deal-readiness-tool",
    "Deal readiness",
    {
      title: "Deal Readiness Assessment: Are You Exit-Ready?",
      description:
        "Take the free 5-minute deal readiness assessment. Find out if your UAE business is ready to sell and what to fix before going to market.",
    },
    {
      title: "Deal readiness assessment",
      sub: "Answer 15 plain-English questions in 5 minutes. See your readiness score and what to fix before going to market.",
    },
    "readiness",
  ),
  page(
    "benchmark",
    "Benchmark",
    {
      title: "Free GCC SME Benchmarking Tool | Wusool Capital",
      description:
        "Benchmark your GCC business free. See your percentile on revenue, EBITDA margin, growth and more against real SME data. Instant results, no signup.",
    },
    {
      title: "GCC SME benchmarking tool",
      sub: "See your percentile on revenue, EBITDA margin, growth and more against GCC peers. Instant results, no signup.",
    },
    "benchmark",
    [
      {
        _key: key(),
        _type: "faqSection",
        label: "Common questions",
        title: "FAQ's",
        lede: "Answers to frequently asked questions.",
        cta: { label: "Talk to us", form: "get-started" },
        faq: [
          [
            "Is the Wusool SME benchmarking tool free?",
            "Yes. The benchmarking tool is free to use and does not require a signup to see your result.",
          ],
          [
            "What metrics does the tool benchmark?",
            "It benchmarks core metrics every business tracks: revenue, EBITDA and EBITDA margin, revenue growth, gross margin, headcount, revenue per employee, customer concentration, recurring revenue share, and owner dependency.",
          ],
          [
            "Where does the benchmark data come from?",
            "Wusool Capital blends verified data from its own field work and deal mandates with published industry reports, building a GCC-specific SME dataset rather than relying on global averages.",
          ],
          [
            "Is my business data kept confidential?",
            "Yes. Your individual numbers are never shown to other users. Only your own percentile result is displayed, and your data is aggregated anonymously into the wider benchmark.",
          ],
          [
            "How accurate is my percentile result?",
            "Results are shown against a minimum sample size per metric to avoid unreliable comparisons. Where the dataset for a metric is still small, the tool clearly marks the result as an early estimate rather than a full benchmark.",
          ],
        ].map(([question, answer]) => ({
          _key: key(),
          _type: "faqItem",
          question,
          answer,
        })),
      },
    ],
  ),
];

for (const doc of docs) {
  const res = await client.createIfNotExists(doc);
  console.log(`${doc._id}: ${res._rev ? "ok" : "exists"}`);
}
