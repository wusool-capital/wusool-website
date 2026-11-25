import { readFileSync } from "node:fs";
import { test, expect, type Page, type Route } from "@playwright/test";
import { completeTool } from "./helpers";

// Lead capture (AZM-207): each tool posts to the tools API. The API is mocked,
// so these tests check what the page sends and how it behaves, not the server.

type Body = Record<string, unknown>;
type Reply = { status?: number; body?: unknown; hold?: Promise<void> };

// Answers calls to the tools host (any host that is not the site itself).
async function mockApi(
  page: Page,
  replies: Record<string, (n: number) => Reply>,
) {
  const calls: { path: string; body: Body }[] = [];
  await page.route(
    (u) => u.hostname !== "localhost" && u.pathname in replies,
    async (route: Route) => {
      const req = route.request();
      const cors = { "access-control-allow-origin": "*" };
      if (req.method() === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            ...cors,
            "access-control-allow-methods": "POST",
            "access-control-allow-headers": "content-type",
          },
        });
      const path = new URL(req.url()).pathname;
      calls.push({ path, body: req.postDataJSON() });
      const n = calls.filter((c) => c.path === path).length;
      const r = replies[path](n);
      await r.hold;
      await route.fulfill({
        status: r.status ?? 200,
        headers: cors,
        contentType: "application/json",
        body: JSON.stringify(r.body ?? {}),
      });
    },
  );
  return (path: string) => calls.filter((c) => c.path === path);
}

const SCORED = {
  run_id: "r1",
  overallScore: 72.4,
  scoreBand: "Nearly Ready",
  summaryParagraph: "A solid base with a few gaps to close.",
  dimensions: [
    "Financial Health",
    "Team & Operations",
    "Revenue Quality",
    "Legal & Structure",
    "Growth Story",
  ].map((name, i) => ({ name, score: 80 - i * 10, insight: "ok" })),
  recommendations: [1, 2, 3].map((n) => ({
    title: `Action ${n}`,
    detail: `Do thing ${n}.`,
  })),
};

const readiness = (page: Page, done = "[data-results], [data-failed]") =>
  completeTool(
    page,
    "[data-readiness]",
    '[data-go="1"]:visible, .btn--next:visible',
    done,
  );

test("the tools host is allowed to be called by the page (CSP connect-src)", () => {
  const csp = readFileSync("public/_headers", "utf8").match(
    /connect-src ([^;]*);/,
  )?.[1];
  expect(csp).toContain("https://tools.wusoolcapital.com");
  expect(csp).toContain("https://63-184-6-136.sslip.io");
});

test("readiness sends the answers, shows the loading screen, then the server's result", async ({
  page,
}) => {
  let release!: () => void;
  const hold = new Promise<void>((r) => (release = r));
  const sent = await mockApi(page, {
    "/readiness/score": () => ({ body: SCORED, hold }),
  });
  await page.goto("/deal-readiness-tool");
  await readiness(page, "[data-loading], [data-results]");
  await expect(page.locator("[data-loading]")).toBeVisible();
  await expect(page.locator("[data-loading] progress")).toBeVisible();
  const first = await page.locator("[data-loading-text]").textContent();
  await expect
    .poll(() => page.locator("[data-loading-text]").textContent())
    .not.toBe(first);
  release();
  await expect(page.locator("[data-score]")).toHaveText("72");
  await expect(page.locator("[data-band]")).toHaveText("Nearly Ready");
  await expect(page.locator("[data-summary]")).toHaveText(
    SCORED.summaryParagraph,
  );
  await expect(page.locator("[data-sec]").first()).toHaveText("80 / 100");
  await expect(page.locator("[data-sec]").nth(4)).toHaveText("40 / 100");
  await expect(page.locator("[data-recs] li")).toHaveCount(3);
  await expect(page.locator("[data-flags] li").first()).toBeVisible();

  const calls = sent("/readiness/score");
  expect(calls).toHaveLength(1);
  // Every question is answered with a 0 to 3 score. The two free-text answers
  // go as typed.
  const sentAnswers = calls[0].body.answers as Record<string, unknown>;
  expect(Object.keys(sentAnswers).sort()).toEqual(
    Array.from({ length: 15 }, (_, i) => `q${i + 1}`).sort(),
  );
  for (let q = 1; q <= 13; q++)
    expect([0, 1, 2, 3]).toContain(sentAnswers[`q${q}`]);
  expect(sentAnswers.q14).toBe("Test company");
  expect(sentAnswers.q15).toBe("Test company");
  expect({ ...calls[0].body, answers: undefined }).toEqual({
    submission_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    name: "Test company",
    company: "Test company",
    email: "owner@example.com",
    sector: "Technology & SaaS",
    revenue: "Under $1M",
    country: "UAE",
    domain: "test company",
    answers: undefined,
    analytics: { consent: false },
  });
});

