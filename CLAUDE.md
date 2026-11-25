# Wusool Capital website

The company is Wusool Capital. Never call it Dopamine.

Astro static site on Cloudflare Workers static assets, Sanity as the only CMS. `PRD.md` is the full spec. Read it before any feature.

## Source files

- `PRD.md`: spec. Section 13 lists content fixes that must ship. Appendix A lists every content field, Appendix B every structured data type.
- `index.html`: approved design, the visual reference for every page and template.
- `DESIGN.md`: brand tokens and writing rules. Where it conflicts with `index.html`, `index.html` wins.

## Engineering principles (PRD 14.1)

1. **Think before coding.** State assumptions in writing. When a request has more than one reading, list them and ask instead of picking silently. When something is unclear, stop and ask. If a simpler approach than the one requested exists, say so before building.
2. **Simplicity first.** Write the minimum code that meets the feature's "done when" check. No features, options or abstractions that were not asked for. No error handling for cases that cannot happen. Anything in PRD 14.6 (Deferred) is not built unless Jules asks for it. If a solution could be half the size, rewrite it.
3. **Surgical changes.** A feature branch touches only the files that feature needs. Do not reformat, rename or refactor code outside the feature. Unrelated problems found along the way are listed in the report, not fixed. Remove only the code your own change made unused.
4. **Goal-driven execution.** Every feature starts from a verifiable "done when" check (PRD 14.2). Write the check (test, crawl, Lighthouse run or count) first, make it pass, and report the result. A feature is done when the check passes.

## Loop per feature (PRD 14.3)

Features are built one at a time, in the order of PRD 14.2.

1. **Clarify.** Read the PRD, this file and the relevant code. Write down assumptions, then ask every open question at once with AskUserQuestion. No code until the answers are in. Confirm the "done when" check and a short plan.
2. **Build** on a feature branch (`feature/<n>-<name>`), smallest change that meets the check, touching only the feature's files.
3. **Automated gates** (PRD 14.4) run locally (`npm run gates`) and in CI. Fix failures before going further.
4. **Independent review.** Spawn a separate review agent with the PRD 14.5 brief: the PRD, this file, the "done when" check and the diff only, never the builder's plan or reasoning. It returns findings ranked by severity with file, line, failure scenario, and confirmed or plausible. Fix every confirmed finding, then rerun the gates.
5. **Stop and report:** preview URL, "done when" result, gate results, review findings and fixes, assumptions, unrelated issues noticed but not touched. Then wait.
6. **Feedback.** Apply Jules's feedback, rerun steps 3 and 4, report again.
7. **Approve and merge** only on Jules's explicit approval. Then start the next feature at step 1.

## Design rules (PRD 5.1 and 5.2)

- `index.html` is the visual reference for every page and template: layout, components, radii, spacing, motion and tone. New templates reuse its components.
- Brand tokens from `DESIGN.md`: navy `#000523` as the single accent, sky `#C6E1EE`, sky-soft `#EAF3F8`, page grey `#F5F5F5`, ink, muted `#5E6670`, line colors. Sentence case. Status never shown by color alone. Visible focus states. Its dashboard-only rules (13px body, desktop only, tables everywhere) do not apply.
- Inter only, for every element including the consent banner. Self-hosted with `@fontsource-variable/inter`, Latin subset, `font-display: swap`, preloaded. No Google Fonts request. Article body 18px, line height 1.65, 68-character measure. Interface text 16px. Headings use Inter's display optical size with tighter tracking.
- Light theme only. No dark mode.
- Icons: Phosphor only, imported per icon at build. No icon font.
- All colors, type sizes, spacing, radii, shadows and motion timings are CSS custom properties in `src/styles/tokens.css`. A brand change is an edit to that file only.
- One Astro component per section type, scoped styles, under about 150 lines each.
- No inline styles, no one-off colors or sizes. Components read tokens only.
- `/styleguide` (noindex, not in the sitemap) renders every component, so a design change is checked in one screenshot.
- Apply design feedback with small edits to the token file or one component. Never regenerate a page.
- On features 2, 4, 7, 8 and any new page template, also apply `/taste-skill:design-taste-frontend`. Where it conflicts with the PRD, the PRD wins: Astro with CSS tokens (no Next.js or Tailwind), Inter only, light theme only, `index.html` components, branded covers and live UI mocks instead of stock photography. Do not use it on other features. Do not use `/frontend-design`.

