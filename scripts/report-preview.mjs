// Captures page 1 of each report's HTML as a static preview image, so report
// pages show the cover without the tools app.
//
//   node --env-file=.env scripts/report-preview.mjs [--write]
//
// Without --write it saves the images to a temp folder only.
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "@playwright/test";

const WRITE = process.argv.includes("--write");
const API = "https://qjvm6ww8.api.sanity.io/v2025-01-01";
const token = process.env.SANITY_WRITE_TOKEN;
if (WRITE && !token) throw new Error("--write needs SANITY_WRITE_TOKEN");

const q = encodeURIComponent(
  `*[_type == "report" && !(_id in path("drafts.**"))]{_id, title, "slug": slug.current, renderedHtml}`,
);
const reports = (
  await (await fetch(`${API}/data/query/production?query=${q}`)).json()
).result;

const dir = mkdtempSync(join(tmpdir(), "report-preview-"));
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
for (const r of reports) {
  if (!r.renderedHtml) {
    console.log(`${r.slug}: no rendered HTML, skipped`);
    continue;
  }
  const html = join(dir, `${r.slug}.html`);
  writeFileSync(html, r.renderedHtml);
  await page.goto(`file://${html}`);
  await page.waitForTimeout(3000);
  const file = join(dir, `${r.slug}.png`);
  await page.locator(".page").first().screenshot({ path: file });
  console.log(`${r.slug}: ${file}`);
  if (!WRITE) continue;
  const res = await fetch(
    `${API}/assets/images/production?filename=${r.slug}-page-1.png`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/png",
      },
      body: readFileSync(file),
    },
  );
  const asset = (await res.json()).document;
  const patch = await fetch(`${API}/data/mutate/production`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mutations: [
        {
          patch: {
            id: r._id,
            set: {
              preview: {
                _type: "image",
                asset: { _type: "reference", _ref: asset._id },
                alt: `First page of the ${r.title} report`,
              },
            },
          },
        },
      ],
    }),
  });
  console.log(`  written: ${patch.status}`);
}
await browser.close();
