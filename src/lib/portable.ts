// Portable Text helpers for build-time rendering.
import { toHTML } from "@portabletext/to-html";

type Span = { text?: string };
export type Block = { _type: string; listItem?: string; children?: Span[] };

export const html = (blocks?: Block[]) =>
  blocks?.length ? toHTML(blocks) : "";

// List items, or the paragraphs when an editor typed no bullets.
export const listItems = (blocks?: Block[]) => {
  const text = (b: Block) =>
    (b.children ?? [])
      .map((c) => c.text ?? "")
      .join("")
      .trim();
  const all = (blocks ?? []).filter((b) => b._type === "block");
  const items = all.some((b) => b.listItem)
    ? all.filter((b) => b.listItem)
    : all;
  return items.map(text).filter(Boolean);
};
