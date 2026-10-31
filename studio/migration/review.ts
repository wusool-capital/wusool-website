// Compares migrated insights with their Webflow source, field by field.
//   npx sanity exec migration/review.ts -- slug-one slug-two ...
import { createClient } from "@sanity/client";
import { JSDOM } from "jsdom";
import { projectId, dataset } from "../env";

const slugs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function webflow(slug: string) {
  const url = `https://api.webflow.com/v2/collections/69aaa645fa60624091050e8e/items?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.WEBFLOW_TOKEN}` },
  });
  return (await res.json()).items[0]?.fieldData ?? {};
}

// Leaf text blocks, so nested lists are not counted twice.
const BLOCKS =
  "p, h1, h2, h3, h4, h5, h6, blockquote, figcaption, li:not(:has(p)), th, td";
// Question count read straight from the HTML: lines ending in "?" that are
// headings or bold text.
const questions = (s = "") =>
  [...html(s).querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b")].filter(
    (e) =>
      !e.closest("h1,h2,h3,h4,h5,h6")?.contains(e.parentElement) &&
      !(/^(STRONG|B)$/.test(e.tagName) && e.closest("h1,h2,h3,h4,h5,h6")) &&
      (e.textContent ?? "").trim().endsWith("?"),
  ).length;
// Body headings must start at H2 and never skip a level.
const headingOrder = (blocks: Block[]) => {
  const levels = blocks
    .map((b) => b.style?.match(/^h(\d)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  const bad = levels[0] !== undefined && levels[0] !== 2;
  const skip = levels.some((l, i) => i > 0 && l > levels[i - 1] + 1);
  return bad || skip ? `levels ${levels.join(",")}` : "H2 first, no skips";
};
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const html = (s = "") => new JSDOM(s).window.document;

type Block = {
  _type: string;
  style?: string;
  children?: { text: string }[];
  markDefs?: unknown[];
};

for (const slug of slugs) {
  const f = await webflow(slug);
  const d = await client.fetch(
    `*[_type == "insights" && slug.current == $slug][0]{..., "author": author->name}`,
    {
      slug,
    },
  );
  const body = html(f["body-content"]);
  const blocks: Block[] = d?.body ?? [];
  const ptText = blocks
    .flatMap(
      (b) =>
        b.children?.map((c) => c.text).join("") ??
        (b as { rows?: { cells: string[] }[] }).rows
          ?.flatMap((r) => r.cells)
          .join(" ") ??
        [],
    )
    .join(" ");
  const same = (a: unknown, b: unknown) => (a ?? "") === (b ?? "");
  const rows: [string, string | number, string | number, boolean][] = [
    ["title", f.name, d?.title, same(f.name, d?.title)],
    [
      "seo title",
      f["seo-title"],
      d?.seoTitle,
      same(f["seo-title"], d?.seoTitle),
    ],
    [
      "seo description",
      f["seo-description"],
      d?.seoDescription,
      same(f["seo-description"], d?.seoDescription),
    ],
    ["h1", f["h1-tag"], d?.h1, same(f["h1-tag"], d?.h1)],
    [
      "body words",
      words(
        [...body.querySelectorAll(BLOCKS)].map((e) => e.textContent).join(" "),
      ),
      words(ptText),
      false,
    ],
    [
      "headings",
      body.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      blocks.filter((b) => /^h\d$/.test(b.style ?? "")).length,
      false,
    ],
    [
      "links",
      body.querySelectorAll("a").length,
      blocks.reduce((n, b) => n + (b.markDefs?.length ?? 0), 0),
      false,
    ],
    [
      "images",
      body.querySelectorAll("img").length,
      blocks.filter((b) => b._type === "image").length,
      false,
    ],
    ["FAQ pairs", questions(f["faq-content"]), d?.faq?.length ?? 0, false],
    [
      "takeaways",
      html(f["key-takeaways"]).querySelectorAll("li").length,
      d?.keyTakeaways?.length ?? 0,
      false,
    ],
    [
      "heading order",
      "H2 first, no skips",
      headingOrder(blocks),
      headingOrder(blocks) === "H2 first, no skips",
    ],
    ["author", f.author ? "set" : "none", d?.author ?? "none", false],
  ];
  console.log(`\n${slug}`);
  for (const [name, a, b, exact] of rows) {
    const ok =
      exact || name === "author"
        ? exact || (a === "none") === (b === "none")
        : a === b;
    console.log(
      `  ${ok ? "ok  " : "DIFF"} ${name.padEnd(16)} webflow ${String(a).slice(0, 60)} | sanity ${String(b).slice(0, 60)}`,
    );
  }
}
