// Plain-language copy rewrites from the GEO audit (GEO-AUDIT-REPORT.md) and
// sector multiples aligned to the industry pages. Each edit replaces one exact
// phrase in one field and stops if the field no longer contains it, so a
// re-run after Studio edits changes nothing by accident.
//
//   npx sanity exec migration/copy-rewrites.ts -- --dry-run
//   npx sanity exec migration/copy-rewrites.ts
import { createClient } from "@sanity/client";
import { projectId, dataset } from "../env";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});
const DRY = process.argv.includes("--dry-run");

const HOME = "page-home";
const SELL = "page-sell";
const BUYERS = "page-buyers";
const TEAM = "page-team";
const HUGO = "webflow-69b3faaa9cd4471c0ff9a32f";
const JULES = "webflow-69b3faaa9cd4471c0ff9a32d";
const TECH = "webflow-69b80ef543a239651eb33483";
const GUIDE = "ebitda-multiples-gcc-2026";

// [document id or insight slug, field path, current phrase, new phrase]
const edits: [string, string, string, string][] = [
  // Home
  [
    HOME,
    "sections[0].title",
    "Sell your business in the UAE.",
    "Sell your business in the UAE,",
  ],
  [
    HOME,
    "sections[0].soft",
    "Faster. For more.",
    "with the right buyer, at a fair price.",
  ],
  [
    HOME,
    "sections[0].sub",
    "The M&A advisory firm built for business owners in the UAE. No 12-month timelines. The right buyers, moving fast.",
    "Wusool Capital is a Dubai-based M&A advisory firm. We help UAE and GCC owners sell companies worth $1M to $25M: we prepare your business, find serious buyers and run the sale with you.",
  ],
  [HOME, "sections[1].items[0].unit", "First Offer", "to a first offer"],
  [
    HOME,
    "sections[1].items[0].text",
    "From mandate to first offer. Not 6 months.",
    "Our target from the day you hire us.",
  ],
  [HOME, "sections[1].items[2].unit", "Qualified Buyers", "buyers"],
  [
    HOME,
    "sections[1].items[2].text",
    "Pre-vetted acquirers matched to your sector.",
    "Investors and companies we have checked, sorted by the sectors they buy.",
  ],
  [
    HOME,
    "sections[2].title",
    "There's a better way to sell your business in the UAE",
    "How we run a sale, compared with a typical broker",
  ],
  [
    HOME,
    "sections[2].oldItems[2]",
    "You chase updates. Advisors go quiet.",
    "You chase the adviser for news",
  ],
  [
    HOME,
    "sections[2].newItems[2]",
    "You focus on your business. We run the process.",
    "A written update every week on every buyer",
  ],
  [
    HOME,
    "sections[2].newItems[3]",
    "Competitive process to drive the best outcome",
    "Several buyers make offers at the same time, so you can compare price and terms",
  ],
  [
    HOME,
    "sections[4].steps[1].text",
    "Our process matches you with pre-qualified acquirers from our network, based on your sector, size, and deal profile. No cold outreach. No generic lists.",
    "We pick buyers who already buy companies like yours, by sector and size. Each one signs a confidentiality agreement before they learn your name.",
  ],
  [
    HOME,
    "sections[4].steps[2].text",
    "We manage the full process end-to-end. NDAs, data room, negotiations. You stay focused on running your business.",
    "We handle the paperwork, share your documents securely with buyers and negotiate price and terms with you. You keep running your business.",
  ],
  [
    HOME,
    "sections[7].faq[0].answer",
    "Wusool Capital works mainly on a success-fee basis: we earn our main fee when your deal closes. A retainer is applied depending on the documentation needed before we start the process.",
    "Most of our fee is paid only when your sale completes. If your business needs documents prepared before going to buyers, we charge a fixed upfront fee and agree it with you in writing first.",
  ],
  [
    HOME,
    "sections[7].faq[2].answer",
    "It depends heavily on your sector. A technology business with recurring revenue might trade at 4-7x EBITDA. A restaurant in Dubai typically sells for 2-3x. A healthcare clinic can reach 5-6x with clean compliance. Use our free valuation calculator for an estimate based on live UAE transaction data: no sign-up needed.",
    "Buyers usually price a business as a multiple of its yearly profit (EBITDA). A profitable technology company in the UAE often sells for 10 to 20 times yearly profit. A healthcare clinic sells for 4 to 6 times, up to 7 for specialty clinics. A Dubai restaurant sells for 2 to 3 times. Our free valuation tool gives an estimate based on recent sales of similar businesses and our own deal experience, with no sign-up needed.",
  ],
  [HOME, "sections[7].title", "FAQ's", "FAQ"],
  // Sell
  [
    SELL,
    "sections[0].title",
    "The smarter way to sell your business in the UAE",
    "Sell your UAE business with an adviser who runs every step",
  ],
  [
    SELL,
    "sections[0].sub",
    "Most GCC advisors take 6-12 months and still bring you the wrong buyers. Wusool Capital does the opposite.",
    "We find buyers who fit your business, keep the sale confidential and aim to bring you a first offer within 6 weeks.",
  ],
  [
    SELL,
    "sections[1].title",
    "Selling your business should be easy",
    "What happens, step by step",
  ],
  [
    SELL,
    "sections[1].steps[1].text",
    "Our process matches you with pre-qualified acquirers from our network, based on your sector, size, and deal profile. No cold outreach. No generic lists.",
    "We pick buyers who already buy companies like yours, by sector and size. Each one signs a confidentiality agreement before they learn your name.",
  ],
  [
    SELL,
    "sections[1].steps[2].text",
    "We manage the full process end-to-end. NDAs, data room, negotiations. You stay focused on running your business.",
    "We handle the paperwork, share your documents securely with buyers and negotiate price and terms with you. You keep running your business.",
  ],
  [
    SELL,
    "sections[2].cards[0].text",
    "Get an instant customized valuation report based on real M&A transaction data, in 60 seconds.",
    "Get an estimate of your company's value in 60 seconds, based on recent sales of similar businesses.",
  ],
  [
    SELL,
    "sections[5].faq[0].answer",
    "Wusool Capital operates mainly on a success-fee model, where we earn more when you close. A retainer is applied depending on the documentation needed before we start the process.",
    "Most of our fee is paid only when your sale completes. If your business needs documents prepared before going to buyers, we charge a fixed upfront fee and agree it with you in writing first.",
  ],
  [
    SELL,
    "sections[5].faq[5].answer",
    "Yes, exclusivity is standard practice in any credible M&A process. It signals to buyers that you're committed, which drives better offers.",
    "Yes. You agree to work only with us for a set period, written in the contract. Buyers take a sale more seriously when one adviser runs it, which helps you get better offers.",
  ],
  [SELL, "sections[5].title", "FAQ's", "FAQ"],
  // Buyers
  [
    BUYERS,
    "sections[0].title",
    "GCC's most active deal flow under $25M.",
    "Buy a company in the UAE or GCC",
  ],
  [
    BUYERS,
    "sections[0].soft",
    "Curated. Confidential. Qualified.",
    "worth $1M to $25M.",
  ],
  [
    BUYERS,
    "sections[0].sub",
    "Wusool Capital matches serious acquirers with pre-qualified businesses for sale across the UAE and GCC. Application-only. No noise, no cold outreach.",
    "We send approved buyers companies for sale that match their sector and budget. Our team checks every company first. Joining is free and by application.",
  ],
  [
    BUYERS,
    "sections[4].cards[0].title",
    "Early access to quality deals",
    "See companies before they are public",
  ],
  [
    BUYERS,
    "sections[4].cards[0].text",
    "Deal flow reaches our network before any public listing. The best deals never go to market.",
    "Our sellers do not advertise, so buyers in our network hear about them first.",
  ],
  [
    BUYERS,
    "sections[4].cards[2].title",
    "Verified, not just listed",
    "Checked before you see it",
  ],
  [
    BUYERS,
    "sections[4].cards[2].text",
    "Every seller mandate is reviewed by Wusool Capital before being shared. Financials are assessed. Red flags are flagged.",
    "We review each seller's accounts and tell you about any gaps before you spend time on it.",
  ],
  [
    BUYERS,
    "sections[4].cards[3].title",
    "Confidentiality guaranteed",
    "Your name stays private",
  ],
  [BUYERS, "sections[5].title", "FAQ's", "FAQ"],
  ["page-benchmark", "sections[2].title", "FAQ's", "FAQ"],
  // Team
  [
    TEAM,
    "sections[0].sub",
    "Dubai-based and partner-led. Built for founders who deserve a better exit.",
    "Based in Dubai. A founder works on every sale, from the first call to the signed contract.",
  ],
  [
    TEAM,
    "sections[1].paragraphs[1]",
    "The sub-$20M M&A market in the UAE and broader GCC is broken. Advisors charge retainers before doing anything. Processes drag on for 12 months. Buyers are cold-outreached from generic lists. And founders, who've spent years building something real, end up with the wrong deal, or no deal at all.",
    "Selling a company worth $1M to $25M in the GCC is often slow and opaque. Processes can take a year. Buyers come from generic lists. Founders who spent years building something real end up with the wrong deal, or no deal at all.",
  ],
  [
    TEAM,
    "sections[1].paragraphs[3]",
    "Wusool Capital runs on an AI infrastructure. That means the financial modelling, buyer matching, and CIM preparation that used to take weeks now takes hours. The judgment on valuation, on deal structure and on which buyer is the right fit stays human.",
    "We use software to build financial models, shortlist buyers and draft the document buyers read. Work that took weeks now takes days. Hugo or Jules checks every number and makes every call on price, deal terms and buyers.",
  ],
  [
    HUGO,
    "shortBio",
    "8 years structuring deals on the legal side, term sheets, SAFEs, cap tables, and ADGM-compliant governance frameworks.",
    "Eight years as a deal lawyer. Hugo writes and negotiates the sale contract, so you know what you sign and what you remain liable for after the sale.",
  ],
  [
    JULES,
    "shortBio",
    "now applies that same buyer lens to every sell-side mandate.",
    "now uses that buyer's view to prepare each company for the questions buyers will ask.",
  ],
  // Technology industry page
  [
    TECH,
    "heroHeadline",
    "Sell Your Technology or SaaS Company in the UAE",
    "Sell your technology or software company in the UAE",
  ],
  [
    TECH,
    "heroSubtext",
    "Technology M&A in the UAE requires understanding SaaS vs services multiples, free zone transfer processes, and IP ownership structures.",
    "Buyers pay more for software sold by subscription than for project work. They also check that your code and brand belong to the company and that your free zone licence can be transferred. We prepare all three before buyers look.",
  ],
  [
    TECH,
    "whatBuyersLookFor[0].children[1].text",
    ": MRR/ARR with low churn is the primary value driver",
    ": customers who pay every month or year, and few who cancel. This raises your price more than anything else",
  ],
  // EBITDA guide: sectors other than technology follow the industry pages
  [
    GUIDE,
    "body[22].children[0].text",
    "healthcare at 4–7x, and retail and gyms sit at the floor of 1.5–3x",
    "healthcare at 4–6x (specialty clinics up to 7x), and gyms sit at the floor of 1.5–3x",
  ],
  [
    GUIDE,
    "body[28].children[0].text",
    "Healthcare and Clinics: 4–7x EBITDA",
    "Healthcare and clinics: 4–6x EBITDA, up to 7x for specialty clinics",
  ],
  [
    GUIDE,
    "body[32].children[0].text",
    "Education, Schools, Nurseries, Training Centres: 4–6x EBITDA",
    "Education, schools, nurseries and training centres: 4–7x EBITDA",
  ],
  [
    GUIDE,
    "body[52].children[0].text",
    "Retail, Brick-and-Mortar: 1.5–3x EBITDA",
    "Retail, brick-and-mortar: 2–4x EBITDA, depending on location",
  ],
];

