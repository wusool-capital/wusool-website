import { defineArrayMember, defineField, defineType } from "sanity";

// One document. The approved values of PRD 13 live here once, so pages,
// FAQ and llms.txt read them from one place.
const navLink = defineArrayMember({
  type: "object",
  fields: [
    { name: "label", type: "string" },
    { name: "href", type: "string" },
    {
      name: "menu",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", type: "string" },
            { name: "href", type: "string" },
          ],
        },
      ],
    },
  ],
});

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "timeToFirstOffer",
      type: "string",
      initialValue: "6 weeks to first offer",
    }),
    defineField({
      name: "dealSizeRange",
      type: "string",
      initialValue: "$1M to $25M",
    }),
    defineField({
      name: "feeWording",
      type: "string",
      initialValue:
        "mainly success fee, with a retainer depending on documentation",
    }),
    defineField({
      name: "legalName",
      title: "Registered entity name",
      type: "string",
    }),
    defineField({ name: "address", type: "string" }),
    defineField({ name: "license", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "linkedinUrl", title: "LinkedIn URL", type: "url" }),
    defineField({ name: "nav", type: "array", of: [navLink] }),
    defineField({ name: "footerLinks", type: "array", of: [navLink] }),
    defineField({ name: "defaultSeo", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
