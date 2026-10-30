# Wusool Capital dashboard design

The look of Wusool Deal Room, written so other Wusool dashboards can match it. Source: `app/styles.css` in this repo and the Wusool Capital Brand Guidelines (colors, Inter, the "Illustrative Exit Summary" table).

In one line: a light grey page, white cards with thin borders, Inter only, navy as the single accent, tables in the brand table style.

## 1. Principles

- Quiet and minimalist (shadcn-like), built with plain CSS. No UI framework needed.
- Navy is the only accent. Use it for primary buttons, selected states and table headers, nothing decorative.
- Light theme only. Dashboards are internal, desktop, and screen-shared with clients.
- Status is never shown by color alone. Always pair color with text, a shape, a check mark or weight.
- Desktop only. Check every screen at 1440px and 1920px. Content max width 1440px, centered.
- Nothing on screen that a client should not see (for example fees).

## 2. Color tokens

| Token | Hex | Use |
| --- | --- | --- |
| `--navy` | `#000523` | Accent: primary buttons, table header row, selected states, titles |
| `--sky` | `#C6E1EE` | Borders of light blue elements, focus ring, text on navy (secondary) |
| `--sky-soft` | `#EAF3F8` | Row hover, current step, banners, light badges |
| `--page` | `#F5F5F5` | Page background and top bar (brand light grey) |
| `--surface` | `#FFFFFF` | Cards, tables, inputs, panels |
| `--stripe` | `#F5F5F5` | Alternate table rows |
| `--ink` | `#1A1A1A` | Body text |
| `--muted` | `#5E6670` | Labels, secondary text, "Not set" (passes contrast on white and on #F5F5F5) |
| `--line` | `#E4E4E7` | Card and input borders, dividers |
| `--line-strong` | `#C9C9CF` | Stronger dividers, dashed empty states, arrows |
| `--alert` | `#8A1C1C` | Overdue, errors (always with text) |

Brand colors not used as UI tokens: off-white `#F7F5F0` (print and slides), grey `#9A9A9A` (fails contrast for text on white).

## 3. Typography

- Inter only, for every element. Self-host it (`@fontsource-variable/inter`) and set it on `html` so every element inherits it, form controls included (`button, input, select, textarea { font: inherit; }`).
- No serif, no second family, no monospace for data.

| Role | Size | Weight | Color |
| --- | --- | --- | --- |
| Page title | 20px, letter-spacing -0.02em, line-height 1.25 | 600 | navy |
| Section title (card heading) | 15px | 600 | navy |
| Panel section heading | 14px | 600 | navy |
| Body | 13px, line-height 1.5 | 400 | ink |
| Tables, chips, badges, form labels, small labels | 12px | 400 (headers 600) | ink or muted |
| Big numbers (funnel counts, KPIs) | 20px, line-height 1.2 | 600 | ink |

- Nothing smaller than 12px. Exceptions: the 10px stage names in the process tracker, and a decorative icon glyph hidden from screen readers.
- Numbers in tables and counters use `font-variant-numeric: tabular-nums` and are right-aligned.
- Sentence case everywhere. No all-caps labels.

## 4. Layout and spacing

- Page: max width 1440px, centered, 40px side gutter, 24px top padding, 16px bottom (no empty band under the last card).
- Cards stack vertically with 12px between them.
- Card padding: 18px 24px (14px 24px for the tracker, 10px 24px for the funnel).
- Corners: 8px on cards, 6px on inputs, buttons, tables and small boxes, 4px on tracker cells, full (999px) on chips and badges.
- Shadow: only a faint one on cards, `0 1px 2px rgb(0 5 35 / 0.04)`. Dropdowns `0 8px 24px rgb(0 5 35 / 0.08)`. The side panel `-12px 0 32px rgb(0 5 35 / 0.1)`.
- Label and value grids: 3 columns, each item a 120px label column plus the value, 12px row gap, 40px column gap.

## 5. Components

### Top bar
- Same grey as the page (`--page`), 60px high, 1px bottom border (`--line`). No colored bar.
- Left: the Wusool Capital logo, 24px high. The logo file is the white line version (`logo line white.png`); on the light bar draw it dark with `filter: brightness(0)`.
- After the logo: a 1px divider (`--line-strong`) and the product name in muted text.
- Right: plain text links (ink, underline on hover) and controls such as a select, 24px apart.

### Cards
- White, 1px `--line` border, 8px corners, faint shadow. One card per page section.

### Buttons
- Height 36px, padding 0 14px, 6px corners, weight 500, no wrap.
- Primary: navy fill, white text.
- Secondary ("quiet"): white fill, `--line` border, ink text; hover `--page`.
- Small: height 28px, padding 0 10px, 12px text (for example "View" next to a link; shown disabled when there is no link yet; "Share" at the right of the page title, copying the page link with a "Link copied" note beside it).
- Disabled: opacity 0.45, not-allowed cursor.
- Text-style actions: navy underlined text with no box (for example "Clear filters", "Remove").

### Inputs, selects, search
- White, 1px `--line` border, 6px corners, 36px high, 0 10px padding.
- Focus: navy border plus a 2px `--sky` outline.
- Label above the field in 12px muted text, error below in 12px `--alert`. Invalid field gets an `--alert` border.
- Placeholder text in `--muted`, never used as the label.

### Badges and chips
- An editable chip opens a small menu of its values under it (white, 1px border, 6px corners); the current value is highlighted in `--sky-soft`, and picking one saves at once.
- Pill shape, 2px 10px padding, 12px text, 1px border.
- Badge (for example "Sell-side"): `--sky` border, `--sky-soft` fill, navy text.
- Status chips in three tones, always with their text:
  - Not started: `--line` border, muted text.
  - In progress: `--sky` border, `--sky-soft` fill, navy text.
  - Done: navy fill, white text.
- Pipeline status pills (table Status column): 1px 8px padding, 12px text, no border except the outlined ones. Soft fill with dark text of the same hue:
  - Not started or unknown: white, `--line-strong` border, muted text.
  - Contacted: `#E8E8EA` fill, ink text.
  - Talks: `#FBF0D6` fill, `#6E4A00` text.
  - LOI: `--sky` fill, navy text.
  - Due diligence: navy fill, white text.
  - Bidding: `#EEE8FA` fill, `#46297A` text.
  - Closed: `#DEF2E4` fill, `#1C5532` text.
  - Passed: `#FBE5E5` fill, `--alert` text.

### Tables (brand table style)
The brand guideline's "Illustrative Exit Summary (AED '000)" table, used for every data table.
- Header row: navy background, white Inter semibold 12px labels, no wrap. Each label is a button that sorts: first click A to Z (numbers low first, dates newest first), second click reversed, third click back to the default order. The sorted column shows ↑ or ↓ and `aria-sort`.
- Data rows: alternate white and `#F5F5F5`, no grid lines, no row borders.
- Cells: 12px, padding 8px 12px (8px 10px in wide tables), vertically centered.
- Numbers right-aligned in tabular figures. Text left-aligned.
- Table corners 6px with `overflow: hidden`; `border-collapse: separate; border-spacing: 0`.
- Clickable rows: pointer cursor, `--sky-soft` hover, keyboard focus outline (2px navy, inset), and Enter opens the row.
- Wide tables: `table-layout: fixed` with set column widths; one line per cell with `…`, and the full text in a `title` tooltip. Keep headers, statuses, dates and numbers whole; let free text be cut.
- Empty values: "Not set" in muted text.
- Long tables in a card: card `max-height: calc(100vh - 32px)` as a flex column; the table sits in a scroll box that clips the corners, with `thead th { position: sticky; top: 0 }`. The box only scrolls once the card is 16px from the top of the window (a scroll listener sets `data-pinned`), so the wheel moves the page first and the rows after.

