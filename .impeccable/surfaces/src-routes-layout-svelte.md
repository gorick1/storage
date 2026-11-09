---
version: 1
slug: "src-routes-layout-svelte"
primary_target: "src/routes/+layout.svelte"
related_targets: []
---

# Storage app shell (all screens)

Scope: the whole household-facing web app (phone-first, desktop for label design). Visitor mode: Operate.

Audience and job: household members in a garage, attic or closet, one hand on a phone, adding one item at a time, scanning labels, and finding where things are. Desktop use for the label designer and hardware-scanner lookups.

## Direction contract

THESIS: Storage browses like Apple's Home app: places and boxes are colored tiles you tap, and every record is one scan away. It refuses the category's dashboard of tables and gray cards.

OWN-WORLD: iOS system grammar: system font stack (SF Pro), large titles that collapse into a translucent nav bar, inset grouped lists, sheets that slide up, a translucent tab bar. Each location owns one system color (teal, orange, purple, green, indigo, pink, yellow) that tints its tiles, its boxes, and the box's record header. Neutrals are iOS grouped background and secondary labels; tint blue for links and primary actions. Light and dark follow the device.

STORY: Open the app and see your places as colored tiles with box counts; search sits above them. Tap Garage, see its boxes as tiles, tap a box, see its items as photos. Scan anything and land on it. Tap Add, photograph, accept the AI's name, save, hear the label print.

FIRST VIEWPORT: Phone: large title "Storage" with a search field below; a 2-column grid of location tiles (color glyph top-left, name bottom-left, box and item counts); below, "Recent Boxes" as a horizontal tile row. Translucent tab bar: Home, Search, Scan (center, prominent), Labels, Settings. Add is a tinted circular button in the nav bar.

FORM: Apple Home-style tiles, candidate 3 of the safer-register hand; seed key 3eb73bb8.

SIGNATURE INTERACTION: Scan: the camera sheet locks onto a code, the frame snaps to it, and the matching tile expands into its record (view transition from tile to page).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
