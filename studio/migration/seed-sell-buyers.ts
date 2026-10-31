// Creates the Sell and Buyers landing pages from the live copy, with the
// approved fixes (6 weeks to first offer, $1M to $25M). Never overwrites a
// page that exists.
//
//   npx sanity exec migration/seed-sell-buyers.ts -- og-sell.jpg og-buyers.jpg
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
type Form = "get-started" | "buyers";
const link = (label: string, href: string, form?: Form) => ({
  label,
  href,
  ...(form ? { form } : {}),
});
const items = <T extends object>(list: T[]) =>
  list.map((i) => ({ _key: key(), ...i }));
const faq = (list: [string, string][]) =>
  list.map(([question, answer]) => ({
    _key: key(),
    _type: "faqItem",
    question,
    answer,
  }));
const deal = (
  category: string,
  status: string,
  sector: string,
  country: string,
  year: string,
  summary: string,
) => ({
  category,
  status,
  sector,
  country,
  year,
  summary,
});

const [ogSell, ogBuyers] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("-"));
if (!ogSell || !ogBuyers)
  throw new Error("Pass the Sell and Buyers OG image paths");

async function create(
  doc: { _id: string; _type: string } & Record<string, unknown>,
  og: string,
) {
  if (await client.getDocument(doc._id)) {
    console.log(`${doc._id} exists, left as is`);
    return;
  }
  const image = await client.assets.upload("image", readFileSync(og), {
    filename: `${doc._id}.jpg`,
  });
  const seo = doc.seo as Record<string, unknown>;
  seo.ogImage = {
    _type: "image",
    asset: { _type: "reference", _ref: image._id },
  };
  await client.create(doc);
  console.log(`${doc._id} created`);
}

const industries: { slug: string; _id: string }[] = await client.fetch(
  `*[_type == "industry" && !(_id in path("drafts.**"))]{"slug": slug.current, _id}`,
);
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
const tileItems = tiles.map(([slug, title, text, cta]) => {
  const hit = industries.find((i) => i.slug === slug);
  if (!hit) throw new Error(`No industry ${slug}`);
  return {
    _key: key(),
    industry: { _type: "reference", _ref: hit._id },
    title,
    text,
    cta,
  };
});

