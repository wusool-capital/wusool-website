// Valuation tool behaviour: form toggles, validation, the calculation and the
// results. The estimate is worked out in the browser. /enrich fills the
// description from the website, /analyze and /compare refine the estimate,
// and /submit-lead records the lead once those have settled.
import {
  SECTORS,
  valuation,
  detectSectorFromText,
  fmt,
  fmtM,
  fmtP,
  fmtResult,
  type Comp,
  type Growth,
  type Profile,
  type Refine,
  type VcRow,
} from "../../lib/tools/valuation";
import { analytics, cleanDomain, newId, post } from "./lead";

const LOADING_MS = 10_000;
// The analysis can take a few minutes. After this the lead goes on what landed.
const SETTLE_MS = 185_000;
const STEPS = [
  "Analyzing financial inputs...",
  "Computing DCF projections...",
  "Matching transaction comparables...",
  "Benchmarking against listed peers...",
  "Calibrating valuation ranges...",
];
interface Analyzed {
  discounts?: Refine["discounts"];
  dcf?: Growth | null;
  transaction_search_terms?: string[];
  vc_search_terms?: string[];
}
// One submission: the figures sent with the lead and what has landed so far.
interface Run {
  lead: Record<string, unknown>;
  refine: Refine;
  txTerms: string[];
  vcTerms: string[];
  sent: boolean;
  shown: boolean;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const root = document.querySelector<HTMLElement>("[data-valuation]");
if (root) init(root);

function init(root: HTMLElement) {
  // Every element below is rendered by Valuation.astro.
  const q = <T extends HTMLElement>(sel: string) =>
    root.querySelector(sel) as T;
  const form = q<HTMLFormElement>("[data-valuation-form]");
  const results = q("[data-valuation-results]");
  const funding = q("[data-funding]");
  const suggested = q("[data-suggested]");
  const enrichNote = q("[data-enrich]");
  const loading = q("[data-valuation-loading]");
  const title = q("#val-title");
  const live = q("[data-announce]");
  const sector = form.elements.namedItem("sector") as HTMLSelectElement;
  // Sector data loads from the site once the page has drawn.
  let profiles: Record<string, Profile> = {};
  let vc: VcRow[] = [];
  const load = () =>
    fetch("/tools/valuation-data.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { profiles: Record<string, Profile>; vc: VcRow[] }) => {
        profiles = d.profiles;
        vc = d.vc;
      });
  let data = load();
  data.catch(() => {});

  // The server's limits. A longer answer would be refused and the lead lost.
  Object.entries({
    companyName: 200,
    name: 200,
    domain: 253,
    description: 4000,
  }).forEach(([n, max]) =>
    form.querySelector(`[name="${n}"]`)?.setAttribute("maxlength", String(max)),
  );

  const field = (n: string) =>
    form.elements.namedItem(n) as HTMLInputElement | RadioNodeList | null;
  const val = (n: string) => (field(n)?.value ?? "").trim();
  const num = (n: string) => parseFloat(val(n).replace(/,/g, "")) || 0;
  const cur = () => val("currency") || "USD";
  const toUSD = (x: number) => (cur() === "AED" ? x / 3.6725 : x);
  const set = (key: string, text: string) =>
    root
      .querySelectorAll(`[data-v="${key}"]`)
      .forEach((e) => (e.textContent = text));
  const show = (key: string, on: boolean) =>
    root
      .querySelectorAll<HTMLElement>(`[data-show="${key}"]`)
      .forEach((e) => (e.hidden = !on));
  const controls = (n: string) =>
    form.querySelectorAll<HTMLElement>(`[name="${n}"]`);

  const setError = (n: string, msg: string) => {
    const err = root.querySelector<HTMLElement>(`[data-error="${n}"]`);
    if (err) {
      err.textContent = msg;
      err.hidden = !msg;
    }
    controls(n).forEach((c) =>
      msg
        ? c.setAttribute("aria-invalid", "true")
        : c.removeAttribute("aria-invalid"),
    );
  };

