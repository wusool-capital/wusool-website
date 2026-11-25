// Build-time reads from the public Sanity dataset. No token is used, so only
// published documents are ever read. The CDN is skipped so a build started by
// a publish webhook sees that publish.
import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

const client = createClient({
  projectId: "qjvm6ww8",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: false,
  perspective: "published",
});
const builder = createImageUrlBuilder(client);

export function query<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return client.fetch<T>(groq, params);
}

// Image asset ref to a resized URL, cropped when a height is given.
export function imageUrl(
  ref: string,
  width: number,
  height?: number,
  format: "jpg" | "webp" = "jpg",
) {
  const img = builder.image(ref).width(width).format(format);
  return height ? img.height(height).fit("crop").url() : img.url();
}
