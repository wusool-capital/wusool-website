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

// The partner directory is hidden until launch: /partners builds with
// noindex and nothing links to it. Set to true to publish it, then add it
// back to the nav and footer.
export const partnersLive = false;

// Shared by the nav dropdowns and the footer columns.
const industries: NavLink[] = [
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
];
const tools: NavLink[] = [
  { label: "Valuation Calculator", href: "/valuation-tool" },
  { label: "Deal Readiness", href: "/deal-readiness-tool" },
  { label: "Benchmarking Tool", href: "/benchmark" },
];

export const nav: NavItem[] = [
  { label: "For Sellers", href: "/sell" },
  { label: "For Buyers", href: "/buyers" },
  { label: "Industries", wide: true, menu: industries },
  { label: "Tools", menu: tools },
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

// Footer link columns: every key page is one click from any page.
export const footerGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "Services",
    links: [
      { label: "Sell your business", href: "/sell" },
      { label: "Buy a business", href: "/buyers" },
    ],
  },
  { title: "Industries", links: industries },
  { title: "Tools", links: tools },
  {
    title: "Resources",
    links: [
      { label: "Insights", href: "/insights" },
      { label: "Reports", href: "/reports" },
      {
        label: "Selling a business",
        href: "/insights/topic/sell-your-business",
      },
      {
        label: "Business valuation",
        href: "/insights/topic/business-valuation",
      },
      { label: "Exit strategy", href: "/insights/topic/exit-strategy" },
      { label: "Buying a business", href: "/insights/topic/buy-a-business" },
      { label: "GCC M&A market", href: "/insights/topic/gcc-ma-market" },
      {
        label: "Acquisition entrepreneurship",
        href: "/insights/topic/eta-gcc",
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Team", href: "/team" },
      { label: "Careers", href: "/careers" },
      { label: "Refer and earn", href: "/refer" },
    ],
  },
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

// Share image for pages that have none of their own (the home page's).
export const defaultOgImage =
  "https://cdn.sanity.io/images/qjvm6ww8/production/2247de378b2e22aaa3c15f6692b987276b8d7bc3-1910x1001.jpg?w=1200&h=630&fit=crop&fm=jpg";
