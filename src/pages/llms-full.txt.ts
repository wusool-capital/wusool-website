// llms-full.txt (PRD 8): the llms.txt header plus every listed insight's full
// text, so AI search tools can read the articles in one file.
import type { APIRoute } from "astro";
import { query } from "../lib/sanity";
import { SITE } from "../lib/schema";
import { GET as llms } from "./llms.txt";

type Block = {
  _type: string;
  style?: string;
  listItem?: string;
  children?: { text?: string }[];
};

const text = (blocks: Block[] = []) =>
  blocks
    .filter((b) => b._type === "block")
    .map((b) => {
      const t = (b.children ?? [])
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      if (b.style === "h2") return `### ${t}`;
      if (b.style === "h3") return `#### ${t}`;
      return b.listItem ? `- ${t}` : t;
    })
    .filter(Boolean)
    .join("\n\n");

export const GET: APIRoute = async (context) => {
  const head = await (await llms(context)).text();
  const insights = await query<
    { h1: string; slug: string; excerpt?: string; body?: Block[] }[]
  >(
    `*[_type == "insights" && hideFromListings != true] | order(publishedAt desc){h1, "slug": slug.current, excerpt, body}`,
  );
  const articles = insights
    .map(
      (i) =>
        `## ${i.h1}\n\n${SITE}/insights/${i.slug}\n\n${i.excerpt ? `${i.excerpt}\n\n` : ""}${text(i.body)}`,
    )
    .join("\n\n---\n\n");
  return new Response(`${head}\n# Full insights\n\n${articles}\n`);
};
