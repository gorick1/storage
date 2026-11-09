# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: TypeScript end to end (SvelteKit + SQLite) in a single container packaged as a Home Assistant add-on. Chosen because the label designer is a heavy in-browser editor, and sharing one template-to-ZPL renderer between browser preview and server print keeps what you see identical to what prints.

## Users

A household (a few people) cataloging their own storage. They mostly add items one at a time, as things get put away, from a phone standing in the garage, attic, or closet. Some use a desktop with a USB/Bluetooth barcode scanner (keyboard-wedge) for lookups and moves.

## Product Purpose

Know exactly which box any item is in. Every item and every box gets a printed label; boxes carry a QR code that opens their contents. Success: anyone in the household can find something in seconds, and adding a new item takes under a minute including the label printing itself.

## Positioning

Replaces Homebox for this household. The difference that matters: labels are first-class. A real label designer with user-defined templates per type (item, box, location), any label stock size, and automatic printing to a networked Zebra the moment a record is created. Photo-first capture with AI filling in the details.

## Operating Context

- Printer: Zebra ZD420t (thermal transfer, ribbon) with built-in Ethernet, printing raw ZPL over TCP 9100. Any label stock the user loads; size is not fixed. Currently printing direct thermal (no ribbon on hand); thermal transfer planned later. Each label-stock profile therefore records its print method (direct thermal ^MTD vs thermal transfer ^MTT) and the app sends it with every job, so switching stock never needs printer menu changes. Durable target stock: polypropylene labels with resin or wax-resin ribbon, all-temperature adhesive (garage and attic heat and cold). Labels printed direct thermal should be easy to find and reprint in bulk once ribbon arrives.
- Auth: app-managed accounts with passkeys as the primary login (WebAuthn, relying party storage.garrettorick.com; changing the domain later invalidates all passkeys). Admin invites household members by link; recovery codes as fallback. No Cloudflare Access.
- Hosting: Home Assistant OS (VM on KVM) add-on, served on its own subdomain storage.garrettorick.com through the user's existing Cloudflared / Nginx Proxy Manager, not HA ingress.
- Codes:
  - QR code = public URL to the server with the record number embedded in compact uppercase form, e.g. HTTPS://STORAGE.GARRETTORICK.COM/I42, so the QR encodes in denser alphanumeric mode; routes are case-insensitive. Any phone camera can scan it; it routes through login and then opens that record.
  - QR base URL is a setting, not hard-coded. Short domain: gtor.cc (owned). A separate, standalone Cloudflare Worker shortener makes storage its default namespace with a stateless pattern redirect (HTTPS://GTOR.CC/<code> -> https://storage.garrettorick.com/<code>), so labels never depend on a shortener database. Other projects get prefixed namespaces. The shortener is its own project.
  - QR paths use a compact base-36 form of the record number (e.g. item 1295 -> /IZZ; 3 characters cover 46,655 records) so the full URL (e.g. HTTPS://GTOR.CC/IZZZ, 20 chars) stays within the smallest QR size (21x21, 20 alphanumeric characters at medium error correction). Human-readable numbers (I001295) still appear on the label as text.
  - Barcode (1D) = the bare record number. Meaningful only inside the app; works with a hardware keyboard-wedge scanner and in-app camera scanning.
- Structure: Location > Box > Item. Items may sit loose in a location with no box.

## Capabilities and Constraints

Confirmed:
- Household accounts with their own logins; long-lived sessions on phones; QR deep links survive the login redirect.
- Items: number, name, description, multiple photos, box (or loose location), tags.
- Boxes: number, name, location, photo, contents.
- AI (Claude vision): photo in, suggested name/description/tags out; user confirms before save.
- Label templates per record type, designed in-app, for arbitrary label sizes; the default template for a type auto-prints on create.
- Both a QR code and a barcode on labels.

- Moving an item prompts "Reprint label?" because item labels show the box.
- Items can be checked out ("taken out by X, date") while keeping their home box.
- Items can carry a quantity (e.g. "40 zip ties"); one label per record, not per unit.
- No Homebox import. Start fresh.

## Brand Commitments

- Modern, Apple-native feel: "like an Apple engineer built this." Follow Apple's interface conventions (system font stack, inset grouped lists, large titles, sheets, translucent bars, SF Symbols-style iconography) as the standing design language.
- Chosen world: Apple Home / Shortcuts-style tiles. Locations and boxes browse as tappable tiles, each location carrying its own color.

## Evidence on Hand

None yet. No logos, brand assets, or existing data. The catalog starts empty; Homebox data will not be imported.

## Product Principles

1. The label is the product. If printing is fiddly, the system fails, so printing must be automatic, fast, and predictable.
2. Finding beats filing. Every design choice should make "where is X?" faster, even at a small cost to data entry.
3. One-handed in a garage. Capture flows work on a phone with one hand, in poor light, with gloves-level precision.
4. Scan anything, land somewhere useful. Any QR or barcode the system printed opens the right record, from any device.
