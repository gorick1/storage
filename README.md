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

1. Push this repo to GitHub. The **Build image** workflow publishes `ghcr.io/<you>/storage`. Make the package public, or log Home Assistant in to GHCR.
2. Replace `OWNER` in `ha-addon/repository.yaml` and `ha-addon/storage/config.yaml` with your GitHub username.
3. In Home Assistant: **Settings → Add-ons → Add-on store → ⋮ → Repositories**, add your repo URL, then install **Storage**.
4. Set **public_url** to `https://storage.garrettorick.com` *before anyone signs up*. Passkeys are tied to that exact address.
5. Point the domain at `http://<home-assistant-ip>:3000` with Cloudflared or Nginx Proxy Manager.

The add-on stores everything in its `/data`, so it is included in Home Assistant backups.

> The add-on folder has to sit at the root of the repository Home Assistant reads. Either move `ha-addon/*` to the repo root, or keep a separate small add-on repository that contains just those files.

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
