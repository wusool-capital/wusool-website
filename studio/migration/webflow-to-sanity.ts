// Webflow CMS (and the 3 documents of the old Sanity project) to this Sanity
// project. Re-runnable: fixed document IDs, stable keys, createOrReplace.
//
//   npx sanity exec migration/webflow-to-sanity.ts            # write
//   npx sanity exec migration/webflow-to-sanity.ts -- --dry-run
//
// Needs WEBFLOW_TOKEN (read-only) and SANITY_WRITE_TOKEN in ../.env.
import { createClient } from "@sanity/client";
import { Schema } from "@sanity/schema";
import { builtinTypes } from "@sanity/schema/_internal";
import { htmlToBlocks } from "@portabletext/block-tools";
import { JSDOM } from "jsdom";
import { schemaTypes } from "../schemas";
import { projectId, dataset } from "../env";

type Doc = Record<string, unknown> & { _id: string; _type: string };
// Webflow field data is untyped JSON keyed by field slug.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fields = Record<string, any>;
type Item = {
  id: string;
  isDraft: boolean;
  isArchived: boolean;
  fieldData: Fields;
};

const DRY = process.argv.includes("--dry-run");
const { WEBFLOW_TOKEN, SANITY_WRITE_TOKEN } = process.env;
if (!WEBFLOW_TOKEN || (!DRY && !SANITY_WRITE_TOKEN)) {
  throw new Error("Set WEBFLOW_TOKEN and SANITY_WRITE_TOKEN in .env");
}

// Webflow collection IDs. The two test collections are left out (PRD 13, fix 3).
const WF = {
  team: "69aaa628c0f8adcccfb58673",
  transactions: "69aaa634fe086cfe92f30f19",
  insights: "69aaa645fa60624091050e8e",
  industries: "69b80dc4f2bfad122bd09c17",
  careers: "6a8c79398c73fd4a4dfa0f6c",
  reports: "6ac64c92647fc1acb46497de",
};
// Report slug to its public companion insight slug (PRD 6.1).
const COMPANIONS: Record<string, string> = {
  "padel-in-the-gulf": "gcc-padel-report-2026",
  "how-to-fund-a-buyout-in-the-uae-and-gcc-2026-playbook":
    "buyouts-in-the-gcc-lbo-mbo-funding",
};
const OLD_SANITY =
  "https://itidwo8t.apicdn.sanity.io/v2024-01-01/data/query/production";
const SETTINGS = {
  timeToFirstOffer: "6 weeks to first offer",
  dealSizeRange: "$1M to $25M",
  feeWording: "mainly success fee, with a retainer depending on documentation",
  legalName: "DOPAMINE INNOVATION CONSULTANCY - FZCO",
  address: "Building A5, Dubai Silicon Oasis, Dubai, UAE",
  license: "License: 54561 (DIEZA)",
  email: "contact@wusoolcapital.com",
  linkedinUrl: "https://www.linkedin.com/company/wusoolcapital",
};

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
});
const richTextType = Schema.compile({
  name: "default",
  types: [...builtinTypes, ...schemaTypes],
}).get("richText");

// --- Webflow --------------------------------------------------------------

