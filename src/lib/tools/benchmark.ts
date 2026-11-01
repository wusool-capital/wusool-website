// GCC SME benchmark: dataset, percentile engine and buyer narrative.
// Ported from the standalone tool (wusool-benchmark.html, dataset v1.0,
// 2026-08-17). Numbers, weights and rules are unchanged.

export type Mode = "sme" | "tech";
export type Cur = "AED" | "USD";
type Unit = "%" | "k" | "x" | "$";
interface Meta {
  label: string;
  unit: Unit;
  hi: boolean;
  w: number;
  obs?: boolean;
}
interface Cut {
  label: string;
  n: number;
  m: Record<string, number[]>;
  multiSite?: boolean;
  b2b?: boolean;
}
interface Band {
  id: string;
  label: string;
  max: number | null;
  ebitdaAdj: number;
  revEmpMult: number;
  rentMult: number;
}

// AED per USD, pegged. The engine computes in USD in both modes.
export const FX = 3.6725;

// prettier-ignore
export const DATA = {
  version: "1.0", updated: "2026-08-17",
  // The original AED 2m / 10m / 30m cuts converted at 3.6725.
  bands: [{ id: "micro", label: "Under USD 545k", max: 545000, ebitdaAdj: -3, revEmpMult: 0.8, rentMult: 1.25 },
    { id: "small", label: "USD 545k to 2.7m", max: 2725000, ebitdaAdj: 0, revEmpMult: 1.0, rentMult: 1.0 },
    { id: "mid", label: "USD 2.7m to 8.2m", max: 8170000, ebitdaAdj: 2, revEmpMult: 1.2, rentMult: 0.88 },
    { id: "upper", label: "USD 8.2m and above", max: null, ebitdaAdj: 4, revEmpMult: 1.4, rentMult: 0.82 }] as Band[],
  metrics: {
    ebitda: { label: "Operating profit margin", unit: "%", hi: true, w: 25 },
    growth: { label: "Revenue growth", unit: "%", hi: true, w: 15 },
    revEmp: { label: "Revenue per employee", unit: "k", hi: true, w: 15 },
    conc: { label: "Customer concentration", unit: "%", hi: false, w: 15 },
    gm: { label: "Gross margin", unit: "%", hi: true, w: 10 },
    rent: { label: "Premises cost", unit: "%", hi: false, w: 10 },
    recur: { label: "Contracted revenue", unit: "%", hi: true, w: 10 }
  } as Record<string, Meta>,
  // Startup benchmarks are cut by stage, not sector (n=43 MENA companies).
  techMetrics: {
    growth: { label: "Revenue growth", unit: "%", hi: true, w: 25, obs: true },
    capEff: { label: "Revenue per $ raised", unit: "x", hi: true, w: 20, obs: true },
    revScale: { label: "Revenue for stage", unit: "$", hi: true, w: 15, obs: true },
    gm: { label: "Gross margin", unit: "%", hi: true, w: 15, obs: false },
    recur: { label: "Recurring revenue", unit: "%", hi: true, w: 15, obs: false },
    conc: { label: "Customer concentration", unit: "%", hi: false, w: 10, obs: false }
  } as Record<string, Meta>,
  stages: {
    seed: { label: "Seed or pre-Series A", n: 15, m: { growth: [76, 117, 150, 267, 400], capEff: [0.04, 0.09, 0.21, 0.55, 1.23], revScale: [100000, 150000, 500000, 2750000, 7200000], gm: [30, 45, 60, 72, 82], recur: [6, 20, 42, 64, 82], conc: [10, 20, 35, 55, 76], fwdMult: [2.1, 3.6, 10.0, 20.0, 68.7] } },
    seriesa: { label: "Series A", n: 19, m: { growth: [51, 77, 157, 350, 633], capEff: [0.09, 0.15, 0.39, 1.2, 1.81], revScale: [870000, 1000000, 2100000, 9675000, 19326529], gm: [35, 48, 63, 75, 84], recur: [10, 28, 50, 70, 85], conc: [8, 16, 30, 50, 72], fwdMult: [2.3, 4.1, 5.0, 7.1, 13.5] } },
    seriesb: { label: "Series B or later", n: 6, m: { growth: [50, 52, 120, 197, 221], capEff: [0.35, 0.48, 0.76, 0.97, 1.06], revScale: [3100000, 3950000, 5150000, 8825000, 10600000], gm: [40, 52, 66, 77, 86], recur: [16, 36, 58, 76, 89], conc: [6, 13, 25, 42, 64], fwdMult: [2.9, 4.9, 6.9, 7.8, 8.7] } }
  } as Record<string, Cut>,
  techSectorList: ["AI", "SaaS", "Fintech", "Digital Health", "Supply Chain or mobility", "FoodTech", "E-commerce", "Proptech", "Edtech", "DeepTech or hardware", "Other"],
  sectors: {
    restaurant: { label: "Restaurant or cafe", multiSite: true, b2b: false, n: 64, m: { ebitda: [2, 7, 12, 18, 25], gm: [55, 60, 65, 70, 74], rent: [8, 11, 15, 20, 26], revEmp: [33, 46, 63, 84, 114], growth: [-8, 0, 7, 15, 28], conc: [2, 3, 5, 10, 20], recur: [0, 1, 5, 12, 25], dso: [0, 2, 5, 12, 25] } },
    salon: { label: "Beauty salon or spa", multiSite: true, b2b: false, n: 48, m: { ebitda: [3, 8, 14, 21, 28], gm: [62, 68, 74, 79, 84], rent: [10, 14, 19, 25, 32], revEmp: [25, 35, 48, 65, 87], growth: [-5, 2, 8, 16, 28], conc: [2, 3, 5, 9, 18], recur: [5, 15, 28, 42, 58], dso: [0, 1, 4, 10, 20] } },
    aesthetics: { label: "Aesthetics or dermatology clinic", multiSite: true, b2b: false, n: 37, m: { ebitda: [5, 12, 20, 28, 36], gm: [58, 65, 71, 77, 82], rent: [7, 10, 14, 19, 25], revEmp: [60, 90, 123, 169, 231], growth: [-2, 5, 14, 25, 40], conc: [2, 4, 7, 13, 24], recur: [5, 12, 25, 40, 55], dso: [0, 3, 8, 18, 35] } },
    medical: { label: "Medical or dental clinic", multiSite: true, b2b: false, n: 41, m: { ebitda: [4, 10, 17, 25, 33], gm: [55, 62, 68, 74, 79], rent: [6, 9, 12, 17, 23], revEmp: [68, 101, 136, 185, 245], growth: [0, 4, 10, 18, 30], conc: [5, 10, 18, 32, 50], recur: [5, 15, 30, 45, 60], dso: [10, 25, 45, 70, 105] } },
    auto: { label: "Auto garage, service or detailing", multiSite: true, b2b: false, n: 52, m: { ebitda: [3, 8, 14, 21, 29], gm: [38, 46, 53, 60, 67], rent: [5, 8, 11, 15, 21], revEmp: [41, 60, 82, 112, 152], growth: [-4, 2, 8, 16, 26], conc: [3, 6, 12, 25, 45], recur: [3, 8, 18, 32, 50], dso: [2, 8, 20, 40, 70] } },
    fitness: { label: "Gym or fitness studio", multiSite: true, b2b: false, n: 29, m: { ebitda: [2, 9, 16, 24, 33], gm: [63, 70, 76, 81, 86], rent: [11, 15, 20, 26, 33], revEmp: [38, 57, 79, 109, 147], growth: [-3, 4, 11, 20, 33], conc: [2, 3, 5, 9, 17], recur: [60, 70, 80, 88, 93], dso: [0, 1, 3, 8, 16] } },
    nursery: { label: "Nursery or early years school", multiSite: true, b2b: false, n: 24, m: { ebitda: [4, 11, 19, 27, 35], gm: [45, 52, 58, 64, 70], rent: [9, 13, 17, 23, 29], revEmp: [27, 37, 48, 63, 82], growth: [0, 3, 8, 14, 24], conc: [2, 3, 5, 8, 15], recur: [70, 80, 88, 93, 96], dso: [3, 8, 15, 28, 45] } },
    training: { label: "Training or education centre", multiSite: true, b2b: false, n: 22, m: { ebitda: [2, 8, 15, 23, 31], gm: [50, 58, 65, 72, 78], rent: [7, 10, 14, 19, 25], revEmp: [30, 44, 60, 82, 109], growth: [-5, 2, 9, 18, 30], conc: [5, 10, 20, 35, 55], recur: [10, 20, 35, 50, 68], dso: [5, 15, 30, 55, 85] } },
    cleaning: { label: "Cleaning, pest control or facilities services", multiSite: false, b2b: true, n: 46, m: { ebitda: [2, 6, 11, 17, 24], gm: [20, 27, 33, 40, 47], rent: [1, 2, 3, 5, 8], revEmp: [11, 15, 20, 26, 35], growth: [-3, 3, 10, 19, 32], conc: [10, 18, 30, 48, 68], recur: [25, 40, 60, 75, 88], dso: [30, 45, 65, 95, 140] } },
    laundry: { label: "Laundry or dry cleaning", multiSite: true, b2b: false, n: 19, m: { ebitda: [3, 9, 15, 22, 30], gm: [48, 56, 63, 70, 76], rent: [5, 8, 11, 16, 22], revEmp: [16, 23, 31, 42, 57], growth: [-2, 3, 9, 16, 26], conc: [3, 7, 14, 28, 48], recur: [10, 20, 35, 50, 65], dso: [2, 8, 18, 35, 60] } },
    trading: { label: "General trading or distribution", multiSite: false, b2b: true, n: 71, m: { ebitda: [1, 3, 6, 10, 16], gm: [8, 13, 18, 25, 33], rent: [0.5, 1, 2, 4, 6], revEmp: [109, 177, 259, 381, 599], growth: [-8, 0, 7, 16, 30], conc: [12, 22, 35, 52, 72], recur: [5, 15, 30, 50, 70], dso: [35, 55, 80, 115, 160] } },
    contracting: { label: "Contracting, fit-out or MEP", multiSite: false, b2b: true, n: 58, m: { ebitda: [0, 4, 9, 15, 22], gm: [10, 16, 21, 28, 35], rent: [0.5, 1.5, 3, 5, 8], revEmp: [49, 76, 103, 142, 204], growth: [-10, 0, 8, 20, 38], conc: [18, 30, 45, 65, 85], recur: [0, 5, 15, 30, 50], dso: [45, 70, 100, 145, 200] } },
    logistics: { label: "Logistics, freight or last-mile delivery", multiSite: false, b2b: true, n: 34, m: { ebitda: [1, 5, 10, 16, 23], gm: [15, 22, 28, 35, 43], rent: [2, 3, 5, 8, 12], revEmp: [25, 37, 50, 68, 93], growth: [-4, 3, 11, 21, 35], conc: [12, 22, 35, 55, 75], recur: [20, 35, 55, 72, 85], dso: [30, 45, 65, 95, 135] } },
    grocery: { label: "Grocery, supermarket or retail store", multiSite: true, b2b: false, n: 43, m: { ebitda: [0, 2, 5, 9, 14], gm: [13, 18, 23, 28, 34], rent: [3, 5, 7, 10, 14], revEmp: [76, 109, 147, 196, 267], growth: [-5, 0, 5, 11, 20], conc: [2, 3, 5, 10, 20], recur: [0, 1, 5, 12, 25], dso: [0, 2, 6, 15, 35] } },
    ecommerce: { label: "E-commerce or D2C brand", multiSite: false, b2b: false, n: 31, m: { ebitda: [-5, 2, 9, 17, 26], gm: [32, 44, 55, 65, 74], rent: [0.5, 1, 2.5, 4.5, 7], revEmp: [82, 131, 191, 272, 408], growth: [-10, 5, 20, 45, 85], conc: [2, 4, 8, 16, 32], recur: [0, 5, 15, 28, 45], dso: [0, 2, 6, 15, 30] } },
    itservices: { label: "IT services or managed services", multiSite: false, b2b: true, n: 27, m: { ebitda: [1, 7, 14, 22, 31], gm: [28, 36, 44, 53, 62], rent: [1, 2, 3.5, 6, 9], revEmp: [49, 71, 95, 128, 177], growth: [-3, 4, 13, 24, 40], conc: [12, 20, 33, 50, 70], recur: [20, 35, 55, 70, 85], dso: [30, 45, 65, 95, 135] } },
    agency: { label: "Marketing, creative or media agency", multiSite: false, b2b: true, n: 26, m: { ebitda: [0, 6, 13, 21, 30], gm: [35, 45, 54, 63, 72], rent: [2, 3.5, 5.5, 8, 12], revEmp: [49, 68, 93, 125, 169], growth: [-8, 2, 12, 25, 45], conc: [15, 25, 40, 58, 78], recur: [15, 30, 50, 68, 82], dso: [30, 45, 65, 90, 130] } },
    travel: { label: "Travel agency or tour operator", multiSite: false, b2b: false, n: 21, m: { ebitda: [0, 4, 10, 17, 25], gm: [12, 20, 30, 45, 60], rent: [2, 3, 5, 8, 12], revEmp: [54, 82, 114, 158, 218], growth: [-5, 4, 13, 24, 40], conc: [8, 15, 26, 45, 68], recur: [0, 5, 15, 30, 50], dso: [10, 22, 40, 65, 100] } },
    realestate: { label: "Real estate brokerage or property services", multiSite: false, b2b: false, n: 25, m: { ebitda: [-2, 5, 12, 21, 32], gm: [55, 65, 73, 80, 87], rent: [3, 5, 8, 12, 17], revEmp: [60, 90, 123, 169, 245], growth: [-15, 0, 15, 35, 70], conc: [5, 10, 20, 38, 62], recur: [0, 2, 8, 18, 35], dso: [10, 25, 45, 75, 115] } },
    manufacturing: { label: "Light manufacturing or fabrication", multiSite: false, b2b: true, n: 33, m: { ebitda: [1, 5, 11, 18, 26], gm: [18, 25, 32, 40, 49], rent: [2, 3.5, 6, 9, 14], revEmp: [41, 63, 90, 125, 177], growth: [-6, 1, 8, 17, 30], conc: [15, 25, 40, 60, 80], recur: [5, 15, 30, 50, 70], dso: [35, 55, 80, 115, 165] } }
  } as Record<string, Cut> };