test("a failed readiness call shows an error, and the retry reuses the submission id", async ({
  page,
}) => {
  const sent = await mockApi(page, {
    "/readiness/score": (n) => (n === 1 ? { status: 500 } : { body: SCORED }),
  });
  await page.goto("/deal-readiness-tool");
  await readiness(page);
  await expect(page.locator("[data-failed]")).toBeVisible();
  await expect(page.locator("[data-failed-text]")).toContainText(
    "went wrong on our side",
  );
  await expect(page.locator("[data-results]")).toBeHidden();
  await page.locator("[data-retry]").click();
  await expect(page.locator("[data-score]")).toHaveText("72");
  const calls = sent("/readiness/score");
  expect(calls).toHaveLength(2);
  expect(calls[1].body.submission_id).toBe(calls[0].body.submission_id);
});

// Consent is true only after Accept all. UTM tags travel either way.
for (const [choice, consent] of [
  ["all", true],
  ["cookies", false],
  ["declined", false],
] as const) {
  test(`readiness analytics block with the "${choice}" consent choice`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: "wusool_analytics_consent",
        value: choice,
        url: baseURL ?? "",
      },
    ]);
    const sent = await mockApi(page, {
      "/readiness/score": () => ({ body: SCORED }),
    });
    await page.goto("/deal-readiness-tool?utm_source=news&utm_medium=email");
    await readiness(page);
    expect(sent("/readiness/score")[0].body.analytics).toEqual({
      consent,
      utm: { source: "news", medium: "email" },
    });
  });
}

const METRIC = { label: "x", value: 1, percentile: 50 };
const BENCH = { run_id: "b1", score: 50, metrics: { a: METRIC } };

test("benchmark sends the figures in USD with the email form, and retries with the same id", async ({
  page,
}) => {
  const sent = await mockApi(page, {
    "/benchmark": (n) => (n === 1 ? { status: 429 } : { body: BENCH }),
  });
  await page.goto("/benchmark");
  // The result is worked out in the browser, before anything is sent.
  await completeTool(page, "#bm", ".act--primary:visible", "#bm-report");
  expect(sent("/benchmark")).toHaveLength(0);
  await page.locator("#bm-name").fill("Sam Owner");
  await page.locator("#bm-company").fill("Acme");
  await page.locator("#bm-email").fill("owner@example.com");
  await page.locator("#bm-phone").fill("+971500000000");
  await page.locator("#bm-consent").check();
  await page.locator("#bm-report button[type=submit]").click();
  await expect(page.locator("#bm-error")).toContainText("Too many requests");
  await expect(page.locator("#bm-thanks")).toBeHidden();
  await page.locator("#bm-report button[type=submit]").click();
  await expect(page.locator("#bm-thanks")).toBeVisible();

  const calls = sent("/benchmark");
  expect(calls).toHaveLength(2);
  expect(calls[1].body.submission_id).toBe(calls[0].body.submission_id);
  const body = calls[0].body;
  expect(Object.keys(body).sort()).toEqual(
    [
      "submission_id",
      "mode",
      "peer_key",
      "company",
      "name",
      "email",
      "phone",
      "domain",
      "geography",
      "consent",
      "revenue",
      "prev_revenue",
      "ebitda_reported",
      "owner_salary",
      "salary_deducted",
      "gross_margin_pct",
      "headcount",
      "rent_cost",
      "capital_raised",
      "top_customer_pct",
      "recurring_pct",
      "years_active",
      "outlets",
      "days_to_get_paid",
      "analytics",
    ].sort(),
  );
  expect(body).toMatchObject({
    mode: "sme",
    domain: null,
    consent: true,
    email: "owner@example.com",
    analytics: { consent: false },
  });
  expect(typeof body.peer_key).toBe("string");
  // 1,000,000 AED at the peg.
  expect(body.revenue).toBeCloseTo(1_000_000 / 3.6725, 2);
});

const ANALYZED = {
  discounts: { revenue_discount_pct: 40, ebitda_discount_pct: 40 },
  dcf: {
    revGrowth: 20,
    ebitMarginImpr: 3,
    daaPct: 4,
    capexPct: 6,
    nwcPct: 2,
    termGrowth: 2.5,
  },
  transaction_search_terms: ["spare parts"],
  vc_search_terms: ["auto"],
  pros: [],
  cons: [],
  insights: [],
};
const COMPS = [1, 2, 3, 4].map((n) => ({
  co: `Peer ${n}`,
  tk: `P${n}`,
  ev: 1000 * n,
  rev: 500 * n,
  ebitda: 100 * n,
  extra: "dropped",
}));

async function fillValuation(page: Page) {
  const f = page.locator("[data-valuation-form]");
  await f.locator('[name="companyName"]').fill("Acme");
  await f.locator('[name="name"]').fill("Sam");
  await f.locator('[name="email"]').fill("sam@example.com");
  await f.locator('[name="domain"]').fill("https://www.acme.com/about");
  await f.locator('[name="sector"]').selectOption("SaaS");
  await f.locator('[name="currency"][value="AED"]').check({ force: true });
  await f.locator('[name="revenue"]').fill("3672500");
  await f.locator('[name="profitBeforeTax"]').fill("734500");
  await f.locator('[name="ownerSalary"]').fill("367250");
  await f.locator('[name="raised"][value="No"]').check({ force: true });
  await f.locator('[name="consent"]').check({ force: true });
  return f;
}

