# PRD: Wusool Capital website rebuild (Webflow to Astro + Sanity + Cloudflare)

Owner: Jules Chasles
Status: Draft for review
Date: 30 Oct 2026

## 1. Summary

Move wusoolcapital.com off Webflow to a coded Astro site hosted on Cloudflare, with Sanity as the only CMS. Sanity already powers the reports and the padel insight (`sanity-managed` items synced into Webflow), so this removes the second CMS, gives full control of the HTML for SEO and GEO, and makes lead magnets plain code instead of embeds.

The lead-capture app at `tools.wusoolcapital.com` stays as it is. The new site keeps loading it the same way.

## 2. Goals

1. Full control of markup, structured data, crawl rules and performance for SEO and GEO.
2. One CMS (Sanity) for every piece of content, editable by the team without a developer.
3. Zero loss of rankings, URLs, meta data, analytics or lead flow at cutover.
4. Faster, cheaper changes: site code lives in a Git repo that Claude and developers edit directly.
5. A clean path for richer lead magnets and animated content.

## 3. Non-goals

- No logged-in areas, dashboards, community or social features on the main site.
- No rewrite of the tools app (`tools.wusoolcapital.com`) in this project.
- No copy rewrite. Copy is migrated as is, except the fixes decided in section 13.
- No Arabic version at launch (the architecture must not block it).

## 4. Current state (audited 30 Oct 2026 via the Webflow API)

| Area | Today |
| --- | --- |
| Static pages | 15 live: Home, Sell, Buyers, Team, Transactions, Insights, Reports, Careers, Valuation Tool, Deal Readiness Tool, Benchmark, Privacy, Terms, 404, 401 |
| CMS collections | Insights (68 items), Industries (10), Reports (5), Team (5), Careers, Transactions (template not published), plus 2 test collections |
| Sanity | Already in use (project `itidwo8t`, dataset `production`) for reports; insight bodies reference Sanity-hosted HTML bundles |
| Lead capture | No Webflow forms. All forms run from `tools.wusoolcapital.com/embed.js`: modals `get-started` and `buyers` (triggered by `data-form` attributes) on every page, plus inline tools `valuation`, `benchmark`, deal readiness, `report` (report pages) and `insight` (Sanity-managed insights) |
| Reports | `/reports` lists reports; each `/reports/{slug}` page is rendered entirely by `embed.js` (`data-tool="report"`) in the browser, so its HTML has no H1, body text, canonical or JSON-LD. The full report sits behind a form in the tools app. Each report has a companion public insight (for example `/insights/gcc-padel-report-2026` for `/reports/padel-in-the-gulf`) that carries the indexable text and links to the report with many "Download the report" CTAs. `pin-to-banner` on a report drives the home announcement bar |
| Sanity insights | Body is a Sanity-hosted HTML bundle (`<figure data-bundle="https://cdn.sanity.io/files/...html">`) rendered by `embed.js` (`data-tool="insight"`) for interactive exhibits, with a plain-text copy of the same content in the Webflow rich text for crawlers |
| Live sitemap | 75 URLs: home, 11 top-level pages, 50 insights, 10 industries, 2 reports, 1 career. `/transactions` is in the nav but not in the sitemap. Served with the wrong content type (`application/rss+xml`) |
| robots.txt / llms.txt | robots allows all and names GPTBot, ClaudeBot, PerplexityBot, Google-Extended; the sitemap line is duplicated. `llms.txt` exists (611 chars) but says "success-fee only" and "first offer within 60 days" |
| Fonts | Inter (Google WebFont loader) site-wide; the cookie banner uses DM Sans |
| Analytics | GA4 with Consent Mode, Microsoft Clarity, PostHog (`WusoolAnalytics`), Search Console meta verification |
| Consent | Custom banner (Decline / Cookies only / Accept all), cookie `wusool_analytics_consent` on `.wusoolcapital.com`, broadcast to tool iframes via `postMessage` |
| Custom scripts | Insights share + TOC, FAQ accordion, FAQ schema on Sell page, Finsweet CMS Filter |
| SEO fields | Per-item seo title, description, og title/image, `schema-json-ld`, `target-keyword`, `faq-content`, `key-takeaways` |

