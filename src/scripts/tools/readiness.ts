// Deal readiness tool: step navigation, browser validation, scoring and
// results. Sends nothing over the network.
import { SECTIONS, score, flags } from "../../lib/tools/readiness";

const root = document.querySelector<HTMLElement>("[data-readiness]");
if (root) {
  const $ = <T extends Element = HTMLElement>(
    sel: string,
    el: Element = root,
  ) => el.querySelector(sel) as T;
  const $$ = <T extends Element = HTMLElement>(
    sel: string,
    el: Element = root,
  ) => [...el.querySelectorAll<T>(sel)];
  const form = $<HTMLFormElement>("form");
  const steps = $$("[data-step]");
  const marks = $$("[data-progress] li");
  const status = $("[data-status]");
  let cur = 0;

  const show = (n: number) => {
    steps.forEach((s, i) => (s.hidden = i !== n));
    cur = n;
    $("[data-progress]").hidden = n < 1 || n > SECTIONS.length;
    marks.forEach((m, i) => {
      m.toggleAttribute("data-done", i < n - 1);
      if (i === n - 1) m.setAttribute("aria-current", "step");
      else m.removeAttribute("aria-current");
    });
    root.scrollIntoView({ block: "start" });
    $("h2", steps[n]).focus({ preventScroll: true });
  };

  // The welcome step has no error message.
  const err = (on: boolean) => {
    const e = steps[cur].querySelector<HTMLElement>("[data-error]");
    if (e) e.hidden = !on;
  };

  // Shows the step's error and focuses the first missing answer.
  const valid = () => {
    const bad = $$<HTMLInputElement>(
      "input, select, textarea",
      steps[cur],
    ).find((f) => !f.checkValidity());
    err(!!bad);
    bad?.focus();
    return !bad;
  };

  form.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-go]");
    if (!b) return;
    const d = Number(b.dataset.go);
    if (d > 0 && !valid()) return;
    show(cur + d);
  });
  form.addEventListener("change", () => {
    if (
      $$("input, select, textarea", steps[cur]).every((f) =>
        (f as HTMLInputElement).checkValidity(),
      )
    )
      err(false);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!valid()) return;
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const answers: Record<string, number> = {};
    SECTIONS.forEach((s) =>
      s.questions.forEach((q) => (answers[q.id] = Number(get(q.id)))),
    );
    const r = score(answers);
    const res = $("[data-results]");
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    $("[data-thanks]", res).textContent =
      `Thanks, ${get("name")}. Here is your deal readiness score.`;
    $("[data-biz]", res).textContent = `${get("biz")}, ${get("sector")}`;
    $("[data-for]", res).textContent = `Prepared for ${get("name")}, ${date}`;
    $("[data-date]", res).textContent = date;
    $("[data-score]", res).textContent = String(r.overall);
    $("[data-band]", res).textContent = r.band;
    $$("[data-sec]", res).forEach(
      (b, i) => (b.textContent = `${r.sections[i]} / 100`),
    );
    $$<HTMLProgressElement>("[data-bar]", res).forEach(
      (p, i) => (p.value = r.sections[i]),
    );
    const list = flags(answers);
    $("[data-flags]", res).replaceChildren(
      ...(list.length ? list : ["No major red flags in your answers."]).map(
        (t) => {
          const li = document.createElement("li");
          li.textContent = t;
          return li;
        },
      ),
    );
    form.hidden = true;
    $("[data-progress]").hidden = true;
    res.hidden = false;
    status.textContent = `Your score is ${r.overall} out of 100: ${r.band}.`;
    root.scrollIntoView({ block: "start" });
    $("h2", res).focus({ preventScroll: true });
  });
}
