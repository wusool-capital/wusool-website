import { defineArrayMember, defineField, defineType } from "sanity";

// SEO fields shared by every page type.
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.max(60),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      validation: (r) => r.max(160),
    }),
    defineField({
      name: "canonical",
      title: "Canonical override",
      type: "url",
    }),
    defineField({ name: "ogTitle", title: "OG title", type: "string" }),
    defineField({
      name: "ogImage",
      title: "OG image (1200 x 630)",
      type: "image",
    }),
    defineField({ name: "noindex", type: "boolean", initialValue: false }),
  ],
});

// One question and answer. FAQ lists are arrays of these, never HTML.
export const faqItem = defineType({
  name: "faqItem",
  title: "Question",
  type: "object",
  fields: [
    defineField({
      name: "question",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "answer",
      type: "text",
      rows: 4,
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "question" } },
});

export const faqList = defineField({
  name: "faq",
  title: "FAQ",
  type: "array",
  of: [defineArrayMember({ type: "faqItem" })],
});

// Rich text with the custom blocks of PRD 6: exhibit, stat, quote, CTA,
// report download and FAQ.
export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      marks: {
        annotations: [
          {
            name: "link",
            type: "object",
            fields: [
              { name: "href", type: "string", validation: (r) => r.required() },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      fields: [{ name: "alt", type: "string" }],
    }),
    defineArrayMember({
      name: "exhibit",
      type: "object",
      fields: [
        { name: "title", type: "string" },
        { name: "bundle", title: "Interactive HTML bundle", type: "file" },
        { name: "caption", type: "string" },
      ],
    }),
    defineArrayMember({
      name: "stat",
      type: "object",
      fields: [
        { name: "value", type: "string" },
        { name: "label", type: "string" },
      ],
    }),
    defineArrayMember({
      name: "quote",
      type: "object",
      fields: [
        { name: "text", type: "text", rows: 3 },
        { name: "attribution", type: "string" },
      ],
    }),
    defineArrayMember({
      name: "cta",
      title: "CTA",
      type: "object",
      fields: [
        { name: "text", type: "string" },
        { name: "url", type: "string" },
      ],
    }),
    defineArrayMember({
      name: "reportDownload",
      type: "object",
      fields: [{ name: "report", type: "reference", to: [{ type: "report" }] }],
    }),
    defineArrayMember({
      name: "table",
      type: "object",
      fields: [
        { name: "headerRow", title: "First row is a header", type: "boolean" },
        {
          name: "rows",
          type: "array",
          of: [
            {
              type: "object",
              name: "row",
              fields: [
                { name: "cells", type: "array", of: [{ type: "string" }] },
              ],
            },
          ],
        },
      ],
    }),
    defineArrayMember({
      name: "faqBlock",
      title: "FAQ",
      type: "object",
      fields: [faqList],
    }),
  ],
});