## 5. Target architecture

```
Sanity (content, Studio, webhooks)
   │  GROQ at build time (read token, server only)
   ▼
Astro (static output, React islands only where needed)
   │  git push / Sanity publish webhook → build
   ▼
Cloudflare Workers static assets (CDN, _headers, _redirects, preview URLs per branch)
   │
   ├── wusoolcapital.com            main site (this project)
   └── tools.wusoolcapital.com      existing lead-capture app (unchanged)
```

- **Framework: Astro.** Static HTML by default, near-zero JavaScript, which is the best fit for crawlers and AI agents. Interactive parts (calculators, animated exhibits) are isolated islands. Portability: content lives in Sanity and design values in `tokens.css`, so a later move to Next.js reuses both and only the components and routing are rewritten.
- **Hosting: Cloudflare.** Static assets on the CDN, security headers and redirects as files in the repo, a preview deployment per branch.
- **CMS: Sanity.** The existing project, extended with the schemas in section 6. Studio deployed at a Sanity-hosted URL. Publishing in Sanity triggers a rebuild (about 1 to 2 minutes to live).
- **Preview:** a separate preview deployment, protected by Cloudflare Access, renders Sanity drafts so editors see changes before publishing. It is the only build that holds a draft-reading token, kept server side. The public site stays fully static with no runtime token.
- **Repo:** GitHub, protected `main`, pull request previews, Renovate for dependency updates.

### 5.1 Design source

- `index.html` (the approved landing page redesign, Stitch-inspired) is the visual reference for every page and template: layout language, components, radii, spacing, motion and tone. New templates reuse its components instead of inventing new ones.
- `DESIGN.md` is the source for brand tokens: navy `#000523` as the single accent, sky `#C6E1EE` and sky-soft `#EAF3F8`, page grey `#F5F5F5`, ink, muted `#5E6670`, line colors, sentence case, no em dashes, status never shown by color alone, visible focus states. Its dashboard-only rules (13px body, desktop only, light theme only, tables everywhere) do not apply to the public site; `index.html` wins where they differ.
- **Inter only**, for every element including the consent banner (DM Sans is retired). For readability: article body 18px with 1.65 line height and a 68-character measure, interface text 16px, headings use Inter's display optical size with tighter tracking. Self-hosted with `@fontsource-variable/inter`, subset to Latin, `font-display: swap`, preloaded. No Google Fonts request.
- Design skill: on features 2, 4, 7, 8 and any new template, the builder also applies `/taste-skill:design-taste-frontend`. Where it conflicts with this PRD, the PRD wins: Astro with CSS tokens (no Next.js or Tailwind), Inter only, light theme only (no dark mode), `index.html` components, branded covers and live UI mocks instead of stock photography.
- Icons: one library (Phosphor, as in `index.html`), imported per icon at build so only used glyphs ship. No icon font.

### 5.2 Keeping design changes cheap

- All colors, type sizes, spacing, radii, shadows and motion timings live as CSS custom properties in one file (`src/styles/tokens.css`). A brand change is an edit to that file only.
- One Astro component per section type (hero, stats, comparison, sector grid, process, deals table, posts, FAQ, CTA band, footer), each with its own scoped styles under about 150 lines.
- No inline styles and no one-off colors or sizes in components; components read tokens only.
- A `/styleguide` page (noindex, excluded from the sitemap) renders every component in one place, so a design change is checked in one screenshot.
- Design feedback is applied with small edits to the token file or one component, never by regenerating a page.

## 6. Content model (Sanity)

