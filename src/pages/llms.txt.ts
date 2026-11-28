// llms.txt built from Sanity (PRD fix 9): the approved values come from
// siteSettings, so they match the rest of the site.
import type { APIRoute } from "astro";
import { query } from "../lib/sanity";
import { SITE } from "../lib/schema";
import { referLive } from "../data/site";

type Item = { title: string; slug: string };

export const GET: APIRoute = async () => {
  const d = await query<{
    s: {
      orgDescription: string;
      dealSizeRange: string;
      feeWording: string;
      timeToFirstOffer: string;
    };
    reports: Item[];
    insights: Item[];
  }>(`{
    "s": *[_id == "siteSettings"][0]{orgDescription, dealSizeRange, feeWording, timeToFirstOffer},
    "reports": *[_type == "report"] | order(publishedAt desc){title, "slug": slug.current},
    "insights": *[_type == "insights" && hideFromListings != true] | order(publishedAt desc){title, "slug": slug.current}
  }`);
  const s = d.s;
  const list = (items: Item[], base: string) =>
    items.map((i) => `- ${i.title}: ${SITE}/${base}/${i.slug}`).join("\n");
  const text = `# Wusool Capital

${s.orgDescription}

- Deal size: ${s.dealSizeRange}
- Fees: ${s.feeWording}
- Timeline: ${s.timeToFirstOffer}

## Key pages

- Homepage: ${SITE}/
- For sellers: ${SITE}/sell
- For buyers: ${SITE}/buyers
- Valuation tool: ${SITE}/valuation-tool
- Deal readiness assessment: ${SITE}/deal-readiness-tool
- GCC SME benchmark: ${SITE}/benchmark
- Insights: ${SITE}/insights
- Reports: ${SITE}/reports
- Team: ${SITE}/team
${referLive ? `- Refer and earn (referral partners): ${SITE}/refer\n` : ""}
## Reports

${list(d.reports, "reports")}

## Insights

${list(d.insights, "insights")}

## Permissions

Content may be used for search indexing and AI-generated search summaries.
`;
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
