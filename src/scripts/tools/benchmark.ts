// Benchmark tool behaviour: mode and currency switches, steps, validation,
// scoring and results. Every question is already in the HTML. The result is
// worked out in the browser. The email form sends the figures to the tools API.
import {
  DATA,
  FX,
  ORDER,
  QLABEL,
  compute,
  coverNote,
  flags,
  quart,
  view,
  type Cur,
  type Input,
  type Mode,
} from "../../lib/tools/benchmark";
import { ApiError, FAIL_TEXT, analytics, newId, post } from "./lead";

const root = document.getElementById("bm");
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends HTMLElement = HTMLInputElement>(id: string) =>
    document.getElementById("bm-" + id) as T;
  const picked = (name: string) =>
    (root.querySelector(`[name="bm-${name}"]:checked`) as HTMLInputElement)
      .value;
  const num = (id: string) => {
    const n = parseFloat($(id).value.replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? null : n;
  };
  const MONEY = ["rev", "prev", "ebitda", "salary", "rent"];
  const PH = {
    AED: ["5,000,000", "4,400,000", "700,000", "360,000", "750,000"],
    USD: ["1,360,000", "1,200,000", "190,000", "98,000", "204,000"],
  };
  const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
  // The answers behind the result on show, for the email form.
  let last: Input | null = null;
  // A retry after a failure reuses the id, so the server never records twice.
  const submissionId = newId();
  let mode: Mode = "sme";
  let disp: Cur = "AED";
  const cur = () => (mode === "tech" ? "USD" : disp);

  // Carry typed figures across a currency change at the peg.
  const convert = (f: number) =>
    MONEY.forEach((id) => {
      const v = num(id);
      if (v != null) $(id).value = Math.round(v * f).toLocaleString("en-US");
    });
  const relabel = () => {
    root.querySelectorAll(".cur").forEach((e) => (e.textContent = cur()));
    MONEY.forEach((id, i) => ($(id).placeholder = PH[cur()][i]));
  };
  // Locations and payment days only show for some SME sectors.
  const applySector = () => {
    const s = mode === "sme" ? DATA.sectors[$("sector").value] : undefined;
    $("outwrap").hidden = !s?.multiSite;
    $("dsowrap").hidden = !s?.b2b;
  };

  root.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === "bm-mode") {
      // Startup mode is USD only.
      if (disp === "AED") convert(t.value === "tech" ? 1 / FX : FX);
      mode = t.value as Mode;
      root.dataset.mode = mode;
      relabel();
      applySector();
    } else if (t.name === "bm-cur") {
      convert(t.value === "USD" ? 1 / FX : FX);
      disp = t.value as Cur;
      relabel();
    } else if (t.name === "bm-sal") {
      $("salwrap").hidden = t.value !== "yes";
    } else if (t.id === "bm-sector") applySector();
  });

  // Thousands separators on money fields.
  [...MONEY, "raised"].forEach((id) =>
    $(id).addEventListener("input", () => {
      const raw = $(id).value.replace(/[^0-9-]/g, "");
      $(id).value =
        raw === "" || raw === "-" ? raw : Number(raw).toLocaleString("en-US");
    }),
  );

  const go = (n: number) => {
    steps.forEach((s, i) => (s.hidden = i !== n - 1));
    root.scrollIntoView();
    steps[n - 1]
      .querySelector<HTMLElement>("[tabindex='-1']")
      ?.focus({ preventScroll: true });
  };
  // Check only the fields on show for this mode and sector.
  const valid = (form: HTMLElement) => {
    for (const el of form.querySelectorAll<HTMLInputElement>("input, select"))
      if (el.offsetParent !== null && !el.reportValidity()) return false;
    return true;
  };

  steps.slice(0, 3).forEach((form, i) =>
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!valid(form)) return;
      if (i === 2) render();
      go(i + 2);
    }),
  );
  root
    .querySelectorAll<HTMLElement>("[data-back]")
    .forEach((b) =>
      b.addEventListener("click", () => go(Number(b.dataset.back))),
    );

  const clone = (id: string) =>
    (
      $<HTMLTemplateElement>(id).content.firstElementChild as HTMLElement
    ).cloneNode(true) as HTMLElement;
  const put = (el: HTMLElement, sel: string, text: string) =>
    ((el.querySelector(sel) as HTMLElement).textContent = text);

  function render() {
    const tech = mode === "tech";
    const sector = $<HTMLSelectElement>(tech ? "tsector" : "sector");
    const input: Input = {
      mode,
      disp,
      cut: tech ? $("stage").value : sector.value,
      sector: sector.selectedOptions[0].text,
      rev: num("rev"),
      prev: num("prev"),
      ebitda: num("ebitda"),
      salaryDeducted: picked("sal") === "yes",
      salary: num("salary"),
      staff: num("staff"),
      rent: num("rent"),
      raised: num("raised"),
      gm: num("gm"),
      conc: num("conc"),
      recur: num("recur"),
    };
    last = input;
    const r = compute(input);
    const { show } = view(input);

    const cover = coverNote(input, r);
    $("cover").textContent = cover;
    $("cover").hidden = !cover;

    const rows = ORDER[mode].filter((k) => r.metrics[k]);
    $("metrics").replaceChildren(
      ...rows.map((k) => {
        const d = r.metrics[k];
        const el = clone("metric");
        const q = quart(d.pct);
        const pos = Math.max(2, Math.min(98, d.pct));
        const val = show(d.value, d.meta.unit);
        const med = show(d.anchors[2], d.meta.unit);
        el.dataset.q = String(q);
        // Move the median label aside when your marker sits close to it.
        el.dataset.shift =
          Math.abs(pos - 50) < 17 ? (pos <= 50 ? "right" : "left") : "";
        el.dataset.edge = pos < 15 ? "start" : pos > 85 ? "end" : "";
        el.style.setProperty("--pos", pos + "%");
        put(el, ".mname", d.meta.label);
        put(el, ".pill", QLABEL[q]);
        put(el, ".mval", val);
        put(el, ".medlab", "median " + med);
        put(el, ".desc", `You: ${val}. Peer median: ${med}.`);
        return el;
      }),
    );

    $("flags").replaceChildren(
      ...flags(input, r).map((f) => {
        const el = clone("flag");
        el.dataset.tone = f.tone;
        put(el, "h4", f.title);
        put(el, "p", f.body);
        return el;
      }),
    );
    $("status").textContent =
      `Your benchmark is ready. ${rows.length} metrics ranked.`;
  }

  $<HTMLFormElement>("report").addEventListener("submit", async (e) => {
    e.preventDefault();
    const i = last;
    if (!i) return;
    const btn = $<HTMLButtonElement>("report").querySelector(
      "button[type=submit]",
    ) as HTMLButtonElement;
    const fail = $("error");
    btn.disabled = true;
    fail.hidden = true;
    // Startup mode is USD. SME figures are in the chosen currency.
    const f = i.mode === "sme" && i.disp === "AED" ? 1 / FX : 1;
    const usd = (v: number | null) => (v == null ? null : v * f);
    const tech = i.mode === "tech";
    try {
      await post("/benchmark", {
        submission_id: submissionId,
        mode: i.mode,
        peer_key: i.cut,
        sector: tech ? $("tsector").value : undefined,
        company: $("company").value.trim(),
        name: $("name").value.trim(),
        email: $("email").value.trim(),
        phone: $("phone").value.trim() || undefined,
        domain: null,
        geography: $("geo").value || null,
        consent: $("consent").checked,
        revenue: usd(i.rev),
        prev_revenue: usd(i.prev),
        ebitda_reported: usd(i.ebitda),
        owner_salary: i.salaryDeducted ? usd(i.salary) : null,
        salary_deducted: i.salaryDeducted,
        gross_margin_pct: i.gm,
        headcount: i.staff,
        rent_cost: usd(i.rent),
        capital_raised: i.raised,
        top_customer_pct: i.conc,
        recurring_pct: i.recur,
        years_active: num("years"),
        outlets: $("outwrap").hidden ? null : num("outlets"),
        days_to_get_paid: $("dsowrap").hidden ? null : num("dso"),
        analytics: analytics(),
      });
    } catch (err) {
      fail.textContent =
        FAIL_TEXT[err instanceof ApiError ? err.kind : "server"];
      fail.hidden = false;
      btn.disabled = false;
      return;
    }
    $("report").hidden = true;
    $("thanks").hidden = false;
    ($("thanks").querySelector("h3") as HTMLElement).focus();
  });
}