async function wf(path: string) {
  const res = await fetch(`https://api.webflow.com/v2${path}`, {
    headers: { Authorization: `Bearer ${WEBFLOW_TOKEN}` },
  });
  if (!res.ok)
    throw new Error(`Webflow ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

// Webflow test items that are never migrated (PRD 13, fix 3).
const SKIP_SLUGS = new Set(["test-report"]);

async function pages(path: string): Promise<Item[]> {
  const all: Item[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await wf(`${path}?limit=100&offset=${offset}`);
    all.push(...page.items);
    if (all.length >= page.pagination.total) break;
  }
  return all;
}

// Items with option IDs replaced by their names. An item counts as published
// only if it is on the live site; everything else becomes a Sanity draft.
async function items(collectionId: string): Promise<Item[]> {
  const { fields } = await wf(`/collections/${collectionId}`);
  const options = new Map<string, string>();
  for (const f of fields)
    for (const o of f.validations?.options ?? []) options.set(o.id, o.name);
  const all = await pages(`/collections/${collectionId}/items`);
  const live = new Set(
    (await pages(`/collections/${collectionId}/items/live`)).map((i) => i.id),
  );
  for (const i of all) {
    i.isDraft = !live.has(i.id);
    for (const [k, v] of Object.entries(i.fieldData)) {
      if (typeof v === "string" && options.has(v))
        i.fieldData[k] = options.get(v);
    }
  }
  const skipped = all.filter(
    (i) => i.isArchived || SKIP_SLUGS.has(i.fieldData.slug),
  );
  for (const i of skipped) console.log(`skip ${i.fieldData.slug}`);
  return all.filter((i) => !skipped.includes(i));
}

// --- Assets ---------------------------------------------------------------

const uploaded = new Map<string, string>();
async function upload(kind: "image" | "file", url: string): Promise<string> {
  if (DRY) return `${kind}-dry-run`;
  const hit = uploaded.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url}: ${res.status}`);
  const filename = decodeURIComponent(url.split("/").pop() ?? "asset");
  // Sanity stores assets by content hash, so a re-run reuses the same asset.
  const asset = await client.assets.upload(
    kind,
    Buffer.from(await res.arrayBuffer()),
    { filename },
  );
  uploaded.set(url, asset._id);
  return asset._id;
}

async function image(field?: { url?: string; alt?: string | null }) {
  if (!field?.url) return undefined;
  const ref = await upload("image", field.url);
  return {
    _type: "image",
    asset: { _type: "reference", _ref: ref },
    ...(field.alt ? { alt: field.alt } : {}),
  };
}

// --- Rich text ------------------------------------------------------------

