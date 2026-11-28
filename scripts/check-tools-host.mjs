// The tools post leads to the host in PUBLIC_TOOLS_API. A build without it
// compiles every tool to a function that throws, so no lead is ever sent.
// Run after a build, before any deploy.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join("dist", "_astro");
const chunks = readdirSync(dir).filter((f) => /^lead\..*\.js$/.test(f));
const bad = chunks.filter(
  (f) => !/https:\/\/[a-z0-9.-]+/.test(readFileSync(join(dir, f), "utf8")),
);
if (!chunks.length || bad.length) {
  console.error(
    "check-tools-host: the build has no tools API host. Build with PUBLIC_TOOLS_API set.",
  );
  process.exit(1);
}
console.log("check-tools-host: ok");
