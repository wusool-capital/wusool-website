import { test, expect, type Page } from "@playwright/test";

// Each consent choice must behave as on the live site (PRD 9), except that
// Clarity now loads only after "Accept all" (no third-party script before consent).

type Choice = "declined" | "cookies" | "all";
const COOKIE = "wusool_analytics_consent";

async function setup(page: Page) {
  const clarity: string[] = [];
  // Stub the tools app bridge and Clarity so the test needs no network.
  await page.route("https://tools.wusoolcapital.com/embed.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "window.WusoolAnalytics = window.WusoolAnalytics || { calls: [], setConsent(g) { this.calls.push(g); } };",
    }),
  );
  await page.route("https://www.clarity.ms/**", (r) => {
    clarity.push(r.request().url());
    return r.fulfill({ contentType: "text/javascript", body: "" });
  });
  return clarity;
}

// Collects the wusool-consent event and messages posted to an iframe.
async function listen(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { events: unknown[]; msgs: unknown[] };
    w.events = [];
    w.msgs = [];
    window.addEventListener("wusool-consent", (e) =>
      w.events.push((e as CustomEvent).detail),
    );
    const f = document.createElement("iframe");
    document.body.appendChild(f);
    f.contentWindow?.addEventListener("message", (e) => w.msgs.push(e.data));
  });
}

const state = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as {
      dataLayer: unknown[][];
      clarity: { q: unknown[][] };
      WusoolAnalytics: { calls: boolean[] };
      events: unknown[];
      msgs: unknown[];
    };
    return {
      dataLayer: w.dataLayer.map((a) => [...a]),
      clarity: w.clarity.q.map((a) => [...a]),
      bridge: w.WusoolAnalytics.calls,
      events: w.events,
      msgs: w.msgs,
      storage: localStorage.getItem("wusool_analytics_consent"),
    };
  });

for (const choice of ["declined", "cookies", "all"] as Choice[]) {
  test(`"${choice}" sets the same cookie and consent signals as live`, async ({
    page,
    context,
  }) => {
    const clarity = await setup(page);
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: "Cookie choices" });
    await expect(banner).toBeVisible();
    await listen(page);
    expect(clarity, "no Clarity before a choice").toEqual([]);

    const before = await state(page);
    expect(before.dataLayer[0]).toEqual([
      "consent",
      "default",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        wait_for_update: 500,
      },
    ]);

    await banner.locator(`[data-consent="${choice}"]`).click();
    await expect(banner).toBeHidden();

    const cookie = (await context.cookies()).find((c) => c.name === COOKIE);
    expect(cookie?.value).toBe(choice);
    expect(cookie?.sameSite).toBe("Lax");
    expect(cookie?.secure).toBe(true);

    const s = await state(page);
    const all = choice === "all";
    expect(s.storage).toBe(all ? "granted" : "denied");
    expect(s.dataLayer).toContainEqual([
      "consent",
      "update",
      { analytics_storage: choice === "declined" ? "denied" : "granted" },
    ]);
    expect(s.clarity.at(-1)).toEqual([
      "consentv2",
      { ad_Storage: "denied", analytics_Storage: all ? "granted" : "denied" },
    ]);
    expect(s.bridge).toEqual([all]);
    const msg = { type: "wusool-consent", choice, version: "2026-10" };
    expect(s.events).toEqual([msg]);
    await expect.poll(async () => (await state(page)).msgs).toEqual([msg]);
    expect(clarity.length > 0, "Clarity loads only on Accept all").toBe(all);
  });
}

test("a returning visitor who accepted all gets Clarity and no banner", async ({
  page,
  context,
  baseURL,
}) => {
  const clarity = await setup(page);
  await context.addCookies([
    { name: COOKIE, value: "all", url: baseURL ?? "" },
  ]);
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Cookie choices" }),
  ).toBeHidden();
  const s = await state(page);
  expect(
    (s.dataLayer[0] as [string, string, { analytics_storage: string }])[2]
      .analytics_storage,
  ).toBe("granted");
  expect(s.storage).toBe("granted");
  await expect.poll(() => clarity.length).toBeGreaterThan(0);
});

test("Privacy choices reopens the banner", async ({
  page,
  context,
  baseURL,
}) => {
  await setup(page);
  await context.addCookies([
    { name: COOKIE, value: "declined", url: baseURL ?? "" },
  ]);
  await page.goto("/");
  const banner = page.getByRole("dialog", { name: "Cookie choices" });
  await expect(banner).toBeHidden();
  await page.getByRole("button", { name: "Privacy choices" }).click();
  await expect(banner).toBeVisible();
  await expect(banner.getByRole("button", { name: "Decline" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(banner).toBeHidden();
});
