// JSON-LD helpers: one @graph per page, stable @ids on the www host (PRD 8).
export const SITE = "https://www.wusoolcapital.com";
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

export interface OrgSettings {
  legalName: string;
  orgDescription: string;
  email: string;
  address: string;
  foundingDate: string;
  knowsAbout: string[];
  areaServed: string[];
  sameAs: string[];
}

type Node = Record<string, unknown>;

export function organization(s: OrgSettings): Node {
  return {
    "@type": "FinancialService",
    "@id": ORG_ID,
    name: "Wusool Capital",
    legalName: s.legalName,
    url: `${SITE}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE}/logo.png`,
      width: 600,
      height: 102,
    },
    image: `${SITE}/logo.png`,
    description: s.orgDescription,
    foundingDate: s.foundingDate,
    email: s.email,
    knowsAbout: s.knowsAbout,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Building A5, Dubai Silicon Oasis",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    areaServed: s.areaServed.map((name) => ({ "@type": "Country", name })),
    sameAs: s.sameAs,
  };
}

export function website(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE}/`,
    name: "Wusool Capital",
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function webPage(url: string, name: string, description: string): Node {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function faqPage(
  url: string,
  items: { question: string; answer: string }[],
): Node {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    isPartOf: { "@id": `${url}#webpage` },
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export const graph = (nodes: Node[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});