const parse = (html: string) => new JSDOM(html).window.document;
const text = (el: Element) =>
  (el.textContent ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Deterministic keys, so a re-run writes identical documents.
function keys(prefix: string) {
  let n = 0;
  return () => `${prefix}${(n++).toString(36)}`;
}

async function portableText(html: string | undefined, keyPrefix: string) {
  if (!html) return undefined;
  const srcs = [...parse(html).querySelectorAll("img")].map(
    (i) => i.getAttribute("src") ?? "",
  );
  const refs = new Map<string, string>();
  for (const src of srcs) if (src) refs.set(src, await upload("image", src));
  const key = keys(keyPrefix);
  return htmlToBlocks(html, richTextType as never, {
    parseHtml: parse,
    keyGenerator: key,
    rules: [
      {
        // Tables keep their rows and cells (text only).
        deserialize(el) {
          if ((el as Element).tagName !== "TABLE") return undefined;
          const rows = [...(el as Element).querySelectorAll("tr")];
          return {
            _type: "table",
            headerRow: rows[0]?.querySelector("th") !== null,
            rows: rows.map((tr) => ({
              _key: key(),
              _type: "row",
              cells: [...tr.querySelectorAll("th, td")].map(text),
            })),
          };
        },
      },
      {
        deserialize(el) {
          if ((el as Element).tagName !== "IMG") return undefined;
          const img = el as Element;
          const ref = refs.get(img.getAttribute("src") ?? "");
          if (!ref) return undefined;
          const alt = img.getAttribute("alt");
          return {
            _type: "image",
            asset: { _type: "reference", _ref: ref },
            ...(alt ? { alt } : {}),
          };
        },
      },
    ],
  });
}

// FAQ HTML to Q&A pairs. A question is a heading, a paragraph led by bold
// text ending in "?", or "Q: ..." text. A heading that only titles the list
// ("FAQ") is skipped. Every pair is checked in checkFaqs() before writing.
const FAQ_TITLE = /^(faq'?s?|frequently asked questions)$/i;
function faq(html: string | undefined, keyPrefix: string) {
  if (!html) return undefined;
  const pairs: { question: string; answer: string }[] = [];
  for (const el of parse(html).body.querySelectorAll(
    "h1,h2,h3,h4,h5,h6,p,li",
  )) {
    const t = text(el);
    if (!t || FAQ_TITLE.test(t)) continue;
    const lead = el.firstElementChild;
    const bold =
      el.tagName === "P" &&
      lead &&
      /^(STRONG|B)$/.test(lead.tagName) &&
      t.startsWith(text(lead)) &&
      text(lead).endsWith("?")
        ? text(lead)
        : undefined;
    const qa = t.match(/^Q:\s*(.*?)(?:\s*A:\s*(.*))?$/i);
    if (/^H\d$/.test(el.tagName)) pairs.push({ question: t, answer: "" });
    else if (bold)
      pairs.push({ question: bold, answer: t.slice(bold.length).trim() });
    else if (qa) pairs.push({ question: qa[1], answer: qa[2] ?? "" });
    else if (pairs.length) {
      const last = pairs[pairs.length - 1];
      last.answer = [last.answer, t.replace(/^A:\s*/i, "")]
        .filter(Boolean)
        .join(" ");
    }
  }
  const key = keys(keyPrefix);
  return pairs.map((p) => ({ _key: key(), _type: "faqItem", ...p }));
}

// Fails the run if any FAQ pair lost its question or answer.
function checkFaqs(docs: Doc[]) {
  const bad = docs.flatMap((d) =>
    ((d.faq as { question: string; answer: string }[]) ?? [])
      .filter((p) => !p.question || !p.answer || FAQ_TITLE.test(p.question))
      .map(
        (p) => `${(d.slug as { current: string })?.current}: "${p.question}"`,
      ),
  );
  if (bad.length) throw new Error(`Broken FAQ pairs:\n${bad.join("\n")}`);
}

// Key takeaways HTML to a list of strings.
function list(html: string | undefined) {
  if (!html) return undefined;
  const doc = parse(html);
  const els = doc.querySelectorAll("li").length
    ? doc.querySelectorAll("li")
    : doc.querySelectorAll("p");
  return [...els].map(text).filter(Boolean);
}

const slug = (s: string) => ({ _type: "slug", current: s });
const csv = (s?: string) =>
  s
    ?.split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const id = (i: Item) =>
  i.isDraft ? `drafts.webflow-${i.id}` : `webflow-${i.id}`;
const ref = (wfId?: string) =>
  wfId ? { _type: "reference", _ref: `webflow-${wfId}` } : undefined;

// --- Mapping per collection -------------------------------------------------

async function teamMember(i: Item): Promise<Doc> {
  const f = i.fieldData;
  return {
    _id: id(i),
    _type: "teamMember",
    name: f.name,
    slug: slug(f.slug),
    roleTitle: f["role-title"],
    bio: await portableText(f.bio, "b"),
    shortBio: f["short-bio"],
    headshot: await image(f.headshot),
    credentials: f.credentials,
    email: f.email,
    linkedinUrl: f["linkedin-url"],
    xTwitterUrl: f["x-twitter-url"],
    crunchbaseUrl: f["crunchbase-url"],
    wikidataUrl: f["wikidata-url"],
    expertiseTags: csv(f["expertise-tags"]),
    yearsOfExperience: f["years-of-experience"],
    basedIn: f["based-in"],
    languages: csv(f.languages),
    seoTitle: f["seo-title"],
    seoDescription: f["seo-description"],
  };
}

async function industry(i: Item): Promise<Doc> {
  const f = i.fieldData;
  return {
    _id: id(i),
    _type: "industry",
    name: f.name,
    slug: slug(f.slug),
    heroHeadline: f["hero-headline"],
    heroSubtext: f["hero-subtext"],
    sectorOverview: await portableText(f["sector-overview"], "o"),
    ebitdaMultipleRange: f["ebitda-multiple-range"],
    whatBuyersLookFor: await portableText(f["what-buyers-look-for"], "w"),
    commonDealKillers: await portableText(f["common-deal-killers"], "k"),
    dealTimeline: f["deal-timeline"],
    buyerTypes: f["buyer-types"],
    // PRD 13, fix 8: one approved deal size everywhere.
    dealSizeRange: SETTINGS.dealSizeRange,
    clusterArticleUrl: f["cluster-article-url"],
    clusterArticleLabel: f["cluster-article-label"],
    faq: faq(f.faq, "f"),
    featuredImage: await image(f["featured-image"]),
    seoMetaTitle: f["seo-meta-title"],
    seoMetaDescription: f["seo-meta-description"],
    sortOrder: f["sort-order"],
  };
}

async function career(i: Item): Promise<Doc> {
  const f = i.fieldData;
  return {
    _id: id(i),
    _type: "career",
    name: f.name,
    slug: slug(f.slug),
    department: f.department,
    location: f.location,
    employmentType: f["employment-type"],
    datePosted: f["date-posted"],
    validThrough: f["valid-through"],
    status: f.status,
    linkedinApplyUrl: f["linkedin-apply-url"],
    shortDescription: f["short-description"],
    responsibilities: await portableText(f.responsibilities, "r"),
    requirements: await portableText(f.requirements, "q"),
    metaTitle: f["meta-title"],
    metaDescription: f["meta-description"],
  };
}

async function transaction(i: Item): Promise<Doc> {
  const f = i.fieldData;
  return {
    _id: id(i),
    _type: "transaction",
    name: f.name,
    slug: slug(f.slug),
    category: f.category,
    status: f.status,
    sector: f.sector,
    country: f.country,
    cityEmirate: f["city-emirate"],
    dealType: f["deal-type"],
    revenueRange: f["revenue-range"],
    dealSizeRange: f["deal-size-range"],
    year: f.year,
    date: f.date,
    timeToClose: f["time-to-close"],
    oneLineDescription: f["one-line-description"],
    dealSummaryExtended: await portableText(f["deal-summary-extended"], "s"),
    counterparties: f.counterparties,
    clientLogo: await image(f["client-logo"]),
    industryKeywords: f["industry-keywords"],
    sortOrder: f["sort-order"],
  };
}

// Webflow-only fields of an insight, also laid over the copied Sanity insight.
async function insightFields(f: Fields) {
  return {
    excerpt: f.excerpt,
    featuredImage: await image(f["featured-image"]),
    heroImage: await image(f["hero-image"]),
    ogImage: await image({ url: f["og-image"]?.url }),
    author: ref(f.author),
    lastUpdated: f["last-updated"],
    readingTime: f["reading-time"],
    wordCount: f["word-count"],
    featured: f.featured,
    gated: f.gated,
    hideFromListings: f["hide-from-listings"],
    ctaText: f["cta-text"],
    ctaUrl: f["cta-url"],
    keyTakeaways: list(f["key-takeaways"]),
    faq: faq(f["faq-content"], "f"),
  };
}

async function insight(i: Item): Promise<Doc> {
  const f = i.fieldData;
  return {
    _id: id(i),
    _type: "insights",
    title: f.name,
    slug: slug(f.slug),
    contentType: f["content-type"],
    silo: f["primary-silo"],
    body: await portableText(f["body-content"], "p"),
    h1: f["h1-tag"],
    seoTitle: f["seo-title"],
    seoDescription: f["seo-description"],
    ogTitle: f["og-title"],
    targetKeyword: f["target-keyword"],
    publishedAt: f["published-date"],
    pressOutlet: f["press-outlet"],
    pressUrl: f["press-url"],
    ...(await insightFields(f)),
  };
}

// --- Old Sanity project (reports and Sanity-managed insights) ----------------

// Asset refs point at the old project, so each asset is copied across.
async function copyAssets(value: unknown): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(copyAssets));
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const asset = obj.asset as { _ref?: string } | undefined;
  if (asset?._ref) {
    const [kind, hash, ...rest] = asset._ref.split("-");
    const ext = rest.pop();
    const path =
      kind === "image"
        ? `images/itidwo8t/production/${hash}-${rest.join("-")}.${ext}`
        : `files/itidwo8t/production/${hash}.${ext}`;
    const newRef = await upload(
      kind as "image" | "file",
      `https://cdn.sanity.io/${path}`,
    );
    return { ...obj, asset: { _type: "reference", _ref: newRef } };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = await copyAssets(v);
  return out;
}

async function oldSanity(type: string): Promise<Doc[]> {
  const url = `${OLD_SANITY}?query=${encodeURIComponent(`*[_type == "${type}"]`)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Old Sanity ${type}: ${res.status}`);
  const { result } = await res.json();
  return Promise.all(
    result.map(async (d: Doc) => {
      // System fields and the old free-text author are not carried over.
      const dropped = ["_rev", "_createdAt", "_updatedAt", "_system", "author"];
      const rest = Object.fromEntries(
        Object.entries(d).filter(([k]) => !dropped.includes(k)),
      );
      return (await copyAssets(rest)) as Doc;
    }),
  );
}

