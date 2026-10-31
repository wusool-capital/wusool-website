// Portable Text to HTML at build time. Text is escaped by the library and by
// escapeHTML here; links pass the library's URI safety check.
import { toHTML, escapeHTML as esc, uriLooksSafe } from "@portabletext/to-html";
import { imageUrl } from "./sanity";

type Span = { text?: string };
export type Block = {
  _type: string;
  style?: string;
  listItem?: string;
  children?: Span[];
};
type Node = Block & Record<string, unknown>;

const plain = (b: Block) =>
  (b.children ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();

// List items, or the paragraphs when an editor typed no bullets.
export const listItems = (blocks?: Block[]) => {
  const all = (blocks ?? []).filter((b) => b._type === "block");
  const items = all.some((b) => b.listItem)
    ? all.filter((b) => b.listItem)
    : all;
  return items.map(plain).filter(Boolean);
};

// A heading's anchor id, unique within the page.
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

// Responsive image from a Sanity asset ref ("image-<hash>-<w>x<h>-<ext>").
function img(
  ref: string,
  alt: string,
  sizes = "(max-width: 760px) 100vw, 760px",
) {
  const [w, h] = ref.split("-")[2].split("x").map(Number);
  const width = Math.min(w, 1520);
  const height = Math.round((h / w) * width);
  const srcset = [480, 760, 1140, 1520]
    .filter((x) => x <= w)
    .map((x) => `${imageUrl(ref, x, undefined, "webp")} ${x}w`)
    .join(", ");
  return `<img src="${imageUrl(ref, 760, undefined, "webp")}" srcset="${srcset}" sizes="${sizes}" width="${width}" height="${height}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}

export interface Heading {
  id: string;
  text: string;
}

export function renderBody(blocks: Node[] = []) {
  const ids = new Set<string>();
  const toc: Heading[] = [];
  const idFor = (text: string) => {
    let id = slugify(text) || "section";
    for (let n = 2; ids.has(id); n++) id = `${slugify(text)}-${n}`;
    ids.add(id);
    return id;
  };
  const html = toHTML(blocks, {
    components: {
      block: {
        h2: ({ children, value }) => {
          const text = plain(value as Block);
          const id = idFor(text);
          toc.push({ id, text });
          return `<h2 id="${id}">${children}</h2>`;
        },
        h3: ({ children, value }) =>
          `<h3 id="${idFor(plain(value as Block))}">${children}</h3>`,
      },
      marks: {
        link: ({ children, value }) => {
          const href = String((value as { href?: string })?.href ?? "");
          if (!uriLooksSafe(href)) return children;
          const external =
            /^https?:\/\//.test(href) && !href.includes("wusoolcapital.com");
          return `<a href="${esc(href)}"${external ? ' rel="noopener"' : ""}>${children}</a>`;
        },
      },
      types: {
        image: ({ value }) => {
          const v = value as { asset?: { _ref: string }; alt?: string };
          return v.asset
            ? `<figure class="pt-image">${img(v.asset._ref, v.alt ?? "")}</figure>`
            : "";
        },
        exhibit: ({ value }) => {
          const v = value as {
            title?: string;
            caption?: string;
            image?: { asset?: { _ref: string }; alt?: string };
          };
          if (!v.image?.asset) return "";
          return `<figure class="pt-exhibit">${v.title ? `<h3 id="${idFor(v.title)}">${esc(v.title)}</h3>` : ""}${img(v.image.asset._ref, v.image.alt ?? v.title ?? "")}${v.caption ? `<figcaption>${esc(v.caption)}</figcaption>` : ""}</figure>`;
        },
        table: ({ value }) => {
          const v = value as {
            title?: string;
            headerRow?: boolean;
            rows?: { cells?: string[] }[];
          };
          const rows = v.rows ?? [];
          const cells = (r: { cells?: string[] }, tag: string) =>
            `<tr>${(r.cells ?? []).map((c) => `<${tag}>${esc(c)}</${tag}>`).join("")}</tr>`;
          const head =
            v.headerRow && rows[0]
              ? `<thead>${cells(rows[0], "th")}</thead>`
              : "";
          const body = (v.headerRow ? rows.slice(1) : rows)
            .map((r) => cells(r, "td"))
            .join("");
          return `<figure class="pt-table">${v.title ? `<h3 id="${idFor(v.title)}">${esc(v.title)}</h3>` : ""}<div class="pt-scroll"><table>${head}<tbody>${body}</tbody></table></div></figure>`;
        },
        quote: ({ value }) => {
          const v = value as { text?: string; attribution?: string };
          return `<blockquote class="pt-quote"><p>${esc(v.text ?? "")}</p>${v.attribution ? `<cite>${esc(v.attribution)}</cite>` : ""}</blockquote>`;
        },
        stat: ({ value }) => {
          const v = value as { value?: string; label?: string };
          return `<p class="pt-stat"><strong>${esc(v.value ?? "")}</strong> ${esc(v.label ?? "")}</p>`;
        },
      },
      unknownType: () => "",
    },
  });
  return { html, toc };
}

export const html = (blocks?: Block[]) =>
  blocks?.length ? toHTML(blocks) : "";
