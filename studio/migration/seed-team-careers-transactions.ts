// Creates the Team and Careers pages from the live copy, with
// the approved fixes (6 weeks to first offer, fee wording, no em dashes).
// Never overwrites a page that exists.
//
//   npx sanity exec migration/seed-team-careers-transactions.ts
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
const items = <T extends object>(list: T[]) =>
  list.map((i) => ({ _key: key(), ...i }));
const ids = Object.fromEntries(
  (
    await client.fetch<{ _id: string; slug: string }[]>(
      `*[_type == "teamMember" && !(_id in path("drafts.**"))]{_id, "slug": slug.current}`,
    )
  ).map((m) => [m.slug, m._id]),
);
const ref = (slug: string) => {
  if (!ids[slug]) throw new Error(`No team member ${slug}`);
  return { _key: key(), _type: "reference", _ref: ids[slug] };
};
const hero = (title: string, sub: string) => ({
  _key: key(),
  _type: "heroSection",
  title,
  sub,
  visual: "none",
});
const talk = { label: "Talk to us", form: "get-started" };
type Doc = { _id: string; _type: string; [k: string]: unknown };

const team: Doc = {
  _id: "page-team",
  _type: "page",
  title: "Team",
  slug: { _type: "slug", current: "team" },
  seo: {
    title: "Meet the Team | Wusool Capital M&A Advisory Dubai",
    description:
      "Meet the team behind GCC's tech-powered M&A advisory. Private equity, VC, and legal backgrounds. Dubai-based. Helping founders sell faster, for more.",
  },
  sections: [
    hero(
      "The Team",
      "Dubai-based and partner-led. Built for founders who deserve a better exit.",
    ),
    {
      _key: key(),
      _type: "noteSection",
      title: "A note from the founders",
      paragraphs: [
        "We built Wusool Capital because the GCC's best businesses deserve better than what the market currently offers them.",
        "The sub-$20M M&A market in the UAE and broader GCC is broken. Advisors charge retainers before doing anything. Processes drag on for 12 months. Buyers are cold-outreached from generic lists. And founders, who've spent years building something real, end up with the wrong deal, or no deal at all.",
        "We come from the other side of the table. Jules has spent eight years evaluating businesses as an investor across GCC and Africa. Hugo has spent eight years structuring the legal architecture of deals. Between us, we've seen what separates a clean exit from a failed process, and it almost always comes down to preparation, access, and speed.",
        "Wusool Capital runs on an AI infrastructure. That means the financial modelling, buyer matching, and CIM preparation that used to take weeks now takes hours. The judgment on valuation, on deal structure and on which buyer is the right fit stays human.",
      ],
      signers: [ref("hugo-cugnet"), ref("jules-chasles")],
    },
    {
      _key: key(),
      _type: "teamSection",
      title: "The team",
      cta: talk,
    },
    {
      _key: key(),
      _type: "statsSection",
      items: items([
        {
          num: "100+",
          unit: "Deals",
          text: "M&A, private equity, and advisory mandates completed",
        },
        {
          num: "300+",
          unit: "Buyers",
          text: "Pre-qualified acquirers in our network",
        },
        {
          num: "6 weeks",
          unit: "First offer",
          text: "From mandate to first offer",
        },
        { num: "16+", unit: "Years", text: "Combined deal-side experience" },
      ]),
    },
    {
      _key: key(),
      _type: "featureCardsSection",
      title: "How we work",
      cards: items([
        {
          title: "Every mandate is partner-led",
          text: "No handoffs to junior staff. Jules or Hugo is in every key conversation, from first valuation call to final negotiation.",
        },
        {
          title: "Buyers see a clean process",
          text: "Wusool Capital works behind the scenes. Buyers and investors experience a well-prepared deal, with no consulting layer on top of yours.",
        },
        {
          title: "We come from the other side of the table",
          text: "Our team has reviewed deals as investors and structured them as lawyers. That perspective is what we bring to every founder.",
        },
      ]),
      cta: talk,
    },
    {
      _key: key(),
      _type: "postsSection",
      title: "Latest from Wusool Capital",
      allLink: { label: "See all posts", href: "/insights" },
    },
  ],
};

const careers: Doc = {
  _id: "page-careers",
  _type: "page",
  title: "Careers",
  slug: { _type: "slug", current: "careers" },
  seo: {
    title: "Careers at Wusool Capital | M&A Jobs in Dubai, UAE",
    description:
      "Join Wusool Capital, GCC's first tech-powered M&A advisory. Open finance and deal roles in Dubai, UAE. Apply on LinkedIn.",
  },
  closingCta: {
    title: "Don't see your role?",
    text: "We're a small, growing team. Reach out on LinkedIn. We read every message.",
    button: {
      label: "View Wusool Capital on LinkedIn",
      href: "https://www.linkedin.com/company/wusoolcapital/",
    },
  },
  sections: [
    hero(
      "Careers at Wusool Capital",
      "We're building the GCC's first tech-powered M&A firm. Small team, high ownership, real deal experience from day one.",
    ),
    {
      _key: key(),
      _type: "featureCardsSection",
      title: "Why Wusool Capital",
      cards: items([
        {
          title: "AI-native process",
          text: "Our process runs on proprietary automation. You'll work close to the model, not around it.",
        },
        {
          title: "High ownership",
          text: "Small team, few hires. Every person here runs real workstreams on live deals, fast.",
        },
        {
          title: "GCC-native",
          text: "Based in Dubai, building the region's first tech-powered M&A advisory from here.",
        },
      ]),
    },
    {
      _key: key(),
      _type: "rolesSection",
      title: "Open roles",
      empty:
        "No open roles right now. Follow us on LinkedIn to hear about the next one.",
    },
  ],
};

for (const doc of [team, careers]) {
  const res = await client.createIfNotExists(doc);
  console.log(`${doc._id}: ${res._rev ? "ok" : "exists"}`);
}
