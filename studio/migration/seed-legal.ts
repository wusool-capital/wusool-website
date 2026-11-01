// Creates the Privacy Policy and Terms pages from the live HTML, with em
// dashes removed and the registered entity name in the Terms meta (fix 2).
// Never overwrites a page that exists.
//
//   npx sanity exec migration/seed-legal.ts
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
const decode = (t: string) =>
  t
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;|‍/g, " ");
const dashes = (t: string) => t.replace(/\s*—\s*/g, ", ");

// Inline HTML (strong, em, a) to Portable Text spans and link marks.
function spans(html: string) {
  const children: {
    _type: "span";
    _key: string;
    text: string;
    marks: string[];
  }[] = [];
  const markDefs: { _type: "link"; _key: string; href: string }[] = [];
  const marks: string[] = [];
  for (const part of html.split(/(<[^>]+>)/)) {
    if (!part) continue;
    const open = part.match(/^<(strong|b|em|i|a)\b([^>]*)>$/);
    const close = part.match(/^<\/(strong|b|em|i|a)>$/);
    if (open) {
      if (open[1] === "a") {
        const href = decode(open[2].match(/href="([^"]*)"/)?.[1] ?? "");
        const k = key();
        markDefs.push({ _type: "link", _key: k, href });
        marks.push(k);
      } else marks.push(/strong|b/.test(open[1]) ? "strong" : "em");
    } else if (close) marks.pop();
    else if (!part.startsWith("<")) {
      const text = dashes(decode(part));
      if (text)
        children.push({ _type: "span", _key: key(), text, marks: [...marks] });
    }
  }
  return { children, markDefs };
}

async function convert(url: string) {
  const html = await (await fetch(url)).text();
  const start = html.indexOf("</h1>") + 5;
  const end = html.indexOf("</div>", start);
  const body = html.slice(start, end);
  const blocks = [];
  let updated: string | undefined;
  let intro: string | undefined;
  for (const m of body.matchAll(/<(h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const [, tag, inner] = m;
    const text = decode(inner.replace(/<[^>]+>/g, "")).trim();
    if (!text) continue;
    if (!updated && /^Last updated:/i.test(text)) {
      updated = text.replace(/^Last updated:\s*/i, "");
      continue;
    }
    if (!intro && tag === "p" && blocks.length === 0) {
      intro = dashes(text);
      continue;
    }
    const { children, markDefs } = spans(inner);
    blocks.push({
      _type: "block",
      _key: key(),
      style: tag === "li" || tag === "p" ? "normal" : tag,
      ...(tag === "li" && { listItem: "bullet", level: 1 }),
      markDefs,
      children,
    });
  }
  return { blocks, updated, intro };
}

const docs = [
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    seo: {
      title: "Privacy Policy | Wusool Capital M&A Advisory UAE",
      description:
        "How Wusool Capital collects, uses and protects your personal data. PDPL-compliant privacy policy for wusoolcapital.com. Based in Dubai, UAE.",
    },
  },
  {
    id: "terms",
    title: "Terms of Service",
    seo: {
      title: "Terms of Service | Wusool Capital M&A Advisory UAE",
      description:
        "Terms governing the use of Wusool Capital's website and M&A advisory services. DOPAMINE INNOVATION CONSULTANCY - FZCO, Dubai, UAE.",
    },
  },
];

for (const d of docs) {
  const { blocks, updated, intro } = await convert(
    `https://www.wusoolcapital.com/${d.id}`,
  );
  const res = await client.createIfNotExists({
    _id: `legal-${d.id}`,
    _type: "legal",
    title: d.title,
    slug: { _type: "slug", current: d.id },
    seo: d.seo,
    lastUpdated: updated,
    intro,
    body: blocks,
  });
  console.log(
    `${d.id}: ${blocks.length} blocks, updated ${updated}, ${res._rev ? "ok" : "exists"}`,
  );
}
