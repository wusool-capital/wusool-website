import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

// Pages to smoke test. Add each new page as it ships.
const pages = [
  "/",
  "/sell",
  "/buyers",
  "/industries/technology",
  "/insights",
  "/insights/gcc-padel-report-2026",
  "/insights/topic/sell-your-business",
  "/reports",
  "/reports/padel-in-the-gulf",
  "/team",
  "/careers",
  "/careers/senior-analyst-ma-advisory-dubai",
  "/valuation-tool",
  "/deal-readiness-tool",
  "/benchmark",
  "/partners",
  "/privacy-policy",
  "/terms",
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
    // The tools app only allows framing from wusoolcapital.com, so its report
    // reader is refused on localhost and staging. Production is unaffected.
    expect(
      errors.filter(
        (e) => !e.includes("frame-ancestors https://wusoolcapital.com"),
      ),
    ).toEqual([]);
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
    h1: /^Sell your business in the UAE, with the right buyer, at a fair price\.$/i,
    meta: /6 weeks to first offer/,
    form: "get-started",
  },
  {
    path: "/sell",
    title: "Sell Your Business in Dubai & UAE | Wusool Capital",
    h1: /^Sell your UAE business with an adviser who runs every step$/i,
    meta: /6 weeks to first offer/,
    form: "get-started",
  },
  {
    path: "/buyers",
    title: "Buy a Business UAE | Access GCC Deal Flow | Wusool Capital",
    h1: /^Buy a company in the UAE or GCC worth \$1M to \$25M\.$/i,
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
  request,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/insights");
  const cards = page.locator("[data-browse] .card");
  const listed: number = (
    await (
      await request.get(
        sanity(
          'count(*[_type == "insights" && !(_id in path("drafts.**")) && hideFromListings != true])',
        ),
      )
    ).json()
  ).result;
  const reports: number = (
    await (
      await request.get(
        sanity('count(*[_type == "report" && !(_id in path("drafts.**"))])'),
      )
    ).json()
  ).result;
  expect(await cards.count()).toBe(listed + reports);
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

test("a CTA to /get-started opens the form, since that page never existed", async ({
  page,
}) => {
  await page.goto(
    "/insights/what-one-year-of-transaction-taught-us-about-the-market",
  );
  await expect(page.locator('a[href*="/get-started"]')).toHaveCount(0);
  await expect(
    page.locator('.end button[data-form="get-started"]'),
  ).toHaveCount(1);
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

test("every published report has its landing content in the raw HTML", async ({
  request,
  isMobile,
}) => {
  test.skip(isMobile, "content check, desktop only");
  const reports: { slug: string; title: string; excerpt: string }[] = (
    await (
      await request.get(
        sanity(
          '*[_type == "report" && !(_id in path("drafts.**"))]{"slug": slug.current, title, excerpt}',
        ),
      )
    ).json()
  ).result;
  expect(reports.length).toBeGreaterThan(0);
  for (const r of reports) {
    const res = await request.get(`/reports/${r.slug}`);
    expect(res.status(), r.slug).toBe(200);
    const html = await res.text();
    // Compare text the way Astro escapes it.
    const esc = (t: string) =>
      t
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    expect(html).toMatch(
      new RegExp(`<h1[^>]*>${RegExp.escape(esc(r.title))}</h1>`),
    );
    expect(html).toContain(esc(r.excerpt));
    expect(html).toContain(
      `<link rel="canonical" href="https://www.wusoolcapital.com/reports/${r.slug}">`,
    );
    const ld = JSON.parse(
      html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )?.[1] ?? "{}",
    );
    const report = ld["@graph"].find(
      (n: { "@type": string }) => n["@type"] === "Report",
    );
    expect(report?.headline, r.slug).toBe(r.title);
    expect(html).toContain(`data-tool="report" data-report="${r.slug}"`);
  }
});

const graphOf = async (page: import("@playwright/test").Page) =>
  JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  )["@graph"] as { "@type": string; "@id"?: string; [k: string]: unknown }[];

test("the team page lists every member with Person schema, and bylines link to their card", async ({
  page,
  request,
  isMobile,
}) => {
  test.skip(isMobile, "content check, desktop only");
  const members: { slug: string; name: string }[] = (
    await (
      await request.get(
        sanity(
          '*[_type == "teamMember" && slug.current != "wusool-capital"]{"slug": slug.current, name}',
        ),
      )
    ).json()
  ).result;
  expect(members.length).toBeGreaterThan(0);
  await page.goto("/team");
  const nodes = await graphOf(page);
  expect(nodes.find((n) => n["@type"] === "AboutPage")).toBeTruthy();
  const people = nodes.filter((n) => n["@type"] === "Person");
  expect(people.length).toBe(members.length);
  for (const m of members) {
    await expect(page.locator(`#${m.slug} h3`)).toHaveText(m.name);
    const p = people.find(
      (n) => n["@id"] === `https://www.wusoolcapital.com/team#${m.slug}`,
    );
    expect(p?.worksFor, m.slug).toEqual({
      "@id": "https://www.wusoolcapital.com/#organization",
    });
  }

  // A byline links to the author's card and the Article points at the Person.
  await page.goto("/insights/how-to-buy-a-business-uae");
  const href = await page.locator('.meta a[rel="author"]').getAttribute("href");
  expect(members.map((m) => `/team#${m.slug}`)).toContain(href);
  const article = (await graphOf(page)).find((n) => n["@type"] === "Article");
  expect((article?.author as { "@id": string })["@id"]).toBe(
    `https://www.wusoolcapital.com${href}`,
  );
});

test("an open role has one JobPosting and is listed on Careers", async ({
  page,
}) => {
  await page.goto("/careers");
  const role = page.locator('main a[href^="/careers/"]').first();
  test.skip((await role.count()) === 0, "no open role right now");
  const href = await role.getAttribute("href");
  await page.goto(href ?? "");
  const jobs = (await graphOf(page)).filter((n) => n["@type"] === "JobPosting");
  expect(jobs.length).toBe(1);
  expect(jobs[0].hiringOrganization).toMatchObject({
    "@id": "https://www.wusoolcapital.com/#organization",
    name: "Wusool Capital",
  });
});

// Native tools render their questions in the HTML; the rest embed the tools app.
for (const [path, tool, type, native] of [
  ["/valuation-tool", "valuation", "WebApplication", "data-valuation"],
  ["/deal-readiness-tool", "readiness", "WebApplication", "data-readiness"],
  ["/benchmark", "benchmark", "SoftwareApplication", 'id="bm"'],
]) {
  test(`${path} has its H1, its tool and ${type} schema in the raw HTML`, async ({
    request,
    isMobile,
  }) => {
    test.skip(isMobile, "content check, desktop only");
    const html = await (await request.get(path)).text();
    expect(html).toMatch(/<h1[^>]*>[^<]+/);
    if (native) {
      expect(html).toContain(native);
      expect(html).toMatch(/<fieldset/);
      expect(html).not.toMatch(new RegExp(`data-tool="${tool}"`));
    } else
      expect(html).toMatch(
        new RegExp(
          `<script[^>]*(src="https://tools\\.wusoolcapital\\.com/embed\\.js"[^>]*data-tool="${tool}"|data-tool="${tool}"[^>]*src="https://tools\\.wusoolcapital\\.com/embed\\.js")`,
        ),
      );
    const ld = JSON.parse(
      html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )?.[1] ?? "{}",
    );
    const app = ld["@graph"].find(
      (n: { "@type": string }) => n["@type"] === type,
    );
    expect(app?.url).toBe(`https://www.wusoolcapital.com${path}`);
  });
}

