import { defineField, defineType } from "sanity";

export const transaction = defineType({
  name: "transaction",
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
    defineField({
      name: "category",
      type: "string",
      options: {
        list: ["M&A Advisory", "Valuation Advisory", "Capital Advisory"],
      },
    }),
    defineField({
      name: "status",
      type: "string",
      options: { list: ["Closed", "Active", "Under Offer", "Completed"] },
    }),
    defineField({ name: "sector", type: "string" }),
    defineField({ name: "country", type: "string" }),
    defineField({
      name: "cityEmirate",
      title: "City or emirate",
      type: "string",
    }),
    defineField({ name: "dealType", type: "string" }),
    defineField({ name: "revenueRange", type: "string" }),
    defineField({ name: "dealSizeRange", type: "string" }),
    defineField({ name: "year", type: "string" }),
    defineField({ name: "date", type: "datetime" }),
    defineField({ name: "timeToClose", type: "string" }),
    defineField({ name: "oneLineDescription", type: "string" }),
    defineField({ name: "dealSummaryExtended", type: "richText" }),
    defineField({ name: "counterparties", type: "string" }),
    defineField({ name: "clientLogo", type: "image" }),
    defineField({ name: "industryKeywords", type: "string" }),
    defineField({ name: "sortOrder", type: "number" }),
  ],
});
