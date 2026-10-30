import { test, expect } from "@playwright/test";

// Pages to smoke test. Add each new page as it ships.
const pages = ["/"];

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
    for (const href of hrefs) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
    expect(errors).toEqual([]);
  });
}
