// SEO and budget gates (PRD 14.4) run against the built site in dist/.
// Exits 1 and lists every failure.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "node-html-parser";

const DIST = "dist";
const SITE = "https://www.wusoolcapital.com";
// Links to the bare domain are checked like www links.
const APEX = "https://wusoolcapital.com";
// Inline scripts run only if their hash is in the CSP.
const CSP = readFileSync("public/_headers", "utf8");
const JS_BUDGET = 50 * 1024;
const CSS_BUDGET = 100 * 1024;
// Pages later features build; links to them are allowed until then.
const PENDING = new Set(
  JSON.parse(readFileSync("scripts/pending-routes.json", "utf8")).routes,
);
// "/insights/*" covers pages under /insights/ not built yet. Their slug must
// still exist in Sanity, so a typo or a deleted document fails the check.
const SANITY =
  "https://qjvm6ww8.api.sanity.io/v2025-01-01/data/query/production?perspective=published&query=";
const TYPES = {
  "/insights/": "insights",
  "/industries/": "industry",
  "/reports/": "report",
};
const slugs = await (
  await fetch(
    SANITY +
      encodeURIComponent(
        `{${Object.entries(TYPES)
          .map(([p, t]) => `"${p}": *[_type == "${t}"].slug.current`)
          .join(", ")}}`,
      ),
  )
).json();
const pending = (path) => {
  if (PENDING.has(path)) return true;
  const prefix = Object.keys(TYPES).find((p) => path.startsWith(p));
  return (
    !!prefix &&
    PENDING.has(`${prefix}*`) &&
    slugs.result[prefix].includes(path.slice(prefix.length))
  );
};

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

// Internal path exists as a built page or file.
const exists = (pathname) => {
  const p = decodeURI(pathname);
  if (p === "/") return true;
  return [p, `${p}.html`, `${p}/index.html`].some((c) =>
    existsSync(join(DIST, c)),
  );
};

const size = (src) => {
  const p = join(DIST, src.split("?")[0]);
  return existsSync(p) ? statSync(p).size : 0;
};

// Static imports and dynamic import() of .js chunks in a piece of code.
const imports = (code) =>
  [...code.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+\.js)["']/g)].map(
    (m) => m[1],
  );

// Adds a JS file and every chunk it loads to the set.
const addJs = (pathname, set) => {
  const p = join(DIST, pathname);
  if (set.has(p) || !existsSync(p)) return;
  set.add(p);
  for (const spec of imports(readFileSync(p, "utf8")))
    addJs(new URL(spec, SITE + pathname).pathname, set);
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
    if (href === undefined) {
      err("link without href");
    } else if (href === "#" || href === "") {
      if (!a.hasAttribute("data-form")) err(`empty link "${href}"`);
    } else if (/^javascript:/i.test(href)) {
      err(`javascript link ${href}`);
    } else {
      const url = new URL(href, SITE + path);
      if (url.origin !== SITE && url.origin !== APEX) continue;
      if (url.pathname !== "/" && url.pathname.endsWith("/"))
        err(`link ${href} has a trailing slash and redirects`);
      else if (!exists(url.pathname) && !pending(url.pathname))
        err(`broken link ${href}`);
    }
  }
  for (const img of doc.querySelectorAll("img")) {
    if (!img.hasAttribute("alt"))
      err(`image without alt: ${img.getAttribute("src")}`);
  }

  // JS: script tags, island chunks and everything they import.
  let js = 0;
  let css = 0;
  const jsFiles = new Set();
  for (const s of doc.querySelectorAll("script")) {
    const src = s.getAttribute("src");
    if (src?.startsWith("/")) addJs(src.split("?")[0], jsFiles);
    else if (!src && s.getAttribute("type") !== "application/ld+json") {
      js += Buffer.byteLength(s.text);
      const hash = createHash("sha256").update(s.text).digest("base64");
      if (!CSP.includes(`'sha256-${hash}'`))
        err(`inline script missing from the CSP: 'sha256-${hash}'`);
      for (const spec of imports(s.text))
        addJs(new URL(spec, SITE + path).pathname, jsFiles);
    }
  }
  for (const island of doc.querySelectorAll("astro-island")) {
    for (const attr of [
      "component-url",
      "renderer-url",
      "before-hydration-url",
    ]) {
      const src = island.getAttribute(attr);
      if (src?.startsWith("/")) addJs(src, jsFiles);
    }
  }
  for (const f of jsFiles) js += statSync(f).size;
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
  if (!doc.querySelector('meta[property="og:image"]')?.getAttribute("content"))
    err("no og:image (share image)");

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

for (const route of PENDING) {
  if (!route.endsWith("/*") && exists(route))
    errors.push(
      `${route} is built: remove it from scripts/pending-routes.json`,
    );
}

if (errors.length) {
  console.error(
    `check-dist: ${errors.length} failure(s)\n` + errors.join("\n"),
  );
  process.exit(1);
}
console.log(`check-dist: ${htmlFiles.length} page(s) passed`);
