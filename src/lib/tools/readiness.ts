// Deal readiness score: questions, options and scoring. Questions, options
// and option scores come from the original tool. The score is computed here,
// in the browser, from those option scores.

export interface Option {
  value: number;
  label: string;
  sub?: string;
}
export interface Question {
  id: string;
  text: string;
  options: Option[];
  grid?: boolean;
}
export interface TextQuestion {
  id: string;
  text: string;
  placeholder: string;
}
export interface Section {
  title: string;
  icon: string;
  intro: string;
  next: string;
  questions: Question[];
  texts?: TextQuestion[];
}

export const SECTIONS: Section[] = [
  {
    title: "Financial health",
    icon: "coins",
    intro:
      "Buyers need to trust your numbers. These questions help us understand how financially transparent your business is.",
    next: "Next: your team",
    questions: [
      {
        id: "q1",
        text: "Are your last 2–3 years of financial statements prepared by an accountant?",
        options: [
          {
            value: 3,
            label: "Yes, fully audited or reviewed by an external firm",
          },
          { value: 2, label: "Yes, prepared by an accountant but not audited" },
          { value: 1, label: "We're working on it, not fully done yet" },
          { value: 0, label: "Not really, mostly internal spreadsheets" },
        ],
      },
      {
        id: "q2",
        text: "Does any single customer represent more than 30% of your revenue?",
        options: [
          { value: 0, label: "Yes, one customer is more than half my revenue" },
          { value: 1, label: "Yes, one customer is between 30–50% of revenue" },
          {
            value: 3,
            label: "No, my top customer is less than 30% of revenue",
          },
        ],
      },
      {
        id: "q3",
        text: "Are there any outstanding issues with taxes, loans, or legal disputes?",
        options: [
          { value: 3, label: "None, everything is clean and up to date" },
          { value: 1, label: "Minor issues that are being resolved" },
          { value: 0, label: "Yes, there are some significant open issues" },
        ],
      },
    ],
  },
  {
    title: "Team and operations",
    icon: "users-three",
    intro:
      "One of the biggest concerns for buyers is whether the business depends entirely on you.",
    next: "Next: revenue quality",
    questions: [
      {
        id: "q4",
        text: "If you stepped away for 3 months, could the business keep running smoothly?",
        options: [
          {
            value: 3,
            label: "Yes, I have a strong team that handles most things",
          },
          {
            value: 2,
            label: "Mostly, there'd be some gaps but it would survive",
          },
          {
            value: 1,
            label: "Probably not, key relationships or decisions need me",
          },
          {
            value: 0,
            label: "No, the business is very dependent on me personally",
          },
        ],
      },
      {
        id: "q5",
        text: "How would you describe your management team?",
        options: [
          {
            value: 3,
            label: "Strong: I have experienced managers across key functions",
          },
          {
            value: 2,
            label: "Decent: I have 1–2 good people I rely on heavily",
          },
          { value: 0, label: "Thin: it's mostly me and a few junior staff" },
        ],
      },
      {
        id: "q6",
        text: "Are your key business processes written down or documented?",
        options: [
          {
            value: 3,
            label: "Yes, we have clear SOPs and documented processes",
          },
          { value: 1, label: "Some are, the important ones mostly" },
          { value: 0, label: "Not really, most of it is in people's heads" },
        ],
      },
    ],
  },
  {
    title: "Revenue quality",
    icon: "chart-line-up",
    intro:
      "Not all revenue is equal. Buyers pay more for predictable, growing income.",
    next: "Next: legal and structure",
    questions: [
      {
        id: "q7",
        text: "What percentage of your revenue is recurring or under signed contracts?",
        grid: true,
        options: [
          { value: 0, label: "Under 20%", sub: "Mostly one-off" },
          { value: 1, label: "20–50%", sub: "Mixed" },
          { value: 2, label: "50–80%", sub: "Mostly recurring" },
          { value: 3, label: "80%+", sub: "Highly contracted" },
        ],
      },
      {
        id: "q8",
        text: "How long have your top 3 customers been with you?",
        options: [
          { value: 3, label: "3+ years, they've been with us a long time" },
          { value: 2, label: "1–3 years" },
          { value: 1, label: "Less than a year" },
          { value: 0, label: "We don't really have repeat customers" },
        ],
      },
      {
        id: "q9",
        text: "How has your revenue been trending over the last 2 years?",
        options: [
          { value: 3, label: "Growing fast, 20%+ per year" },
          { value: 2, label: "Growing steadily" },
          { value: 1, label: "Roughly flat, stable but not growing much" },
          { value: 0, label: "Declining or inconsistent" },
        ],
      },
    ],
  },
  {
    title: "Legal and structure",
    icon: "scales",
    intro:
      "Legal surprises can kill a deal. We just need a quick health check.",
    next: "Next: growth story",
    questions: [
      {
        id: "q10",
        text: "Is your company properly registered and in good regulatory standing?",
        options: [
          {
            value: 3,
            label: "Yes, fully registered and all licences are current",
          },
          { value: 1, label: "Mostly, a few minor things to sort out" },
          {
            value: 0,
            label: "Not fully, there are registration gaps to address",
          },
        ],
      },
      {
        id: "q11",
        text: "Are your key contracts (customers, suppliers, employees) properly signed?",
        options: [
          {
            value: 3,
            label: "Yes, everything significant is under signed contract",
          },
          {
            value: 2,
            label: "Most of them, some relationships are still informal",
          },
          { value: 0, label: "Not really, a lot runs on trust and handshakes" },
        ],
      },
      {
        id: "q12",
        text: "Who owns the key assets of the business: brand, software, IP?",
        options: [
          {
            value: 3,
            label: "The company owns everything, clearly registered",
          },
          {
            value: 2,
            label: "Most of it, a few things need to be formally transferred",
          },
          { value: 0, label: "Unclear, some things are in my personal name" },
        ],
      },
    ],
  },
  {
    title: "Your growth story",
    icon: "rocket-launch",
    intro: "Buyers pay for today and for what your business could become.",
    next: "Almost there",
    questions: [
      {
        id: "q13",
        text: "How clear and compelling is your reason for a buyer to want this business?",
        options: [
          {
            value: 3,
            label:
              "Very clear: strong market position, loyal customers, or unique capability",
          },
          {
            value: 2,
            label: "Reasonably clear: good business with a solid track record",
          },
          {
            value: 1,
            label: "Somewhat clear: good business but the story needs work",
          },
          {
            value: 0,
            label: "Not sure yet: I haven't thought through the buyer pitch",
          },
        ],
      },
    ],
    texts: [
      {
        id: "q14",
        text: "In your own words, what's the main reason a buyer would want your business?",
        placeholder:
          "For example: exclusive supplier relationships, a loyal base of 200+ business customers, and a team that runs independently.",
      },
      {
        id: "q15",
        text: "What's held back growth until now?",
        placeholder:
          "For example: working capital. With proper backing we could expand to 3 more cities within 18 months.",
      },
    ],
  },
];