const sell = {
  _id: "page-sell",
  _type: "page",
  title: "Sell",
  slug: { _type: "slug", current: "sell" },
  seo: {
    title: "Sell Your Business in Dubai & UAE | Wusool Capital",
    description:
      "Sell your UAE business with Wusool Capital. 6 weeks to first offer, mainly success fee, 300+ pre-qualified buyers. Get a free valuation.",
    ogTitle: "Sell Your UAE Business. 6 Weeks to First Offer | Wusool Capital",
    ogDescription:
      "M&A advisory for UAE business owners. Mainly success fee. 300+ pre-qualified buyers. 6 weeks to first offer.",
  },
  service: {
    name: "M&A Advisory for Business Sellers in the UAE and GCC",
    serviceType: "Sell-side M&A advisory",
    description:
      "End-to-end M&A advisory for UAE and GCC business owners: valuation, buyer matching from a network of 300+ pre-qualified acquirers, and deal management to close. 6 weeks to first offer.",
  },
  sections: [
    {
      _key: key(),
      _type: "heroSection",
      title: "The smarter way to sell your business in the UAE",
      sub: "Most GCC advisors take 6-12 months and still bring you the wrong buyers. Wusool Capital does the opposite.",
      visual: "seller",
      ctas: items([link("Get a Free Valuation", "/valuation-tool")]),
    },
    {
      _key: key(),
      _type: "processSection",
      label: "The process",
      title: "Selling your business should be easy",
      lede: "From first conversation to close, here's exactly what happens.",
      primary: link("Start the Process", "/sell", "get-started"),
      steps: items([
        {
          title: "Tell us about your business",
          text: "10 minutes. No documents needed yet. Just the basics about your business, your sector, and what you're looking for.",
        },
        {
          title: "We find your buyers",
          text: "Our process matches you with pre-qualified acquirers from our network, based on your sector, size, and deal profile. No cold outreach. No generic lists.",
        },
        {
          title: "You close the deal",
          text: "We manage the full process end-to-end. NDAs, data room, negotiations. You stay focused on running your business.",
        },
      ]),
    },
    {
      _key: key(),
      _type: "featureCardsSection",
      label: "Toolkit",
      title: "Your seller's toolkit",
      lede: "Everything you need to plan a successful exit in the UAE.",
      cards: items([
        {
          eyebrow: "Valuation Tool",
          title: "Curious what your business is worth?",
          text: "Get an instant customized valuation report based on real M&A transaction data, in 60 seconds. No sign-up required.",
          link: link("Get a Free Valuation", "/valuation-tool"),
        },
        {
          eyebrow: "Buyer Match Preview",
          title: "See who's buying businesses like yours",
          text: "See how many active buyers in our network are looking for businesses like yours right now, by sector and deal size.",
          link: link("Start the Process", "/sell", "get-started"),
        },
        {
          eyebrow: "Deal Readiness Report",
          title: "Are you ready to sell your business?",
          text: "Know exactly what buyers will scrutinize before going to market. Get a sector-specific checklist sent to your inbox.",
          link: link("Are You Ready to Sell?", "/deal-readiness-tool"),
        },
      ]),
    },
    {
      _key: key(),
      _type: "sectorGridSection",
      title: "We know your sector",
      lede: "Wusool Capital has active buyers and closed deals across the UAE's most active M&A sectors.",
      tiles: tileItems,
      footLink: link(
        "Don't see your industry? Let's connect",
        "/sell",
        "get-started",
      ),
    },
    {
      _key: key(),
      _type: "dealsSection",
      label: "Transactions",
      title: "Recent UAE M&A transactions",
      lede: "Every deal is anonymized. Confidentiality is standard, not an afterthought.",
      note: "Anonymized by default",
      exampleNote: "These are indicative examples. Every deal is anonymized.",
      footLink: link(
        "Selling your business? See what's possible",
        "/sell",
        "get-started",
      ),
      examples: items([
        deal(
          "M&A Advisory",
          "Closed",
          "Technology",
          "UAE",
          "2026",
          "Software business, UAE-based. Full acquisition.",
        ),
        deal(
          "M&A Advisory",
          "Active",
          "Confidential",
          "GCC",
          "2026",
          "Buy-side mandate in progress. Buyer sourcing underway.",
        ),
        deal(
          "Transaction Advisory",
          "Closed",
          "HR Tech",
          "UAE",
          "2025",
          "Independent valuation for UAE-based technology company.",
        ),
      ]),
    },
    {
      _key: key(),
      _type: "faqSection",
      label: "Common questions",
      title: "FAQ's",
      lede: "Answers to frequently asked questions.",
      cta: link("Talk to us", "/sell", "get-started"),
      faq: faq([
        [
          "What does it cost to sell my business with Wusool Capital?",
          "Wusool Capital operates mainly on a success-fee model, where we earn more when you close. A retainer is applied depending on the documentation needed before we start the process.",
        ],
        [
          "How long does the process take?",
          "Our target is your first offer within 6 weeks of signing the mandate. That timeline depends on how prepared your financials are and how cleanly your business fits buyer criteria, but that's the benchmark we work to. Most traditional advisors in the UAE take six months just to get to market.",
        ],
        [
          "What documents do I need to get started?",
          "Very little to begin. Start with the calculator; just basic information about your business, or a 10 minute conversation. We'll guide you on exactly what documents you'll need once we understand your deal profile. Most sellers are surprised how light the initial ask is.",
        ],
        [
          "What if my financials aren't audited?",
          "Not a blocker. We work with management accounts and connect you with the right auditors to make sure your financials are deal-ready. We'll help you present your financials in the most credible way for buyers, and flag what to clean up before going to market.",
        ],
        [
          "How do you find buyers?",
          "Wusool Capital maintains a network of 300+ pre-qualified acquirers. We match your business against their specific criteria (sector, deal size, country, and strategic fit) before making any introductions.",
        ],
        [
          "Do I need to sign an exclusivity agreement?",
          "Yes, exclusivity is standard practice in any credible M&A process. It signals to buyers that you're committed, which drives better offers.",
        ],
        [
          "What sectors do you cover?",
          "Technology, F&B, Healthcare, Business Services, Manufacturing, Education, Retail, and Logistics across the UAE and GCC. Other sectors are assessed individually. If your business has strong fundamentals, we'll tell you honestly whether we're the right fit.",
        ],
      ]),
    },
  ],
};