// Old Sanity doc with the Webflow values laid over it, matched by slug.
// Empty Webflow values never overwrite old values.
async function merged(
  type: string,
  wfItems: Item[],
  webflowOnly: (f: Fields) => Promise<object>,
) {
  const old = await oldSanity(type);
  const oldSlugs = new Set(
    old.map((d) => (d.slug as { current: string }).current),
  );
  const bySlug = new Map(wfItems.map((i) => [i.fieldData.slug, i]));
  const docs = await Promise.all(
    old.map(async (d) => {
      const wfItem = bySlug.get((d.slug as { current: string }).current);
      const overlay = wfItem ? await webflowOnly(wfItem.fieldData) : {};
      const filled = Object.entries(overlay).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      );
      return { ...d, ...Object.fromEntries(filled) };
    }),
  );
  // Webflow items with no document in the old project are migrated from Webflow.
  return { docs, rest: wfItems.filter((i) => !oldSlugs.has(i.fieldData.slug)) };
}

async function reportFields(f: Fields) {
  return {
    silo: f["primary-silo"],
    publishedAt: f["published-date"],
    seoTitle: f["seo-title"],
    seoDescription: f["seo-description"],
    ogTitle: f["og-title"],
    bannerPinned: f["pin-to-banner"],
    featuredImage: await image(f["featured-image"]),
    ogImage: await image({ url: f["og-image"]?.url }),
    readingTime: f["reading-time"],
    featured: f.featured,
    lastUpdated: f["last-updated"],
    ctaText: f["cta-text"],
    ctaUrl: f["cta-url"],
    excerpt: f.excerpt,
  };
}