| Type | Notes |
| --- | --- |
| `insight` | Every Webflow field (Appendix A) plus body as Portable Text with custom blocks (exhibit, stat, quote, CTA, report download, FAQ). Key takeaways and FAQ become structured lists |
| `report` | Every Webflow field (Appendix A) plus a reference to its companion insight and the tools app gate id |
| `industry` | Every Webflow field (Appendix A); FAQ as structured Q&A, not HTML |
| `teamMember` | Every Webflow field (Appendix A) plus a display order; feeds the team page list and Person schema. Members are added, removed and reordered in Sanity |
| `career`, `transaction` | Every Webflow field (Appendix A). Transactions stay in Sanity but are hidden on the site until Jules decides otherwise |
| `page` | Landing pages built from section blocks (hero, stats, comparison, sector grid, process, deals table, FAQ, CTA band). Layout of each block is code; content and order are editable |
| `siteSettings` | Nav, footer, announcement bar, default SEO, organization data |
| `seo` (object) | Title, description, canonical override, OG title, OG image, noindex |

Rules:
- Structured fields instead of HTML blobs (FAQ as Q&A pairs, takeaways as a list), so JSON-LD is generated, not pasted.
- Drop `schema-json-ld` free-text fields after migration; schema comes from templates.
- Test collections are not migrated.
- Redirects live in a `_redirects` file in the repo, not in Sanity. They change rarely and belong with the code review.
- Fields that only exist for the Webflow sync (`sanity-managed`) or for pasted schema (`schema-json-ld`) are not recreated.

### 6.1 Reports and Sanity insights

- Keep both URLs: `/reports/{slug}` (gated report) and the companion `/insights/{slug}` (public article). Canonicals stay separate because the pages differ.
- `/reports/{slug}` becomes a real HTML landing page rendered at build: H1, summary, what is inside, cover image, author, dates, Article JSON-LD and canonical. Only the download form comes from the tools app (`embed.js`, `data-tool="report"`). Today this page has no indexable content.
- Sanity insights render their body natively from Portable Text. Interactive exhibits become Astro islands, so the text is in the HTML once and the duplicate plain-text copy is dropped. The `embed.js` `insight` tool stays only for the inline download form.
- Every "Download the report" CTA in an insight points to its report page (no empty `href`).
- The report with `pinToBanner` drives the home announcement bar, as today.

### 6.2 Insights hub, article pages and images

Most readers land directly on an article from Google or an AI answer, so the article page carries the conversion work. The hub serves returning readers and crawlers.

Article page (`/insights/{slug}`):
- Breadcrumbs, H1, key takeaways at the top, table of contents for long pieces, visible published and updated dates, author box linking to the author's card on the team page (`/team#{slug}`).
- One CTA block at the end from `cta-text` and `cta-url`, plus a contextual CTA mid-article; no sticky bar covering content.
- "Related insights": three cards from the same silo, so search visitors keep reading.
- Share links from the canonical URL.

Hub (`/insights`):
- Bento layout in the `index.html` style: the featured insight as a large card, then a mixed grid. Reports appear as wide cards.
- Search with Pagefind: a static index built at deploy, loaded only when the search box is focused (no server, under 10 KB until used).
- Filter chips for topic (`primary-silo`) and format (`content-type`). Filtering happens in the browser and does not create new indexable URLs; the full list stays in the HTML for crawlers.
- One indexable hub page per topic at `/insights/topic/{silo}` with a short intro, so each silo can rank for its head term. Seven pages, built from the existing silo list.

Images:
- Every insight and report needs a card image (1200 x 630, also used as the OG image).
- Default: a branded cover generated at build from the title, topic and one key figure, in the `index.html` style (navy panel, sky accents, Inter). Editors can replace it with an uploaded image in Sanity.
- Images served as AVIF and WebP at the needed sizes, lazy-loaded below the fold, with alt text from Sanity.

## 7. Animations and advanced lead magnets