export const ORDER: Record<Mode, string[]> = {
  sme: ["ebitda", "growth", "revEmp", "conc", "gm", "rent", "recur"],
  tech: ["growth", "capEff", "revScale", "gm", "recur", "conc"],
};
export const QLABEL = [
  "",
  "Bottom 25%",
  "Below average",
  "Above average",
  "Top 25%",
];

const ANCHORS = [10, 25, 50, 75, 90];

// Piecewise-linear percentile rank against 5 anchor points, with tail extrapolation.
function rank(v: number, a: number[]) {
  if (v <= a[0])
    return Math.max(1, 10 - ((a[0] - v) / (a[1] - a[0] || 1)) * 15);
  if (v >= a[4])
    return Math.min(99, 90 + ((v - a[4]) / (a[4] - a[3] || 1)) * 15);
  for (let i = 0; i < 4; i++) {
    if (v >= a[i] && v <= a[i + 1]) {
      const span = a[i + 1] - a[i] || 1;
      return ANCHORS[i] + ((v - a[i]) / span) * (ANCHORS[i + 1] - ANCHORS[i]);
    }
  }
  return 50;
}

const bandFor = (rev: number) =>
  DATA.bands.find((b) => b.max === null || rev < b.max) ?? DATA.bands[3];

function adjust(mode: Mode, key: string, arr: number[], band: Band) {
  if (mode !== "sme") return arr.slice(); // stage is the cut, no band adjustment
  if (key === "ebitda") return arr.map((x) => x + band.ebitdaAdj);
  if (key === "revEmp") return arr.map((x) => x * band.revEmpMult);
  if (key === "rent") return arr.map((x) => x * (band.rentMult || 1));
  return arr.slice();
}

