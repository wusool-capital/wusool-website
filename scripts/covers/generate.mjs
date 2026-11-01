// Generates insight covers with the Gemini API into scripts/covers/images/.
// Skips slugs that already have a PNG. Usage: node scripts/covers/generate.mjs [slug...]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const env = readFileSync(`${root}.env`, "utf8");
const key = env
  .match(/^GEMINI_API_KEY=(.*)$/m)?.[1]
  .trim()
  .replace(/^["']|["']$/g, "");
if (!key) throw new Error("Add GEMINI_API_KEY to .env");
const model = process.env.MODEL ?? "gemini-3.1-flash-image";
const { template, covers } = JSON.parse(
  readFileSync(`${root}scripts/covers/prompts.json`, "utf8"),
);
const outDir = `${root}scripts/covers/images`;
const only = process.argv.slice(2);

for (const [slug, [medium, dominant, accent, composition]] of Object.entries(
  covers,
)) {
  const out = `${outDir}/${slug}.png`;
  if (only.length ? !only.includes(slug) : existsSync(out)) continue;
  const prompt = template
    .replace("{medium}", medium[0].toUpperCase() + medium.slice(1))
    .replace("{dominant}", dominant)
    .replace("{accent}", accent ? `, ${accent}` : "")
    .replace("{composition}", composition);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
        },
      }),
    },
  );
  const data = await res.json();
  const b64 = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
    ?.inlineData.data;
  if (!b64) {
    console.error(slug, res.status, JSON.stringify(data).slice(0, 300));
    continue;
  }
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log("saved", slug);
}
