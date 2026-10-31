// One-off: turns an insight's interactive HTML bundle into native Portable
// Text, so the article text is in the page HTML once (PRD 6.1):
//   - headings, paragraphs and lists become text blocks
//   - each exhibit (<figure> with an H3 title) becomes an exhibit block with a
//     2x image of the chart, its title, and alt text from the chart's labels
//   - exhibits that are tables become table blocks with a title
//
//   node --env-file=.env scripts/convert-bundle.mjs <insight slug> [--write]
//
// Without --write it prints a summary and saves the images to a temp folder.
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "@playwright/test";

const [slug] = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const WRITE = process.argv.includes("--write");
const API = "https://qjvm6ww8.api.sanity.io/v2025-01-01";
const token = process.env.SANITY_WRITE_TOKEN;
if (!slug || (WRITE && !token)) {
  throw new Error(
    "Usage: convert-bundle.mjs <slug> [--write], with SANITY_WRITE_TOKEN",
  );
}

const q = encodeURIComponent(
  `*[_type == "insights" && slug.current == "${slug}" && !(_id in path("drafts.**"))][0]{_id, "file": htmlFile.asset->url}`,
);
const doc = (
  await (await fetch(`${API}/data/query/production?query=${q}`)).json()
).result;
if (!doc?.file) throw new Error(`${slug} has no HTML bundle`);

// The files CDN serves bundles sandboxed, so the bundle runs from a local copy.
const dir = mkdtempSync(join(tmpdir(), "bundle-"));
const local = join(dir, "bundle.html");
writeFileSync(local, Buffer.from(await (await fetch(doc.file)).arrayBuffer()));

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto(`file://${local}`);
await page.waitForTimeout(8000);

const blocks = await page.evaluate(() => {
  let n = 0;
  const key = () => `b${(n++).toString(36)}`;
  const clean = (t) => (t ?? "").replace(/\s+/g, " ").trim();
  const out = [];

  // Inline text with bold, italic and site links as Portable Text spans.
  const spans = (el) => {
    const children = [];
    const markDefs = [];
    const walk = (node, marks) => {
      if (node.nodeType === 3) {
        const text = node.textContent.replace(/\s+/g, " ");
        if (text.trim())
          children.push({ _type: "span", _key: key(), text, marks });
        return;
      }
      if (node.nodeType !== 1) return;
      let next = marks;
      if (node.tagName === "STRONG" || node.tagName === "B")
        next = [...marks, "strong"];
      if (node.tagName === "EM" || node.tagName === "I")
        next = [...marks, "em"];
      const href = node.tagName === "A" ? node.getAttribute("href") : null;
      if (href && href.startsWith("/")) {
        const k = key();
        markDefs.push({ _type: "link", _key: k, href });
        next = [...marks, k];
      }
      node.childNodes.forEach((c) => walk(c, next));
    };
    el.childNodes.forEach((c) => walk(c, []));
    if (children.length) {
      children[0].text = children[0].text.trimStart();
      children.at(-1).text = children.at(-1).text.trimEnd();
    }
    return { children, markDefs };
  };
  const text = (el, style, extra = {}) => {
    const { children, markDefs } = spans(el);
    if (children.length)
      out.push({
        _type: "block",
        _key: key(),
        style,
        markDefs,
        children,
        ...extra,
      });
  };

  let figure = 0;
  // eslint-disable-next-line no-undef -- runs in the page
  for (const el of document.body.querySelectorAll("h2, h3, p, li, figure")) {
    if (el.closest("button, nav, header, footer")) continue;
    const inFigure = el.tagName !== "FIGURE" && el.closest("figure");
    if (inFigure) continue;
    if (el.tagName === "FIGURE") {
      const title = clean(el.querySelector("h3")?.textContent);
      const table = el.querySelector("table");
      const chart =
        el.querySelectorAll("svg").length > 0 ||
        el.querySelectorAll("div").length > 4;
      if (table && !chart) {
        const rows = [...table.querySelectorAll("tr")];
        out.push({
          _type: "table",
          _key: key(),
          title: title || undefined,
          headerRow: !!rows[0]?.querySelector("th"),
          rows: rows.map((tr) => ({
            _type: "row",
            _key: key(),
            cells: [...tr.querySelectorAll("th, td")].map((c) =>
              clean(c.textContent),
            ),
          })),
        });
        continue;
      }
      el.setAttribute("data-exhibit", String(figure));
      const caption = clean(el.querySelector("figcaption")?.textContent);
      const labels = clean(
        el.innerText.replace(title, "").replace(caption, ""),
      );
      out.push({
        _type: "exhibit",
        _key: key(),
        title: title || undefined,
        caption: caption || undefined,
        alt: labels.slice(0, 600),
        shot: figure++,
      });
      continue;
    }
    if (el.tagName === "H2") text(el, "h2");
    else if (el.tagName === "H3") text(el, "h3");
    else if (el.tagName === "LI")
      text(el, "normal", { listItem: "bullet", level: 1 });
    else if (!el.closest("li")) text(el, "normal");
  }
  return out;
});

// One image per chart, without its title and caption (they render as text).
for (const b of blocks.filter((x) => x._type === "exhibit")) {
  const fig = page.locator(`[data-exhibit="${b.shot}"]`);
  await fig.evaluate((f) =>
    f
      .querySelectorAll("h3, figcaption")
      .forEach((e) => (e.style.display = "none")),
  );
  const file = join(dir, `exhibit-${b.shot}.png`);
  await fig.screenshot({ path: file });
  b.file = file;
}
await browser.close();

const count = (t) =>
  blocks.filter((b) => b._type === t || b.style === t).length;
console.log(
  `${slug}: ${blocks.length} blocks, h2 ${count("h2")}, h3 ${count("h3")}, paragraphs ${blocks.filter((b) => b.style === "normal" && !b.listItem).length}, list items ${blocks.filter((b) => b.listItem).length}, exhibits ${count("exhibit")}, tables ${count("table")}`,
);
console.log(`images in ${dir}`);

if (WRITE) {
  for (const b of blocks.filter((x) => x._type === "exhibit")) {
    const res = await fetch(
      `${API}/assets/images/production?filename=${slug}-exhibit-${b.shot + 1}.png`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "image/png",
        },
        body: readFileSync(b.file),
      },
    );
    const asset = (await res.json()).document;
    b.image = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt: b.alt,
    };
    delete b.file;
    delete b.shot;
    delete b.alt;
  }
  const res = await fetch(`${API}/data/mutate/production`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mutations: [
        {
          patch: {
            id: doc._id,
            set: { body: blocks, bodyFormat: "portableText" },
          },
        },
      ],
    }),
  });
  console.log(`written: ${res.status}`);
}