async function report(i: Item): Promise<Doc> {
  const f = i.fieldData;
  return {
    _id: id(i),
    _type: "report",
    title: f.name,
    slug: slug(f.slug),
    ...(await reportFields(f)),
  };
}

// --- Run ------------------------------------------------------------------

// The last run time. Re-runs refuse to overwrite documents edited in Studio
// after it, unless --force is passed.
const MARKER = "migration.webflow";

async function guardEdits() {
  const marker = await client.getDocument(MARKER);
  if (!marker || process.argv.includes("--force")) return;
  const edited: string[] = await client.fetch(
    `*[_updatedAt > $t && !(_type match "sanity.*") && _id != $m]._id`,
    { t: marker.lastRun, m: MARKER },
  );
  if (edited.length) {
    throw new Error(
      `Edited in Sanity since the last run, would be overwritten:\n${edited.join("\n")}\nRun with --force to overwrite.`,
    );
  }
}

// Removes migrated documents whose Webflow item was deleted, archived, or
// switched between draft and published since the last run.
async function removeStale(written: Set<string>) {
  const ids: string[] = await client.fetch(
    `*[_id match "webflow-*" || _id match "drafts.webflow-*"]._id`,
  );
  const stale = ids.filter((i) => !written.has(i));
  for (const i of stale) console.log(`remove ${i}`);
  if (stale.length) {
    const tx = client.transaction();
    for (const i of stale) tx.delete(i);
    await tx.commit();
  }
}