test("an unknown path returns the 404 page with a 404 status", async ({
  page,
}) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Page not found");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("legal pages carry the live text, the entity name and no em dashes", async ({
  request,
  isMobile,
}) => {
  test.skip(isMobile, "content check, desktop only");
  for (const [path, h1, phrase] of [
    ["/privacy-policy", "Privacy Policy", "What Data We Collect"],
    ["/terms", "Terms of Service", "Who We Are"],
  ]) {
    const html = await (await request.get(path)).text();
    expect(html).toMatch(new RegExp(`<h1[^>]*>${h1}</h1>`));
    expect(html).toContain(phrase);
    expect(html).toContain("DOPAMINE INNOVATION CONSULTANCY - FZCO");
    expect(html).not.toContain("—");
    expect(html).not.toContain("TBD");
    expect(html).not.toContain("dopaminecap");
  }
});

test("every live URL still resolves, and the sitemap lists every indexable page", async ({
  request,
  isMobile,
}) => {
  test.skip(isMobile, "crawl check, desktop only");
  test.setTimeout(120_000);
  const live = readFileSync("scripts/live-urls.txt", "utf8")
    .split("\n")
    .filter(Boolean);
  const missing: string[] = [];
  for (const path of live) {
    const res = await request.get(path, { maxRedirects: 0 });
    if (![200, 301].includes(res.status()))
      missing.push(`${path} ${res.status()}`);
  }
  expect(missing).toEqual([]);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  const xml = await sitemap.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const path of live.filter((p) => p !== "/transactions"))
    expect(locs, path).toContain(`https://www.wusoolcapital.com${path}`);
  expect(locs.some((u) => /\/styleguide$|\/404$|-test$/.test(u))).toBe(false);

  // The Webflow test collections are gone (fix 3).
  for (const path of ["/insights-test", "/reports-test"])
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(
      404,
    );
});

