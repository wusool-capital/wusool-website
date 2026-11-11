// Referral calculator: recomputes the referral fee as the slider moves.
import { earnings, usd } from "../lib/referral";

document
  .querySelectorAll<HTMLElement>("[data-referral-calc]")
  .forEach((calc) => {
    const input = calc.querySelector<HTMLInputElement>("input[type=range]");
    if (!input) return;
    const out = (name: string) =>
      calc.querySelector<HTMLElement>(`[data-out="${name}"]`);
    const update = () => {
      const deal = Number(input.value);
      // Screen readers announce the amount, not the raw number.
      input.setAttribute("aria-valuetext", usd(deal));
      const values = { deal, share: earnings(deal).share };
      for (const [name, value] of Object.entries(values)) {
        const el = out(name);
        if (el) el.textContent = usd(value);
      }
    };
    input.addEventListener("input", update);
    update();
  });
