// Structured data for the tool pages, carried over from the live site
// (PRD Appendix B), on the www host and linked to the organization.
import { SITE, ORG_ID } from "./schema";

const GCC = ["AE", "SA", "KW", "QA", "BH", "OM"];

export const toolApp = (
  path: string,
  type: "WebApplication" | "SoftwareApplication",
  name: string,
  description: string,
  category: string,
  extra: Record<string, unknown> = {},
) => ({
  "@type": type,
  "@id": `${SITE}${path}#app`,
  name,
  url: `${SITE}${path}`,
  description,
  applicationCategory: category,
  operatingSystem: "All",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "AED" },
  provider: { "@id": ORG_ID },
  areaServed: GCC,
  inLanguage: "en",
  ...extra,
});
