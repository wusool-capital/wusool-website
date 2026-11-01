// Build-time data for the insights hub, topic pages and articles.
import { query, imageUrl } from "./sanity";
import type { Block } from "./portable";

export interface Person {
  name: string;
  slug: string;
  roleTitle?: string;
  shortBio?: string;
}
export interface InsightCard {
  title: string;
  slug: string;
  excerpt?: string;
  silo?: string;
  contentType?: string;
  publishedAt?: string;
  readingTime?: string;
  featured?: boolean;
  hideFromListings?: boolean;
  image?: string; // Sanity image asset ref, when an editor uploaded one
  authorSlug?: string;
}
export interface Insight extends InsightCard {
  h1: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle?: string;
  ogImage?: string;
  lastUpdated?: string;
  keyTakeaways?: string[];
  body?: (Block & Record<string, unknown>)[];
  faq?: { question: string; answer: string }[];
  ctaText?: string;
  ctaUrl?: string;
  author?: Person;
  report?: { title: string; slug: string };
}
export interface ReportCard {
  title: string;
  slug: string;
  excerpt?: string;
  silo?: string;
  publishedAt?: string;
  image?: string;
}

const CARD = `title, "slug": slug.current, excerpt, silo, contentType, publishedAt, readingTime,
  featured, hideFromListings, "image": featuredImage.asset._ref,
  "authorSlug": author->slug.current`;

export const allInsights = () =>
  query<Insight[]>(`*[_type == "insights"] | order(publishedAt desc){
    ${CARD}, h1, seoTitle, seoDescription, ogTitle, "ogImage": ogImage.asset._ref, lastUpdated,
    keyTakeaways, body, faq, ctaText, ctaUrl,
    "author": author->{name, "slug": slug.current, roleTitle, shortBio},
    "report": *[_type == "report" && companionInsight._ref == ^._id][0]{title, "slug": slug.current}
  }`);

export const listedInsights = () =>
  query<InsightCard[]>(
    `*[_type == "insights" && hideFromListings != true] | order(featured desc, publishedAt desc){${CARD}}`,
  );

export const reportCards = () =>
  query<ReportCard[]>(`*[_type == "report"] | order(publishedAt desc){
    title, "slug": slug.current, excerpt, silo, publishedAt, "image": featuredImage.asset._ref
  }`);

export interface Report extends ReportCard {
  seoTitle: string;
  seoDescription: string;
  ogTitle?: string;
  ogImage?: string;
  lastUpdated?: string;
  readingTime?: string;
  inside?: string[];
  preview?: { ref: string; alt?: string };
  insight?: { title: string; slug: string };
}

export const allReports = () =>
  query<Report[]>(`*[_type == "report"] | order(publishedAt desc){
    title, "slug": slug.current, excerpt, silo, publishedAt, "image": featuredImage.asset._ref,
    seoTitle, seoDescription, ogTitle, "ogImage": ogImage.asset._ref, lastUpdated, readingTime,
    inside, "preview": preview{"ref": asset._ref, alt}, "insight": companionInsight->{"title": h1, "slug": slug.current}
  }`);

// Card and OG images: the uploaded image, else the generated branded cover.
// Insight cards reuse the article's 800px hero (same size and crop), served
// from our own domain; reports still read from the Sanity CDN.
export const cardImage = (
  kind: "insights" | "reports",
  c: { slug: string; image?: string },
) =>
  c.image
    ? kind === "insights"
      ? `/heroes/${c.slug}-800.webp`
      : imageUrl(c.image, 800, 420, "webp")
    : `/covers/${kind}/${c.slug}.webp`;
export const ogImage = (
  kind: "insights" | "reports",
  c: { slug: string; image?: string; ogImage?: string },
) => {
  const ref = c.ogImage ?? c.image;
  return ref
    ? imageUrl(ref, 1200, 630)
    : `https://www.wusoolcapital.com/og/${kind}/${c.slug}.jpg`;
};

// Topic hub pages, one per primary silo (PRD 6.2).
export const topics = [
  { silo: "Sell Your Business", slug: "sell-your-business" },
  { silo: "Business Valuation", slug: "business-valuation" },
  { silo: "Exit Strategy", slug: "exit-strategy" },
  { silo: "Buy a Business", slug: "buy-a-business" },
  { silo: "GCC M&A Market", slug: "gcc-ma-market" },
  { silo: "General", slug: "general" },
  { silo: "Entrepreneurship Through Acquisition (ETA) GCC", slug: "eta-gcc" },
];
export const topicOf = (silo?: string) => topics.find((t) => t.silo === silo);

export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
