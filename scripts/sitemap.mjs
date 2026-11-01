// Writes dist/sitemap.xml after the build: every built page that is
// indexable (no noindex), with its own canonical URL and, for articles and
// reports, lastmod from the page's dateModified (PRD 8, fix 11).
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".html")) pages.push(path);
  }
};
walk(DIST);

const entries = pages
  .map((file) => readFileSync(file, "utf8"))
  .filter((html) => !/<meta[^>]*name="robots"[^>]*noindex/.test(html))
  .map((html) => ({
    loc: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1],
    lastmod: html.match(/"dateModified":"([^"]+)"/)?.[1]?.slice(0, 10),
  }))
  .filter((e) => e.loc)
  .sort((a, b) => a.loc.localeCompare(b.loc));

writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      (e) =>
        `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n")}\n</urlset>\n`,
);
console.log(`sitemap: ${entries.length} URLs`);
