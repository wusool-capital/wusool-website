// Creates the Home landing page from the approved index.html copy and adds
// the organization fields to site settings. Never overwrites: existing
// documents and fields edited in Studio are kept.
//
//   npx sanity exec migration/seed-home.ts -- path/to/og-home.jpg
import { readFileSync } from "node:fs";
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
const link = (label: string, href: string) => ({ label, href });
const strings = (items: string[]) => items;

const ogPath = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!ogPath) throw new Error("Pass the OG image path");
if (await client.getDocument("page-home")) {
  console.log("Home page exists, left as is");
  process.exit(0);
}
const og = await client.assets.upload("image", readFileSync(ogPath), {
  filename: "og-home.jpg",
});

const industries: { slug: string; _id: string }[] = await client.fetch(
  `*[_type == "industry" && !(_id in path("drafts.**"))]{"slug": slug.current, _id}`,
);
const industryRef = (slug: string) => {
  const hit = industries.find((i) => i.slug === slug);
  if (!hit) throw new Error(`No industry ${slug}`);
  return { _type: "reference", _ref: hit._id };
};

const tiles: [string, string, string, string][] = [
  [
    "technology",
    "Technology",
    "SaaS, software, IT services. Recurring revenue commands a premium.",
    "Sell Your Tech Business",
  ],
  [
    "food-beverage",
    "F&B and Restaurants",
    "Restaurants, cafés, franchise operations across UAE & GCC.",
    "Sell Your F&B Business",
  ],
  [
    "healthcare",
    "Healthcare & Clinics",
    "Clinics, diagnostics, wellness. Licence transfers handled.",
    "Sell Your Clinic",
  ],
  [
    "business-services",
    "Business Services",
    "Agencies, consultancies, logistics. Exit on your terms.",
    "Sell Your Agency",
  ],
  [
    "manufacturing",
    "Manufacturing",
    "Asset-heavy businesses with strong buyer appetite in GCC.",
    "Sell Your Manufacturing Business",
  ],
  [
    "education",
    "Education",
    "Nurseries to training centres, with licence transfers handled in the process.",
    "Sell Your Education Business",
  ],
  [
    "retail",
    "Retail & Consumer",
    "Standalone stores to multi-location retail operations.",
    "Sell Your Retail Business",
  ],
  [
    "logistics",
    "Logistics",
    "Fleet assets, route contracts, and driver visas.",
    "Sell Your Logistics Business",
  ],
];

const faq: [string, string][] = [
  [
    "How much does it cost to sell my business in the UAE?",
    "Wusool Capital works mainly on a success-fee basis: we earn our main fee when your deal closes. A retainer is applied depending on the documentation needed before we start the process.",
  ],
  [
    "How long does it take to receive an offer on my business?",
    "Our target is your first offer within 6 weeks of signing the mandate. That timeline depends on how prepared your financials are and how cleanly your business fits buyer criteria, but that's the benchmark we work to. Most traditional advisors in the UAE take six months just to get to market.",
  ],
  [
    "What is my business worth in Dubai or the UAE?",
    "It depends heavily on your sector. A technology business with recurring revenue might trade at 4-7x EBITDA. A restaurant in Dubai typically sells for 2-3x. A healthcare clinic can reach 5-6x with clean compliance. Use the free valuation calculator above for an estimate based on live UAE transaction data: no sign-up needed.",
  ],
  [
    "Do I need audited accounts to sell my business?",
    "No, and this is one of the most common things that stops UAE founders from starting. We work with management accounts regularly. Audited financials are better for maximising valuation, but they're not a prerequisite to beginning the process. We'll tell you exactly what you need once we understand your situation.",
  ],
  [
    "How do you find buyers for my business?",
    "Wusool Capital maintains a network of 300+ pre-qualified acquirers: family offices, PE funds, search funds, and strategic buyers across the GCC. We match your business against their specific criteria before making any introduction. No public listings. No cold emails to strangers. Every buyer has signed an NDA before they see anything.",
  ],
  // PRD 13, fix 8: one approved deal size.
  [
    "What types of businesses does Wusool Capital work with?",
    "We focus on UAE and GCC businesses valued between $1M and $25M across Technology, F&B, Healthcare, Business Services, Manufacturing, Retail, Logistics, and Education. If your business is outside those sectors, get in touch; we'll tell you honestly whether we're the right fit.",
  ],
];

