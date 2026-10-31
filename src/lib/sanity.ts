// Build-time reads from the public Sanity dataset. No token is used, so only
// published documents are ever read.
const PROJECT = "qjvm6ww8";
const DATASET = "production";
const API = `https://${PROJECT}.api.sanity.io/v2025-01-01/data/query/${DATASET}`;

export async function query<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const url = new URL(API);
  url.searchParams.set("query", groq);
  url.searchParams.set("perspective", "published");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return (await res.json()).result as T;
}

// Image asset ref ("image-<hash>-<w>x<h>-<ext>") to a resized URL, cropped
// when a height is given.
export function imageUrl(
  ref: string,
  width: number,
  height?: number,
  format: "jpg" | "webp" = "jpg",
) {
  const [, hash, size, ext] = ref.split("-");
  const params = height
    ? `w=${width}&h=${height}&fit=crop&fm=${format}`
    : `w=${width}&fm=${format}`;
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${hash}-${size}.${ext}?${params}`;
}
