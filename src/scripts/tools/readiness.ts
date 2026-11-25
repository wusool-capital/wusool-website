// Deal readiness tool: step navigation, browser validation, then the answers
// go to the tools API, which scores them and records the lead. The red flags
// are worked out in the browser.
import { SECTIONS, flags } from "../../lib/tools/readiness";
import {
  ApiError,
  FAIL_TEXT,
  analytics,
  cleanDomain,
  newId,
  post,
} from "./lead";

interface Scored {
  overallScore: number;
  scoreBand: string;
  summaryParagraph: string;
  dimensions: { name: string; score: number; insight: string }[];
  recommendations: { title: string; detail: string }[];
}
const MESSAGES = [
  "Reviewing your financial position...",
  "Analysing team and operations...",
  "Evaluating revenue quality...",
  "Checking legal structure...",
  "Assessing your growth story...",
  "Calculating your readiness score...",
];

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
  const loading = $("[data-loading]");
  const failed = $("[data-failed]");
  const res = $("[data-results]");
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
    const fields = $$<HTMLInputElement>("input, select, textarea", steps[cur]);
    // An answer made only of spaces counts as empty, as in the original.
    for (const f of fields)
      if (f.type !== "radio" && f.type !== "checkbox") f.value = f.value.trim();
    const bad = fields.find((f) => !f.checkValidity());
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

  // A retry after a failure reuses the id, so the server never records twice.
  const submissionId = newId();

  // Shows one panel and hides the form and the others. null shows the form.
  const swap = (panel: HTMLElement | null) => {
    form.hidden = panel !== null;
    [loading, failed, res].forEach((p) => (p.hidden = p !== panel));
    $("[data-progress]").hidden = true;
    root.scrollIntoView({ block: "start" });
    panel?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  };

  async function send() {
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const answers: Record<string, number> = {};
    const text: Record<string, string> = {};
    SECTIONS.forEach((s) => {
      s.questions.forEach((q) => (answers[q.id] = Number(get(q.id))));
      s.texts?.forEach((t) => {
        if (get(t.id)) text[t.id] = get(t.id);
      });
    });

    swap(loading);
    let i = 0;
    const line = $("[data-loading-text]", loading);
    line.textContent = MESSAGES[0];
    const timer = setInterval(
      () => (line.textContent = MESSAGES[++i % MESSAGES.length]),
      1100,
    );
    try {
      const r = await post<Scored>("/readiness/score", {
        submission_id: submissionId,
        name: get("name"),
        company: get("biz"),
        email: get("email"),
        sector: get("sector"),
        revenue: get("revenue") || null,
        country: get("country") || null,
        domain: cleanDomain(get("domain")) || null,
        answers: { ...answers, ...text },
        analytics: analytics(),
      });
      render(r, get, flags(answers));
    } catch (e) {
      $("[data-failed-text]", failed).textContent =
        FAIL_TEXT[e instanceof ApiError ? e.kind : "server"];
      swap(failed);
    } finally {
      clearInterval(timer);
    }
  }

  $("[data-retry]", failed).addEventListener("click", send);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (valid()) send();
  });

  function render(r: Scored, get: (k: string) => string, list: string[]) {
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const item = (...kids: (string | HTMLElement)[]) => {
      const li = document.createElement("li");
      li.append(...kids);
      return li;
    };
    const overall = Math.round(r.overallScore);
    $("[data-thanks]", res).textContent =
      `Thanks, ${get("name")}. Here is your deal readiness score.`;
    $("[data-biz]", res).textContent = `${get("biz")}, ${get("sector")}`;
    $("[data-for]", res).textContent = `Prepared for ${get("name")}, ${date}`;
    $("[data-date]", res).textContent = date;
    $("[data-score]", res).textContent = String(overall);
    $("[data-band]", res).textContent = r.scoreBand;
    $("[data-summary]", res).textContent = r.summaryParagraph;
    // The server names its five areas. Match each bar by its first word.
    $$("[data-sec]", res).forEach((b, i) => {
      const word = SECTIONS[i].title.split(" ")[0].toLowerCase();
      const d =
        r.dimensions.find((x) => x.name.toLowerCase().startsWith(word)) ??
        r.dimensions[i];
      b.textContent = `${Math.round(d?.score ?? 0)} / 100`;
      const bar = $<HTMLProgressElement>(
        "[data-bar]",
        b.parentElement as HTMLElement,
      );
      bar.value = d?.score ?? 0;
    });
    $("[data-recs]", res).replaceChildren(
      ...r.recommendations.map((x) => {
        const t = document.createElement("strong");
        t.textContent = x.title;
        return item(t, ` ${x.detail}`);
      }),
    );
    $("[data-flags]", res).replaceChildren(
      ...(list.length ? list : ["No major red flags in your answers."]).map(
        (t) => item(t),
      ),
    );
    status.textContent = `Your score is ${overall} out of 100: ${r.scoreBand}.`;
    swap(res);
  }
}
