import { defineField, defineType } from "sanity";
import { partnerCategories, partnerLocations, partnerSizes } from "./options";

// Partner directory and quiz on /partners (PRD 6.3).
export const partner = defineType({
  name: "partner",
  title: "Partner",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      options: { list: partnerCategories },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      description: "One plain sentence on what they do.",
      type: "string",
      validation: (r) => r.required().max(160),
    }),
    defineField({
      name: "logo",
      type: "image",
      fields: [{ name: "alt", type: "string" }],
    }),
    defineField({
      name: "sizes",
      title: "Company sizes they fit",
      description: "Leave empty if they fit every size.",
      type: "array",
      of: [{ type: "string" }],
      options: { list: partnerSizes, layout: "grid" },
    }),
    defineField({
      name: "locations",
      title: "Locations they serve",
      description: "Leave empty if they serve every location.",
      type: "array",
      of: [{ type: "string" }],
      options: { list: partnerLocations, layout: "grid" },
    }),
    defineField({
      name: "offer",
      description: 'For example "20% off the first year". Optional.',
      type: "string",
    }),
    defineField({
      name: "linkType",
      title: "Link type",
      type: "string",
      options: {
        list: [
          { title: "Link to their site", value: "link" },
          { title: "Discount code", value: "code" },
          { title: "Landing page for our referrals", value: "landing" },
        ],
        layout: "radio",
      },
      initialValue: "link",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "code",
      description: "Shown with a copy button when the link type is code.",
      type: "string",
      hidden: ({ parent }) => parent?.linkType !== "code",
      validation: (r) =>
        r.custom((code, ctx) =>
          (ctx.parent as { linkType?: string })?.linkType === "code" && !code
            ? "Add the code, or pick another link type."
            : true,
        ),
    }),
    defineField({
      name: "active",
      description: "Off hides the partner on the next build.",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "order",
      description: "Lower numbers show first in their category.",
      type: "number",
    }),
  ],
  preview: { select: { title: "name", subtitle: "category", media: "logo" } },
});