export const quart = (p: number) => (p < 25 ? 1 : p < 50 ? 2 : p < 75 ? 3 : 4);

export interface Input {
  mode: Mode;
  disp: Cur; // entry and display currency, SME mode only
  cut: string; // sector key (SME) or stage key (startup)
  sector: string; // sector label for the narrative
  rev: number | null;
  prev: number | null;
  ebitda: number | null;
  salaryDeducted: boolean;
  salary: number | null;
  staff: number | null;
  rent: number | null;
  raised: number | null;
  gm: number | null;
  conc: number | null;
  recur: number | null;
}
export interface Metric {
  value: number;
  pct: number;
  anchors: number[];
  meta: Meta;
}

export function compute(i: Input) {
  const tech = i.mode === "tech";
  const usd = (v: number | null) =>
    v == null ? null : !tech && i.disp === "AED" ? v / FX : v;
  const rev = usd(i.rev);
  const prev = usd(i.prev);
  const raw = usd(i.ebitda);
  const salary = i.salaryDeducted ? usd(i.salary) || 0 : 0;
  const adjEbitda = raw == null ? null : raw + salary;
  const rentUsd = usd(i.rent);
  const cut = tech ? DATA.stages[i.cut] : DATA.sectors[i.cut];
  const band = bandFor(rev ?? 0);

  const v: Record<string, number | null> = {
    ebitda: rev && adjEbitda != null ? (adjEbitda / rev) * 100 : null,
    gm: i.gm,
    growth:
      prev && prev > 0 && rev != null ? ((rev - prev) / prev) * 100 : null,
    revEmp: rev && i.staff ? rev / i.staff / 1000 : null,
    rent: !tech && rentUsd != null && rev ? (rentUsd / rev) * 100 : null,
    conc: i.conc,
    recur: i.recur,
    revScale: tech ? rev : null,
    capEff:
      tech && i.raised && i.raised > 0 && rev != null ? rev / i.raised : null,
  };

  const metrics: Record<string, Metric> = {};
  let wSum = 0;
  let pSum = 0;
  for (const [k, meta] of Object.entries(
    tech ? DATA.techMetrics : DATA.metrics,
  )) {
    const val = v[k];
    if (val == null || !cut.m[k]) continue;
    const anchors = adjust(i.mode, k, cut.m[k], band);
    let p = rank(val, anchors);
    if (!meta.hi) p = 100 - p;
    p = Math.max(1, Math.min(99, p));
    metrics[k] = { value: val, pct: p, anchors, meta };
    wSum += meta.w;
    pSum += p * meta.w;
  }
  const score = wSum ? Math.round(pSum / wSum) : 50;
  return { metrics, score, adjEbitda, salary };
}