export const SECTORS = [
  "Technology & SaaS",
  "Healthcare & Medical",
  "F&B & Hospitality",
  "Professional Services",
  "Education & Training",
  "Retail & E-Commerce",
  "Construction & Contracting",
  "Logistics & Supply Chain",
  "Financial Services",
  "Manufacturing & Industrial",
  "Other",
];
export const REVENUES = [
  "Under $1M",
  "$1M – $5M",
  "$5M – $15M",
  "$15M – $50M",
  "$50M+",
];
export const COUNTRIES = [
  "UAE",
  "Saudi Arabia",
  "Egypt",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
  "Other MENA",
];

// Score bands, lowest first, each with the minimum score that reaches it.
export const BANDS: [number, string][] = [
  [0, "Not ready"],
  [20, "Early stage"],
  [40, "Getting there"],
  [60, "Nearly ready"],
  [80, "Exit ready"],
];

type Answers = Record<string, number>;

const pct = (ids: string[], a: Answers) =>
  Math.round((ids.reduce((s, id) => s + a[id], 0) / (ids.length * 3)) * 100);

export function score(a: Answers) {
  const ids = SECTIONS.map((s) => s.questions.map((q) => q.id));
  const overall = pct(ids.flat(), a);
  return {
    overall,
    band: BANDS.reduce((b, [min, name]) => (overall >= min ? name : b), ""),
    sections: ids.map((q) => pct(q, a)),
  };
}

// Plain-language flags, from the original tool's rule-based advisory notes.
export function flags(a: Answers): string[] {
  const f: string[] = [];
  if (a.q1 <= 1)
    f.push(
      "Your financial statements are not prepared by an accountant yet. Buyers will ask for them before making an offer.",
    );
  if (a.q2 === 0)
    f.push(
      "One customer brings in more than half your revenue. Buyers see this as a major risk.",
    );
  if (a.q2 === 1)
    f.push(
      "One customer brings in 30–50% of your revenue. Have a clear plan to spread revenue across more customers.",
    );
  if (a.q3 === 0)
    f.push(
      "You have significant open tax or legal issues. Resolve them with a legal adviser before you approach buyers.",
    );
  if (a.q3 === 1)
    f.push(
      "You have minor tax or legal issues in progress. Close them out and keep the paperwork ready.",
    );
  if (a.q4 <= 1)
    f.push(
      "The business relies heavily on you. Buyers will want a team that can run it without you.",
    );
  if (a.q6 === 0)
    f.push(
      "Your key processes are not written down. Document them before you go to market.",
    );
  if (a.q10 === 0)
    f.push(
      "There are registration or licence gaps. Fix them before any buyer introductions.",
    );
  if (a.q12 === 0)
    f.push(
      "Some key assets, such as the brand or IP, are in your personal name. Transfer them to the company before a sale.",
    );
  if (a.q12 === 2)
    f.push("Some assets still need a formal transfer to the company.");
  return f;
}
