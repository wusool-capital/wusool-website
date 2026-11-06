// Partners page (PRD 6.3). Labels mirror studio/schemas/options.ts, which
// holds the values editors pick from.
import { query } from "./sanity";

// `need` is how the quiz phrases each category.
export const CATEGORIES = [
  {
    value: "lending",
    label: "SME lending",
    need: "I want access to debt to grow the business",
  },
  {
    value: "accounting",
    label: "Accounting",
    need: "I need to make sure my accounting is right",
  },
  {
    value: "audit-tax",
    label: "Audit and corporate tax",
    need: "I need to audit my company or file corporate tax",
  },
  { value: "legal", label: "Legal", need: "I need legal advice" },
  {
    value: "csp",
    label: "Corporate services",
    need: "I need to set up an entity",
  },
  {
    value: "marketing",
    label: "Marketing",
    need: "I need help with marketing",
  },
  {
    value: "cap-table",
    label: "Cap table management",
    need: "I need to organise my cap table",
  },
  {
    value: "banking",
    label: "Banking",
    need: "I need a business bank account",
  },
];
export const SIZES = [
  { value: "under-1m", label: "Under $1M" },
  { value: "1-5m", label: "$1M to $5M" },
  { value: "5-25m", label: "$5M to $25M" },
  { value: "over-25m", label: "Over $25M" },
];
export const LOCATIONS = [
  { value: "uae-mainland", label: "UAE mainland" },
  { value: "uae-freezone", label: "UAE free zone" },
  { value: "ksa", label: "Saudi Arabia" },
  { value: "gcc-other", label: "Other GCC" },
  { value: "outside-gcc", label: "Outside the GCC" },
  { value: "not-setup", label: "Not set up yet" },
];
export const HORIZONS = [
  { value: "none", label: "Not planning to sell" },
  { value: "1-2y", label: "In 1 to 2 years" },
  { value: "3y", label: "In 3 years or more" },
];

export interface Partner {
  name: string;
  category: string;
  description: string;
  logo?: string;
  sizes?: string[];
  locations?: string[];
  offer?: string;
  linkType: "link" | "code" | "landing";
  url: string;
  code?: string;
}

export const activePartners = () =>
  query<Partner[]>(
    `*[_type == "partner" && active != false && !(_id in path("drafts.**"))]
      | order(order asc, name asc){
        name, category, description, "logo": logo.asset._ref, sizes,
        locations, offer, linkType, url, code
      }`,
  );

// Outbound links tell the partner the visit came from us, unless the URL
// already carries its own tracking.
export const refUrl = (url: string) => {
  if (/[?&](ref|utm_[a-z]+)=/i.test(url)) return url;
  const [base, hash] = url.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}ref=wusoolcapital${hash ? `#${hash}` : ""}`;
};

export const categoryLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? v;
