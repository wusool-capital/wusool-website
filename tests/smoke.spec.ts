import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

// Pages to smoke test. Add each new page as it ships.
const pages = [
  "/",
  "/sell",
  "/buyers",
  "/industries/technology",
  "/insights",
  "/insights/gcc-padel-report-2026",
  "/insights/topic/sell-your-business",
  "/styleguide",
];
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

test("Home announcement strip links the pinned report and stays closed", async ({
  page,
}) => {
  await page.goto("/");
  const strip = page.locator("[data-strip]");
  await expect(strip).toBeVisible();
  await expect(strip.locator("a")).toHaveAttribute("href", /^\/reports\//);
  // The strip sits above the nav.
  const stripBox = await strip.boundingBox();
  const navBox = await page.locator(".header").boundingBox();
  expect((stripBox?.y ?? 0) < (navBox?.y ?? 0)).toBe(true);
  await strip.getByRole("button", { name: "Close banner" }).click();
  await expect(strip).toBeHidden();
  await expect(page.locator(".logo")).toBeFocused();
  await page.reload();
  await expect(page.locator("[data-strip]")).toBeHidden();
});

test("top and footer areas match the sections they touch", async ({ page }) => {
  for (const [path, top] of [
    ["/", "page"],
    ["/sell", "surface"],
    ["/buyers", "page"],
  ]) {
    await page.goto(path);
    await expect(page.locator("body")).toHaveAttribute("data-top", top);
    // The nav itself takes that background.
    await expect(page.locator(".header")).toHaveCSS(
      "background-color",
      top === "surface"
        ? "rgba(255, 255, 255, 0.96)"
        : "rgba(245, 245, 245, 0.96)",
    );
    await expect(page.locator("body")).toHaveAttribute(
      "data-bottom",
      "surface",
    );
  }
});

test("Buyers has its own closing CTA that opens the buyers form", async ({
  page,
}) => {
  await page.goto("/buyers");
  const band = page.locator(".band");
  await expect(band.locator("h2")).toHaveText(
    "Looking to buy a business in the UAE or GCC?",
  );
  await expect(band.locator('[data-form="buyers"]')).toHaveCount(1);
  await expect(page.locator(".hero .visual")).toHaveCount(0);
});

// Every published industry in Sanity has a page with its title, H1 and FAQ.
test("all industry pages render their Sanity content", async ({ page }) => {
  const api =
    "https://qjvm6ww8.api.sanity.io/v2025-01-01/data/query/production?perspective=published&query=";
  const res = await fetch(
    api +
      encodeURIComponent(
        '*[_type == "industry"]{"slug": slug.current, seoMetaTitle, seoMetaDescription, heroHeadline, faq}',
      ),
  );
  const industries: {
    slug: string;
    seoMetaTitle: string;
    seoMetaDescription: string;
    heroHeadline: string;
    faq: { question: string; answer: string }[];
  }[] = (await res.json()).result;
  expect(industries.length).toBe(10);
  for (const i of industries) {
    const r = await page.goto(`/industries/${i.slug}`);
    expect(r?.status(), i.slug).toBe(200);
    await expect(page).toHaveTitle(i.seoMetaTitle);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      i.seoMetaDescription,
    );
    expect(i.seoMetaTitle.length, i.slug).toBeLessThanOrEqual(60);
    await expect(page.locator("h1")).toHaveText(i.heroHeadline);
    const ld = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    );
    const types = ld["@graph"].map((n: { "@type": string }) => n["@type"]);
    expect(types).toEqual(["WebPage", "Service", "FAQPage", "BreadcrumbList"]);
    const faq = ld["@graph"].find(
      (n: { "@type": string }) => n["@type"] === "FAQPage",
    );
    await expect(page.locator("#faq summary")).toHaveText(
      faq.mainEntity.map((m: { name: string }) => m.name),
    );
    await expect(page.locator("main")).not.toContainText(
      /\$1M . \$27M|\$1M to \$27M/,
    );
  }
});

const sanity = (groq: string) =>
  "https://qjvm6ww8.api.sanity.io/v2025-01-01/data/query/production?query=" +
  encodeURIComponent(groq);

test("every published insight renders with Article schema", async ({
  page,
  request,
  isMobile,
}) => {
  test.skip(isMobile, "content check, desktop only");
  test.setTimeout(180_000);
  const insights: { slug: string; seoTitle: string; h1: string }[] = (
    await (
      await request.get(
        sanity(
          '*[_type == "insights" && !(_id in path("drafts.**"))]{"slug": slug.current, seoTitle, h1}',
        ),
      )
    ).json()
  ).result;
  expect(insights.length).toBeGreaterThan(30);
  for (const i of insights) {
    const r = await page.goto(`/insights/${i.slug}`);
    expect(r?.status(), i.slug).toBe(200);
    await expect(page).toHaveTitle(i.seoTitle);
    await expect(page.locator("h1")).toHaveText(i.h1);
    const ld = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    );
    const article = ld["@graph"].find(
      (n: { "@type": string }) => n["@type"] === "Article",
    );
    expect(article?.headline, i.slug).toBeTruthy();
    expect(article?.image, i.slug).toBeTruthy();
  }
});

test("insights hub lists every insight without JS and each card has an image", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/insights");
  const cards = page.locator("[data-browse] .card");
  expect(await cards.count()).toBeGreaterThan(30);
  const missing = await cards.evaluateAll(
    (cs) => cs.filter((c) => !c.querySelector("img[src]")).length,
  );
  expect(missing).toBe(0);
  await ctx.close();
});

test("insights hub filters by topic and searches with Pagefind", async ({
  page,
}) => {
  await page.goto("/insights");
  const cards = page.locator("[data-browse] .card");
  const all = await cards.count();
  const chip = page
    .locator('[data-filter="topic"][data-value]:not([data-value=""])')
    .first();
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  const topic = await chip.getAttribute("data-value");
  const visible = page.locator("[data-browse] .card:visible");
  expect(await visible.count()).toBeLessThan(all);
  for (const t of await visible.evaluateAll((cs) =>
    cs.map((c) => (c as HTMLElement).dataset.topic),
  ))
    expect(t).toBe(topic);

  await page.fill("#q", "valuation");
  await expect(page.locator("[data-results-list] li").first()).toBeVisible();
  await expect(page.locator("[data-browse]")).toBeHidden();
  const href = await page
    .locator("[data-results-list] a")
    .first()
    .getAttribute("href");
  expect(href).toMatch(/^\/insights\/[a-z0-9-]+$/);
});

test("padel report insight renders exhibits natively, text once", async ({
  page,
}) => {
  await page.goto("/insights/gcc-padel-report-2026");
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.locator(".pt-exhibit img").count()).toBeGreaterThan(10);
  await expect(page.locator(".pt-table table").first()).toBeVisible();
  const first = (await page.locator(".prose p").first().textContent()) ?? "";
  const body = (await page.locator("article").textContent()) ?? "";
  expect(body.split(first.trim()).length - 1).toBe(1);
});
