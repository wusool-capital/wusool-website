// Team members for the team page. Each has an anchor there, which article
// bylines link to.
import { query, imageUrl } from "./sanity";
import type { Block } from "./portable";
import { SITE, ORG_ID } from "./schema";

// The company has a team entry so it can sign articles; it is not listed as
// a person, and its bylines point to the organization instead.
export const COMPANY_SLUG = "wusool-capital";

export interface Member {
  name: string;
  slug: string;
  roleTitle?: string;
  shortBio?: string;
  bio?: Block[];
  headshot?: string;
  credentials?: string;
  linkedinUrl?: string;
  xTwitterUrl?: string;
  crunchbaseUrl?: string;
  wikidataUrl?: string;
  expertiseTags?: string[];
  yearsOfExperience?: string;
  basedIn?: string;
  languages?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export const teamMembers = () =>
  query<Member[]>(
    `*[_type == "teamMember" && slug.current != $company] | order(order asc, name asc){
      name, "slug": slug.current, roleTitle, shortBio, bio,
      "headshot": headshot.asset._ref, credentials, linkedinUrl, xTwitterUrl,
      crunchbaseUrl, wikidataUrl, expertiseTags, yearsOfExperience, basedIn,
      languages, seoTitle, seoDescription
    }`,
    { company: COMPANY_SLUG },
  );

export const personId = (slug: string) => `${SITE}/team#${slug}`;

// Person node, referenced by @id from articles the member wrote.
export const person = (m: Member) => ({
  "@type": "Person",
  "@id": personId(m.slug),
  name: m.name,
  url: `${SITE}/team#${m.slug}`,
  jobTitle: m.roleTitle,
  description: m.shortBio,
  ...(m.headshot && { image: imageUrl(m.headshot, 600, 600) }),
  worksFor: { "@id": ORG_ID },
  sameAs: [m.linkedinUrl, m.xTwitterUrl, m.crunchbaseUrl, m.wikidataUrl].filter(
    Boolean,
  ),
  ...(m.expertiseTags?.length && { knowsAbout: m.expertiseTags }),
  ...(m.languages?.length && { knowsLanguage: m.languages }),
});