- **Animated content** (report exhibits, charts, scroll reveals): CSS and scroll-driven animations first; React islands with Motion for interactive exhibits. Islands load only on the pages that use them and respect reduced motion.
- **Light lead magnets** (calculators, gated downloads, checklists): built as Astro islands on the main domain so the content stays indexable and fast.
- **Heavy lead magnets** (multi-step apps, logins, saved results): live in the tools app or a separate Next.js app on a subdomain. The main site opens them two ways:
  1. Modal via `embed.js` (current pattern) for short forms.
  2. Full-page link to the app for long flows.
- Iframes are fine for the form UI. Anything we want ranked or cited by AI (explanations, benchmarks, methodology) is rendered as HTML on the main site, never only inside an iframe.

## 8. SEO and GEO requirements

Parity (launch blockers):
- Every live URL keeps its exact path, or gets a 301 in `_redirects`. A crawl of the old site is diffed against the new one before DNS switch.
- Titles, descriptions, OG data, canonicals and H1s match the current values unless a fix is approved.
- XML sitemap (with `lastmod` from Sanity), robots.txt, Search Console verification, 404 page.

- Every structured data type in Appendix B is kept on the same page.

Improvements:
- JSON-LD from templates per Appendix B: one `@graph` per page, stable `@id`s on `https://www.wusoolcapital.com` (today the schema uses the non-www host), no duplicate blocks (Careers and JobPosting are emitted twice today).
- Self-referencing canonical on every page (today only CMS templates have one).
- Sitemap served as `application/xml`, one `Sitemap:` line in robots.txt, unlisted items (`hide-from-listings`) kept in the sitemap but out of listings.
- One team page with a Person node per member (credentials and sameAs links for E-E-A-T). No individual author pages (Jules's decision, feature 9).
- `/transactions` redirects to `/sell` while transactions are hidden.
- `llms.txt` and `llms-full.txt` generated from Sanity at build.
- robots.txt policy that explicitly allows AI search crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended) unless we decide otherwise.
- Visible "last updated" dates, key takeaways near the top, question-style H2s on guides (content team, after launch).
- Performance budget: see section 14.4.
- Every insight and report has a card image that doubles as its OG image (section 6.2).

## 9. Lead capture, analytics and consent

- Keep the current setup: `embed.js` from `tools.wusoolcapital.com` with the same `data-form` triggers and modal tools (`get-started`, `buyers`), and the inline tools `valuation`, `benchmark`, deal readiness, `report` and `insight` on the same pages as today.
- Load `embed.js` once per page with `defer`, not once per tool, if the tools app supports it; otherwise keep one tag per tool. Confirm with the tools app before feature 2.
- Port the consent banner as a component with identical behavior: same cookie name and domain, same three choices, same `postMessage` to iframes and `wusool-consent` event.
- Keep GA4 Consent Mode defaults, Clarity and PostHog with the same IDs and the same consent gating.
- Add a lead-source attribute on every CTA (page, section, report) so the tools app can attribute leads by page.

## 10. Security

- Static site: no database or server code on the main domain, so the attack surface is small.
- Sanity read token used only at build time, stored in Cloudflare secrets, never shipped to the browser. Studio access through Sanity roles with SSO or 2FA.
- Security headers in `_headers`: CSP allowing only the tools subdomain, analytics hosts and Google Fonts; HSTS; X-Content-Type-Options; Referrer-Policy; Permissions-Policy; frame-ancestors.
- GitHub: branch protection, required review, secret scanning, Renovate updates merged weekly.
- If a form endpoint is ever added to the main domain (deferred), it uses Cloudflare Turnstile and rate limiting.

## 11. Maintenance and speed of change

| Change | Who | How long |
| --- | --- | --- |
| New article, report, team member, FAQ | Team in Sanity | Minutes, live 1 to 2 min after publish |
| Reorder or edit sections on a landing page | Team in Sanity | Minutes |
| New section design or new page template | Developer or Claude in the repo | Hours, previewed on a branch URL |
| Dependency and security updates | Renovate PRs, reviewed weekly | About 30 min per month |

