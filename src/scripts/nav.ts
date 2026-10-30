// Mobile menu toggle.
const header = document.querySelector<HTMLElement>("[data-header]");
const burger = header?.querySelector<HTMLButtonElement>(".burger");
burger?.addEventListener("click", () => {
  const open = header?.toggleAttribute("data-open") ?? false;
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

export {};
