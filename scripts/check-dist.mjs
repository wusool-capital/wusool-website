// SEO and budget gates (PRD 14.4) run against the built site in dist/.
// Exits 1 and lists every failure.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "node-html-parser";

const DIST = "dist";
const SITE = "https://www.wusoolcapital.com";
const JS_BUDGET = 50 * 1024;
const CSS_BUDGET = 100 * 1024;

const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });

const htmlFiles = files(DIST).filter((f) => f.endsWith(".html"));
const errors = [];
const seen = { title: new Map(), description: new Map() };

// dist/index.html -> /, dist/sell.html -> /sell, dist/a/index.html -> /a
const pathOf = (file) =>
  "/" +
  relative(DIST, file)
    .replace(/(^|\/)index\.html$/, "")
    .replace(/\.html$/, "");

// Internal link target exists as a built page or file.
const exists = (href) => {
  const p = decodeURI(href.split(/[?#]/)[0]).replace(/\/$/, "");
  if (p === "") return true;
  return [p, `${p}.html`, `${p}/index.html`].some((c) =>
    existsSync(join(DIST, c)),
  );
};

const size = (src) => {
  const p = join(DIST, src.split("?")[0]);
  return existsSync(p) ? statSync(p).size : 0;
};

for (const file of htmlFiles) {
  const path = pathOf(file);
  const err = (msg) => errors.push(`${path}: ${msg}`);
  const doc = parse(readFileSync(file, "utf8"));
  const noindex = /noindex/.test(
    doc.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
  );

  // Links and alt text apply to every page, indexable or not.
  for (const a of doc.querySelectorAll("a")) {
    const href = a.getAttribute("href");
    if (href === undefined) err("link without href");
    else if (href === "#" || href === "") {
      if (!a.hasAttribute("data-form")) err(`empty link "${href}"`);
    } else if (href.startsWith("/") && !href.startsWith("//") && !exists(href))
      err(`broken link ${href}`);
  }
  for (const img of doc.querySelectorAll("img")) {
    if (!img.hasAttribute("alt"))
      err(`image without alt: ${img.getAttribute("src")}`);
  }

  let js = 0;
  let css = 0;
  for (const s of doc.querySelectorAll("script")) {
    const src = s.getAttribute("src");
    if (src?.startsWith("/")) js += size(src);
    else if (!src && s.getAttribute("type") !== "application/ld+json")
      js += Buffer.byteLength(s.text);
  }
  for (const l of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const href = l.getAttribute("href");
    if (href?.startsWith("/")) css += size(href);
  }
  for (const s of doc.querySelectorAll("style"))
    css += Buffer.byteLength(s.text);
  if (js > JS_BUDGET) err(`JavaScript ${js} B over ${JS_BUDGET} B budget`);
  if (css > CSS_BUDGET) err(`CSS ${css} B over ${CSS_BUDGET} B budget`);

  if (noindex) continue;

  const title = doc.querySelector("title")?.text.trim() ?? "";
  if (title.length < 30 || title.length > 60)
    err(`title is ${title.length} chars, needs 30 to 60: "${title}"`);

  const description =
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ??
    "";
  if (description.length < 70 || description.length > 160)
    err(`description is ${description.length} chars, needs 70 to 160`);

  for (const [key, value] of [
    ["title", title],
    ["description", description],
  ]) {
    if (seen[key].has(value))
      err(`duplicate ${key}, also on ${seen[key].get(value)}`);
    else seen[key].set(value, path);
  }

  const h1s = doc.querySelectorAll("h1").length;
  if (h1s !== 1) err(`has ${h1s} H1, needs exactly 1`);

  const canonical = doc
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
  const expected = path === "/" ? `${SITE}/` : `${SITE}${path}`;
  if (canonical !== expected)
    err(`canonical is ${canonical}, expected ${expected}`);

  const ld = doc.querySelectorAll('script[type="application/ld+json"]');
  if (ld.length > 1) err(`${ld.length} JSON-LD blocks, needs one @graph`);
  for (const s of ld) {
    try {
      const data = JSON.parse(s.text);
      if (
        data["@context"] !== "https://schema.org" ||
        !Array.isArray(data["@graph"])
      )
        err("JSON-LD needs @context https://schema.org and a @graph array");
      for (const node of data["@graph"] ?? []) {
        if (!node["@type"]) err("JSON-LD node without @type");
        if (node["@id"] && !node["@id"].startsWith(`${SITE}/`))
          err(`JSON-LD @id not on ${SITE}: ${node["@id"]}`);
      }
    } catch {
      err("JSON-LD is not valid JSON");
    }
  }
}

if (errors.length) {
  console.error(
    `check-dist: ${errors.length} failure(s)\n` + errors.join("\n"),
  );
  process.exit(1);
}
console.log(`check-dist: ${htmlFiles.length} page(s) passed`);