const home = {
  _id: "page-home",
  _type: "page",
  title: "Home",
  slug: { _type: "slug", current: "home" },
  seo: {
    title: "Sell Your Business UAE | Wusool Capital M&A Advisory",
    description:
      "Sell your business in the UAE with 6 weeks to first offer. M&A advisory for GCC founders, mainly success fee. Get your free valuation.",
    ogTitle: "Sell Your UAE Business. 6 Weeks to First Offer | Wusool Capital",
    ogDescription:
      "Tech-powered M&A advisory for UAE founders. Matched buyers, 6 weeks to first offer, mainly success fee. Get your free business valuation.",
    ogImage: { _type: "image", asset: { _type: "reference", _ref: og._id } },
  },
  sections: [
    {
      _key: key(),
      _type: "heroSection",
      label: "GCC M&A Advisory",
      title: "Sell your business in the UAE.",
      soft: "Faster. For more.",
      sub: "The M&A advisory firm built for business owners in the UAE. No 12-month timelines. The right buyers, moving fast.",
      ctas: [
        { _key: key(), ...link("Get a Free Valuation", "/valuation-tool") },
        { _key: key(), ...link("Access The Buyer Network", "/buyers") },
      ],
    },
    {
      _key: key(),
      _type: "statsSection",
      items: [
        {
          _key: key(),
          num: "6 weeks",
          unit: "First Offer",
          text: "From first conversation to close. Not 6 months.",
        },
        {
          _key: key(),
          num: "GCC",
          unit: "Native",
          text: "Built for founders across the GCC. Built-in UAE and KSA expertise.",
        },
        {
          _key: key(),
          num: "300+",
          unit: "Qualified Buyers",
          text: "Pre-vetted acquirers matched to your sector.",
        },
      ],
    },
    {
      _key: key(),
      _type: "comparisonSection",
      title: "There's a better way to sell your business in the UAE",
      lede: "See how Wusool Capital compares to the traditional advisory model.",
      oldTitle: "The Old Way",
      oldItems: strings([
        "6-12 months to find a buyer",
        "Generic buyer lists, no matching logic",
        "You chase updates. Advisors go quiet.",
        "One offer, take it or leave it",
      ]),
      newTitle: "The Wusool Capital Way",
      newItems: strings([
        "6 weeks to first offer versus the traditional 6 months",
        "Buyers matched to your exact sector and size",
        "You focus on your business. We run the process.",
        "Competitive process to drive the best outcome",
      ]),
      cta: link("Start the Process", "/sell"),
    },
    {
      _key: key(),
      _type: "sectorGridSection",
      title: "We know your sector",
      lede: "Wusool Capital has active buyers and closed deals across the UAE's most active M&A sectors.",
      tiles: tiles.map(([slug, title, text, cta]) => ({
        _key: key(),
        industry: industryRef(slug),
        title,
        text,
        cta,
      })),
      footLink: link(
        "Don't see your industry? Get a free valuation anyway",
        "/valuation-tool",
      ),
    },
    {
      _key: key(),
      _type: "processSection",
      label: "The process",
      title: "How our M&A advisory process works",
      lede: "From first conversation to close, here's exactly what happens.",
      primary: link("Start the Process", "/sell"),
      secondary: link("Looking to acquire? Access GCC deal flow", "/buyers"),
      steps: [
        {
          _key: key(),
          title: "Tell us about your business",
          text: "10 minutes. No documents needed yet. Just the basics about your business, your sector, and what you're looking for.",
        },
        {
          _key: key(),
          title: "We find your buyers",
          text: "Our process matches you with pre-qualified acquirers from our network, based on your sector, size, and deal profile. No cold outreach. No generic lists.",
        },
        {
          _key: key(),
          title: "You close the deal",
          text: "We manage the full process end-to-end. NDAs, data room, negotiations. You stay focused on running your business.",
        },
      ],
    },
    {
      _key: key(),
      _type: "dealsSection",
      label: "Transactions",
      title: "Recent UAE M&A transactions",
      lede: "Every deal is anonymized. Confidentiality is standard, not an afterthought.",
      note: "Anonymized by default",
      footLink: link("Selling your business? See what's possible", "/sell"),
    },
    {
      _key: key(),
      _type: "postsSection",
      title: "Latest from Wusool Capital",
      allLink: link("See all posts", "/insights"),
    },
    {
      _key: key(),
      _type: "faqSection",
      label: "Common questions",
      title: "FAQ's",
      lede: "Answers to frequently asked questions.",
      faq: faq.map(([question, answer]) => ({
        _key: key(),
        _type: "faqItem",
        question,
        answer,
      })),
      cta: link("Talk to us", "mailto:contact@wusoolcapital.com"),
    },
  ],
};

await client.createIfNotExists(home);
// Organization data, from the live site's schema with the 6-week fix (PRD 13).
await client
  .patch("siteSettings")
  .setIfMissing({
    orgDescription:
      "M&A advisory for UAE and GCC business owners. Mainly success fee. 6 weeks to first offer. 300+ pre-qualified acquirers.",
    foundingDate: "2024",
    knowsAbout: [
      "Mergers and Acquisitions",
      "Business Valuation",
      "M&A Advisory UAE",
      "GCC Business Sales",
      "Exit Strategy",
    ],
    areaServed: [
      "United Arab Emirates",
      "Saudi Arabia",
      "Kuwait",
      "Qatar",
      "Bahrain",
    ],
    sameAs: [
      "https://www.linkedin.com/company/wusoolcapital",
      "https://www.crunchbase.com/organization/wusool-capital",
      "https://www.wikidata.org/wiki/Q140032972",
    ],
  })
  .commit();
console.log("Home page and organization settings seeded");
