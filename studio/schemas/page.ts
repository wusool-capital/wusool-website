import { defineArrayMember, defineField, defineType } from "sanity";
import { faqList } from "./objects";

// Section blocks of a landing page. Layout is code; content and order are
// editable (PRD 6). One block per index.html section.
const link = [
  { name: "label", type: "string" },
  { name: "href", type: "string" },
];
const head = [
  { name: "label", type: "string" },
  { name: "title", type: "string" },
  { name: "lede", type: "text", rows: 2 },
];
const strings = { type: "array", of: [{ type: "string" }] };

const sections = [
  defineArrayMember({
    name: "heroSection",
    title: "Hero",
    type: "object",
    fields: [
      { name: "label", type: "string" },
      { name: "title", type: "string" },
      { name: "soft", title: "Second line", type: "string" },
      { name: "sub", type: "text", rows: 2 },
      { name: "ctas", type: "array", of: [{ type: "object", fields: link }] },
    ],
  }),
  defineArrayMember({
    name: "statsSection",
    title: "Stats",
    type: "object",
    fields: [
      {
        name: "items",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "num", type: "string" },
              { name: "unit", type: "string" },
              { name: "text", type: "string" },
            ],
          },
        ],
      },
    ],
  }),
  defineArrayMember({
    name: "comparisonSection",
    title: "Comparison",
    type: "object",
    fields: [
      ...head,
      { name: "oldTitle", type: "string" },
      { name: "oldItems", ...strings },
      { name: "newTitle", type: "string" },
      { name: "newItems", ...strings },
      { name: "cta", type: "object", fields: link },
    ],
  }),
  defineArrayMember({
    name: "sectorGridSection",
    title: "Sector grid",
    type: "object",
    fields: [
      ...head,
      {
        name: "industries",
        type: "array",
        of: [{ type: "reference", to: [{ type: "industry" }] }],
      },
    ],
  }),
  defineArrayMember({
    name: "processSection",
    title: "Process",
    type: "object",
    fields: [
      ...head,
      {
        name: "steps",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "title", type: "string" },
              { name: "text", type: "text", rows: 3 },
            ],
          },
        ],
      },
    ],
  }),
  defineArrayMember({
    name: "dealsSection",
    title: "Deals table",
    type: "object",
    fields: [
      ...head,
      {
        name: "transactions",
        type: "array",
        of: [{ type: "reference", to: [{ type: "transaction" }] }],
      },
    ],
  }),
  defineArrayMember({
    name: "postsSection",
    title: "Latest insights",
    type: "object",
    fields: [{ name: "title", type: "string" }],
  }),
  defineArrayMember({
    name: "faqSection",
    title: "FAQ",
    type: "object",
    fields: [...head, faqList],
  }),
  defineArrayMember({
    name: "ctaBandSection",
    title: "CTA band",
    type: "object",
    fields: [
      { name: "title", type: "string" },
      { name: "text", type: "string" },
      { name: "cta", type: "object", fields: link },
    ],
  }),
];

export const page = defineType({
  name: "page",
  title: "Landing page",
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
    defineField({ name: "sections", type: "array", of: sections }),
  ],
});
