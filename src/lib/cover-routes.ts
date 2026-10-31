// Static routes for generated covers: one per insight or report that has no
// uploaded image. Card covers are WebP, social images are JPG.
import { query } from "./sanity";
import { coverJpg, coverWebp } from "./cover";
import { topicOf } from "./insights";

type Item = {
  slug: string;
  title: string;
  silo?: string;
  readingTime?: string;
};

export async function coverPaths(kind: "insights" | "report") {
  const items = await query<(Item & { image?: string })[]>(
    `*[_type == $kind]{"slug": slug.current, title, silo, readingTime, "image": featuredImage.asset._ref}`,
    { kind },
  );
  return items
    .filter((i) => !i.image)
    .map((i) => ({ params: { slug: i.slug }, props: i }));
}

const text = (i: Item, kind: "insights" | "report") => ({
  title: i.title,
  topic: kind === "report" ? "Report" : topicOf(i.silo)?.silo,
  meta: i.readingTime,
});

export const webpResponse = async (i: Item, kind: "insights" | "report") =>
  new Response(new Uint8Array(await coverWebp(text(i, kind))), {
    headers: { "Content-Type": "image/webp" },
  });
export const jpgResponse = async (i: Item, kind: "insights" | "report") =>
  new Response(new Uint8Array(await coverJpg(text(i, kind))), {
    headers: { "Content-Type": "image/jpeg" },
  });