test("robots.txt lists the sitemap once and llms.txt uses the approved values", async ({
  request,
}) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots.match(/^Sitemap:/gm)?.length).toBe(1);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("6 weeks to first offer");
  expect(llms).toContain("$1M to $25M");
  expect(llms).toContain("mainly success fee");
  expect(llms).not.toMatch(/60 days|success-fee only/i);
  const full = await (await request.get("/llms-full.txt")).text();
  expect(full).toContain("https://www.wusoolcapital.com/insights/");
  expect(full.length).toBeGreaterThan(llms.length * 5);
});

// The site-wide "Get started" modal still loads from the tools app on every
// page; the tools themselves must request nothing else off the site.
const EMBED = "https://tools.wusoolcapital.com/embed.js";

// Answers every visible question with the first option or a sample value,
// then presses the step's forward button, until `done` is visible.
async function completeTool(
  page: Page,
  root: string,
  forward: string,
  done: string,
) {
  const tool = page.locator(root);
  for (
    let step = 0;
    step < 20 && !(await page.locator(done).isVisible());
    step++
  ) {
    for (const radio of await tool
      .locator('input[type="radio"]:visible')
      .all()) {
      const name = await radio.getAttribute("name");
      if (!(await tool.locator(`input[name="${name}"]:checked`).count()))
        await radio.check();
    }
    for (const select of await tool.locator("select:visible").all())
      if (!(await select.inputValue())) await select.selectOption({ index: 1 });
    for (const input of await tool
      .locator(
        'input:visible:not([type="radio"]):not([type="checkbox"]), textarea:visible',
      )
      .all()) {
      if (await input.inputValue()) continue;
      const type = await input.getAttribute("type");
      const max = await input.getAttribute("max");
      const numeric = /numeric|decimal/.test(
        (await input.getAttribute("inputmode")) ?? "",
      );
      const sample: Record<string, string> = {
        email: "owner@example.com",
        tel: "+971500000000",
        url: "https://example.com",
        number: max ?? "1000000",
      };
      await input.fill(
        numeric ? "1000000" : (sample[type ?? ""] ?? "Test company"),
      );
    }
    for (const box of await tool
      .locator('input[type="checkbox"][required]:visible')
      .all())
      await box.check();
    await tool.locator(forward).first().click();
  }
  await expect(page.locator(done)).toBeVisible();
}

test("deal readiness tool scores the answers without any request", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost") && r.url() !== EMBED)
      external.push(r.url());
  });
  await page.goto("/deal-readiness-tool");
  await completeTool(
    page,
    "[data-readiness]",
    '[data-go="1"]:visible, .btn--next:visible',
    "[data-results]",
  );
  await expect(page.locator("[data-score]")).toHaveText(/^\d+$/);
  await expect(
    page.locator('[data-results] a[href="/partners"]'),
  ).toBeVisible();
  expect(external).toEqual([]);
});

test("benchmark tool shows results and a thank-you without any request", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost") && r.url() !== EMBED)
      external.push(r.url());
  });
  await page.goto("/benchmark");
  await completeTool(page, "#bm", ".act--primary:visible", "#bm-thanks");
  await expect(page.locator('#bm a[href="/partners"]')).toBeVisible();
  expect(external).toEqual([]);
});

test("valuation tool shows a range without any request", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost") && r.url() !== EMBED)
      external.push(r.url());
  });
  await page.goto("/valuation-tool");
  await completeTool(
    page,
    "[data-valuation]",
    'button[type="submit"]:visible',
    "[data-valuation-results]",
  );
  await expect(page.locator('[data-v="range"]')).not.toBeEmpty();
  await expect(
    page.locator('[data-valuation-results] a[href="/partners"]'),
  ).toBeVisible();
  expect(external).toEqual([]);
});

