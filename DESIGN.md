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
  glass-bg: "rgba(255, 255, 255, 0.58)"
  glass-bg-strong: "rgba(255, 255, 255, 0.82)"
  glass-rim: "rgba(255, 255, 255, 0.9)"
  glass-edge: "rgba(0, 0, 0, 0.07)"
  glass-lens: "rgba(0, 0, 0, 0.06)"
  sheet-scrim: "rgba(20, 20, 30, 0.22)"
  menu-scrim: "rgba(240, 240, 245, 0.35)"
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
  hero-title-item:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
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
  callout:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
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
  caption-2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
  tab-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    letterSpacing: "0.01em"
  code:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "0.82em"
    letterSpacing: "0"
rounded:
  sheet: "34px"
  dock: "32px"
  action-bar: "30px"
  lens: "27px"
  float: "26px"
  capsule-lg: "24px"
  tile: "22px"
  capsule: "20px"
  capsule-sm: "19px"
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
    rounded: "{rounded.capsule-sm}"
    size: "38px"
  glass-capsule:
    backgroundColor: "{colors.glass-bg}"
    textColor: "{colors.tint}"
    typography: "{typography.callout}"
    rounded: "{rounded.capsule}"
    padding: "0 14px 0 6px"
    height: "40px"
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
    rounded: "{rounded.sheet}"
  tab-bar:
    backgroundColor: "{colors.glass-bg}"
    textColor: "{colors.label}"
    typography: "{typography.tab-label}"
    rounded: "{rounded.dock}"
    padding: "5px"
    height: "64px"
  tab-bar-compact:
    backgroundColor: "{colors.glass-bg}"
    rounded: "{rounded.float}"
    height: "52px"
  tab-lens:
    backgroundColor: "{colors.glass-lens}"
    rounded: "{rounded.lens}"
  search-orb:
    backgroundColor: "{colors.glass-bg}"
    textColor: "{colors.label}"
    rounded: "{rounded.dock}"
    size: "64px"
  sidebar:
    backgroundColor: "{colors.glass-bg}"
    rounded: "{rounded.float}"
    padding: "16px 12px"
    width: "260px"
  toast:
    backgroundColor: "{colors.glass-bg-strong}"
    textColor: "{colors.label}"
    typography: "{typography.subhead}"
    rounded: "{rounded.float}"
    padding: "7px 7px 7px 16px"
  print-pill:
    backgroundColor: "{colors.glass-bg-strong}"
    textColor: "{colors.label}"
    rounded: "{rounded.capsule-sm}"
    padding: "0 16px 0 10px"
    height: "38px"
  context-menu:
    backgroundColor: "{colors.glass-bg-strong}"
    textColor: "{colors.label}"
    typography: "{typography.callout}"
    rounded: "{rounded.tile}"
    padding: "6px"
    width: "220px"
  select-bar:
    backgroundColor: "{colors.glass-bg-strong}"
    textColor: "{colors.tint}"
    typography: "{typography.caption-2}"
    rounded: "{rounded.action-bar}"
    padding: "6px"
  select-bar-action:
    textColor: "{colors.tint}"
    rounded: "{rounded.capsule-lg}"
    height: "52px"
  label-preview:
    backgroundColor: "{colors.thermal-white}"
    textColor: "{colors.thermal-black}"
    rounded: "{rounded.control}"
---

# Design System: Storage

## Overview

**Creative North Star: "The Household Home App"**

Storage speaks Apple's system grammar as its native tongue, in its iOS 26 Liquid Glass dialect: the SF Pro stack, large titles over a blurred scroll edge, inset grouped lists on grouped-gray, and controls that float above content as glass capsules. Nothing is invented where iOS already has an answer; the app should feel like a first-party utility a household found already installed.

The one voice the system adds is place color. Every location owns a single system color, and that color follows the place everywhere it appears: its tile, the dot beside each box and item it holds, the tint behind a box's cover, the hero of the box's record. Colored tiles are the browsing surface; the grouped list is the reading surface; glass is the control layer that floats over both. Density is phone-first and one-handed, with 44px minimum targets throughout.

