// Hides the announcement strip once closed, per pinned report.
const KEY = "latest-read-dismissed";
const strip = document.querySelector<HTMLElement>("[data-strip]");
const slug = strip?.dataset.slug ?? "";
try {
  if (strip && localStorage.getItem(KEY) === slug) strip.hidden = true;
} catch {
  /* storage blocked */
}
strip?.querySelector(".close")?.addEventListener("click", () => {
  strip.hidden = true;
  // Keep the keyboard place: focus moves to the logo, the next item.
  document.querySelector<HTMLElement>(".logo")?.focus();
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    /* storage blocked */
  }
});

export {};