  form.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === "currency")
      root
        .querySelectorAll("[data-cur-label]")
        .forEach((l) => (l.textContent = `(${cur()})`));
    if (t.name === "raised") funding.hidden = val("raised") !== "Yes";
    if (t.name === "sector") suggested.hidden = true;
    setError(t.name, "");
  });
  form.addEventListener("input", (e) =>
    setError((e.target as HTMLInputElement).name, ""),
  );

  // Suggest a sector from the description, as the original tool did.
  const suggest = () => {
    const text = val("description");
    if (text.length <= 20 || sector.value) return;
    const guess = detectSectorFromText(text);
    if (guess && profiles[guess]) {
      sector.value = guess;
      suggested.hidden = false;
      setError("sector", "");
    }
  };
  (field("description") as HTMLInputElement).addEventListener("input", suggest);

  // Leaving the website field fills the description and sector from the site.
  // It only fills what the visitor has not typed, and asks once per address.
  let asked = "";
  let filled = "";
  (field("domain") as HTMLInputElement).addEventListener("blur", async () => {
    const domain = cleanDomain(val("domain"));
    if (!domain.includes(".") || domain === asked) return;
    asked = domain;
    enrichNote.textContent = "Analyzing your website...";
    enrichNote.hidden = false;
    try {
      const r = await post<{ description: string; sector: string }>("/enrich", {
        domain,
        company: val("companyName") || undefined,
      });
      // A newer address has been asked for. Its answer will fill the form.
      if (asked !== domain) return;
      const desc = field("description") as HTMLInputElement;
      if (
        r.description &&
        (!val("description") || val("description") === filled)
      )
        desc.value = filled = r.description;
      await data.catch(() => {});
      if (r.sector && SECTORS.includes(r.sector) && !sector.value) {
        sector.value = r.sector;
        suggested.hidden = false;
      } else suggest();
      enrichNote.textContent = "Auto-filled from your website. Check it.";
    } catch {
      asked = "";
      enrichNote.hidden = true;
    }
  });

  // Amounts show with thousands separators once the field is left.
  form.querySelectorAll<HTMLInputElement>("[data-number]").forEach((input) =>
    input.addEventListener("blur", () => {
      const n = parseFloat(input.value.replace(/,/g, ""));
      input.value = isNaN(n)
        ? ""
        : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }),
  );

  const rules: [string, () => boolean, string][] = [
    ["companyName", () => !!val("companyName"), "Enter your company name."],
    ["name", () => !!val("name"), "Enter your name."],
    ["email", () => val("email").includes("@"), "Enter a valid email address."],
    ["domain", () => !!val("domain"), "Enter your company website."],
    ["sector", () => !!val("sector"), "Select your sector."],
    ["geo", () => !!val("geo"), "Select your country."],
    ["revenue", () => num("revenue") > 0, "Enter your yearly revenue."],
    ["ownerSalary", () => num("ownerSalary") >= 0, "Enter 0 or more."],
    ["raised", () => !!val("raised"), "Choose yes or no."],
    [
      "lastRaiseRevenue",
      () => val("raised") !== "Yes" || num("lastRaiseRevenue") >= 0,
      "Enter 0 or more.",
    ],
    [
      "consent",
      () => (field("consent") as HTMLInputElement).checked,
      "Tick the box to accept the privacy policy.",
    ],
  ];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const failed = rules.filter(([n, ok, msg]) => {
      setError(n, ok() ? "" : msg);
      return !ok();
    });
    if (failed.length) {
      controls(failed[0][0])[0]?.focus();
      announce(
        `${failed.length} ${failed.length === 1 ? "answer needs" : "answers need"} attention.`,
      );
      return;
    }
    try {
      await data;
    } catch {
      data = load();
      data.catch(() => {});
      announce(
        "The sector data did not load. Check your connection and try again.",
      );
      return;
    }
    run();
  });

  // Shows the loading screen, then the preliminary estimate, then the refined
  // one once /analyze and /compare have landed. Each submission is its own
  // run with its own id, so an edited resubmission is recorded as a new lead.
  let current: Run | null = null;
  async function run() {
    const raised = val("raised") === "Yes";
    const usd = (n: string) => (val(n) === "" ? null : toUSD(num(n)));
    const domain = cleanDomain(val("domain"));
    const geo = val("geo");
    const revenue = toUSD(num("revenue"));
    const r: Run = {
      lead: {
        submission_id: newId(),
        company: val("companyName"),
        name: val("name"),
        email: val("email"),
        domain: domain || null,
        description: val("description") || null,
        sector: val("sector"),
        geography: geo,
        stage: raised ? val("stage") || null : null,
        last_raise_revenue: raised ? usd("lastRaiseRevenue") : null,
        last_raise_pbt: raised ? usd("lastRaisePBT") : null,
        revenue,
        profit_before_tax: usd("profitBeforeTax"),
        owner_salary: usd("ownerSalary"),
        consent: true,
      },
      refine: {},
      txTerms: [],
      vcTerms: [],
      sent: false,
      shown: false,
    };
    current = r;
    window.addEventListener("pagehide", () => send(r));

    form.hidden = true;
    results.hidden = true;
    loading.hidden = false;
    loading.querySelector<HTMLElement>("h2")?.focus();
    let i = 0;
    const line = loading.querySelector("[data-loading-text]") as HTMLElement;
    line.textContent = STEPS[0];
    const timer = setInterval(
      () => (line.textContent = STEPS[Math.min(++i, STEPS.length - 1)]),
      LOADING_MS / STEPS.length,
    );

    const description = val("description");
    const sectorName = val("sector");
    const company = val("companyName");
    const analyze = post<Analyzed>("/analyze", {
      company,
      domain,
      sector: sectorName,
      description,
      geography: geo,
      revenue,
      ebitda: toUSD(num("profitBeforeTax") + num("ownerSalary")),
      raised,
      stage: raised ? val("stage") || null : null,
    })
      .then((a) => {
        r.refine.discounts = a.discounts ?? null;
        r.refine.dcf = a.dcf ?? null;
        r.txTerms = a.transaction_search_terms ?? [];
        r.vcTerms = a.vc_search_terms ?? [];
      })
      .catch(() => {});
    const compare = post<{ comps: Comp[] }>("/compare", {
      company,
      sector: sectorName,
      description,
      revenue,
      geography: geo,
    })
      .then((c) => {
        if (c.comps.length >= 3)
          r.refine.comps = c.comps.map(({ co, tk, ev, rev, ebitda }) => ({
            co,
            tk,
            ev,
            rev,
            ebitda,
          }));
      })
      .catch(() => {});

    let settled = false;
    const done = Promise.race([
      Promise.all([analyze, compare]),
      sleep(SETTLE_MS),
    ]).then(() => (settled = true));
    await sleep(LOADING_MS);
    clearInterval(timer);
    if (!settled) paint(r, "Preliminary estimate, refining...", {});
    await done;
    const refined = !!(r.refine.comps || r.refine.dcf);
    paint(r, refined ? "Refined estimate" : "Estimate ready", r.refine);
    send(r);
  }

  function paint(r: Run, label: string, refine: Refine) {
    // Once the visitor is editing, the form no longer matches this run.
    if (r !== current || (r.shown && results.hidden)) return;
    render(refine);
    set("status", label);
    if (!r.shown) {
      r.shown = true;
      loading.hidden = true;
      results.hidden = false;
      title.focus();
    } else if (!results.hidden) announce(`${label}. ${val("companyName")}.`);
  }

  // Once per run: when the analysis settles or the visitor leaves.
  function send(r: Run) {
    if (r.sent) return;
    r.sent = true;
    const { discounts, dcf, comps } = r.refine;
    const body = {
      ...r.lead,
      comps: comps ?? [],
      discounts: discounts
        ? {
            revenue_discount_pct: discounts.revenue_discount_pct,
            ebitda_discount_pct: discounts.ebitda_discount_pct,
          }
        : null,
      dcf: dcf
        ? {
            revGrowth: dcf.revGrowth,
            ebitMarginImpr: dcf.ebitMarginImpr,
            daaPct: dcf.daaPct,
            capexPct: dcf.capexPct,
            nwcPct: dcf.nwcPct,
            termGrowth: dcf.termGrowth,
          }
        : null,
      transaction_search_terms: r.txTerms,
      vc_search_terms: r.vcTerms,
      analytics: analytics(),
    };
    post("/submit-lead", body, true).catch(() =>
      // One more try. The server ignores a repeat of the same submission id.
      sleep(3000)
        .then(() => post("/submit-lead", body))
        .catch(() => {}),
    );
  }

  results.addEventListener("click", (e) => {
    const action = (e.target as HTMLElement)
      .closest("[data-action]")
      ?.getAttribute("data-action");
    if (action === "print") {
      results.querySelectorAll("details").forEach((d) => (d.open = true));
      window.print();
    }
    if (action === "edit") {
      results.hidden = true;
      form.hidden = false;
      controls("companyName")[0]?.focus();
    }
  });

  function announce(text: string) {
    live.textContent = text;
  }

  function render(refine: Refine) {
    const c = cur();
    const s = val("sector");
    const raised = val("raised") === "Yes";
    const inputs = {
      sector: s,
      geo: val("geo"),
      stage: raised ? val("stage") : "",
      revenue: toUSD(num("revenue")),
      profitBeforeTax: toUSD(num("profitBeforeTax")),
      ownerSalary: toUSD(num("ownerSalary")),
    };
    const p = profiles[s];
    const r = valuation(inputs, p, vc, new Date().getFullYear(), refine);
    const money = (v: number) => fmt(v, c);
    const big = (v: number) => fmtResult(v, c);
    const n = r.methods.length;
    const range = n ? `${big(r.blended.low)} to ${big(r.blended.high)}` : "-";

    // Summary
    set(
      "thanks",
      `Thanks, ${val("name")}. Here is the estimate for ${val("companyName")}.`,
    );
    set("range", range);
    set("mid", n ? big(r.blended.mid) : "-");
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    set(
      "sub",
      `Blended across ${n} method${n === 1 ? "" : "s"} · ${s} · ${date}`,
    );
    show("pre-profit", r.ebitda <= 0 && n > 0);
    set("blend-low", big(r.blended.low));
    set("blend-mid", big(r.blended.mid));
    set("blend-high", big(r.blended.high));
    const basis: Record<string, string> = {
      dcf: "Central value plus or minus 25%",
    };
    root.querySelectorAll<HTMLElement>("[data-method]").forEach((row) => {
      const m = r.methods.find((x) => x.key === row.dataset.method);
      row.hidden = !m;
      if (!m) return;
      set(`${m.key}-low`, big(m.low));
      set(`${m.key}-mid`, big(m.mid));
      set(`${m.key}-high`, big(m.high));
      set(
        `${m.key}-basis`,
        basis[m.key] ??
          `${fmtM(m.lowX)} to ${fmtM(m.highX)} ${m.key === "tr-eb" ? "EBITDA" : "revenue"}`,
      );
    });

    // Inputs
    set("in-company", val("companyName"));
    set("in-sector", s);
    set("in-geo", inputs.geo);
    set("in-revenue", money(inputs.revenue));
    set("in-pbt", money(inputs.profitBeforeTax));
    set("in-salary", money(inputs.ownerSalary));
    set("in-ebitda", money(r.ebitda));
    set("in-stage", inputs.stage);
    show("in-stage", !!inputs.stage);
    set("in-last-rev", money(toUSD(num("lastRaiseRevenue"))));
    show("in-last-rev", raised && num("lastRaiseRevenue") !== 0);

    // DCF
    const d = r.dcf;
    set("dcf-head", money(d.equity));
    set("dcf-ind", p.ind ?? "-");
    set("dcf-ke", fmtP(p.ke));
    set("dcf-kd", fmtP(p.kd));
    set("dcf-sp", `${d.sp}%`);
    set("dcf-tax", `${d.tax}%`);
    set("dcf-tg", `${d.tg}%`);
    set("dcf-wacc", fmtP(d.wacc * 100));
    d.rows.forEach((row, i) => {
      set(`dcf-${i}-year`, String(row.year));
      for (const k of [
        "ebit",
        "dep",
        "capex",
        "nwc",
        "nopat",
        "fcf",
        "dfcf",
      ] as const)
        set(`dcf-${i}-${k}`, money(row[k]));
      set(`dcf-${i}-df`, row.df.toFixed(4));
    });
    set("dcf-tv", money(d.tv));
    set("dcf-ev", money(d.ev));
    set("dcf-eq", money(d.equity));
    show("dcf-loss", d.lossMaking);
    show("dcf-floored", d.tvFloored);

    // Listed peers
    const t = r.tr;
    set("tr-head", `${fmtM(t.rv[1])} revenue`);
    set("tr-intro", `${t.n} listed companies matched to ${s}.`);
    set(
      "tr-disc",
      `${t.effective}%` +
        (t.sizeDisc ? `, including a ${t.sizeDisc}% size discount` : ""),
    );
    set("tr-rev-x", fmtM(t.rv[1]));
    set("tr-eb-x", fmtM(t.eb[1]));
    show("tr-size", t.sizeDisc > 0);
    show("tr-neg", r.ebitda < 0);

    // Past deals
    const x = r.tx;
    set("tx-head", x.n ? `${fmtM(x.rv[1])} revenue` : "No match");
    set(
      "tx-intro",
      x.n
        ? `${x.n} past deals matched to ${s}. Deal names are kept anonymous.`
        : `No past deals matched ${s}.`,
    );
    set("tx-disc", `${x.effective}%`);
    set("tx-low", fmtM(x.rv[0]));
    set("tx-mid", fmtM(x.rv[1]));
    set("tx-high", fmtM(x.rv[2]));
    show("tx-neg", r.ebitda < 0 && x.n > 0);

    // Funding rounds
    const v = r.ind;
    set("ind-head", v.n ? `${fmtM(v.rv[1])} revenue` : "No match");
    set(
      "ind-intro",
      v.n
        ? `${v.n} funding rounds matched to ${s}.`
        : `No funding rounds matched ${s}.`,
    );
    set("ind-fy", fmtM(v.avgFy));
    set("ind-fw", fmtM(v.avgFw));
    set("ind-blend", fmtM(v.blended));
    set("ind-disc", "20%");

    announce(
      n ? `Estimated value ${range}. Midpoint ${big(r.blended.mid)}.` : "",
    );
  }
}
