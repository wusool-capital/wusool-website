// Insights hub: topic and format filters (no URL change, the full list stays
// in the HTML) and Pagefind search, loaded only when the search box is used.
const filters = { topic: "", format: "" };
const cards = [
  ...document.querySelectorAll<HTMLElement>("[data-browse] .card"),
];
const status = document.querySelector<HTMLElement>("[data-status]");

function applyFilters() {
  let shown = 0;
  for (const c of cards) {
    const ok =
      (!filters.topic || c.dataset.topic === filters.topic) &&
      (!filters.format || c.dataset.format === filters.format);
    c.hidden = !ok;
    if (ok) shown++;
  }
  if (status)
    status.textContent =
      filters.topic || filters.format ? `${shown} matching` : "";
}

document.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const kind = btn.dataset.filter as "topic" | "format";
    filters[kind] = btn.dataset.value ?? "";
    document
      .querySelectorAll<HTMLButtonElement>(`[data-filter="${kind}"]`)
      .forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    applyFilters();
  });
});

// Search
type Result = { url: string; meta: { title?: string }; excerpt: string };
type Pagefind = {
  search: (
    q: string,
  ) => Promise<{ results: { data: () => Promise<Result> }[] }>;
};
let pagefind: Promise<Pagefind> | undefined;
const load = () => {
  const path = "/pagefind/pagefind.js";
  pagefind ??= import(/* @vite-ignore */ path) as Promise<Pagefind>;
  return pagefind;
};

const input = document.querySelector<HTMLInputElement>("[data-search] input");
const results = document.querySelector<HTMLElement>("[data-results]");
const list = document.querySelector<HTMLElement>("[data-results-list]");
const browse = document.querySelector<HTMLElement>("[data-browse]");
const filterBar = document.querySelector<HTMLElement>("[data-filters]");

input?.addEventListener("focus", () => void load(), { once: true });
input?.form?.addEventListener("submit", (e) => e.preventDefault());

let run = 0;
input?.addEventListener("input", async () => {
  const q = input.value.trim();
  const id = ++run;
  const searching = q.length > 1;
  if (browse) browse.hidden = searching;
  if (filterBar) filterBar.hidden = searching;
  if (results) results.hidden = !searching;
  if (!searching) {
    if (status) status.textContent = "";
    return;
  }
  const found = await (await load()).search(q);
  const data = await Promise.all(
    found.results.slice(0, 20).map((r) => r.data()),
  );
  if (id !== run || !list) return;
  list.replaceChildren(
    ...data.map((d) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = d.url.replace(/\.html$/, "");
      const title = document.createElement("strong");
      title.textContent = d.meta.title ?? d.url;
      const excerpt = document.createElement("span");
      // Pagefind excerpts are escaped text with <mark> highlights only.
      excerpt.innerHTML = d.excerpt;
      a.append(title, excerpt);
      li.append(a);
      return li;
    }),
  );
  if (status)
    status.textContent = `${data.length} result${data.length === 1 ? "" : "s"}`;
});

export {};