const ids = [...new Set(edits.map((e) => e[0]))];
const docs = await client.fetch<Record<string, unknown>[]>(
  `*[(_id in $ids || slug.current in $ids) && !(_id in path("drafts.**"))]`,
  { ids },
);
const docFor = (k: string) =>
  docs.find(
    (d) => d._id === k || (d.slug as { current?: string })?.current === k,
  );

const get = (o: unknown, path: string) =>
  path
    .split(/\.|\[|\]/)
    .filter(Boolean)
    .reduce<unknown>((v, p) => (v as Record<string, unknown>)?.[p], o);

const patches = new Map<string, Record<string, string>>();
const values = new Map<string, string>();
let todo = 0;
for (const [k, path, from, to] of edits) {
  const doc = docFor(k);
  if (!doc) throw new Error(`missing document ${k}`);
  const id = doc._id as string;
  const value = values.get(`${id}:${path}`) ?? (get(doc, path) as string);
  if (typeof value !== "string") throw new Error(`${k} ${path} is not text`);
  if (value.includes(to) && !value.includes(from)) continue;
  if (!value.includes(from))
    throw new Error(`${k} ${path} no longer contains "${from}"`);
  const next = value.replace(from, to);
  values.set(`${id}:${path}`, next);
  patches.set(id, { ...patches.get(id), [path]: next });
  todo++;
}
console.log(`${todo} edits in ${patches.size} documents`);
if (DRY) process.exit(0);

const tx = client.transaction();
for (const [id, set] of patches) {
  const rev = docFor(id)?._rev as string;
  tx.patch(id, (p) => p.ifRevisionId(rev).set(set));
}
if (patches.size) await tx.commit();
console.log("done");
