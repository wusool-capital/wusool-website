// Sample content for /styleguide, taken from index.html.
import technology from "../assets/industries/technology.svg?url";
import foodBeverage from "../assets/industries/food-beverage.svg?url";
import healthcare from "../assets/industries/healthcare.svg?url";
import businessServices from "../assets/industries/business-services.svg?url";
import manufacturing from "../assets/industries/manufacturing.svg?url";
import education from "../assets/industries/education.svg?url";
import retail from "../assets/industries/retail.svg?url";
import logistics from "../assets/industries/logistics.svg?url";

export const stats = [
  {
    num: "6 weeks",
    unit: "First Offer",
    text: "From first conversation to close. Not 6 months.",
  },
  {
    num: "GCC",
    unit: "Native",
    text: "Built for founders across the GCC. Built-in UAE and KSA expertise.",
  },
  {
    num: "300+",
    unit: "Qualified Buyers",
    text: "Pre-vetted acquirers matched to your sector.",
  },
];

export const compare = {
  old: {
    title: "The Old Way",
    items: [
      "6-12 months to find a buyer",
      "Generic buyer lists, no matching logic",
      "You chase updates. Advisors go quiet.",
      "One offer, take it or leave it",
    ],
  },
  better: {
    title: "The Wusool Capital Way",
    items: [
      "6 weeks to first offer versus the traditional 6 months",
      "Buyers matched to your exact sector and size",
      "You focus on your business. We run the process.",
      "Competitive process to drive the best outcome",
    ],
  },
};

export const industries = [
  {
    href: "/industries/technology",
    icon: technology,
    iconAlt: "Technology business icon",
    title: "Technology",
    text: "SaaS, software, IT services. Recurring revenue commands a premium.",
    cta: "Sell Your Tech Business",
  },
  {
    href: "/industries/food-beverage",
    icon: foodBeverage,
    iconAlt: "Restaurant and F&B business icon",
    title: "F&B and Restaurants",
    text: "Restaurants, cafés, franchise operations across UAE & GCC.",
    cta: "Sell Your F&B Business",
  },
  {
    href: "/industries/healthcare",
    icon: healthcare,
    iconAlt: "Healthcare and clinic business icon",
    title: "Healthcare & Clinics",
    text: "Clinics, diagnostics, wellness. Licence transfers handled.",
    cta: "Sell Your Clinic",
  },
  {
    href: "/industries/business-services",
    icon: businessServices,
    iconAlt: "Business services icon",
    title: "Business Services",
    text: "Agencies, consultancies, logistics. Exit on your terms.",
    cta: "Sell Your Agency",
  },
  {
    href: "/industries/manufacturing",
    icon: manufacturing,
    iconAlt: "Manufacturing business icon",
    title: "Manufacturing",
    text: "Asset-heavy businesses with strong buyer appetite in GCC.",
    cta: "Sell Your Manufacturing Business",
  },
  {
    href: "/industries/education",
    icon: education,
    iconAlt: "Education business icon",
    title: "Education",
    text: "Nurseries to training centres, with licence transfers handled in the process.",
    cta: "Sell Your Education Business",
  },
  {
    href: "/industries/retail",
    icon: retail,
    iconAlt: "Retail business icon",
    title: "Retail & Consumer",
    text: "Standalone stores to multi-location retail operations.",
    cta: "Sell Your Retail Business",
  },
  {
    href: "/industries/logistics",
    icon: logistics,
    iconAlt: "Logistics business icon",
    title: "Logistics",
    text: "Fleet assets, route contracts, and driver visas.",
    cta: "Sell Your Logistics Business",
  },
];

export const steps = [
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
];

export const deals = [
  {
    mandate: "M&A Advisory",
    status: "Closed",
    closed: true,
    sector: "Technology",
    country: "UAE",
    year: "2026",
    summary: "Software business, UAE-based. Full acquisition.",
  },
  {
    mandate: "M&A Advisory",
    status: "Active",
    closed: false,
    sector: "Confidential",
    country: "GCC",
    year: "2026",
    summary: "Buy-side mandate in progress. Buyer sourcing underway.",
  },
  {
    mandate: "Valuation Advisory",
    status: "Closed",
    closed: true,
    sector: "HR Tech",
    country: "UAE",
    year: "2025",
    summary: "Independent valuation for UAE-based technology company.",
  },
];

export const posts = {
  lead: {
    href: "/insights/how-to-buy-a-business-in-abu-dhabi",
    title: "How to Buy a Business in Abu Dhabi",
    excerpt:
      "How to buy a business in Abu Dhabi: the ADDED ownership transfer process, ADGM vs mainland, and what makes Abu Dhabi different from Dubai.",
    glyph: "map-trifold",
  },
  side: [
    {
      href: "/insights/entrepreneurship-through-acquisition-vs-search-fund",
      title:
        "Entrepreneurship Through Acquisition vs Search Fund: What's the Difference in the GCC?",
      excerpt:
        "Entrepreneurship through acquisition and search funds are not the same thing. Here's the difference, and why the GCC path is almost always self-funded.",
    },
    {
      href: "/insights/when-to-bring-in-ma-advisor-uae",
      title: "When to Hire an M&A Advisor in the UAE",
      excerpt:
        "The right time to bring in an M&A advisor is 12 to 24 months before you sell, not after a buyer has already made an offer. Here's what advisors actually do at each stage.",
    },
  ],
};

export const faq = [
  {
    q: "How much does it cost to sell my business in the UAE?",
    a: "Wusool Capital works mainly on a success-fee basis: we earn our main fee when your deal closes. A retainer is applied depending on the documentation needed before we start the process.",
  },
  {
    q: "How long does it take to receive an offer on my business?",
    a: "Our target is your first offer within 6 weeks of signing the mandate. That timeline depends on how prepared your financials are and how cleanly your business fits buyer criteria, but that's the benchmark we work to. Most traditional advisors in the UAE take six months just to get to market.",
  },
  {
    q: "What types of businesses does Wusool Capital work with?",
    a: "We focus on UAE and GCC businesses valued between $1M and $25M across Technology, F&B, Healthcare, Business Services, Manufacturing, Retail, Logistics, and Education. If your business is outside those sectors, get in touch; we'll tell you honestly whether we're the right fit.",
  },
];
