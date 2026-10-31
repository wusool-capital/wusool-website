import { defineArrayMember, defineField, defineType, type Rule } from "sanity";
import { faqList } from "./objects";

// Section blocks of a landing page. Layout is code; content and order are
// editable (PRD 6). One block per index.html section.
// A link, or a button that opens a tools app form instead (embed.js modal).
const link = [
  { name: "label", type: "string" },
  { name: "href", type: "string" },
  {
    name: "form",
    title: "Opens form",
    description: "Leave empty for a normal link.",
    type: "string",
    options: { list: ["get-started", "buyers"] },
  },
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
      {
        name: "visual",
        title: "Illustration",
        type: "string",
        options: { list: ["seller", "buyer", "none"] },
        initialValue: "seller",
      },
      {
        name: "ctas",
        type: "array",
        of: [{ type: "object", fields: link }],
        validation: (r: Rule) => r.max(2),
      },
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
        name: "tiles",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              {
                name: "industry",
                type: "reference",
                to: [{ type: "industry" }],
                validation: (r: Rule) => r.required(),
              },
              { name: "title", type: "string" },
              { name: "text", type: "string" },
              { name: "cta", title: "Link label", type: "string" },
            ],
            preview: { select: { title: "title" } },
          },
        ],
      },
      { name: "footLink", type: "object", fields: link },
    ],
  }),
  defineArrayMember({
    name: "processSection",
    title: "Process",
    type: "object",
    fields: [
      ...head,
      { name: "primary", type: "object", fields: link },
      { name: "secondary", type: "object", fields: link },
      {
        name: "steps",
        type: "array",
        description: "Up to 3 steps, one per illustration.",
        validation: (r: Rule) => r.max(3),
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
      { name: "note", title: "Note under real deals", type: "string" },
      { name: "footLink", type: "object", fields: link },
      {
        name: "exampleNote",
        title: "Note under example deals",
        description: "Says the rows are indicative examples.",
        type: "string",
      },
      {
        name: "examples",
        title: "Example deals",
        description: "Shown only while Sanity has no transactions.",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "category", type: "string" },
              { name: "status", type: "string" },
              { name: "sector", type: "string" },
              { name: "country", type: "string" },
              { name: "year", type: "string" },
              { name: "summary", type: "string" },
            ],
            preview: { select: { title: "summary" } },
          },
        ],
      },
    ],
  }),
  defineArrayMember({
    name: "featureCardsSection",
    title: "Feature cards",
    type: "object",
    fields: [
      ...head,
      {
        name: "cards",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "eyebrow", type: "string" },
              {
                name: "title",
                type: "string",
                validation: (r: Rule) => r.required(),
              },
              { name: "text", type: "text", rows: 2 },
              { name: "link", type: "object", fields: link },
            ],
            preview: { select: { title: "title" } },
          },
        ],
      },
      { name: "cta", type: "object", fields: link },
    ],
  }),
  defineArrayMember({
    name: "stepsSection",
    title: "Numbered steps",
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
      { name: "cta", type: "object", fields: link },
    ],
  }),
  defineArrayMember({
    name: "toolSection",
    title: "Tool",
    description: "Embeds a tool from the tools app at this position.",
    type: "object",
    fields: [
      defineField({
        name: "tool",
        type: "string",
        options: { list: ["valuation", "readiness", "benchmark"] },
        validation: (r) => r.required(),
      }),
    ],
  }),
  defineArrayMember({
    name: "noteSection",
    title: "Founders' note",
    type: "object",
    fields: [
      { name: "title", type: "string" },
      { name: "paragraphs", type: "array", of: [{ type: "text" }] },
      {
        name: "signers",
        type: "array",
        of: [{ type: "reference", to: [{ type: "teamMember" }] }],
      },
    ],
  }),
  defineArrayMember({
    name: "teamSection",
    title: "Team grid",
    description:
      "Lists every team member. Add, remove or reorder them under Team members.",
    type: "object",
    fields: [
      { name: "title", type: "string" },
      { name: "cta", type: "object", fields: link },
    ],
  }),
  defineArrayMember({
    name: "rolesSection",
    title: "Open roles",
    description: "Lists every open role from Careers.",
    type: "object",
    fields: [
      { name: "title", type: "string" },
      { name: "empty", title: "Text when no role is open", type: "string" },
    ],
  }),
  defineArrayMember({
    name: "postsSection",
    title: "Latest insights",
    type: "object",
    fields: [
      { name: "title", type: "string" },
      { name: "allLink", type: "object", fields: link },
    ],
  }),
  defineArrayMember({
    name: "faqSection",
    title: "FAQ",
    type: "object",
    fields: [...head, faqList, { name: "cta", type: "object", fields: link }],
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
    defineField({
      name: "closingCta",
      title: "Closing CTA",
      description:
        "Replaces the site-wide closing call to action on this page.",
      type: "object",
      fields: [
        { name: "title", type: "string" },
        { name: "text", type: "string" },
        { name: "button", type: "object", fields: link },
      ],
    }),
    defineField({
      name: "service",
      title: "Service (structured data)",
      description: "For service pages such as Sell and Buyers.",
      type: "object",
      fields: [
        { name: "name", type: "string" },
        { name: "serviceType", type: "string" },
        { name: "description", type: "text", rows: 2 },
      ],
    }),
    defineField({ name: "sections", type: "array", of: sections }),
  ],
});
