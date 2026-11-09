---
name: Storage
description: A household inventory that browses like Apple's Home app, with every record one scan away.
colors:
  tint: "#007aff"
  destructive-red: "#ff3b30"
  success-green: "#34c759"
  grouped-background: "#f2f2f7"
  grouped-surface: "#ffffff"
  label: "#000000"
  label-secondary: "rgba(60, 60, 67, 0.62)"
  label-tertiary: "rgba(60, 60, 67, 0.36)"
  separator: "rgba(60, 60, 67, 0.18)"
  fill: "rgba(120, 120, 128, 0.12)"
  fill-strong: "rgba(120, 120, 128, 0.2)"
  bar-material: "rgba(249, 249, 249, 0.82)"
  place-teal: "#30b0c7"
  place-orange: "#ff9500"
  place-purple: "#af52de"
  place-green: "#34c759"
  place-indigo: "#5856d6"
  place-pink: "#ff2d55"
  place-yellow: "#ffcc00"
  place-blue: "#007aff"
  place-red: "#ff3b30"
  place-brown: "#a2845e"
  yellow-ink: "#2e2300"
  thermal-black: "#000000"
  thermal-white: "#ffffff"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.012em"
  hero-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.012em"
  title-2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.27
    letterSpacing: "0.016em"
  title-3:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  tile-name:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: "-0.01em"
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.38
    letterSpacing: "-0.006em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0"
  tab-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.01em"
  code:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "0.82em"
    letterSpacing: "0"
rounded:
  tile: "22px"
  card: "18px"
  card-sm: "16px"
  button: "14px"
  group: "12px"
  control: "10px"
  pill: "17px"
  full: "9999px"
spacing:
  hairline: "0.5px"
  xs: "6px"
  sm: "10px"
  md: "12px"
  gutter: "16px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.grouped-surface}"
    typography: "{typography.headline}"
    rounded: "{rounded.button}"
    padding: "0 20px"
    height: "50px"
  button-gray:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.tint}"
    typography: "{typography.headline}"
    rounded: "{rounded.button}"
    padding: "0 20px"
    height: "50px"
  button-plain:
    textColor: "{colors.tint}"
    typography: "{typography.headline}"
    padding: "0 8px"
    height: "44px"
  button-small:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.grouped-surface}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "34px"
  icon-button:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.tint}"
    rounded: "{rounded.full}"
    size: "36px"
  location-tile:
    textColor: "{colors.grouped-surface}"
    typography: "{typography.tile-name}"
    rounded: "{rounded.tile}"
    padding: "14px 15px"
  location-tile-yellow:
    backgroundColor: "{colors.place-yellow}"
    textColor: "{colors.yellow-ink}"
    rounded: "{rounded.tile}"
  box-tile:
    backgroundColor: "{colors.grouped-surface}"
    textColor: "{colors.label}"
    rounded: "{rounded.card}"
  grouped-list:
    backgroundColor: "{colors.grouped-surface}"
    rounded: "{rounded.group}"
  list-row:
    textColor: "{colors.label}"
    typography: "{typography.body}"
    padding: "10px 16px"
    height: "44px"
  search-field:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.label-secondary}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "38px"
  text-field:
    backgroundColor: "{colors.grouped-surface}"
    textColor: "{colors.label}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  sheet:
    backgroundColor: "{colors.grouped-background}"
    rounded: "{rounded.button}"
  tab-bar:
    backgroundColor: "{colors.bar-material}"
    textColor: "{colors.label-secondary}"
    typography: "{typography.tab-label}"
    height: "56px"
  label-preview:
    backgroundColor: "{colors.thermal-white}"
    textColor: "{colors.thermal-black}"
    rounded: "{rounded.control}"
---

# Design System: Storage

## Overview

**Creative North Star: "The Household Home App"**

Storage speaks Apple's system grammar as its native tongue: the SF Pro stack, large titles that hand off to a translucent bar, inset grouped lists on grouped-gray, and sheets that rise from the bottom edge. Nothing is invented where iOS already has an answer; the app should feel like a first-party utility a household found already installed.

The one voice the system adds is place color. Every location owns a single system color, and that color follows the place everywhere it appears: its tile, the dot beside each box and item it holds, the tint behind a box's cover, the hero of the box's record. Colored tiles are the browsing surface; the grouped list is the reading surface. Density is phone-first and one-handed, with 44px minimum targets throughout.

Light and dark follow the device; every token has a dark counterpart and nothing is designed for one mode only. Motion is short and springy, and its signature is continuity: a tile does not link to a page, it becomes the page.

