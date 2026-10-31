import { defineField, defineType } from "sanity";
import { faqList } from "./objects";

export const industry = defineType({
  name: "industry",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "heroHeadline", type: "string" }),
    defineField({ name: "heroSubtext", type: "text", rows: 2 }),
    defineField({ name: "sectorOverview", type: "richText" }),
    defineField({
      name: "ebitdaMultipleRange",
      title: "EBITDA multiple range",
      type: "string",
    }),
    defineField({ name: "whatBuyersLookFor", type: "richText" }),
    defineField({ name: "commonDealKillers", type: "richText" }),
    defineField({ name: "dealTimeline", type: "string" }),
    defineField({ name: "buyerTypes", type: "string" }),
    defineField({ name: "dealSizeRange", type: "string" }),
    defineField({
      name: "clusterArticleUrl",
      title: "Cluster article URL",
      type: "string",
    }),
    defineField({ name: "clusterArticleLabel", type: "string" }),
    faqList,
    defineField({
      name: "featuredImage",
      type: "image",
      fields: [{ name: "alt", type: "string" }],
    }),
    defineField({
      name: "seoMetaTitle",
      title: "SEO meta title",
      type: "string",
    }),
    defineField({
      name: "seoMetaDescription",
      title: "SEO meta description",
      type: "text",
      rows: 2,
    }),
    defineField({ name: "sortOrder", type: "number" }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});