## Content rules

- The brand is always Wusool Capital. The registered entity name appears only in the legal line (`company.legalName` in `src/data/site.ts`).

## Safety

- Never put a secret, token or API key in the repo or client code. Use Cloudflare secrets, and ask Jules to add any credential.
- Ask Jules before anything hard to undo: DNS, deleting content, publishing to production, changing the Webflow site or the tools app.

## Writing rules

For copy, comments, commit messages and reports: no em dashes, no "it's not X, it's Y" phrasing, short plain sentences, sentence case, no filler adverbs.

## Commands

- `npm run dev`: local dev server.
- `npm run gates`: every local gate (lint, Astro check, `check:tokens`, `check:studio`, build, `check:dist`, npm audit, Playwright, Lighthouse CI).
- `cd studio && npm run dev`: Sanity Studio locally (project `qjvm6ww8`, dataset `production`).
- `cd studio && npx sanity exec migration/webflow-to-sanity.ts` (add `-- --dry-run` to only count): re-runnable Webflow to Sanity migration. Needs `WEBFLOW_TOKEN` and `SANITY_WRITE_TOKEN` in the git-ignored `.env`. `migration/review.ts -- <slugs>` compares migrated insights with Webflow. A re-run stops if any document was edited in Sanity since the last run; `-- --force` overwrites those edits, so use it only before the team starts editing.
- `cd studio && npx sanity exec migration/seed-home.ts -- <og.jpg>`: creates the Home page document if missing (never overwrites).
- Pages read Sanity at build through `src/lib/sanity.ts` (public dataset, published content only, no token).
- `npm run preview`: serve `dist/` with `wrangler dev` on port 8787, with `_headers` applied.

## Deploys

- Every PR gets a preview URL comment (`pr-<n>`) once the gates pass.
- Merge to `main` deploys the `wusool-website` Worker (`https://wusool-website.jules-aa2.workers.dev`, noindex). At launch, attach `wusoolcapital.com` to this Worker and remove the noindex rule in `public/_headers`, with Jules's approval.
- A Sanity publish starts CI on `main` through a webhook (README, "Content deploys"). When that commit already passed every gate, it only builds, runs `check:dist` and deploys.
- Needs the `CLOUDFLARE_API_TOKEN` repo secret.

## Gates

- `scripts/check-dist.mjs`: titles 30 to 60 chars, descriptions 70 to 160, unique titles and descriptions, one H1, self canonical on `https://www.wusoolcapital.com`, alt text, broken internal links, `href="#"` only on `data-form` modal triggers, one JSON-LD `@graph` per page, JS under 50 KB and CSS under 100 KB per page. Pages with `noindex` skip the SEO checks.
- `scripts/check-tokens.mjs`: no raw colors, sizes, times or easings in component styles or `global.css`. Add a token to `tokens.css` instead.
- `scripts/pending-routes.json`: live-site paths not built yet. Links to them pass the link checks. Remove a path in the feature that builds it. Must be empty by feature 12.
- `lighthouserc.cjs`: mobile Performance 95+, Accessibility, Best Practices and SEO 100, LCP under 2.0s, TBT under 150ms, CLS under 0.05. Add a URL per new template.
- `tests/smoke.spec.ts`: Playwright at desktop and mobile widths. Add each new page.
- `tests/consent.spec.ts`: each consent choice matches the live banner (cookie, consent mode, Clarity, tools bridge, iframe message, event). Clarity loads only after Accept all.
- Manual on the staging URL at each report: Ahrefs Site Audit (health 95+, zero errors), Rich Results Test, securityheaders.com (A or better).
