// Writes dist/sitemap.xml after the build: every built page that is
// indexable (no noindex), with its own canonical URL (PRD 8, fix 11).
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

const urls = pages
  .map((file) => readFileSync(file, "utf8"))
  .filter((html) => !/<meta name="robots" content="[^"]*noindex/.test(html))
  .map((html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1])
  .filter(Boolean)
  .sort();

writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
console.log(`sitemap: ${urls.length} URLs`);