Ownership: one named technical owner for the repo and Cloudflare account, with a second person holding admin access.

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| URL or meta drift at cutover | Ranking loss | Crawl diff old vs new, full 301 map, Search Console monitoring for 4 weeks |
| No visual drag-and-drop editor | Slower layout experiments | Section-based `page` type in Sanity; Claude-assisted code changes on preview branches |
| Single developer dependency | Bus factor | Documented repo, README runbook, second admin, standard stack (Astro, Sanity, Cloudflare) |
| Rich-text migration from Webflow HTML | Broken formatting in 68 insights | Scripted HTML to Portable Text conversion, manual review of the 10 highest-traffic articles |
| Consent or analytics regression | Lost attribution, compliance issue | Port the banner code as is; test each consent choice against GA4, Clarity and PostHog before launch |
| Build fails after a Sanity publish | Stale site | Build notifications to Slack; last good deploy stays live |
| Cost creep | Low | Cloudflare and Sanity free or entry tiers cover current traffic; Webflow plan cancelled after 30 days |

## 13. Content and SEO fixes (decided, part of the build)

These were found in the audit. Each one is fixed in the new site and checked in the feature listed.

| # | Issue today | Fix in the new site | Feature |
| --- | --- | --- | --- |
| 1 | Timing claims differ (6 weeks in hero and FAQ, 60 to 90 days in Home and Sell meta and OG text) | "6 weeks to first offer" everywhere: meta titles, descriptions, OG and Twitter text, FAQ, `llms.txt` | 4, 5, 12 |
| 2 | Terms page meta contains `[ENTITY NAME TBD]` | Use the registered FZCO entity name, as in the footer | 11 |
| 3 | Test collections live at `/insights-test` and `/reports-test` | Not migrated; both paths return 404 and are absent from the sitemap | 3, 12 |
| 4 | Footer legal line undecided | Keep the registered FZCO entity name with address, license (54561, DIEZA) and email | 2 |
| 5 | `/reports` shows "This is a test excerpt." and lists the padel report twice | Real excerpt for the buyouts playbook (write it in Sanity before feature 8); listings query unique published reports only | 3, 8 |
| 6 | LinkedIn share links use `https://YOUR_PAGE_URL` | Share links built from the page canonical URL | 7 |
| 7 | The padel insight uses a different nav with `#` links | One global nav and footer component on every page; CI fails on any `href="#"` that is not a modal trigger | 2, 7 |
| 8 | Deal size differs ($1M to $20M on Home, $1M to $27M on industry pages) | "$1M to $25M" everywhere: Home FAQ, industry pages, `llms.txt` | 3, 4, 6 |
| 9 | `llms.txt` says "success-fee only" and "within 60 days" | Generated from Sanity `siteSettings` with "mainly success fee, with a retainer depending on documentation" and "6 weeks to first offer" | 12 |
| 10 | `/team/{slug}` author pages return 404 | One team page with Person schema per member; insight bylines link to the member's card on it (`/team#{slug}`) | 9 |
| 11 | Sitemap served as `application/rss+xml`; robots.txt lists the sitemap twice | Sitemap generated at build as `application/xml` with every indexable page; one `Sitemap:` line | 12 |

The approved values (6 weeks, $1M to $25M, fee wording, entity line) live once in Sanity `siteSettings` and templates read them from there, so they cannot drift again.

## 14. Build workflow

The site is built one feature at a time. Each feature goes through the same loop and nothing moves on until Jules approves it.

### 14.1 Engineering principles (Karpathy guidelines)

These apply to every feature and go into the repo's `CLAUDE.md`.

