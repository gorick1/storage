# Storage

A household storage catalog. Every item and box gets a Zebra label, every box has a QR code, and anything is one scan away.

- **Places → Boxes → Items.** Items can also sit loose in a place.
- **Photo-first capture.** Take a photo; Claude suggests the name, description, tags and search keywords.
- **Labels print themselves.** Saving a new item or box queues its label on your Zebra (raw ZPL over the network), with a few seconds to cancel.
- **Label designer.** Drag-and-drop templates for items, boxes and places, on any label size. Each label stock remembers its size, resolution, print method (direct thermal or ribbon) and darkness.
- **Two codes per label.** A QR code any phone camera opens (`HTTPS://GTOR.CC/I16`), and a Code 128 barcode (`I000042`) that a USB/Bluetooth scanner sends straight into the app.
- **Passkey sign-in** for each household member, with recovery codes and invite links.
- Quantities, check-out, history, typo-tolerant search, pack-a-box scan mode, held prints when the wrong roll is loaded, bulk reprint of direct-thermal labels.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and create the admin account. Data (SQLite database and photos) goes in `./data`.

## Deploy as a Home Assistant add-on

This repository doubles as a Home Assistant add-on repository (`repository.yaml` plus the `storage/` add-on).

1. In Home Assistant: **Settings → Apps → App store → ⋮ → Repositories** and add `https://github.com/gorick1/storage`, then install **Storage**. Home Assistant builds it locally from the git tag matching the add-on version (`v0.1.0`).
2. Set **public_url** to `https://storage.garrettorick.com` *before anyone signs up* (passkeys are tied to that exact address), then start it.
3. Route the domain to `http://<home-assistant-ip>:3000` through the Cloudflare tunnel.

To ship an update: bump `version` in `package.json` and `storage/config.yaml`, tag `v<version>`, push, then update the app in Home Assistant.

Data (database and photos) lives in the app's `/data`, so it is included in Home Assistant backups.

## Printer setup (Zebra ZD420t)

1. Plug the printer into the network. Hold **Feed + Cancel** for 2 seconds to print its configuration, which shows the IP address.
2. Reserve that IP in your router so it never changes.
3. In the app: **Settings → Printer**, enter the IP, then **Test print**.
4. In **Labels → Label Stock**, add each roll you use. **Read size from printer** fills in the width, length, resolution and print method from the loaded roll.
5. Set **Roll in the printer** whenever you swap rolls. Labels meant for a different roll wait in the queue instead of printing on the wrong size.

## Short QR links

Settings → **QR code address** sets what the QR codes encode. With `https://gtor.cc`, item QR codes look like `HTTPS://GTOR.CC/IZZZ` (≤ 20 characters up to 46,655 items), which is the smallest QR size. The shortener must forward `gtor.cc/<code>` to `storage.garrettorick.com/<code>`. The app accepts upper or lower case and redirects to the record after sign-in.

## Development

```bash
npm run check   # svelte-check
npm test        # code parsing tests
npm run build   # production build in ./build
```