// One count per document, whether it exists as published, draft or both.
async function distinctCounts(types: string[]) {
  const rows: { _id: string; _type: string }[] = await client.fetch(
    `*[_type in $types]{_id, _type}`,
    { types },
  );
  const ids = new Map(types.map((t) => [t, new Set<string>()]));
  for (const r of rows) ids.get(r._type)?.add(r._id.replace(/^drafts\./, ""));
  return Object.fromEntries(types.map((t) => [t, ids.get(t)?.size ?? 0]));
}

const clean = (d: Doc) => JSON.parse(JSON.stringify(d)) as Doc; // drops undefined fields

async function main() {
  const [
    wfTeam,
    wfIndustries,
    wfCareers,
    wfTransactions,
    wfInsights,
    wfReports,
  ] = await Promise.all(
    [
      WF.team,
      WF.industries,
      WF.careers,
      WF.transactions,
      WF.insights,
      WF.reports,
    ].map(items),
  );
  const managed = wfInsights.filter((i) => i.fieldData["sanity-managed"]);
  const sanityInsights = await merged("insights", managed, insightFields);
  const sanityReports = await merged("report", wfReports, reportFields);

  const docs: Doc[] = [
    ...(await Promise.all(wfTeam.map(teamMember))),
    ...(await Promise.all(wfIndustries.map(industry))),
    ...(await Promise.all(wfCareers.map(career))),
    ...(await Promise.all(wfTransactions.map(transaction))),
    ...(await Promise.all(
      wfInsights.filter((i) => !i.fieldData["sanity-managed"]).map(insight),
    )),
    ...sanityInsights.docs,
    ...(await Promise.all(sanityInsights.rest.map(insight))),
    ...sanityReports.docs,
    ...(await Promise.all(sanityReports.rest.map(report))),
  ].map(clean);
  checkFaqs(docs);

  // Companion insight references, by slug.
  const idBySlug = new Map(
    docs
      .filter((d) => d._type === "insights")
      .map((d) => [
        (d.slug as { current: string }).current,
        d._id.replace(/^drafts\./, ""),
      ]),
  );
  for (const d of docs.filter((d) => d._type === "report")) {
    const companion = idBySlug.get(
      COMPANIONS[(d.slug as { current: string }).current],
    );
    if (companion) d.companionInsight = { _type: "reference", _ref: companion };
  }

  const expected: Record<string, number> = {
    teamMember: wfTeam.length,
    industry: wfIndustries.length,
    career: wfCareers.length,
    transaction: wfTransactions.length,
    insights: wfInsights.length,
    report: wfReports.length,
  };

  if (!DRY) {
    await guardEdits();
    // Batches stay under the 4 MB request limit (report HTML is large).
    let tx = client.transaction();
    let size = 0;
    for (const d of docs) {
      const bytes = JSON.stringify(d).length;
      if (size && size + bytes > 3_000_000) {
        await tx.commit();
        tx = client.transaction();
        size = 0;
      }
      tx.createOrReplace(d);
      size += bytes;
    }
    await tx.commit();
    // Settings are written once and then edited in Studio only.
    await client.createIfNotExists({
      _id: "siteSettings",
      _type: "siteSettings",
      ...SETTINGS,
    });
    await removeStale(new Set(docs.map((d) => d._id)));
    await client.createOrReplace({
      _id: MARKER,
      _type: "migrationRun",
      lastRun: await client.fetch("now()"),
    });
  }

  // Count check: Webflow items (non-archived) against Sanity documents.
  const actual: Record<string, number> = DRY
    ? Object.fromEntries(
        Object.keys(expected).map((t) => [
          t,
          docs.filter((d) => d._type === t).length,
        ]),
      )
    : await distinctCounts(Object.keys(expected));
  let ok = true;
  console.log(`${DRY ? "Dry run" : "Migrated"} to ${projectId}/${dataset}`);
  for (const t of Object.keys(expected)) {
    const match = expected[t] === actual[t];
    ok &&= match;
    console.log(
      `${match ? "ok  " : "FAIL"} ${t.padEnd(12)} webflow ${expected[t]}  sanity ${actual[t]}`,
    );
  }
  if (!ok) process.exit(1);
}

await main();
