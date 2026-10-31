import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

// Pages to smoke test. Add each new page as it ships.
const pages = ["/", "/sell", "/buyers", "/styleguide"];
// Links to pages later features build (see scripts/check-dist.mjs).
const pending = new Set<string>(
  JSON.parse(readFileSync("scripts/pending-routes.json", "utf8")).routes,
);

for (const path of pages) {
  test(`${path} loads with security headers and working links`, async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    const headers = res?.headers() ?? {};
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    await expect(page.locator("h1")).toHaveCount(1);

    const hrefs = await page
      .locator("a[href^='/']")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of new Set(hrefs)) {
      const path = href.split(/[?#]/)[0];
      const isPending =
        pending.has(path) ||
        [...pending].some(
          (r) => r.endsWith("/*") && path.startsWith(r.slice(0, -1)),
        );
      if (isPending) continue;
      expect((await request.get(href)).status(), href).toBe(200);
    }
    expect(errors).toEqual([]);
  });
}

test("Get Started is wired to the embed.js modal", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  for (const tool of ["get-started", "buyers"]) {
    await expect(
      page.locator(
        `script[src="https://tools.wusoolcapital.com/embed.js"][data-tool="${tool}"][data-modal][data-trigger='[data-form="${tool}"]']`,
      ),
    ).toHaveCount(1);
  }
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  const trigger = page.locator('[data-form="get-started"]:visible').first();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("data-source", /nav/);
});

test("mobile menu toggles", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const burger = page.getByRole("button", { name: "Open menu" });
  await burger.click();
  await expect(page.locator("#mobile-menu")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close menu" }),
  ).toHaveAttribute("aria-expanded", "true");
});

test("process tabs switch panes", async ({ page }) => {
  await page.goto("/styleguide");
  const tab = page.getByRole("tab", { name: /We find your buyers/ });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Buyer shortlist");
});

// Title, H1 and meta per landing page (live values, with PRD 13 fixes).
const landing = [
  {
    path: "/",
    title: "Sell Your Business UAE | Wusool Capital M&A Advisory",
    h1: /^Sell your business in the UAE\. Faster\. For more\.$/i,
    meta: /6 weeks to first offer/,
    form: "get-started",
  },
  {
    path: "/sell",
    title: "Sell Your Business in Dubai & UAE | Wusool Capital",
    h1: /The smarter way to sell your business in the UAE/i,
    meta: /6 weeks to first offer/,
    form: "get-started",
  },
  {
    path: "/buyers",
    title: "Buy a Business UAE | Access GCC Deal Flow | Wusool Capital",
    h1: /^GCC's most active deal flow under \$25M\. Curated\. Confidential\. Qualified\.$/i,
    meta: /\$1M to \$25M/,
    form: "buyers",
  },
];

for (const l of landing) {
  test(`${l.path} keeps its title and H1, approved meta and matching FAQ schema`, async ({
    page,
  }) => {
    await page.goto(l.path);
    await expect(page).toHaveTitle(l.title);
    await expect(page.locator("h1")).toHaveText(l.h1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      l.meta,
    );
    await expect(page.locator("main")).not.toContainText(
      /60.90 days|within 60 days|\$1M (to|and) \$2[07]M|\$500K/i,
    );
    const ld = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    );
    const faq = ld["@graph"].find(
      (n: { "@type": string }) => n["@type"] === "FAQPage",
    );
    // Visible questions and answers equal the FAQ schema, in order.
    const visible = await page.locator("#faq details").evaluateAll((ds) =>
      ds.map((d) => ({
        q: d.querySelector("summary")?.textContent?.trim(),
        a: d.querySelector("p")?.textContent?.trim(),
      })),
    );
    expect(visible.length).toBeGreaterThan(0);
    expect(visible).toEqual(
      faq.mainEntity.map(
        (m: { name: string; acceptedAnswer: { text: string } }) => ({
          q: m.name,
          a: m.acceptedAnswer.text,
        }),
      ),
    );
    // Page CTAs open this page's tools app form (nav Get Started aside).
    const forms = await page
      .locator("main [data-form]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-form")));
    if (l.path !== "/") {
      expect(forms.length).toBeGreaterThan(0);
      expect(new Set(forms)).toEqual(new Set([l.form]));
    }
  });
}

test("a Buyers CTA opens the buyers form and a Sell CTA the get-started form", async ({
  page,
}) => {
  for (const [path, tool] of [
    ["/buyers", "buyers"],
    ["/sell", "get-started"],
  ]) {
    await page.goto(path);
    await page.locator(`main [data-form="${tool}"]`).first().click();
    await expect(page.locator(`iframe[src*="/${tool}/"]`)).toHaveCount(1);
  }
});
