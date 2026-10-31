import { defineArrayMember, defineField, defineType } from "sanity";
import { faqList } from "./objects";
import { contentTypes, silos } from "./options";

// Type name and existing fields kept from the original Sanity project
// (title, slug, contentType, silo, h1, seo fields, htmlFile, bodyFormat,
// hideHeader) so documents can move between projects unchanged.
export const insights = defineType({
  name: "insights",
  title: "Insight",
  type: "document",
  groups: [
    { name: "content", default: true },
    { name: "seo", title: "SEO" },
    { name: "settings" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "content",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "contentType",
      type: "string",
      group: "content",
      options: { list: contentTypes },
    }),
    defineField({
      name: "silo",
      title: "Primary silo",
      type: "string",
      group: "content",
      options: { list: silos },
    }),
    defineField({
      name: "author",
      type: "reference",
      group: "content",
      to: [{ type: "teamMember" }],
    }),
    defineField({ name: "excerpt", type: "text", rows: 3, group: "content" }),
    defineField({
      name: "keyTakeaways",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "body", type: "richText", group: "content" }),
    { ...faqList, group: "content" },
    defineField({
      name: "ctaText",
      title: "CTA text",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "ctaUrl",
      title: "CTA URL",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "featuredImage",
      type: "image",
      group: "content",
      fields: [{ name: "alt", type: "string" }],
    }),
    defineField({
      name: "heroImage",
      type: "image",
      group: "content",
      fields: [{ name: "alt", type: "string" }],
    }),
    defineField({ name: "h1", title: "H1", type: "string", group: "seo" }),
    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 2,
      group: "seo",
    }),
    defineField({
      name: "ogTitle",
      title: "OG title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "OG image",
      type: "image",
      group: "seo",
    }),
    defineField({ name: "targetKeyword", type: "string", group: "seo" }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      type: "datetime",
      group: "settings",
    }),
    defineField({ name: "lastUpdated", type: "datetime", group: "settings" }),
    defineField({ name: "readingTime", type: "string", group: "settings" }),
    defineField({ name: "wordCount", type: "number", group: "settings" }),
    defineField({ name: "featured", type: "boolean", group: "settings" }),
    defineField({ name: "gated", type: "boolean", group: "settings" }),
    defineField({
      name: "hideFromListings",
      type: "boolean",
      group: "settings",
    }),
    defineField({ name: "pressOutlet", type: "string", group: "settings" }),
    defineField({
      name: "pressUrl",
      title: "Press URL",
      type: "url",
      group: "settings",
    }),
    defineField({
      name: "bodyFormat",
      type: "string",
      group: "settings",
      hidden: true,
    }),
    defineField({
      name: "hideHeader",
      type: "boolean",
      group: "settings",
      hidden: true,
    }),
    defineField({
      name: "htmlFile",
      title: "HTML bundle",
      type: "file",
      group: "settings",
    }),
  ],
  preview: { select: { title: "title", subtitle: "silo" } },
});