// Partners (PRD 6.3, feature 14).
test("partners page lists every active partner from Sanity, by category", async ({
  page,
}) => {
  const api =
    "https://qjvm6ww8.api.sanity.io/v2025-01-01/data/query/production?perspective=published&query=";
  const active: { name: string }[] = (
    await (
      await fetch(
        api +
          encodeURIComponent('*[_type == "partner" && active != false]{name}'),
      )
    ).json()
  ).result;
  await page.goto("/partners");
  const cards = page.locator("[data-directory] [data-partner]");
  await expect(cards).toHaveCount(active.length);
  for (const p of active)
    await expect(
      page.locator("[data-directory] h3", { hasText: p.name }),
    ).toHaveCount(1);
  // Every outbound partner link says it came from us.
  for (const href of await page
    .locator("[data-directory] a.go")
    .evaluateAll((a) => a.map((x) => x.getAttribute("href") ?? "")))
    expect(href).toMatch(/[?&](ref|utm_[a-z]+)=/);
  // Filters show one category at a time.
  const first = page.locator("[data-cat]").nth(1);
  await first.click();
  const cat = await first.getAttribute("data-cat");
  for (const c of await cards.all())
    if (await c.isVisible())
      expect(await c.getAttribute("data-category")).toBe(cat);
});

test("partners quiz answers every category and size, without any request", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost") && r.url() !== EMBED)
      external.push(r.url());
  });
  await page.goto("/partners");
  const cats = await page
    .locator('[data-quiz] input[name="need"]')
    .evaluateAll((i) => i.map((x) => (x as HTMLInputElement).value));
  const sizes = await page
    .locator('[data-quiz] input[name="size"]')
    .evaluateAll((i) => i.map((x) => (x as HTMLInputElement).value));
  const present = new Set(
    await page
      .locator("[data-directory] [data-partner]")
      .evaluateAll((c) => c.map((x) => (x as HTMLElement).dataset.category)),
  );
  const location = "uae-mainland";
  for (const cat of cats)
    for (const size of sizes) {
      await page.goto("/partners");
      await page.locator("[data-quiz] summary").click();
      await page
        .locator("[data-quiz] label", {
          has: page.locator(`input[value="${cat}"]`),
        })
        .click();
      await page
        .locator("[data-quiz] label", {
          has: page.locator(`input[value="${size}"]`),
        })
        .click();
      await page
        .locator("[data-quiz] label", {
          has: page.locator(`input[value="${location}"]`),
        })
        .click();
      await page
        .locator("[data-quiz] label", {
          has: page.locator('input[name="horizon"]'),
        })
        .first()
        .click();
      await page.locator('[data-quiz] button[type="submit"]').click();
      // Either matches that fit the size or the location, or the no-match note.
      const shown = page.locator("[data-quiz-list] [data-partner]");
      if (present.has(cat) && (await shown.count())) {
        for (const m of await shown.all()) {
          expect(await m.getAttribute("data-category")).toBe(cat);
          const sz = (await m.getAttribute("data-sizes")) ?? "";
          const loc = (await m.getAttribute("data-locations")) ?? "";
          expect(
            !sz ||
              sz.split(" ").includes(size) ||
              !loc ||
              loc.split(" ").includes(location),
          ).toBe(true);
        }
      } else await expect(page.locator("[data-quiz-none]")).toBeVisible();
    }
  expect(external).toEqual([]);
});

test("Partners is in the nav and footer, and the desktop nav stays on one line", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "desktop and tablet nav");
  for (const width of [1280, 1100]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const main = page.getByRole("navigation", { name: "Main" });
    await expect(main.locator('a[href="/partners"]')).toBeVisible();
    const tops = await main
      .locator(".links > li")
      .evaluateAll((li) =>
        li.map((x) => Math.round(x.getBoundingClientRect().top)),
      );
    expect(new Set(tops).size).toBe(1);
  }
  await expect(page.locator('footer a[href="/partners"]')).toHaveCount(1);
});

// Everything clickable shows the hand cursor, form choices included.
test("clickable elements show the pointer cursor on every page", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "cursor is a desktop concern");
  for (const path of pages) {
    await page.goto(path);
    const missing = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          'a[href], button:not(:disabled), summary, select, label:has(input[type="radio"], input[type="checkbox"])',
        ),
      ]
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .filter((e) => getComputedStyle(e).cursor !== "pointer")
        .map(
          (e) => `${e.tagName} ${(e.textContent ?? "").trim().slice(0, 30)}`,
        ),
    );
    expect(missing, path).toEqual([]);
  }
});
