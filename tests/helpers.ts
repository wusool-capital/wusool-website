import { expect, type Page } from "@playwright/test";

// Answers every visible question with the first option or a sample value,
// then presses the step's forward button, until something `done` matches is
// visible. `done` may list several selectors.
export async function completeTool(
  page: Page,
  root: string,
  forward: string,
  done: string,
) {
  const tool = page.locator(root);
  for (
    let step = 0;
    step < 80 && !(await page.locator(done).filter({ visible: true }).count());
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
    const next = tool.locator(forward).filter({ visible: true });
    // While a request is out there is no button, so wait for it to settle.
    if (await next.count()) await next.first().click();
    else await page.waitForTimeout(100);
  }
  await expect(page.locator(done).filter({ visible: true })).not.toHaveCount(0);
}
