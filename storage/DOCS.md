# Storage

1. Set **public_url** to the address people will use (passkeys are tied to it, so set it before anyone signs up).
2. Optionally paste an Anthropic API key (you can also add it later in the app's Settings).
3. Start the add-on, then route your domain to `http://<home-assistant-ip>:3000` with Cloudflared or Nginx Proxy Manager.
4. Open the public URL and create the admin account.

Data (database and photos) lives in the add-on's `/data` and is included in Home Assistant backups.
