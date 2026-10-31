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
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    /* storage blocked */
  }
});

export {};
