// Gate (PRD 5.2): components and base styles read design values from
// src/styles/tokens.css only. Flags raw colors, raw lengths and raw times
// in .astro <style> blocks and in src/styles/*.css other than tokens.css.
// Allowed: 0, 1px and 2px (hairlines and focus rings), 1em (icon size), %, fr, ch, vw, dvh,
// unitless numbers, and lengths inside @media conditions.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });

const RULES = [
  [/#[0-9a-f]{3,8}\b/gi, "raw color"],
  [/\b(?:rgba?|hsla?|oklch|cubic-bezier)\(/g, "raw color or easing"],
  [
    /:\s*[^;]*\b(?:white|black|red|blue|green|gray|grey|silver|orange|yellow|purple|pink|color-mix)\b/g,
    "named color",
  ],
  [
    /\b(?:font-weight|line-height|z-index)\s*:\s*\d/g,
    "raw weight, leading or layer",
  ],
  [
    /(?<![\w-])(?:ease|ease-in|ease-out|ease-in-out|linear)(?![\w-])/g,
    "keyword easing",
  ],
  [
    /(?<![\w-])(?!0(?:px|em|rem|s)\b)(?!1px\b)(?!2px\b)(?!1em\b)\d*\.?\d+(?:px|rem|em|ms|s|deg|ch|vw|vh|dvh)\b/g,
    "raw size or time",
  ],
];

const errors = [];
for (const file of files("src")) {
  let css;
  if (file.endsWith(".astro")) {
    css = [
      ...readFileSync(file, "utf8").matchAll(
        /<style[^>]*>([\s\S]*?)<\/style>/g,
      ),
    ]
      .map((m) => m[1])
      .join("\n");
  } else if (file.endsWith(".css") && !file.endsWith("tokens.css")) {
    css = readFileSync(file, "utf8");
  } else continue;
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@media[^{]*/g, "")
    .replace(/@font-face\s*\{[^}]*\}/g, "")
    .replace(/unicode-range:[^;]*;/g, "");
  css.split("\n").forEach((line) => {
    for (const [re, what] of RULES) {
      for (const m of line.matchAll(re))
        errors.push(`${file}: ${what} "${m[0]}" in: ${line.trim()}`);
    }
  });
}

if (errors.length) {
  console.error(
    `check-tokens: ${errors.length} value(s) not from tokens\n` +
      errors.join("\n"),
  );
  process.exit(1);
}
console.log("check-tokens: all styles read tokens");
