// Valuation tool behaviour: form toggles, validation, the calculation and the
// results. Sends nothing over the network.
import {
  valuation,
  detectSectorFromText,
  fmt,
  fmtM,
  fmtP,
  fmtResult,
  type Profile,
  type VcRow,
} from "../../lib/tools/valuation";

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
  const title = q("#val-title");
  const live = q("[data-announce]");
  const sector = form.elements.namedItem("sector") as HTMLSelectElement;
  // Sector data loads from the site once the page has drawn.
  let profiles: Record<string, Profile> = {};
  let vc: VcRow[] = [];
  const data = fetch("/tools/valuation-data.json")
    .then((r) => r.json())
    .then((d: { profiles: Record<string, Profile>; vc: VcRow[] }) => {
      profiles = d.profiles;
      vc = d.vc;
    });

  const field = (n: string) =>
    form.elements.namedItem(n) as HTMLInputElement | RadioNodeList | null;
  const val = (n: string) => (field(n)?.value ?? "").trim();
  const num = (n: string) => parseFloat(val(n).replace(/,/g, "")) || 0;
  const cur = () => val("currency") || "USD";
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
  (field("description") as HTMLInputElement).addEventListener("input", () => {
    const text = val("description");
    if (text.length <= 20 || sector.value) return;
    const guess = detectSectorFromText(text);
    if (guess && profiles[guess]) {
      sector.value = guess;
      suggested.hidden = false;
      setError("sector", "");
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
    ["raised", () => !!val("raised"), "Choose yes or no."],
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
    await data;
    render();
    form.hidden = true;
    results.hidden = false;
    title.focus();
  });

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

  function render() {
    const c = cur();
    const toUSD = (x: number) => (c === "AED" ? x / 3.6725 : x);
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
    const r = valuation(inputs, p, vc, new Date().getFullYear());
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