Light is the default appearance. The root carries `data-theme` as `light`, `auto` or `dark`, chosen in Settings under Appearance and kept in localStorage; dark tokens apply under `dark`, and under the device's dark preference only when the theme is `auto`. Every token still has a dark counterpart and nothing is designed for one mode only. Motion is springy in the iOS sense, overshooting slightly on release, and its signature is continuity: a tile does not link to a page, it becomes the page.

**Key Characteristics:**
- System SF Pro stack only; no web fonts.
- One system color per place, carried from tile to record.
- Filled color surfaces use the deepened `--loc-solid`; tints use the raw `--loc`.
- Inset grouped lists with hairline separators for reading and editing.
- Liquid Glass for every floating control: tab capsule, search orb, header capsules, sheets, toasts, menus, pills.
- Light by default, with Automatic and Dark as user choices.
- One spring curve for press-and-release, sheets, the tab lens and pills.
- View transitions morph a tile into its record.
- The label preview is strictly black on white, because it is a print proof.

## Colors

An iOS neutral foundation (grouped gray, white surfaces, translucent gray labels and fills) with one blue for action, ten system hues reserved for places, and a translucent glass layer for floating chrome.

### Primary
- **System Tint Blue** (`tint`; dark #0a84ff): links, primary buttons, the Scan tab capsule, the active tab glyph and label, the selected sidebar link, focus rings (at 55% mix), selection and caret. It is the only action color.

### Secondary
- **Place Colors** (`place-teal`, `place-orange`, `place-purple`, `place-green`, `place-indigo`, `place-pink`, `place-yellow`, `place-blue`, `place-red`, `place-brown`; each with its iOS dark-mode variant): a place is assigned one through `data-color`, which sets `--loc`. The raw hue is for tints only: box cover washes (26% into the surface), record heroes and filter chips (14-15%), and tinted link text (50% mixed into the label color).
- **Place Solid** (`--loc-solid`, derived, not a stored token): `oklch(from var(--loc) min(l, 0.54) c h)`, with a `color-mix(in srgb, var(--loc) 64%, #000)` fallback. Every filled surface that carries white content uses it: location tiles, location heroes, record glyph squares, place dots, the box placeholder glyph.
- **Yellow Ink** (`yellow-ink`): the text color on yellow fills. Yellow is the one place whose solid is its raw hue, kept light with dark ink rather than deepened to mustard.

### Tertiary
- **Destructive Red** (`destructive-red`; dark #ff453a): delete rows and swipe actions, danger buttons (14% wash with red text), the held-jobs badge, error text and error toast icons.
- **Success Green** (`success-green`; dark #30d158): switch on-state, toast success icon, the print pill's done state, the Return swipe action.

### Neutral
- **Grouped Background** (`grouped-background`; dark #000000): the page canvas and, mixed 82% with transparency, the sheet body.
- **Grouped Surface** (`grouped-surface`; dark #1c1c1e): inset groups, cards, box tiles, swipe-row faces.
- **Label** (`label`; dark #ffffff), **Secondary Label** (`label-secondary`), **Tertiary Label** (`label-tertiary`): primary text and resting tab glyphs, supporting text and details, chevrons and placeholders.
- **Separator** (`separator`): 0.5px hairlines inside groups.
- **Fill** / **Fill Strong** (`fill`, `fill-strong`): gray buttons, search fields, segmented tracks, pressed rows, dashed add outlines, the sheet grabber.

### Glass
- **Glass** (`glass-bg`; dark rgba(44, 44, 48, 0.56)): the standard floating material for the tab capsule, search orb, desktop sidebar, header back capsule, jump chips and camera tools.
- **Glass Strong** (`glass-bg-strong`; dark rgba(44, 44, 48, 0.78)): the denser material for surfaces that carry reading text: toasts, the print pill, the context menu, the multi-select bar.
- **Glass Rim** (`glass-rim`; dark rgba(255, 255, 255, 0.14)) and **Glass Edge** (`glass-edge`; dark rgba(255, 255, 255, 0.06)): the 1px top highlight and 0.5px inner outline that give glass its lit edge.
- **Glass Lens** (`glass-lens`; dark rgba(255, 255, 255, 0.14)): the highlight that slides behind the active tab, the hover on sidebar links, pressed menu and select-bar items, and the sheet's header buttons.
- **Sheet Scrim** (`sheet-scrim`) and **Menu Scrim** (`menu-scrim`): the cool, light dims behind a sheet and behind a context menu (the menu scrim also blurs the page 14px).

### Named Rules
**The One Place, One Color Rule.** A location owns exactly one system hue, and every surface that belongs to that place inherits it through `data-color`. Never color a place's objects with anything but its own `--loc`.

**The Solid Fill Rule.** Any filled surface carrying white text or a white glyph uses `--loc-solid`, never the raw `--loc`, so white holds 4.5:1. Yellow is the sole exception: it keeps its light fill and switches to `yellow-ink`.

**The Single Tint Rule.** Blue is for action. Place color never stands in for a button, and blue never stands in for a place (the blue place color is a place's identity, not a link).

**The Light First Rule.** Light is the default theme. Dark applies only when the user picks Dark, or picks Automatic on a device set to dark; every new color is still defined for both.

## Typography

**Display Font:** SF Pro Display via `-apple-system, BlinkMacSystemFont` (with Helvetica Neue, system-ui)
**Body Font:** SF Pro Text via `-apple-system, BlinkMacSystemFont` (with Helvetica Neue, system-ui)
**Label/Mono Font:** SF Mono via `ui-monospace` (with Menlo)

**Character:** The system face at iOS's own metrics: tight negative tracking on 17px body, slight positive tracking on bold display sizes. Typography is quiet; color, tiles and glass carry the personality.

### Hierarchy
- **Large Title** (700, 34px, 1.2): the in-page title on top-level screens (Storage, Labels, Settings, Search).
- **Hero Title** (700, 30px): the record name inside a location or box hero. **Item Hero Title** (700, 26px) is the item record's step down.
- **Title 2** (700, 22px, 1.27): section heads such as "Recent Boxes", and the desktop brand.
- **Title 3** (600, 20px, 1.25): empty-state headings.
- **Tile Name** (600, 19px, 1.15): the place name on a location tile.
- **Body / Headline** (400 / 600, 17px, 1.29): rows, buttons, bar titles. Line length on prose is held near 60ch.
- **Callout** (500, 16px): glass capsule labels (the header back link), context menu items, sidebar links, box tile names.
- **Subhead** (15px): row subtitles, small buttons, toasts, chips, the select-bar count.
- **Footnote** (13px, 1.38): group labels and footers, tile counts, segmented items.
- **Caption** (12px, 1.33): badges, code labels inside tiles, swipe action labels.
- **Caption 2** (600, 11px): labels under the multi-select bar's action glyphs.
- **Tab Label** (600, 10.5px, 0.01em): tab bar labels only; they collapse away when the bar compacts.
- **Code** (SF Mono, 0.82em, secondary label): human-readable box and item codes, often in a code pill.

### Named Rules
**The System Face Rule.** Only the system stack renders UI text. The label preview's Helvetica Neue condensed rendering exists solely to match the printer's font and never leaks into the app chrome.

**The Tabular Count Rule.** Every count, quantity and badge number uses tabular figures (`.num`).

## Layout

Phone-first single column inside a page container (16px gutter, max-width 980px, bottom padding clears the floating dock plus 28px). Sections open 28px apart; group labels sit 26px above their group.

Location tiles sit in a 2-column grid with 12px gaps, becoming 3 columns at 640px and 4 at 1100px; tiles shift from a 1.12 to a 1.5 aspect ratio at 640px. Recent boxes ride a horizontal snap rail of 156px compact tiles that bleeds to the screen edge on phones. Box contents use the same 2/3/4 grid as photo cells.

On phones the navigation is a floating dock 16px in from each side and 10px above the safe area: a four-tab glass capsule (Home, Scan, Labels, Settings) with a separate 64px search orb beside it, 10px apart. At 900px the dock is replaced by a floating 260px glass sidebar inset 12px from the window edges, and item records split into two columns with sticky media. Sheets float 8px in from the screen edges on phones (max 640px wide, 94dvh tall) and center from 700px.

Touch targets are 44px minimum; rows are 44px tall with 10px by 16px padding; row separators inset to 16px, or 72px when a thumbnail leads.

## Elevation & Depth

Depth has two layers. Content sits flat and tonal: white groups on grouped-gray, with soft ambient shadows lifting tappable cards. Controls sit above it as Liquid Glass: a translucent fill, `blur(24px) saturate(190%)` behind it, a bright 1px top rim, a 0.5px inner edge and a soft, cool drop shadow. There is no solid bar anywhere; the header is a blurred, masked fade of the page color that appears only once content scrolls beneath it. In dark mode the resting shadow collapses to a single 1px line because the surfaces already separate by tone.

### Shadow Vocabulary
- **Resting** (`--shadow`: `0 1px 2px rgba(0,0,0,0.06), 0 6px 18px rgba(0,0,0,0.06)`): tiles, box tiles, record heroes, cards, photo cells.
- **Lifted** (`--shadow-lift`: `0 2px 6px rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.12)`): tile hover on pointer devices.
- **Glass** (`inset 0 1px 0 var(--glass-rim), inset 0 0 0 0.5px var(--glass-edge), var(--glass-shadow)`, where `--glass-shadow` is `0 10px 34px rgba(30,30,60,0.13), 0 1px 3px rgba(0,0,0,0.06)`): every glass surface.
- **Sheet** (glass rim and edge plus `0 24px 60px rgba(0,0,0,0.22)`, over `blur(30px) saturate(190%)`): the floating sheet.
- **Context Lift** (`drop-shadow(0 18px 30px rgba(0,0,0,0.18))` at `scale(1.03)`): the pressed item while its context menu is open.
- **Tile Gloss** (`inset 0 1px 0 rgba(255,255,255,0.22)` plus a 160deg white-to-black wash at 7% / 12%): location tiles only, giving the colored slab its Home-app sheen.
- **Control Knob** (`0 3px 8px rgba(0,0,0,.12-.15), 0 3px 1px rgba(0,0,0,.04-.06)`): the selected segment and the switch thumb.

### Named Rules
**The Glass Layer Rule.** Glass is for controls that float over content (navigation, header capsules, sheets, toasts, menus, pills, action bars). Content itself (tiles, groups, cards, rows) stays opaque and never turns to glass.

**The Scroll Edge Rule.** Headers have no bar slab. Back and action capsules float as glass at all times; once content scrolls under, a 10px-blurred gradient of the page color, masked to fade out, softens what sits beneath them.

## Shapes

Continuous, generous rounding that scales with the object. Content: 22px for tiles and heroes, 18px for box tiles and template cards, 16px for small cards, 14px for buttons and action cells, 12px for inset groups and tile glyph squares, 10px for fields and search. Pills (small buttons, counts, chips) are fully rounded at half their height. Place dots are circles.

Floating glass runs on a capsule and sheet scale, each radius half its control's height or concentric with its container: 19px for 38px capsules (icon buttons, sheet header buttons, toast actions, the print pill), 20px for 40px capsules (header back and action capsules, jump chips, camera zoom stops), 22px for the context menu, 24px for 48px camera tools and select-bar actions, 26px for toasts, the compact tab bar and the desktop sidebar, 27px for the tab lens and tabs inside the 64px bar, 30px for the multi-select bar, 32px for the tab bar and search orb at full size, and 34px for sheets.

Glyphs sit in rounded squares (40-58px, 12-16px radius) filled with `--loc-solid` or a 22% white wash on a colored tile. Dashed 1.5px `fill-strong` outlines mark "add" slots. Borders are otherwise absent; hairlines are 0.5px.

## Components

### Buttons
Filled, rounded and calm, pressing down and springing back.
- **Shape:** 14px radius at 50px tall; small buttons are 34px pills.
- **Primary:** tint fill, white 600 17px label, 0 20px padding.
- **Gray:** `fill` background with tint label. **Plain:** no fill, tint label, 44px tall. **Danger:** 14% red wash with red label.
- **Press / Focus:** `scale(0.96)` with 0.88 opacity in 0.08s, released on the 0.45s spring; global focus ring is a 3px tint outline at 55%, offset 2px. Disabled drops to 0.4 opacity.
- **Icon button:** 38px circle, `fill` background with tint glyph, pressing to `scale(0.9)`; a glass variant takes `glass-bg`, a tinted variant fills with tint and a white glyph.

### Chips
- **Style:** place filter chips are 34px pills tinted 15% with the place color, text mixed 50% place into label. Home's jump chips are 40px glass capsules with a tint glyph. Tags are 13px `fill` pills with 12px radius.

### Cards / Containers
- **Inset group:** grouped-surface, 12px radius, clipped, rows separated by inset 0.5px hairlines, with an uppercase 13px secondary-label group label above and a 13px footer below (the native iOS grouped-table header).
- **Record cards:** grouped-surface, 16-18px radius, resting shadow, 12-14px padding.
- **Action cells:** three-up grid of 14px-radius surface cells, a colored glyph over a 13px label.

### Inputs / Fields
- **In-group:** borderless, right-aligned values on a row; selects read as secondary-label values.
- **Standalone field:** 44px, grouped-surface, 10px radius. **Search:** 38px, `fill` background, 10px radius, magnifier glyph.
- **Switch:** 51 by 31px, `switch-off` track turning green, white thumb sliding 20px.
- **Segmented:** `fill` track at 9px radius, selected segment on grouped-surface (#636366 in dark) with knob shadow. Settings' Appearance control (Light, Automatic, Dark) is one.
- **Focus:** tint caret and the global tint ring.

### Navigation
- **Page header:** a 56px row with a glass back capsule (chevron plus parent name, 40px tall) at left, a centered 600 17px title, and glass action capsules at right. In large mode the 34px title lives in the page and the small title fades in once it scrolls under; in hero mode the record hero is the title. The scroll edge blur appears with the small title.
- **Tab bar (signature):** a 64px glass capsule of four tabs with a separate glass search orb beside it. Glyphs sit over 10.5px labels in label color, tint when active; Scan's glyph rides a 44 by 30px tint capsule. A `glass-lens` highlight slides to the active tab on the spring. Scrolling down past 80px compacts the bar to 52px and the orb to 52px, labels collapse away, and scrolling up restores them. The dock slides away on the scan screen.
- **Sidebar (900px+):** a floating glass panel at 26px radius; 42px links at 13px radius with a `glass-lens` hover; active link fills with tint and white text; Add item anchors the bottom as a primary button.

### Location Tile (signature)
A solid slab of the place's `--loc-solid` at 22px radius, white glyph in a 22% white rounded square at top-left, name and box and item counts at bottom-left, tile gloss on top. Presses to `scale(0.96)` and springs back, lifts 2px on hover. Yellow tiles take the raw yellow and yellow ink.

### Box Tile
A grouped-surface card at 18px radius: a 4:3 cover (photo, or the place color washed 26% into the surface with a solid-colored box glyph), a translucent black count pill at bottom-right, then the box name and a place dot with the place name. Presses to `scale(0.96)` on the spring.

### Item Row
A list row led by a 44px thumbnail at 9px radius, title with an optional tabular quantity, a subtitle carrying the place dot and box, and a tertiary chevron. Separators inset to 72px. It sits inside a swipe row and a context menu host.

### Swipe Actions
Rows slide sideways to reveal full-height action panels: Check out (orange deepened to l 0.62) or Return (green) on the leading edge, Move (tint) and Delete (red) on the trailing edge, each a white glyph over a 12px 600 label. The row face is grouped-surface and snaps back on the spring.

### Context Menu
Press and hold (or right-click) a tile or row: it dips to `scale(0.97)`, then lifts to `scale(1.03)` with the context lift while the page dims behind the blurred menu scrim. A 220px `glass-strong` menu pops from `scale(0.6)` on the spring at 22px radius, with 44px items at 15px radius in 16px type; destructive items are red.

### Multi-select Bar
A `glass-strong` toolbar at 30px radius rising over the dock: the tabular selected count at left, then 52px action buttons with a glyph over an 11px label, tint (red for Delete), pressing to `scale(0.9)` over `glass-lens`.

### Sheet
A native `dialog` floating 8px inside the screen edges as a 34px-radius glass panel (grouped background at 82% over `blur(30px) saturate(190%)`), rising from `translateY(30%) scale(0.96)` on a 0.55s spring. A 36 by 5px grabber, Cancel at left and Done at right as 38px `glass-lens` capsules, centered title. The backdrop is the sheet scrim.

### Toast
A 26px-radius `glass-strong` capsule above the dock with a green or red status glyph, 15px 500 text and an optional 38px tint action capsule. Rises with a blur-in on the spring.

### Print Pill
A 38px `glass-strong` capsule dropping from the top safe area on the spring, a 26px status circle (tint while printing, pulsing; green with a drawn check when done; deepened orange when held) beside 14px 600 status text. It links to Labels.

### Icon
One stroke family drawn for the app in the SF Symbols spirit: 24px grid, 1.9px default stroke, round caps and joins, `currentColor`.

### View Transitions (signature motion)
Location tiles, box tiles and photo cells carry `view-transition-name`s (`loc-N`, `box-N`, `item-N`) that match the hero or media on the record page, so the tile morphs into its record through the browser's view transition. The scan reticle borrows the matched record's name so the locked frame grows into the hero. Skipped under reduced motion.

### Label Preview
An SVG render of the label in printer dots: pure white stock, pure black ink, inverted text white on black, at 10px radius with a hairline and soft drop shadow. Editing affordances (dashed hover outline, selection stroke, resize handle) are drawn in tint blue and are never part of the print.

## Do's and Don'ts

### Do:
- **Do** put a place's color on its objects through `data-color` and let `--loc` / `--loc-solid` resolve it.
- **Do** use `--loc-solid` for every filled colored surface that carries white, and raw `--loc` only for washes of 26% or less and for mixed tint text.
- **Do** give yellow its light fill with `yellow-ink` (#2e2300) text and a 10% black glyph wash.
- **Do** read and edit in inset grouped lists: 44px rows, 0.5px inset separators, 13px uppercase group labels.
- **Do** make tiles that open records carry a `view-transition-name` matching the record's hero.
- **Do** build floating controls from the glass material: `glass-bg` (or `glass-bg-strong` behind reading text), `blur(24px) saturate(190%)`, rim, edge and glass shadow.
- **Do** round glass capsules at half their height on the capsule scale (19, 20, 24, 26, 27, 30, 32px) and sheets at 34px.
- **Do** animate press-and-release, sheets, the tab lens, pills and menus on `--spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`); press in fast (0.08s) and release on the spring.
- **Do** ship light as the default and define every new color for both light and dark.
- **Do** keep the label preview strictly #000 on #fff so it matches thermal print.

### Don't:
- **Don't** fill a surface with raw `--loc` behind white text; deepen it to `--loc-solid` (yellow excepted).
- **Don't** use place color for actions, or tint blue for place identity.
- **Don't** load a web font or substitute a non-system display face in the app chrome.
- **Don't** add color, gray, or tint to the label preview's ink or stock; editing chrome stays outside the printed marks.
- **Don't** build dashboards of tables and gray cards for browsing; places and boxes browse as tiles.
- **Don't** put a solid bar behind the header or the tab bar; controls float as glass and the scroll edge blurs.
- **Don't** turn content (tiles, groups, cards, rows) into glass.