1. **Think before coding.** State assumptions in writing. When a request has more than one reading, list them and ask instead of picking silently. When something is unclear, stop and ask. If a simpler approach than the one requested exists, say so before building.
2. **Simplicity first.** Write the minimum code that meets the feature's "done when" check. No features, options or abstractions that were not asked for. No error handling for cases that cannot happen. Anything in section 14.6 (Deferred) is not built unless Jules asks for it. If a solution could be half the size, rewrite it.
3. **Surgical changes.** A feature branch touches only the files that feature needs. Do not reformat, rename or refactor code outside the feature. Unrelated problems found along the way are listed in the report, not fixed. Remove only the code your own change made unused.
4. **Goal-driven execution.** Every feature starts from a verifiable "done when" check (section 14.2). Write the check (test, crawl, Lighthouse run or count) first, make it pass, and report the result. A feature is not done because the code was written; it is done when the check passes.

### 14.2 Feature order and "done when" checks

| # | Feature | Done when |
| --- | --- | --- |
| 1 | Foundation: repo, Astro, Cloudflare staging, CI gates, `CLAUDE.md` | A hello page deploys to staging from `main`; CI runs all section 14.4 gates and fails on a deliberate violation |
| 2 | Design system and layout: `tokens.css` from `DESIGN.md`, components from `index.html` (section 5.1 and 5.2), self-hosted Inter, `/styleguide`, nav, footer, consent banner, analytics | `/styleguide` shows every `index.html` component built from tokens only; layout passes Lighthouse thresholds; each consent choice sets the same cookie and fires the same GA4, Clarity and PostHog behavior as the live site (Playwright test) |
| 3 | Sanity schemas and Webflow to Sanity migration script | Item counts in Sanity match Webflow per collection; script is re-runnable without duplicates; 10 highest-traffic insights reviewed and approved |
| 4 | Home | Matches the approved `index.html` design; meta and H1 parity with live; gates pass |
| 5 | Sell and Buyers | Meta parity; FAQPage and Service JSON-LD valid; CTAs open the right `embed.js` modal |
| 6 | Industries (template plus 10 pages) | All 10 URLs return 200 with parity meta; FAQPage JSON-LD valid |
| 7 | Insights hub and article pages, including exhibit blocks (sections 6.1 and 6.2) | Every published insight URL returns 200; hub search and filters work with JavaScript and the full list is still in the HTML without it; every card has an image; Sanity insights render their exhibits natively with no duplicate text; Article JSON-LD with author valid; padel report renders its exhibits |
| 8 | Reports (section 6.1) | Every published report URL returns 200 with H1, summary, canonical and Report JSON-LD in the raw HTML; the download form opens from `embed.js` and a test lead arrives |
| 9 | Team and Careers | URLs return 200; the team page lists every member from Sanity with valid Person JSON-LD; insight bylines link to the member's card; transactions are hidden and `/transactions` redirects to `/sell` |
| 10 | Valuation, Deal Readiness and Benchmark pages | Each tool loads and a test lead arrives with its page source |
| 11 | Legal pages and 404 | Content matches live; 404 returns status 404 |
| 12 | Global SEO layer: sitemap, robots, `llms.txt`, redirects | Crawl diff old vs new shows zero missing URLs; Ahrefs staging crawl meets section 14.4 |
| 13 | Cutover (section 15) | Section 16 acceptance criteria met on production |

### 14.3 Loop per feature

1. **Clarify.** Claude reads the PRD, `CLAUDE.md` and the relevant code, writes down its assumptions, then asks every open question at once with AskUserQuestion. No code until the answers are in. Claude confirms the "done when" check and a short plan.
2. **Build** on a feature branch, smallest change that meets the check, touching only the feature's files.
3. **Automated gates** (section 14.4) run locally and in CI. Failures are fixed before going further.
4. **Independent review.** A separate review agent, with fresh context and no access to the builder's reasoning, reads the diff against the PRD and checks for bugs, security issues, accessibility, performance regressions, SEO parity, and breaches of section 14.1 (unrequested features, changes outside the feature, overbuilt code). The builder fixes every confirmed finding, then the gates run again.
5. **Stop and report.** Claude posts the preview URL, the "done when" result, gate results, review findings and what was fixed, assumptions made, and unrelated issues noticed but not touched. Then it waits.
6. **Feedback.** Jules reviews on the preview URL. Claude implements the feedback, reruns steps 3 and 4, and reports again.
7. **Approve and merge.** Only an explicit approval merges the branch. Then the next feature starts at step 1.

