// Global nav, footer and legal data. Moves to Sanity siteSettings in feature 3.

export interface NavLink {
  label: string;
  href: string;
}
export interface NavItem {
  label: string;
  href?: string;
  menu?: NavLink[];
  wide?: boolean;
}

export const nav: NavItem[] = [
  { label: "For Sellers", href: "/sell" },
  { label: "For Buyers", href: "/buyers" },
  {
    label: "Industries",
    wide: true,
    menu: [
      { label: "Manufacturing", href: "/industries/manufacturing" },
      { label: "Construction & Fit-out", href: "/industries/construction" },
      { label: "Education & Training", href: "/industries/education" },
      { label: "Logistics & Freight", href: "/industries/logistics" },
      { label: "Business Services", href: "/industries/business-services" },
      { label: "Retail", href: "/industries/retail" },
      { label: "Beauty & Wellness", href: "/industries/beauty-wellness" },
      { label: "Technology & SaaS", href: "/industries/technology" },
      { label: "Healthcare & Clinics", href: "/industries/healthcare" },
      { label: "F&B & Restaurants", href: "/industries/food-beverage" },
    ],
  },
  {
    label: "Tools",
    menu: [
      { label: "Valuation Calculator", href: "/valuation-tool" },
      { label: "Deal Readiness", href: "/deal-readiness-tool" },
      { label: "Benchmarking Tool", href: "/benchmark" },
    ],
  },
  { label: "Insights", href: "/insights" },
  {
    label: "About",
    menu: [
      { label: "Team", href: "/team" },
      { label: "Careers", href: "/careers" },
    ],
  },
];

// Phone menu, as drawn in index.html.
export const mobileNav: NavLink[] = [
  { label: "For Sellers", href: "/sell" },
  { label: "For Buyers", href: "/buyers" },
  { label: "Industries", href: "/industries/technology" },
  { label: "Valuation Calculator", href: "/valuation-tool" },
  { label: "Insights", href: "/insights" },
  { label: "Team", href: "/team" },
];

export const footerLinks: NavLink[] = [
  { label: "For Sellers", href: "/sell" },
  { label: "For Buyers", href: "/buyers" },
  { label: "Insights", href: "/insights" },
  { label: "Team", href: "/team" },
  { label: "Careers", href: "/careers" },
];

export const legalLinks: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
];

export const company = {
  name: "Wusool Capital",
  // Registered entity, shown only in the legal line.
  legalName: "DOPAMINE INNOVATION CONSULTANCY - FZCO",
  address: "Building A5, Dubai Silicon Oasis, Dubai, UAE",
  license: "License: 54561 (DIEZA)",
  email: "contact@wusoolcapital.com",
  linkedin: "https://www.linkedin.com/company/wusoolcapital",
  logoAlt: "Wusool Capital, M&A Advisory for UAE and GCC Business Owners",
};

export const closingCta = {
  title: "Ready to find out what your business is worth?",
  text: "Free valuation. No commitment.",
  label: "Get My Free Valuation",
  href: "/valuation-tool",
};