const buyers = {
  _id: "page-buyers",
  _type: "page",
  title: "Buyers",
  slug: { _type: "slug", current: "buyers" },
  seo: {
    title: "Buy a Business UAE | Access GCC Deal Flow | Wusool Capital",
    // PRD 13, fix 8: the approved deal size range.
    description:
      "Access curated off-market deal flow across the UAE and GCC. Businesses $1M to $25M. Apply to join Wusool Capital's pre-qualified buyer network.",
    ogTitle: "Access UAE Business Acquisition Deal Flow | Wusool Capital",
    ogDescription:
      "Pre-qualified M&A deal flow across the UAE and GCC. Tech, F&B, Healthcare, Business Services. Apply to join Wusool Capital's buyer network.",
  },
  closingCta: {
    title: "Looking to buy a business in the UAE or GCC?",
    text: "Join the buyer network for curated, confidential deal flow. Free for buyers.",
    button: link("Join the Buyer Network", "/buyers", "buyers"),
  },
  service: {
    name: "Buyer Network for GCC Business Acquisitions",
    serviceType: "M&A deal flow access",
    description:
      "Curated, confidential deal flow for family offices, PE funds, search funds, strategic buyers and qualified individuals acquiring UAE and GCC businesses of $1M to $25M. Free for buyers.",
  },
  sections: [
    {
      _key: key(),
      _type: "heroSection",
      title: "GCC's most active deal flow under $25M.",
      soft: "Curated. Confidential. Qualified.",
      sub: "Wusool Capital matches serious acquirers with pre-qualified businesses for sale across the UAE and GCC. Application-only. No noise, no cold outreach.",
      visual: "none",
      ctas: items([link("Join the Buyer Network", "/buyers", "buyers")]),
    },
    {
      _key: key(),
      _type: "featureCardsSection",
      cards: items([
        {
          title: "Mandate-matched",
          text: "Deals filtered to your exact sector and size.",
        },
        {
          title: "Pre-qualified only",
          text: "Every deal reviewed before it reaches you.",
        },
        {
          title: "Confidential process",
          text: "NDAs managed, data rooms secured.",
        },
        { title: "$0 finder fees", text: "No cost to buyers, ever." },
      ]),
    },
    {
      _key: key(),
      _type: "dealsSection",
      label: "Live transactions",
      title: "Active deal flow",
      lede: "Every deal is anonymized until NDA is signed.",
      note: "Anonymized by default",
      exampleNote:
        "These are indicative examples. Live deals are shared exclusively with approved network members.",
      footLink: link("Join the Network to See Live Deals", "/buyers", "buyers"),
      examples: items([
        deal(
          "M&A Advisory",
          "Closed",
          "Technology",
          "UAE",
          "2026",
          "Software business, UAE-based. Full acquisition.",
        ),
        deal(
          "M&A Advisory",
          "Active",
          "Confidential",
          "GCC",
          "2026",
          "Buy-side mandate in progress. Buyer sourcing underway.",
        ),
        deal(
          "Valuation Advisory",
          "Closed",
          "HR Tech",
          "UAE",
          "2025",
          "Independent valuation for UAE-based technology company.",
        ),
      ]),
    },
    {
      _key: key(),
      _type: "stepsSection",
      label: "How it works for buyers",
      title: "Sourcing quality deals should be easy",
      lede: "Our process streamlines the process. Here's exactly what happens.",
      cta: link("Join the Buyer Network", "/buyers", "buyers"),
      steps: items([
        {
          title: "Apply to join (5 minutes)",
          text: "A short application to tell us who you are, what you're looking for, and your typical deal size. We review every application within 48 hours.",
        },
        {
          title: "Qualification review (48 hours)",
          text: "We assess your application and criteria. Wusool Capital accepts serious acquirers only: family offices, PE funds, search funds, strategic buyers, and qualified HNWIs.",
        },
        {
          title: "Receive curated deal alerts",
          text: "Once approved, you receive deal alerts matched to your specific criteria: sector, deal size, country. You only hear about deals that fit.",
        },
        {
          title: "Access data room and submit offer",
          text: "Sign the NDA, access the data room, meet management, and submit your offer. Wusool Capital manages the full process.",
        },
      ]),
    },
    {
      _key: key(),
      _type: "featureCardsSection",
      label: "What you get",
      title: "Why buyers choose Wusool Capital",
      lede: "Every approved buyer gets the same standard. No tiers. No hidden fees.",
      cta: link("Join the Buyer Network", "/buyers", "buyers"),
      cards: items([
        {
          title: "Early access to quality deals",
          text: "Deal flow reaches our network before any public listing. The best deals never go to market.",
        },
        {
          title: "Matched to your criteria",
          text: "You only see deals that match your sector, size, and geography preferences. No irrelevant flow.",
        },
        {
          title: "Verified, not just listed",
          text: "Every seller mandate is reviewed by Wusool Capital before being shared. Financials are assessed. Red flags are flagged.",
        },
        {
          title: "Confidentiality guaranteed",
          text: "All buyer identities are protected. Sellers don't know who's looking until Wusool Capital facilitates an introduction.",
        },
      ]),
    },
    {
      _key: key(),
      _type: "faqSection",
      label: "Common questions",
      title: "FAQ's",
      lede: "Answers to frequently asked questions.",
      cta: link("Join the Buyer Network", "/buyers", "buyers"),
      faq: faq([
        [
          "Is there a fee to join the buyer network?",
          "No. Joining the Wusool Capital buyer network is completely free. Our success fee is paid by the seller at close; buyers pay nothing at any stage.",
        ],
        [
          "How are deals sourced?",
          "Deals come from founders across the UAE and GCC who have engaged Wusool Capital to manage their exit. Every business is reviewed by our team before being presented to the network.",
        ],
        [
          "Are financials verified before I see them?",
          "Yes. Every deal includes management accounts or audited financials reviewed by our team. We flag any gaps or inconsistencies before sharing with buyers.",
        ],
        [
          "How do I make an offer?",
          "Once you've reviewed the data room and completed management presentations, you submit an indicative offer to Wusool Capital. We manage negotiation and deal structuring from there.",
        ],
        [
          "Can I join if I'm based outside the UAE?",
          "Yes. We work with buyers across the GCC and internationally, as long as your acquisition focus includes UAE or GCC-based businesses.",
        ],
        [
          "What deal sizes do you cover?",
          "Primarily $1M to $25M enterprise value. We are expanding to larger deals through 2026-2027.",
        ],
      ]),
    },
  ],
};

await create(sell, ogSell);
await create(buyers, ogBuyers);
