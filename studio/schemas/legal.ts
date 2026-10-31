import { defineField, defineType } from "sanity";

// Privacy policy and terms: one rich-text page each (PRD feature 11).
export const legal = defineType({
  name: "legal",
  title: "Legal page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "seo", type: "seo" }),
    defineField({
      name: "lastUpdated",
      title: "Last updated (as shown)",
      description: "For example: October 2026.",
      type: "string",
    }),
    defineField({ name: "intro", type: "text", rows: 3 }),
    defineField({ name: "body", type: "richText" }),
  ],
});
