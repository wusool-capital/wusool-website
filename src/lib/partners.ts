// Partners page (PRD 6.3). Labels mirror studio/schemas/options.ts, which
// holds the values editors pick from.
import { query } from "./sanity";

export const CATEGORIES = [
  { value: "cap-table", label: "Cap table management" },
  { value: "lending", label: "SME lending" },
  { value: "accounting", label: "Accounting" },
  { value: "audit-tax", label: "Audit and corporate tax" },
  { value: "csp", label: "Corporate services" },
  { value: "legal", label: "Legal" },
  { value: "banking", label: "Banking" },
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
export const refUrl = (url: string) =>
  /[?&](ref|utm_[a-z]+)=/i.test(url)
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}ref=wusoolcapital`;

export const categoryLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? v;