**Key Characteristics:**
- System SF Pro stack only; no web fonts.
- One system color per place, carried from tile to record.
- Filled color surfaces use the deepened `--loc-solid`; tints use the raw `--loc`.
- Inset grouped lists with hairline separators for reading and editing.
- Translucent, blurred bars and toasts; opaque sheets over a dim scrim.
- Large-title and hero headers whose bar title appears only on scroll.
- View transitions morph a tile into its record.
- The label preview is strictly black on white, because it is a print proof.

## Colors

An iOS neutral foundation (grouped gray, white surfaces, translucent gray labels and fills) with one blue for action and ten system hues reserved for places.

### Primary
- **System Tint Blue** (`tint`; dark #0a84ff): links, primary buttons, the center Scan tab, the selected sidebar link, focus rings (at 55% mix), selection and caret. It is the only action color.

### Secondary
- **Place Colors** (`place-teal`, `place-orange`, `place-purple`, `place-green`, `place-indigo`, `place-pink`, `place-yellow`, `place-blue`, `place-red`, `place-brown`; each with its iOS dark-mode variant): a place is assigned one through `data-color`, which sets `--loc`. The raw hue is for tints only: box cover washes (26% into the surface), record heroes and filter chips (14-15%), and tinted link text (50% mixed into the label color).
- **Place Solid** (`--loc-solid`, derived, not a stored token): `oklch(from var(--loc) min(l, 0.54) c h)`, with a `color-mix(in srgb, var(--loc) 64%, #000)` fallback. Every filled surface that carries white content uses it: location tiles, location heroes, record glyph squares, place dots, the box placeholder glyph.
- **Yellow Ink** (`yellow-ink`): the text color on yellow fills. Yellow is the one place whose solid is its raw hue, kept light with dark ink rather than deepened to mustard.

### Tertiary
- **Destructive Red** (`destructive-red`; dark #ff453a): delete rows, danger buttons (14% wash with red text), the held-jobs badge, error text and error toast icons.
- **Success Green** (`success-green`; dark #30d158): switch on-state, toast success icon, printer-ready state.

### Neutral
- **Grouped Background** (`grouped-background`; dark #000000): the page canvas and the sheet body.
- **Grouped Surface** (`grouped-surface`; dark #1c1c1e): inset groups, cards, box tiles, the desktop sidebar.
- **Label** (`label`; dark #ffffff), **Secondary Label** (`label-secondary`), **Tertiary Label** (`label-tertiary`): primary text, supporting text and details, chevrons and placeholders.
- **Separator** (`separator`): 0.5px hairlines inside groups and under the scrolled bar.
- **Fill** / **Fill Strong** (`fill`, `fill-strong`): gray buttons, search fields, segmented tracks, pressed rows, dashed add outlines, the sheet grabber.
- **Bar Material** (`bar-material`; dark rgba(22, 22, 24, 0.8)): the scrolled nav bar and the tab bar, always with `saturate(180%) blur(20px)`.

### Named Rules
**The One Place, One Color Rule.** A location owns exactly one system hue, and every surface that belongs to that place inherits it through `data-color`. Never color a place's objects with anything but its own `--loc`.

**The Solid Fill Rule.** Any filled surface carrying white text or a white glyph uses `--loc-solid`, never the raw `--loc`, so white holds 4.5:1. Yellow is the sole exception: it keeps its light fill and switches to `yellow-ink`.

**The Single Tint Rule.** Blue is for action. Place color never stands in for a button, and blue never stands in for a place (the blue place color is a place's identity, not a link).

## Typography

**Display Font:** SF Pro Display via `-apple-system, BlinkMacSystemFont` (with Helvetica Neue, system-ui)
**Body Font:** SF Pro Text via `-apple-system, BlinkMacSystemFont` (with Helvetica Neue, system-ui)
**Label/Mono Font:** SF Mono via `ui-monospace` (with Menlo)

**Character:** The system face at iOS's own metrics: tight negative tracking on 17px body, slight positive tracking on bold display sizes. Typography is quiet; color and tiles carry the personality.

### Hierarchy
- **Large Title** (700, 34px, 1.2): the in-page title on top-level screens (Storage, Labels, Settings, Search).
- **Hero Title** (700, 30px): the record name inside a location or box hero; item records step down to 26px.
- **Title 2** (700, 22px, 1.27): section heads such as "Recent Boxes", and the desktop brand.
- **Title 3** (600, 20px, 1.25): empty-state headings.
- **Tile Name** (600, 19px, 1.15): the place name on a location tile.
- **Body / Headline** (400 / 600, 17px, 1.29): rows, buttons, bar titles, back links. Line length on prose is held near 60ch.
- **Subhead** (15px): row subtitles, small buttons, toasts, chips.
- **Footnote** (13px, 1.38): group labels and footers, tile counts, segmented items.
- **Caption** (12px, 1.33): badges, code labels inside tiles.
- **Tab Label** (500, 10px, 0.01em): tab bar labels only.
- **Code** (SF Mono, 0.82em, secondary label): human-readable box and item codes, often in a code pill.

### Named Rules
**The System Face Rule.** Only the system stack renders UI text. The label preview's Helvetica Neue condensed rendering exists solely to match the printer's font and never leaks into the app chrome.

**The Tabular Count Rule.** Every count, quantity and badge number uses tabular figures (`.num`).

## Layout

Phone-first single column inside a page container (16px gutter, max-width 980px, bottom padding clears the tab bar plus 28px). Sections open 28px apart; group labels sit 26px above their group.

Location tiles sit in a 2-column grid with 12px gaps, becoming 3 columns at 640px and 4 at 1100px; tiles shift from a 1.12 to a 1.5 aspect ratio at 640px. Recent boxes ride a horizontal snap rail of 156px compact tiles that bleeds to the screen edge on phones. Box contents use the same 2/3/4 grid as photo cells.

At 900px the bottom tab bar is replaced by a 260px sidebar on the grouped surface, and item records split into two columns with sticky media. Sheets are bottom-anchored on phones (max 640px wide, 92dvh tall) and center as rounded dialogs from 700px.

Touch targets are 44px minimum; rows are 44px tall with 10px by 16px padding; row separators inset to 16px, or 72px when a thumbnail leads.

## Elevation & Depth

Depth is mostly tonal and material: white groups on grouped-gray, translucent blurred bars over content. Shadows exist but are soft and ambient, used to lift tappable cards off the canvas, never to outline structure. In dark mode the resting shadow collapses to a single 1px line because the surfaces already separate by tone.

### Shadow Vocabulary
- **Resting** (`--shadow`: `0 1px 2px rgba(0,0,0,0.06), 0 6px 18px rgba(0,0,0,0.06)`): tiles, box tiles, record heroes, cards, photo cells.
- **Lifted** (`--shadow-lift`: `0 2px 6px rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.12)`): tile hover on pointer devices and floating toasts.
- **Tile Gloss** (`inset 0 1px 0 rgba(255,255,255,0.22)` plus a 160deg white-to-black wash at 7% / 12%): location tiles only, giving the colored slab its Home-app sheen.
- **Control Knob** (`0 3px 8px rgba(0,0,0,.12-.15), 0 3px 1px rgba(0,0,0,.04-.06)`): the selected segment and the switch thumb.

### Named Rules
**The Material Bar Rule.** Bars are clear at rest under a large title and become `bar-material` with blur and a hairline only once content scrolls beneath them. The tab bar is always material.

## Shapes

Continuous, generous rounding that scales with the object: 22px for tiles and heroes, 18px for box tiles and template cards, 16px for small cards and toasts, 14px for buttons, action cells and sheet tops, 12px for inset groups and tile glyph squares, 10px for fields and search. Pills (small buttons, counts, chips) are fully rounded at half their height. Place dots are circles.

Glyphs sit in rounded squares (40-58px, 12-16px radius) filled with `--loc-solid` or a 22% white wash on a colored tile. Dashed 1.5px `fill-strong` outlines mark "add" slots. Borders are otherwise absent; hairlines are 0.5px.

## Components

### Buttons
Filled, rounded and calm, pressing down rather than lighting up.
- **Shape:** 14px radius at 50px tall; small buttons are 34px pills.
- **Primary:** tint fill, white 600 17px label, 0 20px padding.
- **Gray:** `fill` background with tint label. **Plain:** no fill, tint label, 44px tall. **Danger:** 14% red wash with red label.
- **Press / Focus:** `scale(0.97)` with 0.85 opacity on press; global focus ring is a 3px tint outline at 55%, offset 2px. Disabled drops to 0.4 opacity.
- **Icon button:** 36px circle, `fill` background with tint glyph; a tinted variant fills with tint and a white glyph.

### Chips
- **Style:** place filter chips are 34px pills tinted 15% with the place color, text mixed 50% place into label. Tags are 13px `fill` pills with 12px radius.

### Cards / Containers
- **Inset group:** grouped-surface, 12px radius, clipped, rows separated by inset 0.5px hairlines, with an uppercase 13px secondary-label group label above and a 13px footer below (the native iOS grouped-table header).
- **Record cards:** grouped-surface, 16-18px radius, resting shadow, 12-14px padding.
- **Action cells:** three-up grid of 14px-radius surface cells, a colored glyph over a 13px label.

### Inputs / Fields
- **In-group:** borderless, right-aligned values on a row; selects read as secondary-label values.
- **Standalone field:** 44px, grouped-surface, 10px radius. **Search:** 38px, `fill` background, 10px radius, magnifier glyph.
- **Switch:** 51 by 31px, `switch-off` track turning green, white thumb sliding 20px.
- **Segmented:** `fill` track at 9px radius, selected segment on grouped-surface (#636366 in dark) with knob shadow.
- **Focus:** tint caret and the global tint ring.

### Navigation
- **Page header:** a 52px bar with back chevron and parent name at left, centered 600 17px title, actions at right. In large mode the 34px title lives in the page and the bar title fades in once it scrolls under. In hero mode the record hero is the title; the bar title appears after 150px of scroll.
- **Tab bar:** five tabs on bar material, 25px stroke glyphs over 10px labels, secondary label at rest and tint when active. Scan is the center tab, its glyph in a 46 by 32px tint capsule.
- **Sidebar (900px+):** 40px links at 10px radius; active link fills with tint and white text; Add item anchors the bottom as a primary button.

### Location Tile (signature)
A solid slab of the place's `--loc-solid` at 22px radius, white glyph in a 22% white rounded square at top-left, name and box and item counts at bottom-left, tile gloss on top. Presses to `scale(0.96)`, lifts 2px on hover. Yellow tiles take the raw yellow and yellow ink.

### Box Tile
A grouped-surface card at 18px radius: a 4:3 cover (photo, or the place color washed 26% into the surface with a solid-colored box glyph), a translucent black count pill at bottom-right, then the box name and a place dot with the place name.

### Item Row
A list row led by a 44px thumbnail at 9px radius, title with an optional tabular quantity, a subtitle carrying the place dot and box, and a tertiary chevron. Separators inset to 72px.

### Sheet
A native `dialog` rising from the bottom with a 0.45s spring, grouped-background body, 14px top corners, 36 by 5px grabber, Cancel at left, centered title, Done at right. The backdrop is a 35% black scrim.

### Toast
A floating pill above the tab bar: grouped-surface at 86% with `saturate(180%) blur(24px)`, 16px radius, lifted shadow, a green or red status glyph and an optional pill action. Rises with a blur-in. Print jobs update their toast live.

### Icon
One stroke family drawn for the app in the SF Symbols spirit: 24px grid, 1.9px default stroke, round caps and joins, `currentColor`.

### View Transitions (signature motion)
Location tiles, box tiles and photo cells carry `view-transition-name`s (`loc-N`, `box-N`, `item-N`) that match the hero or media on the record page, so the tile morphs into its record over 0.42s on `cubic-bezier(0.22, 1, 0.36, 1)`. The scan reticle borrows the matched record's name so the locked frame grows into the hero. Skipped under reduced motion.

### Label Preview
An SVG render of the label in printer dots: pure white stock, pure black ink, inverted text white on black, at 10px radius with a hairline and soft drop shadow. Editing affordances (dashed hover outline, selection stroke, resize handle) are drawn in tint blue and are never part of the print.

## Do's and Don'ts

### Do:
- **Do** put a place's color on its objects through `data-color` and let `--loc` / `--loc-solid` resolve it.
- **Do** use `--loc-solid` for every filled colored surface that carries white, and raw `--loc` only for washes of 26% or less and for mixed tint text.
- **Do** give yellow its light fill with `yellow-ink` (#2e2300) text and a 10% black glyph wash.
- **Do** read and edit in inset grouped lists: 44px rows, 0.5px inset separators, 13px uppercase group labels.
- **Do** make tiles that open records carry a `view-transition-name` matching the record's hero.
- **Do** keep bars clear at rest and material (82% plus `saturate(180%) blur(20px)`) once content scrolls under.
- **Do** define every new color for both light and dark mode.
- **Do** keep the label preview strictly #000 on #fff so it matches thermal print.

### Don't:
- **Don't** fill a surface with raw `--loc` behind white text; deepen it to `--loc-solid` (yellow excepted).
- **Don't** use place color for actions, or tint blue for place identity.
- **Don't** load a web font or substitute a non-system display face in the app chrome.
- **Don't** add color, gray, or tint to the label preview's ink or stock; editing chrome stays outside the printed marks.
- **Don't** build dashboards of tables and gray cards for browsing; places and boxes browse as tiles.
