import { defineArrayMember, defineField, defineType } from "sanity";

// Feeds Person schema and the author pages (PRD 8, fix 10).
export const teamMember = defineType({
  name: "teamMember",
  title: "Team member",
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
    defineField({ name: "roleTitle", title: "Role or title", type: "string" }),
    defineField({
      name: "order",
      title: "Order on the team page",
      description: "Lower numbers show first.",
      type: "number",
    }),
    defineField({ name: "bio", type: "richText" }),
    defineField({ name: "shortBio", type: "text", rows: 2 }),
    defineField({
      name: "headshot",
      type: "image",
      fields: [{ name: "alt", type: "string" }],
    }),
    defineField({ name: "credentials", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "linkedinUrl", title: "LinkedIn URL", type: "url" }),
    defineField({ name: "xTwitterUrl", title: "X URL", type: "url" }),
    defineField({
      name: "crunchbaseUrl",
      title: "Crunchbase URL",
      type: "url",
    }),
    defineField({ name: "wikidataUrl", title: "Wikidata URL", type: "url" }),
    defineField({
      name: "expertiseTags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "yearsOfExperience", type: "string" }),
    defineField({ name: "basedIn", type: "string" }),
    defineField({
      name: "languages",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "seoTitle", title: "SEO title", type: "string" }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "roleTitle", media: "headshot" },
  },
});
