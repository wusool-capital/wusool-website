// Partners page: category filters, the quiz and copy-code buttons. Matching
// runs on the cards already in the page; nothing is sent anywhere.
const $$ = <T extends Element>(s: string, r: ParentNode = document) => [
  ...r.querySelectorAll<T>(s),
];
const cards = $$<HTMLElement>("[data-directory] [data-partner]");

// Category filters show one category's cards, as on the insights hub.
$$<HTMLButtonElement>("[data-cat]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const cat = btn.dataset.cat ?? "";
    $$<HTMLButtonElement>("[data-cat]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b === btn)),
    );
    cards.forEach((c) => (c.hidden = !!cat && c.dataset.category !== cat));
  }),
);

// Copy a partner's code; the label confirms for a moment.
document.addEventListener("click", async (e) => {
  const btn = (e.target as Element).closest<HTMLElement>("[data-code]");
  if (!btn) return;
  const label = btn.querySelector<HTMLElement>("[data-copy-label]");
  try {
    await navigator.clipboard.writeText(btn.dataset.code ?? "");
    if (label) label.textContent = "Copied";
  } catch {
    if (label) label.textContent = "Select and copy";
  }
  setTimeout(() => label && (label.textContent = "Copy code"), 2000);
});

// Quiz: partners in the chosen categories, best fit on size and location
// first, up to three. A partner with no sizes or locations fits all.
const quiz = document.querySelector<HTMLElement>("[data-quiz]");
if (quiz) {
  const form = quiz.querySelector("form") as HTMLFormElement;
  const results = quiz.querySelector("[data-quiz-results]") as HTMLElement;
  const list = quiz.querySelector("[data-quiz-list]") as HTMLElement;
  const none = quiz.querySelector("[data-quiz-none]") as HTMLElement;
  const error = quiz.querySelector("[data-quiz-error]") as HTMLElement;
  const fits = (attr: string | undefined, v: string) =>
    !attr || attr.split(" ").includes(v);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const needs = data.getAll("need").map(String);
    const size = String(data.get("size") ?? "");
    const location = String(data.get("location") ?? "");
    if (!needs.length || !size || !location || !data.get("horizon")) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const matches = cards
      .filter((c) => needs.includes(c.dataset.category ?? ""))
      .map((c, i) => ({
        c,
        i,
        score:
          Number(fits(c.dataset.sizes, size)) +
          Number(fits(c.dataset.locations, location)),
      }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, 3);
    list.replaceChildren(
      ...matches.map(({ c }) => {
        const copy = c.cloneNode(true) as HTMLElement;
        copy.hidden = false;
        return copy;
      }),
    );
    none.hidden = matches.length > 0;
    form.hidden = true;
    results.hidden = false;
    results.querySelector("h2")?.focus();
  });

  quiz.querySelector("[data-quiz-again]")?.addEventListener("click", () => {
    results.hidden = true;
    form.hidden = false;
    form.querySelector("input")?.focus();
  });
}
