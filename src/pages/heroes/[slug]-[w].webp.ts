// Article hero images, copied from Sanity at build in two widths so the
// article loads its main image from our own domain (no extra connection on
// mobile). Quality 75 keeps them sharp at about a third smaller.
import type { APIRoute } from "astro";
import { query, imageUrl } from "../../lib/sanity";

export const HERO_WIDTHS = [800, 1200];

export async function getStaticPaths() {
  const insights = await query<{ slug: string; ref?: string }[]>(
    `*[_type == "insights"]{"slug": slug.current, "ref": featuredImage.asset._ref}`,
  );
  return insights
    .filter((i) => i.ref)
    .flatMap((i) =>
      HERO_WIDTHS.map((w) => ({
        params: { slug: i.slug, w: String(w) },
        props: { ref: i.ref, w },
      })),
    );
}

export const GET: APIRoute = async ({ props }) => {
  // From props: the URL alone cannot split a hyphenated slug from the width.
  const w = props.w as number;
  const res = await fetch(
    `${imageUrl(props.ref as string, w, Math.round((w * 630) / 1200), "webp")}&q=75`,
  );
  if (!res.ok) throw new Error(`Sanity hero image: ${res.status}`);
  return new Response(await res.arrayBuffer(), {
    headers: { "Content-Type": "image/webp" },
  });
};
