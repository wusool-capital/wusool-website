// Loads a landing page from Sanity with everything its sections need.
import { query } from "./sanity";
import type { OrgSettings } from "./schema";

export type Form = "get-started" | "buyers";
export type Link = { label?: string; href?: string; form?: Form };
// Section fields come from Studio; Sections.astro checks what each needs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Section = { _type: string; _key: string; [k: string]: any };
export type Post = {
  title: string;
  slug: string;
  excerpt: string;
  silo: string;
};
export type Deal = {
  category: string;
  status: string;
  sector: string;
  country: string;
  year: string;
  summary: string;
};
export type Faq = {
  question: string;
  answer: string;
  link?: { text?: string; href?: string };
};

export interface PageData {
  page: {
    seo: {
      title: string;
      description: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    };
    service?: { name?: string; serviceType?: string; description?: string };
    closingCta?: { title?: string; text?: string; button?: Link };
    sections: Section[];
  };
  settings: OrgSettings;
  banner?: { title: string; slug: string };
  posts: Post[];
  deals: Deal[];
}

export async function loadPage(id: string): Promise<PageData> {
  const data = await query<PageData>(
    `{
      "page": *[_id == $id][0]{
        seo{..., "ogImage": ogImage.asset._ref},
        service,
        closingCta,
        sections[]{..., _type == "sectorGridSection" => {tiles[]{..., "slug": industry->slug.current}}}
      },
      "settings": *[_id == "siteSettings"][0],
      "banner": *[_type == "report" && bannerPinned == true][0]{title, "slug": slug.current},
      "posts": *[_type == "insights" && hideFromListings != true] | order(featured desc, publishedAt desc)[0...3]{
        title, "slug": slug.current, excerpt, silo
      },
      "deals": *[_type == "transaction"] | order(sortOrder asc){
        category, status, sector, country, year, "summary": oneLineDescription
      }
    }`,
    { id },
  );
  if (!data.page?.seo?.title || !data.page.seo.description) {
    throw new Error(`Sanity: ${id} needs an SEO title and description`);
  }
  data.page.sections ??= [];
  return data;
}

// The FAQ shown on the page, which is also the FAQ schema.
export const faqItems = (section?: Section): Faq[] =>
  (section?.faq ?? []).filter((i: Faq) => i.question && i.answer);
// The page's FAQ schema uses its first FAQ section.
export const faqOf = (sections: Section[]): Faq[] =>
  faqItems(sections.find((s) => s._type === "faqSection"));

// Sections that render: deals need rows, latest insights need 3 posts.
export const visibleSections = (
  sections: Section[],
  deals: Deal[],
  posts: Post[],
) =>
  sections.filter((s) =>
    s._type === "dealsSection"
      ? (deals.length || s.examples?.length) > 0
      : s._type === "postsSection"
        ? posts.length === 3
        : true,
  );

// Sections drawn on the white surface; the rest sit on the grey page.
const SURFACE = new Set(["processSection", "stepsSection", "faqSection"]);
export const tone = (s?: Section): "page" | "surface" =>
  s && SURFACE.has(s._type) ? "surface" : "page";