### 14.4 Quality gates (must pass on every feature)

Performance:
- PageSpeed Insights (Lighthouse) mobile: Performance 95+, Accessibility 100, Best Practices 100, SEO 100, on every template touched.
- Core Web Vitals in lab on every pull request: LCP under 2.0s, TBT under 150ms, CLS under 0.05. Field data (LCP, INP under 150ms, CLS) checked in Search Console 28 days after launch.
- Budgets: under 50 KB of JavaScript and under 100 KB of CSS per content page; hero image under 150 KB in AVIF or WebP with explicit width and height; fonts self-hosted and subset with `font-display: swap`; no third-party script before user consent.
- Lighthouse CI runs on each pull request and fails it below the thresholds.

SEO (Ahrefs Site Audit thresholds):
- Health score 95+ on the staging crawl, zero errors.
- Zero broken links, redirect chains, orphan pages, duplicate or missing titles and descriptions, missing H1s, missing alt text, or non-canonical pages in the sitemap.
- Titles 30 to 60 characters, descriptions 70 to 160 characters, one H1 per page.
- JSON-LD passes Google's Rich Results Test and the Schema.org validator.

Code and secrets:
- TypeScript strict, ESLint and Prettier clean, Astro check clean.
- No secret in the repo or the client bundle: gitleaks in CI and GitHub secret scanning on; Sanity tokens and API keys only in Cloudflare secrets, read at build time.
- `npm audit` with no high or critical issues; Renovate keeps dependencies current.
- Security headers verified on the preview URL (securityheaders.com grade A or better); CSP blocks anything not on the allow list.
- Links, forms and CTAs tested in Playwright on desktop and mobile widths.

### 14.5 Review agent brief

The review agent gets: the PRD, `CLAUDE.md`, the feature's "done when" check and the diff. It does not get the builder's plan or reasoning. It returns findings ranked by severity, each with file, line and a concrete failure scenario, and marks each as confirmed or plausible. It does not edit code.

### 14.6 Deferred (not built unless Jules asks)

- Same-domain routing of the tools app under `/tools/` via a Cloudflare Worker.
- Live visual editing (Sanity Presentation tool) beyond the draft preview deployment.
- Arabic version and `hreflang`.
- On-site report gate (reports stay gated through the tools app).
- Any form endpoint on the main domain.

## 15. Cutover plan

Runs after features 1 to 12 are approved.

1. Final Ahrefs crawl and crawl diff on staging. Check: zero missing URLs, zero errors.
2. Lower DNS TTL to 300 seconds 48 hours before.
3. Switch DNS to Cloudflare. Keep the Webflow site available (domain detached) for 30 days as rollback.
4. Smoke test production: every template, every CTA, each consent choice, sitemap and robots. Check: section 16 criteria.
5. Submit the sitemap in Search Console; check coverage and the 404 report daily for 2 weeks.
6. Cancel the Webflow plan after 30 days without a rollback.

## 16. Acceptance criteria

- 100% of current indexable URLs return 200 or a 301 to the right page.
- Every page passes the section 14.4 gates, including PageSpeed Insights mobile 95+ and an Ahrefs health score of 95+ with zero errors.
- JSON-LD validates on every template.
- Every CTA opens the right tool and the lead arrives in the existing pipeline with page source.
- An editor can publish a new insight in Sanity without help and see it live within 3 minutes.

## 17. Open questions

1. Who is the technical owner after launch?
2. Should AI training crawlers (as opposed to AI search crawlers) be allowed?
3. Arabic version: when, and should URLs be `/ar/...` from day one?

