// Branded 1200 x 630 cover for an insight or report without its own image
// (PRD 6.2): navy panel, sky accents, Inter. Satori draws the text as paths,
// so covers look the same on every machine. Colors mirror tokens.css.
import { readFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";

const NAVY = "#000523";
const SKY = "#c6e1ee";
const ON_NAVY_MUTED = "#a9b6c9";
const font = (weight: 400 | 600) =>
  readFileSync(
    `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`,
  );
const fonts = [
  { name: "Inter", data: font(400), weight: 400 as const },
  { name: "Inter", data: font(600), weight: 600 as const },
];
// Satori draws raster images reliably, so the white logo is passed as PNG.
const logo = sharp(readFileSync("src/assets/logo/logo-white.svg"))
  .resize({ height: 80 })
  .png()
  .toBuffer()
  .then((b) => `data:image/png;base64,${b.toString("base64")}`);

type El = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra = {},
): El => ({
  type,
  props: { style, children, ...extra },
});

export interface CoverText {
  title: string;
  topic?: string;
  meta?: string;
}

async function svg({ title, topic, meta }: CoverText) {
  const src = await logo;
  const size = title.length <= 48 ? 68 : title.length <= 80 ? 58 : 48;
  return satori(
    el(
      "div",
      {
        width: 1200,
        height: 630,
        display: "flex",
        padding: 72,
        backgroundColor: NAVY,
        backgroundImage: `radial-gradient(circle at 88% 12%, rgba(198,225,238,0.22), rgba(0,5,35,0) 55%), radial-gradient(circle at 0% 110%, rgba(198,225,238,0.12), rgba(0,5,35,0) 60%)`,
        fontFamily: "Inter",
      },
      [
        // Satori drops images in a padded space-between column, so the
        // padding sits on the panel and the layout on this inner frame.
        el(
          "div",
          {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 1056,
            height: 486,
          },
          [
            el(
              "div",
              {
                display: "flex",
                justifyContent: "space-between",
                fontSize: 28,
              },
              [
                el(
                  "div",
                  { display: "flex", color: SKY, fontWeight: 600 },
                  topic ?? "Insights",
                ),
                el(
                  "div",
                  { display: "flex", color: ON_NAVY_MUTED },
                  meta ?? "",
                ),
              ],
            ),
            el(
              "div",
              {
                display: "flex",
                color: "#ffffff",
                fontSize: size,
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: -1.5,
                maxWidth: 1000,
              },
              title,
            ),
            // A logo nested in a row is dropped by satori, so it sits in the column.
            { type: "img", props: { src, width: 243, height: 40 } },
          ],
        ),
      ],
    ) as never,
    { width: 1200, height: 630, fonts },
  );
}

// Cards never render wider than about 700px, so card covers ship at 800.
export const coverWebp = async (t: CoverText) =>
  sharp(Buffer.from(await svg(t)))
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toBuffer();
export const coverJpg = async (t: CoverText) =>
  sharp(Buffer.from(await svg(t)))
    .jpeg({ quality: 84 })
    .toBuffer();
