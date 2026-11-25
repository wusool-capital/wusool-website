# Wusool Capital website

The marketing site for [Wusool Capital](https://www.wusoolcapital.com). It replaces the old Webflow site.

- **Astro** builds a static site.
- **Sanity** is the only CMS. Pages read published content at build time.
- **Cloudflare Workers** serves the build as static assets.

## Getting started

You need Node 24 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

The dev server runs at `http://localhost:4321`.

To run Sanity Studio locally (project `qjvm6ww8`, dataset `production`):

```sh
cd studio
npm ci
npm run dev
```

## Commands

| Command            | What it does                                                    |
| ------------------ | --------------------------------------------------------------- |
| `npm run dev`      | Local dev server                                                |
| `npm run build`    | Build to `dist/`, index search with Pagefind, write the sitemap |
| `npm run preview`  | Serve `dist/` with `wrangler dev` on port 8787, with `_headers` |
| `npm run gates`    | Run every quality gate, the same checks CI runs                 |
| `npm run lint`     | ESLint and Prettier                                             |
| `npm run check`    | Astro type check                                                |
| `npm run test:e2e` | Playwright smoke and consent tests, desktop and mobile          |
| `npm run lhci`     | Lighthouse CI on every page template                            |
| `npm run format`   | Format everything with Prettier                                 |

## Project layout

```
src/
  pages/        Routes, one file per page or template
  components/   One Astro component per section type
  layouts/      Page shells
  styles/       tokens.css holds every color, size, radius and timing
  lib/          Sanity client and shared helpers
  data/         Site-wide settings, such as company details
studio/         Sanity Studio, schemas and the Webflow migration
scripts/        Build helpers and gate checks
tests/          Playwright tests
public/         Static files, including _headers
```

## Quality gates

Every pull request must pass these checks:

- **Lint and types:** ESLint, Prettier and `astro check`.
- **Design tokens:** `check:tokens` blocks raw colors, sizes and timings outside `tokens.css`.
- **Built pages:** `check:dist` checks titles, descriptions, canonicals, headings, alt text, internal links, JSON-LD and page weight.
- **Browser tests:** Playwright runs the smoke and consent tests.
- **Lighthouse:** mobile Performance 95 or higher, and 100 for Accessibility, Best Practices and SEO.
- **Security:** npm audit for the site and the Studio, and Gitleaks for secrets.
- **Studio:** `tsc` and Sanity schema validation.

## CI and deploys

GitHub Actions runs the gates on every pull request and on every push to `main`. The site is built once, then the checks run in parallel on that build. Lighthouse is split across four runners.

- **Pull requests:** once every gate passes, CI comments a preview URL on the PR.
- **Merges to `main`:** they deploy the `wusool-website` Worker. The Worker is noindex until launch.

- **Sanity publishes:** a Sanity webhook starts CI on `main`. If that commit already passed every gate, the run only builds, runs `check:dist` and deploys (about 2 minutes). Otherwise it runs every gate first.

Deploys need the `CLOUDFLARE_API_TOKEN` repository secret. Never commit secrets.

## Content deploys

Set up once by an admin. The webhook only starts a CI run, so the token it holds cannot change code or read secrets.

1. In GitHub, create a fine-grained personal access token. Repository access: only `wusool-capital/wusool-website`. Permissions: **Actions: read and write**, nothing else. Set an expiry and put the renewal date in the team calendar.
2. In [sanity.io/manage](https://www.sanity.io/manage), project `qjvm6ww8`, API, Webhooks, create a webhook with the settings below.
3. Publish a small edit. The webhook attempts log should show `204`, and a new CI run starts on `main` with the token owner as the actor.

Webhook settings:

| Setting      | Value                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ |
| URL          | `https://api.github.com/repos/wusool-capital/wusool-website/actions/workflows/ci.yml/dispatches` |
| Dataset      | `production`                                                                                     |
| Trigger on   | Create, Update, Delete                                                                           |
| Filter       | `!(_type in ["sanity.imageAsset", "sanity.fileAsset"])`                                          |
| Projection   | `{"ref": "main"}`                                                                                |
| HTTP method  | POST                                                                                             |
| HTTP headers | `Authorization: Bearer <token>` and `Accept: application/vnd.github+json`                        |
| Drafts       | Off                                                                                              |
| Versions     | Off                                                                                              |

If the token expires, the attempts log shows `401` and publishes stop deploying. A manual deploy is `gh workflow run ci.yml --ref main`.

## Docs

- `PRD.md`: the full product spec. Read it before building a feature.
- `DESIGN.md`: brand tokens and writing rules.
- `index.html`: the approved design. It is the visual reference for every page.
- `CLAUDE.md`: engineering rules, the feature workflow and the gate details.