## Appendix A. Webflow fields to carry into Sanity

Field names are the Webflow slugs; Sanity uses camelCase equivalents.

| Collection | Fields |
| --- | --- |
| Insights | name, slug, content-type (Article, Playbook, Case Study, Press, Report), primary-silo (Sell Your Business, Business Valuation, Exit Strategy, Buy a Business, GCC M&A Market, General, ETA GCC), body-content, excerpt, featured-image, hero-image, h1-tag, seo-title, seo-description, og-title, og-image, target-keyword, published-date, last-updated, reading-time, word-count, featured, gated, hide-from-listings, press-outlet, press-url, author (ref Team), cta-text, cta-url, faq-content, key-takeaways |
| Reports | name, slug, excerpt, featured-image, seo-title, seo-description, og-title, og-image, published-date, last-updated, reading-time, featured, cta-text, cta-url, primary-silo, pin-to-banner |
| Industries | name, slug, hero-headline, hero-subtext, sector-overview, ebitda-multiple-range, what-buyers-look-for, common-deal-killers, deal-timeline, buyer-types, deal-size-range, cluster-article-url, cluster-article-label, faq, featured-image, seo-meta-title, seo-meta-description, sort-order |
| Team | name, slug, role-title, bio, short-bio, headshot, credentials, email, linkedin-url, x-twitter-url, crunchbase-url, wikidata-url, expertise-tags, years-of-experience, based-in, languages, seo-title, seo-description |
| Careers | name, slug, department, location, employment-type (Full-time, Part-time, Internship, Contract), date-posted, valid-through, status (Open, Closed), linkedin-apply-url, short-description, responsibilities, requirements, meta-title, meta-description |
| Transactions | name, slug, category (M&A, Valuation, Capital Advisory), status (Closed, Active, Under Offer, Completed), sector, country, city-emirate, deal-type, revenue-range, deal-size-range, year, date, time-to-close, one-line-description, deal-summary-extended, counterparties, client-logo, industry-keywords, sort-order |

Not carried over: `sanity-managed`, every `schema-json-ld` field, the two test collections.

## Appendix B. Structured data per page

Today = what the live HTML emits (checked 30 Oct 2026). Target = what the new templates emit, all in one `@graph` with `@id`s on `https://www.wusoolcapital.com`. Organization and WebSite are referenced by `@id` on every page.

| Page | Today | Target |
| --- | --- | --- |
| Home | FinancialService, FAQPage (6), WebSite | Organization (FinancialService), WebSite, WebPage, FAQPage |
| Sell | Service, FAQPage (6) | Service, FAQPage, BreadcrumbList |
| Buyers | Service, FAQPage (4) | Service, FAQPage, BreadcrumbList |
| Industry pages | WebPage, FAQPage (4) | WebPage, Service (areaServed, sector), FAQPage, BreadcrumbList |
| Insights list | Blog | Blog with BlogPosting items, BreadcrumbList |
| Insight | Article (emitted twice) | Article once, author Person by `@id`, publisher, dates, image, FAQPage if FAQ present, BreadcrumbList |
| Reports list | none | CollectionPage, BreadcrumbList |
| Report | none (client-rendered) | Report (schema.org subtype of Article), author, dates, BreadcrumbList |
| Team | Person (3), AboutPage | AboutPage, Person per member with sameAs, knowsAbout, knowsLanguage, worksFor |
| Careers | Organization (twice) | CollectionPage, BreadcrumbList |
| Career role | JobPosting (twice) | JobPosting once, hidden after `valid-through` |
| Transactions | none | Hidden for now (`/transactions` redirects to `/sell`) |
| Valuation tool | WebApplication | WebApplication, FAQPage if present, BreadcrumbList |
| Benchmark | Organization, WebSite, WebPage, BreadcrumbList, SoftwareApplication, FAQPage (5) | Same, on the www host |
| Deal readiness | not checked | WebApplication, BreadcrumbList |
