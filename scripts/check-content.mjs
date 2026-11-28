// Lists every published Sanity document missing a field the build needs.
// The build stops at the first such document, so this runs before it and
// names them all, letting editors fix everything in one pass.
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "qjvm6ww8",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: false,
  perspective: "published",
});

// Labels match the field titles in Sanity Studio.
const RULES = [
  {
    kind: "Page",
    query: `*[_type in ["page", "legal"]]{_id, "name": _id, seo}`,
    fields: { "seo.title": "SEO title", "seo.description": "SEO description" },
  },
  {
    kind: "Insight",
    query: `*[_type == "insights"]{_id, "name": title, "path": "/insights/" + slug.current, h1, seoTitle, seoDescription}`,
    fields: {
      h1: "H1",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
    },
  },
  {
    kind: "Report",
    query: `*[_type == "report"]{_id, "name": title, "path": "/reports/" + slug.current, seoTitle, seoDescription, excerpt}`,
    fields: {
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      excerpt: "Excerpt",
    },
  },
  {
    kind: "Industry",
    query: `*[_type == "industry"]{_id, "name": coalesce(name, _id), "path": "/industries/" + slug.current, name, seoMetaTitle, seoMetaDescription, heroHeadline}`,
    fields: {
      name: "Name",
      seoMetaTitle: "SEO meta title",
      seoMetaDescription: "SEO meta description",
      heroHeadline: "Hero headline",
    },
  },
  {
    kind: "Career",
    query: `*[_type == "career"]{_id, "name": name, "path": "/careers/" + slug.current, metaTitle, metaDescription}`,
    fields: { metaTitle: "Meta title", metaDescription: "Meta description" },
  },
];

const get = (doc, path) => path.split(".").reduce((v, k) => v?.[k], doc);

const problems = [];
let checked = 0;
for (const rule of RULES) {
  for (const doc of await client.fetch(rule.query)) {
    checked++;
    const missing = Object.entries(rule.fields)
      .filter(([path]) => !String(get(doc, path) ?? "").trim())
      .map(([, label]) => label);
    if (missing.length)
      problems.push(
        `${rule.kind} "${doc.name ?? doc._id}"${doc.path ? ` (${doc.path})` : ""}: ${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required`,
      );
  }
}

if (problems.length) {
  console.error(
    `check-content: ${problems.length} document(s) need fixing in Sanity. Add these fields, publish, and the site redeploys.\n` +
      problems.map((p) => `- ${p}`).join("\n"),
  );
  process.exit(1);
}
console.log(`check-content: ${checked} document(s) passed`);