test("valuation shows a preliminary figure, refines it, and sends the lead once", async ({
  page,
}) => {
  await page.clock.install();
  let release!: () => void;
  const hold = new Promise<void>((r) => (release = r));
  const sent = await mockApi(page, {
    "/analyze": () => ({ body: ANALYZED, hold }),
    "/compare": () => ({
      body: { comps: COMPS, sourced: 4, filled_from_static: 0 },
    }),
    "/submit-lead": () => ({ body: { run_id: "v1" } }),
  });
  await page.goto("/valuation-tool");
  const f = await fillValuation(page);
  await f.locator('button[type="submit"]').click();
  await expect(page.locator("[data-valuation-loading]")).toBeVisible();
  await expect(page.locator("[data-valuation-results]")).toBeHidden();

  await page.clock.runFor(10_000);
  const results = page.locator("[data-valuation-results]");
  await expect(results).toBeVisible();
  await expect(page.locator('[data-v="status"]').first()).toContainText(
    "Preliminary",
  );
  const preliminary = await page.locator('[data-v="range"]').textContent();
  expect(sent("/submit-lead")).toHaveLength(0);

  release();
  await expect(page.locator('[data-v="status"]').first()).toHaveText(
    "Refined estimate",
  );
  expect(await page.locator('[data-v="range"]').textContent()).not.toBe(
    preliminary,
  );
  await expect.poll(() => sent("/submit-lead").length).toBe(1);

  // The analysis got USD figures, only the keys the API knows.
  expect(sent("/analyze")[0].body).toEqual({
    company: "Acme",
    domain: "acme.com",
    sector: "SaaS",
    description: "",
    geography: "United Arab Emirates",
    revenue: expect.closeTo(1_000_000, 2),
    ebitda: expect.closeTo(300_000, 2),
    raised: false,
    stage: null,
  });
  expect(sent("/compare")[0].body).toEqual({
    company: "Acme",
    sector: "SaaS",
    description: "",
    revenue: expect.closeTo(1_000_000, 2),
    geography: "United Arab Emirates",
  });
  expect(sent("/submit-lead")[0].body).toEqual({
    submission_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    company: "Acme",
    name: "Sam",
    email: "sam@example.com",
    domain: "acme.com",
    description: null,
    sector: "SaaS",
    geography: "United Arab Emirates",
    stage: null,
    last_raise_revenue: null,
    last_raise_pbt: null,
    revenue: expect.closeTo(1_000_000, 2),
    profit_before_tax: expect.closeTo(200_000, 2),
    owner_salary: expect.closeTo(100_000, 2),
    consent: true,
    comps: COMPS.map(({ co, tk, ev, rev, ebitda }) => ({
      co,
      tk,
      ev,
      rev,
      ebitda,
    })),
    discounts: ANALYZED.discounts,
    dcf: ANALYZED.dcf,
    transaction_search_terms: ["spare parts"],
    vc_search_terms: ["auto"],
    analytics: { consent: false },
  });
});

test("leaving before the analysis settles still sends the lead, once", async ({
  page,
}) => {
  await page.clock.install();
  const sent = await mockApi(page, {
    "/analyze": () => ({ hold: new Promise<void>(() => {}) }),
    "/compare": () => ({ hold: new Promise<void>(() => {}) }),
    "/submit-lead": () => ({ body: { run_id: "v1" } }),
  });
  await page.goto("/valuation-tool");
  const f = await fillValuation(page);
  await f.locator('button[type="submit"]').click();
  await page.clock.runFor(10_000);
  await expect(page.locator("[data-valuation-results]")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect.poll(() => sent("/submit-lead").length).toBe(1);
  // Nothing landed, so the lead goes without the analyst inputs.
  const body = sent("/submit-lead")[0].body;
  expect(body).toMatchObject({ comps: [], discounts: null, dcf: null });
  await page.clock.runFor(190_000);
  expect(sent("/submit-lead")).toHaveLength(1);
});

test("the website field fills the description and sector once per address", async ({
  page,
}) => {
  const sent = await mockApi(page, {
    "/enrich": () => ({
      body: {
        description: "We run an online marketplace for used cars in Dubai.",
        sector: "",
      },
    }),
  });
  await page.goto("/valuation-tool");
  const f = page.locator("[data-valuation-form]");
  await f.locator('[name="domain"]').fill("acme.com");
  await f.locator('[name="domain"]').blur();
  await expect(f.locator('[name="description"]')).toHaveValue(
    /online marketplace/,
  );
  await expect(page.locator("[data-enrich]")).toContainText("Auto-filled");
  await expect(f.locator('[name="sector"]')).toHaveValue("E-commerce");
  await f.locator('[name="domain"]').focus();
  await f.locator('[name="domain"]').blur();
  expect(sent("/enrich")).toHaveLength(1);
  expect(sent("/enrich")[0].body).toEqual({ domain: "acme.com" });
});
