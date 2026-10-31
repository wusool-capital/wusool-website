// Report first-page previews, copied from Sanity at build so the report page
// loads its main image from our own domain (no extra connection on mobile).
import type { APIRoute } from "astro";
import { query, imageUrl } from "../../lib/sanity";

export async function getStaticPaths() {
  const reports = await query<{ slug: string; ref?: string }[]>(
    `*[_type == "report"]{"slug": slug.current, "ref": preview.asset._ref}`,
  );
  return reports
    .filter((r) => r.ref)
    .map((r) => ({ params: { slug: r.slug }, props: { ref: r.ref } }));
}

export const GET: APIRoute = async ({ props }) => {
  const res = await fetch(
    `${imageUrl(props.ref as string, 600, undefined, "webp")}&q=70`,
  );
  if (!res.ok) throw new Error(`Sanity preview image: ${res.status}`);
  return new Response(await res.arrayBuffer(), {
    headers: { "Content-Type": "image/webp" },
  });
};
