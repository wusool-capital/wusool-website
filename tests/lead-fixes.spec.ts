import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import {
  SECTORS,
  detectSectorFromText,
  fmt,
  fmtResult,
  sectorProfiles,
  valuation,
} from "../src/lib/tools/valuation";
import { isLaterDay } from "../src/lib/dates";

// Bug fixes that ship with lead capture (AZM-207). Each failed before its fix.

test("Qatar and Bahrain pay 0% tax in the DCF", () => {
  const p = sectorProfiles()["SaaS"];
  for (const geo of ["Qatar", "Bahrain"]) {
    const r = valuation(
      {
        sector: "SaaS",
        geo,
        stage: "",
        revenue: 2_000_000,
        profitBeforeTax: 400_000,
        ownerSalary: 0,
      },
      p,
      [],
      2026,
    );
    expect(r.dcf.tax, geo).toBe(0);
  }
});

test("every sector the keyword matcher can return is in the sector list", () => {
  const src = readFileSync("src/lib/tools/valuation.ts", "utf8");
  const body = src.slice(src.indexOf("export function detectSectorFromText"));
  const names = [...body.matchAll(/return "([^"]+)";/g)].map((m) => m[1]);
  expect(names.length).toBeGreaterThan(20);
  for (const n of new Set(names)) expect(SECTORS, n).toContain(n);
});

test("a same-day update is not shown as updated", () => {
  expect(isLaterDay("2026-03-01T08:00:00Z", "2026-03-01T17:30:00Z")).toBe(
    false,
  );
  expect(isLaterDay("2026-03-01T08:00:00Z", "2026-03-02T01:00:00Z")).toBe(true);
  expect(isLaterDay(undefined, "2026-03-02T01:00:00Z")).toBe(true);
  expect(isLaterDay("2026-03-01", undefined)).toBe(false);
});

test("result amounts below $1M do not print as $0.0M", () => {
  expect(fmtResult(40_000)).toBe("$40,000");
  expect(fmtResult(450_000)).toBe("$450,000");
  expect(fmtResult(2_500_000)).toBe("$2.5M");
  expect(fmtResult(-450_000)).toBe("($450,000)");
});

test("AED figures convert from USD with the peg", () => {
  expect(fmt(1_000_000, "AED")).toBe("AED 3.7M");
  expect(fmtResult(1_000_000, "AED")).toBe("AED 3.7M");
});

test("Benchmark says fifteen questions, matching Readiness", async ({
  request,
}) => {
  const html = await (await request.get("/benchmark")).text();
  expect(html).toContain("Fifteen questions");
  expect(html).not.toContain("Twenty questions");
});

test("a negative owner salary or last-round revenue blocks submit with a message", async ({
  page,
}) => {
  await page.goto("/valuation-tool");
  const f = page.locator("[data-valuation-form]");
  await f.locator('[name="companyName"]').fill("Acme");
  await f.locator('[name="name"]').fill("Sam");
  await f.locator('[name="email"]').fill("sam@example.com");
  await f.locator('[name="domain"]').fill("example.com");
  await f.locator('[name="sector"]').selectOption({ index: 1 });
  await f.locator('[name="geo"]').selectOption({ index: 1 });
  await f.locator('[name="revenue"]').fill("1000000");
  await f.locator('[name="raised"][value="No"]').check({ force: true });
  await f.locator('[name="consent"]').check({ force: true });
  await f.locator('[name="ownerSalary"]').fill("-50000");
  await f.locator('button[type="submit"]').click();
  await expect(page.locator('[data-error="ownerSalary"]')).toHaveText(
    "Enter 0 or more.",
  );
  await expect(page.locator("[data-valuation-results]")).toBeHidden();

  await f.locator('[name="ownerSalary"]').fill("0");
  await f.locator('[name="raised"][value="Yes"]').check({ force: true });
  await f.locator('[name="lastRaiseRevenue"]').fill("-1000");
  await f.locator('button[type="submit"]').click();
  await expect(page.locator('[data-error="lastRaiseRevenue"]')).toHaveText(
    "Enter 0 or more.",
  );
  await expect(page.locator("[data-valuation-results]")).toBeHidden();
});
