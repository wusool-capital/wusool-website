import { defineField, defineType } from "sanity";

export const career = defineType({
  name: "career",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "department", type: "string" }),
    defineField({ name: "location", type: "string" }),
    defineField({
      name: "employmentType",
      type: "string",
      options: { list: ["Full-time", "Part-time", "Internship", "Contract"] },
    }),
    defineField({ name: "datePosted", type: "datetime" }),
    defineField({ name: "validThrough", type: "datetime" }),
    defineField({
      name: "status",
      type: "string",
      options: { list: ["Open", "Closed"] },
    }),
    defineField({
      name: "linkedinApplyUrl",
      title: "LinkedIn apply URL",
      type: "url",
    }),
    defineField({ name: "shortDescription", type: "text", rows: 3 }),
    defineField({ name: "responsibilities", type: "richText" }),
    defineField({ name: "requirements", type: "richText" }),
    defineField({ name: "metaTitle", type: "string" }),
    defineField({ name: "metaDescription", type: "text", rows: 2 }),
  ],
});