/* Formatting */
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => Math.round(n * 10) / 10 + "%";
const fmtM = (n: number) =>
  n >= 1e9
    ? (n / 1e9).toFixed(1) + "bn"
    : n >= 1e6
      ? (n / 1e6).toFixed(1) + "m"
      : Math.round(n / 1e3) + "k";
const sh = (n: number, u: Unit) =>
  u === "%"
    ? pct(n)
    : u === "x"
      ? Math.round(n * 100) / 100 + "x"
      : u === "$"
        ? "$" + fmtM(n)
        : fmt(n);
const ord = (p: number) => {
  const r = Math.round(p);
  const s = ["th", "st", "nd", "rd"];
  const v = r % 100;
  return r + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Display helpers for one run: currency and USD to display conversion.
export function view(i: Input) {
  const cur: Cur = i.mode === "tech" ? "USD" : i.disp;
  const disp = (v: number) => (cur === "AED" ? v * FX : v);
  const show = (x: number, u: Unit) =>
    u === "k" ? `${cur} ${fmt(disp(x))}k` : sh(x, u);
  return { cur, disp, show, money: (x: number) => `${cur} ${fmt(disp(x))}` };
}

/* Narrative */
type Pair = { bad: [string, string]; good: [string, string] };
const FLAGTEXT: Record<string, Pair> = {
  ebitda: {
    bad: [
      "Margin sits below your peer set",
      "Your operating profit margin of {v} is in the {p} percentile. In {s}, the peer median is around {m}. Buyers read a persistent margin gap as either pricing weakness or an overhead problem, and price it directly into the multiple.",
    ],
    good: [
      "Margin is a strength",
      "At {v} you are in the {p} percentile of {s}. This is the single most quotable number in a sale process and it should lead your equity story.",
    ],
  },
  growth: {
    bad: [
      "Growth has stalled relative to peers",
      "Revenue moved {v} against a peer median near {m}. Two flat years is the most common reason a GCC SME sale process attracts only one bidder.",
    ],
    good: [
      "Growth is ahead of the sector",
      "At {v} you are in the {p} percentile. Sustained for another 12 months this alone supports a higher multiple than the sector average.",
    ],
  },
  revEmp: {
    bad: [
      "Revenue per employee is low",
      "You generate {c} {v}k per head against a peer median of {c} {m}k. A buyer will read this as either overstaffing or under-pricing, and will model headcount reduction into their synergy case rather than paying you for it.",
    ],
    good: [
      "The business runs lean",
      "{c} {v}k per head puts you in the {p} percentile. Operating leverage like this is what makes a bolt-on acquisition attractive to a larger group.",
    ],
  },
  conc: {
    bad: [
      "Customer concentration is the biggest issue here",
      "Your largest customer is {v} of revenue. Above roughly 25% most buyers either discount the price or push a large part of it into an earn-out tied to that customer staying. This is the highest-return thing on this page to fix.",
    ],
    good: [
      "Revenue is well spread",
      "At {v} from your largest customer you are in the {p} percentile. Removes the single most common reason GCC SME deals get restructured mid-process.",
    ],
  },
  gm: {
    bad: [
      "Gross margin trails the sector",
      "At {v} against a peer median of {m}, either your input costs or your pricing are out of line. Gross margin is easier to defend in diligence than operating profit, so a gap here is noticed early.",
    ],
    good: [
      "Gross margin is strong",
      "{v} puts you in the {p} percentile, which gives you room to absorb cost inflation without repricing.",
    ],
  },
  rent: {
    bad: [
      "Premises cost is eating your margin",
      "Rent and premises run at {v} of revenue against a peer median of {m}. In Dubai and Abu Dhabi this is the most common single cause of a sub-par margin, and lease terms transfer to a buyer, so it is priced.",
    ],
    good: [
      "Premises cost is well controlled",
      "At {v} of revenue you are in the {p} percentile. Worth confirming your remaining lease term, since buyers pay for security of tenure.",
    ],
  },
  recur: {
    bad: [
      "Little of your revenue is contracted",
      "{v} of revenue is contracted or repeat, against a peer median of {m}. Buyers pay a premium for visibility. Moving even part of your base onto annual agreements raises what the business is worth.",
    ],
    good: [
      "Revenue visibility is a strength",
      "{v} contracted or repeat revenue puts you in the {p} percentile. This is the characteristic that most reliably pulls a valuation above the sector range.",
    ],
  },
};
const TECH_FLAG: Record<string, Pair> = {
  capEff: {
    bad: [
      "Capital efficiency is behind the peer set",
      "You generate {v} of revenue per dollar raised, against a peer median of {m} at {s}. Investors and acquirers read this as the cost of your growth. It is the metric that most often decides whether a round is priced up or flat.",
    ],
    good: [
      "You are capital efficient for your stage",
      "At {v} of revenue per dollar raised you are in the {p} percentile. This is the strongest argument you have for a premium multiple, and it widens your buyer set to include acquirers who will not fund a burn.",
    ],
  },
  revScale: {
    bad: [
      "Revenue is light for the stage",
      "At {v} you are in the {p} percentile of {s} companies. Raising the next round at this scale usually means selling the plan rather than the traction, which prices lower.",
    ],
    good: [
      "Revenue is ahead of the stage",
      "{v} puts you in the {p} percentile of {s} companies. You have the option of raising on traction rather than narrative.",
    ],
  },
  recur: {
    bad: [
      "Revenue is not sticky enough",
      "{v} of revenue is recurring against a peer median of {m}. Buyers pay an ARR multiple for contracted revenue and an earnings multiple for everything else. That distinction is worth more than any single point of growth.",
    ],
    good: [
      "Revenue quality is the strength here",
      "{v} recurring puts you in the {p} percentile. This is what moves a valuation from an earnings multiple onto a revenue multiple.",
    ],
  },
  growth: {
    bad: [
      "Growth has slowed against the peer set",
      "Revenue moved {v} against a peer median near {m}. Two soft quarters is the most common reason a regional tech process attracts a single bidder rather than an auction.",
    ],
    good: [
      "Growth is ahead of the peer set",
      "At {v} you are in the {p} percentile. Held for another year this alone supports a premium to the regional range.",
    ],
  },
};

export type Tone = "good" | "mid" | "bad";
export interface Flag {
  tone: Tone;
  title: string;
  body: string;
  pct: number;
}

function flagFor(i: Input, key: string, d: Metric): Flag | null {
  const t = (i.mode === "tech" && TECH_FLAG[key]) || FLAGTEXT[key];
  const good = d.pct >= 68;
  const bad = d.pct < 40;
  if (!t || (!good && !bad)) return null;
  const { cur, disp, show } = view(i);
  const u = d.meta.unit;
  const f = (x: number) =>
    u === "k" ? String(Math.round(disp(x))) : show(x, u);
  const s = i.mode === "sme" ? i.sector.toLowerCase() : i.sector;
  const o: Record<string, string> = {
    v: f(d.value),
    p: ord(d.pct),
    m: f(d.anchors[2]),
    s,
    c: cur,
  };
  const [title, body] = good ? t.good : t.bad;
  return {
    tone: good ? "good" : d.pct < 25 ? "bad" : "mid",
    title,
    body: body.replace(/\{(\w)\}/g, (_, k) => o[k]),
    pct: d.pct,
  };
}

// The worst three flags, plus the single best, plus the salary note.
export function flags(i: Input, r: ReturnType<typeof compute>): Flag[] {
  const all = ORDER[i.mode]
    .map((k) => (r.metrics[k] ? flagFor(i, k, r.metrics[k]) : null))
    .filter((f): f is Flag => f !== null);
  const bad = all
    .filter((f) => f.tone !== "good")
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
  const good = all
    .filter((f) => f.tone === "good")
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 1);
  const out = [...bad, ...good];
  if (!out.length)
    out.push({
      tone: "good",
      pct: 50,
      title: "No outliers",
      body: "Every metric sits inside the middle of your peer range. Nothing here would stop a process, and nothing here would drive a premium either. The next lever is scale.",
    });
  if (r.salary > 0 && r.adjEbitda != null) {
    const { money } = view(i);
    out.push({
      tone: "mid",
      pct: 50,
      title: "Your salary has been added back",
      body: `Operating profit is shown as ${money(r.adjEbitda)} including your ${money(r.salary)} add-back, so you are compared on the same basis as everyone else. A buyer will deduct a market salary for whoever replaces you, so the figure they underwrite will sit between the two.`,
    });
  }
  return out;
}

// Says plainly which lines were dropped for want of an input.
export function coverNote(i: Input, r: ReturnType<typeof compute>) {
  const order = ORDER[i.mode];
  const meta = i.mode === "sme" ? DATA.metrics : DATA.techMetrics;
  const missing = order
    .filter((k) => !r.metrics[k])
    .map((k) => meta[k].label.toLowerCase());
  if (!missing.length) return "";
  const list =
    missing.length === 1
      ? missing[0]
      : missing.slice(0, -1).join(", ") + " or " + missing.slice(-1);
  return `Based on ${order.length - missing.length} of ${order.length} metrics. You did not give us enough to rank you on ${list}, so those lines are left out rather than guessed.`;
}