### Process tracker (stages)
- One row of equal squared cells (CSS grid, 4px gap), the stage name inside each, 10px, up to 2 lines, min height 30px, 4px padding, 4px corners.
- Done: solid navy cell, white text.
- Current: `--sky-soft` cell, 2px navy border, semibold navy text, `aria-current="step"`.
- Upcoming: white cell, `--line` border, muted text.
- Screen readers get "completed", "current stage" or "not started" per cell.
- A banner above for side states (for example "Mandate on hold"): `--sky-soft` fill, `--sky` border with a 4px navy left border, navy text.

### KPI or funnel counters
- A row of equal boxes, white, 1px `--line` border, 6px corners, padding 6px 12px; card padding 10px top and bottom.
- Inside: label 12px muted on top; below it on one line, number 16px semibold and secondary value (for example a percentage) 12px muted.
- Small arrows between boxes in `--line-strong`.
- Clickable counter selected: navy fill, white number, `--sky` labels, plus `aria-pressed="true"` and a text note elsewhere ("Funnel: Replied").

### Filters toolbar
- One row, 10px by 12px gaps, items 36px high: search box, dropdown filters, segmented control, checkboxes, a result count pushed right ("Showing 33").
- Segmented control: `--page` track with 2px padding, options in muted text; the selected one white, semibold navy, with a small shadow.
- Dropdown filter: a `<details>` styled like an input ("Status: All ▾"), opening a white panel of checkboxes.
- Active special filter: a navy outlined pill with its name.

