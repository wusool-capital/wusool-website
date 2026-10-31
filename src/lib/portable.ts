// Portable Text helpers for build-time rendering.
import { toHTML } from "@portabletext/to-html";

type Span = { text?: string };
export type Block = { _type: string; listItem?: string; children?: Span[] };

export const html = (blocks?: Block[]) =>
  blocks?.length ? toHTML(blocks) : "";

// The text of each list item, for components that take plain strings.
export const listItems = (blocks?: Block[]) =>
  (blocks ?? [])
    .filter((b) => b._type === "block" && b.listItem)
    .map((b) =>
      (b.children ?? [])
        .map((c) => c.text ?? "")
        .join("")
        .trim(),
    )
    .filter(Boolean);