### Side panel (row details)
- Fixed right drawer, 640px wide, full height, white, light navy scrim behind (`rgb(0 5 35 / 0.2)`).
- Header: title, muted status line, Save (primary) and Close (secondary). Notice bar under it in `--sky-soft` when an action is blocked.
- Body scrolls; sections separated by 1px `--line`, 18px padding, 15px navy headings.
- Opens with a 180ms slide and fade, skipped when the user prefers reduced motion.
- Escape closes; ask before discarding unsaved changes. Focus moves into the panel and back to the row on close.

### Empty and missing states
- Empty list: a white box with a dashed `--line-strong` border, muted text that says what to do next.
- Missing value: "Not set" in muted text. Unconfirmed value: "To confirm" in muted text, with the stored value in a tooltip.

### Overdue and warnings
- A small `--alert` circle with "!" plus the word "Overdue" in semibold `--alert`, above or before the date. Never color alone.

## 6. Accessibility

- Visible focus on everything: 2px navy outline, 2px offset (inset on table rows and segmented options).
- Labels on every input; errors tied to fields with `aria-describedby`.
- Body text contrast at least 4.5:1 (that is why muted is `#5E6670`, not the brand grey).
- Respect `prefers-reduced-motion`.

## 7. Writing in the UI

- Simple words, sentence case, no em dashes, no filler adverbs or marketing words.
- Buttons say what they do ("Save", "Add counterparty", "Log event", "View").
- Errors say what to fix ("Give a reason of at least 3 characters.").
- Dates as `12 Mar 2026`, money as `$5.2M` and `AED 19.1M`.

## 8. Starter CSS

Copy into another dashboard, then add the component rules above as needed. The full version lives in `app/styles.css`.

```css
:root {
  --navy: #000523;
  --sky: #c6e1ee;
  --sky-soft: #eaf3f8;
  --page: #f5f5f5;
  --surface: #ffffff;
  --stripe: #f5f5f5;
  --ink: #1a1a1a;
  --line: #e4e4e7;
  --line-strong: #c9c9cf;
  --muted: #5e6670;
  --alert: #8a1c1c;
  --font: "Inter Variable", system-ui, sans-serif;
  --radius-card: 8px;
  --radius: 6px;
  --shadow: 0 1px 2px rgb(0 5 35 / 0.04);
}

* { box-sizing: border-box; }
html { font-family: var(--font); }
html, body { margin: 0; }
body { background: var(--page); color: var(--ink); font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
button, input, select, textarea { font: inherit; }
a { color: var(--navy); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }

.page { max-width: 1440px; margin: 0 auto; padding: 24px 40px 16px; }
.page-title { margin: 0 0 16px; color: var(--navy); font-size: 20px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.25; }
.section-title { margin: 0; color: var(--navy); font-size: 15px; font-weight: 600; }
.muted { color: var(--muted); }

.card { padding: 18px 24px; border: 1px solid var(--line); border-radius: var(--radius-card); background: var(--surface); box-shadow: var(--shadow); }
.card + .card { margin-top: 12px; }

.button { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 14px; border: 1px solid var(--navy); border-radius: var(--radius); background: var(--navy); color: var(--surface); font-weight: 500; white-space: nowrap; cursor: pointer; }
.button--quiet { border-color: var(--line); background: var(--surface); color: var(--ink); }
.button--quiet:hover { background: var(--page); }
.button:disabled { opacity: 0.45; cursor: not-allowed; }

input, select, textarea { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); color: var(--ink); }
input, select { height: 36px; padding: 0 10px; }
input:focus-visible, select:focus-visible, textarea:focus-visible { border-color: var(--navy); outline: 2px solid var(--sky); outline-offset: 0; }

.badge { display: inline-block; padding: 2px 10px; border: 1px solid var(--sky); border-radius: 999px; background: var(--sky-soft); color: var(--navy); font-size: 12px; }

.table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border-radius: var(--radius); background: var(--surface); font-size: 12px; }
.table th, .table td { padding: 8px 12px; text-align: left; vertical-align: middle; }
.table th { background: var(--navy); color: var(--surface); font-weight: 600; white-space: nowrap; }
.table tbody tr:nth-child(even) td { background: var(--stripe); }
.table .num { text-align: right; font-variant-numeric: tabular-nums; }
```
