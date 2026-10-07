# Fueler Dashboard (Next.js rewrite)

A Next.js rewrite of the ERAU Flight Clipboard "Fueler Dashboard" — shows live fuel/oil
requests for fuelers, gated behind a dashboard login, with truck claim + "fueled" tracking.

## How it works

An always-on **collector** process (`src/collector/run.ts`) is the ONLY thing that talks to
`webapps.erau.edu` — it polls on an interval and writes into a local SQLite database
(`src/lib/db.ts`). The Next.js dashboard and all its users only ever read from (and write
claim/fuel state to) that database; they never call ERAU directly. This fixes history only
being tracked while a browser tab was open (the old behavior), since collection now happens
independent of whether anyone has the dashboard open.

```
collector (always running)  --> loginController.cfc / dashboardController.cfc / requestController.cfc
                             --> writes normalized rows + full raw JSON into data/fuel.db

Browser --> /api/erau/status    --> local session cookie check + collector health
Browser --> /api/erau/access    --> local DASHBOARD_ACCESS_CODE check (unrelated to ERAU)
Browser --> /api/erau/requests  --> reads live rows from SQLite
Browser --> /api/erau/history   --> reads completed rows from SQLite
Browser --> /api/erau/requests/[id] (PATCH) --> claim / "fueled" write-back, last-write-wins
```

The dashboard's access code is now a **local-only shared secret** (`DASHBOARD_ACCESS_CODE`) —
it is never forwarded to ERAU. The real ERAU "Fueler" access code
(`ERAU_FUELER_ACCESS_CODE`) is a separate, server-only secret that only the collector uses to
authenticate with upstream (see `src/lib/erau/access.ts`).

### Claim + "fueled" tracking

Dashboard users can "claim" a live or historical request with a truck (and record their name),
and independently mark it "fueled" — purely local bookkeeping, unrelated to ERAU's own
completion flow. Neither is exclusive/lockable: clicking an already-claimed/fueled request opens
a confirm modal to unclaim, reassign to another truck, or "steal" it. Trucks and fuelers are
static lists at `src/data/trucks.json` / `src/data/fuelers.json` — edit them and redeploy to
change the roster (no admin UI). Users pick their truck/name once via the header selector; it's
remembered in `localStorage` for one-click claim/fuel afterward.

### Data storage

Everything lives in one SQLite table (`requests`, see `src/lib/db.ts`): a row per ERAU
`REQUEST_ID`, with `completed_at IS NULL` meaning still live. The full original upstream JSON is
archived forever in a `raw_data` column (normalized columns exist for cheap querying/display;
the dashboard API doesn't send `raw_data` to the browser). Claim/fuel columns are only ever
written by the Next.js app; all other columns are only ever written by the collector — no column
is written by both processes, which is what keeps a single SQLite file safe for this.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `ERAU_BASE_URL` | Base URL of the upstream Flight Clipboard app (server-only). | `https://webapps.erau.edu/flight-clipboard` |
| `FUELER_CAMPUS` | Campus code passed to `getRequestsForFueler`. | `DB` |
| `ERAU_FUELER_ACCESS_CODE` | The real ERAU "Fueler" access code — server-only, used only by the collector. | (none) |
| `COLLECTOR_POLL_INTERVAL_MS` | How often the collector polls ERAU for live requests. | `3000` |
| `SQLITE_DB_PATH` | Path to the SQLite database file. | `./data/fuel.db` |
| `DASHBOARD_ACCESS_CODE` | Shared secret dashboard users type into the login modal. Unrelated to ERAU. | (none) |
| `DASHBOARD_SESSION_SECRET` | Random string signing the local login session cookie. | (none) |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | How often the browser polls `/api/erau/requests` for updates. | `3000` |
| `USE_MOCK_DATA` | When `true`, the collector returns canned sample data instead of calling upstream — useful without campus network/VPN access. | `false` |

## Development

Run the dashboard and the collector as two separate processes:

```bash
npm install
npm run collector:dev   # polls ERAU (or mock data) and writes to data/fuel.db
npm run dev             # the Next.js dashboard, reads/writes the same DB
```

Open [http://localhost:3000](http://localhost:3000). With `USE_MOCK_DATA=true`, the collector
uses canned sample data and a placeholder access code automatically — no real ERAU credentials
needed. Log into the dashboard with whatever you set `DASHBOARD_ACCESS_CODE` to.

### Developing against live production data

To run your local, hot-reloading dashboard code against the real, currently-updating production
database (instead of a local/mock one), tunnel into the deployed app and point the local dev
server at it:

```bash
ssh -L 3001:localhost:3000 fuel@your-server-ip
```

This forwards local port 3001 to the remote `fuel-dashboard` process's own port (bypassing
Nginx/TLS entirely — it's just a plain loopback tunnel over SSH, never exposed to the network).
Leave that running, then in your local `.env`:

```bash
REMOTE_DEV_PROXY_URL=http://localhost:3001
```

Run only `npm run dev` locally (no need for `npm run collector:dev` — the remote collector is
already doing that). Every `/api/erau/*` call is now transparently proxied to the tunneled
remote app (`next.config.ts`'s `rewrites()`), so log in with the real production
`DASHBOARD_ACCESS_CODE`, not your local one.

**This is a direct window into production, not a sandbox** — while `REMOTE_DEV_PROXY_URL` is
set, every dashboard action, including claim/"fueled" clicks, writes to the real remote
database. Remove the env var (and restart `npm run dev`) when you're done to go back to your
local/mock data.

## Deployment (Ubuntu)

A complete, from-scratch walkthrough for a fresh Ubuntu server (written for 26.04 LTS, but any
recent Ubuntu works) where you only have root SSH access and a domain name you've already
bought. Replace `fuel.example.com` with your real domain and `derek-perry/fuel` with your repo
path throughout. Run commands as shown — `sudo` is included where needed.

### 1. Initial server setup (as root)

SSH into the server as `root` for this part only — everything after this section runs as a
new non-root user instead.

```bash
# Update the system
apt update && apt upgrade -y

# Create a dedicated user for this project. It gets its own home dir, sudo access
# (for admin tasks like installing packages), and is also the user the app's systemd
# services run as — there's no need for a separate "admin" vs. "service" account here.
adduser fuel
usermod -aG sudo fuel
```

`adduser` will prompt you to set a password and some optional info (name, etc. — you can leave
those blank). Pick a strong password; you'll use it for `sudo` commands as this user.

Still as root, set up a basic firewall so only SSH (and, later, web traffic) can reach the
server:

```bash
ufw allow OpenSSH
ufw enable
```

Press `y` when prompted. You can now log out of `root` and SSH back in as `fuel` for
everything else:

```bash
ssh fuel@your-server-ip
```

### 2. Install Node.js and build tools

Still logged in as `fuel`. Install a current Node.js LTS via NodeSource's setup script:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # sanity check — should print v22.x
```

Also install `git` and the compiler toolchain needed to build `better-sqlite3`'s native addon
during `npm install` (it compiles from source on install):

```bash
sudo apt install -y git build-essential python3
```

### 3. Get an SSH key onto the server and clone the repo

If `derek-perry/fuel` is a private repository, generate an SSH key for the `fuel` user and add
it as a **deploy key** (read-only) on GitHub:

```bash
ssh-keygen -t ed25519 -C "fuel-server-deploy-key" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Copy that output, then on GitHub go to the repo → **Settings → Deploy keys → Add deploy key**,
paste it in, and leave "Allow write access" unchecked (read-only is all you need here). Then
clone over SSH:

```bash
sudo mkdir -p /opt/fuel
sudo chown fuel:fuel /opt/fuel
git clone git@github.com:derek-perry/fuel.git /opt/fuel
cd /opt/fuel
```

(If the repo is public, you can skip the deploy key and just `git clone
https://github.com/derek-perry/fuel.git /opt/fuel` instead.)

### 4. Configure the app

Install dependencies:

```bash
npm install
```

`better-sqlite3` and `esbuild` need to compile/download a native binary as part of install —
this repo's `package.json` already pre-approves those two specific install scripts
(`"allowScripts"`), so this should just work. If npm still warns that scripts were blocked, run
`npm install-scripts ls` to see which, and `npm install-scripts approve <name>` for each one
listed.

Create your real `.env` from the template and fill it in:

```bash
cp .env.example .env
nano .env
```

Generate the two secrets with:

```bash
openssl rand -hex 32   # use the output for DASHBOARD_SESSION_SECRET
```

Pick your own value for `DASHBOARD_ACCESS_CODE` (whatever you want dashboard users to type in),
and fill in `ERAU_FUELER_ACCESS_CODE` with the real ERAU "Fueler" access code. Leave
`USE_MOCK_DATA=false` for production. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X` in nano).

Edit the truck/fueler rosters with your real data — these are baked into the app at build time,
so do this **before** the next step:

```bash
nano src/data/trucks.json
nano src/data/fuelers.json
```

### 5. Build

```bash
npm run build
```

This compiles the production build of the dashboard. Re-run this (and restart the
`fuel-dashboard` service, see below) any time you change code, `.env` values baked in at build
time, or the truck/fueler JSON files.

### 6. Run both processes with systemd

Copy the example unit files from the repo into place:

```bash
sudo cp deploy/fuel-dashboard.service /etc/systemd/system/fuel-dashboard.service
sudo cp deploy/fuel-collector.service /etc/systemd/system/fuel-collector.service
```

They're already set up for `User=fuel` and `WorkingDirectory=/opt/fuel` matching the steps
above, so if you followed those exactly, no edits are needed. If you used a different user or
path, edit both files (`sudo nano /etc/systemd/system/fuel-dashboard.service`) accordingly
first.

Enable and start both:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fuel-dashboard fuel-collector
```

Check they're both running:

```bash
sudo systemctl status fuel-dashboard fuel-collector
```

You should see `active (running)` for both. Watch live logs with:

```bash
journalctl -u fuel-dashboard -f
journalctl -u fuel-collector -f
```

(`Ctrl+C` to stop watching.) The collector's log should show it polling on an interval with no
errors once `ERAU_FUELER_ACCESS_CODE` is correct. At this point the dashboard is reachable at
`http://your-server-ip:3000` — the remaining steps put a real domain and HTTPS in front of it.

### 7. Point your domain at the server

In your domain registrar/DNS provider's dashboard, add an **A record**:

| Type | Host | Value |
| --- | --- | --- |
| A | `fuel` (or `@` for the bare domain) | your server's IPv4 address |

This makes `fuel.example.com` resolve to your server. DNS changes can take anywhere from a few
minutes to a few hours to propagate. Check with:

```bash
dig +short fuel.example.com
```

Once that prints your server's IP, move on.

### 8. Reverse proxy + HTTPS (Nginx + Let's Encrypt)

Install Nginx:

```bash
sudo apt install -y nginx
```

Create a site config that forwards requests to the Next.js app running on port 3000:

```bash
sudo nano /etc/nginx/sites-available/fuel
```

Paste in:

```nginx
server {
    listen 80;
    server_name fuel.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fuel /etc/nginx/sites-enabled/
sudo nginx -t   # should print "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

Open up the firewall for web traffic:

```bash
sudo ufw allow 'Nginx Full'
```

At this point `http://fuel.example.com` should load the dashboard. Now get a free TLS
certificate with Certbot, which will also edit the Nginx config above to redirect HTTP → HTTPS
automatically:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d fuel.example.com
```

Follow the prompts (enter an email for renewal notices, agree to the terms). Certbot sets up
automatic renewal as a systemd timer — verify it exists with:

```bash
systemctl list-timers | grep certbot
```

### 9. Verify everything end to end

Visit `https://fuel.example.com`, log in with the `DASHBOARD_ACCESS_CODE` you set, and confirm
requests show up. Leave `journalctl -u fuel-collector -f` running in another terminal while you
do this to watch it polling successfully.

### 10. Updating the app later

```bash
cd /opt/fuel
git pull
npm install
npm run build
sudo systemctl restart fuel-dashboard fuel-collector
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) does this automatically on every push to `main` over SSH (secrets: `SSH_HOST`, `SSH_USER`, and `SSH_KEY` or `SSH_PASSWORD`). It needs passwordless sudo for the restart; on the server run `sudo visudo -f /etc/sudoers.d/fuel-deploy` and add:

```
fuel ALL=(root) NOPASSWD: /usr/bin/systemctl restart fuel-dashboard fuel-collector, /usr/bin/systemctl is-active fuel-dashboard fuel-collector
```

### Notes

- The collector has no listening port of its own and is never exposed through Nginx — only
  `fuel-dashboard` (port 3000, proxied) is reachable from outside the server.
- `data/fuel.db` (the SQLite file) lives under `/opt/fuel/data/` by default and is created
  automatically on first run — no manual step needed as long as `fuel` owns `/opt/fuel`.
- If you ever need to run on a port other than 3000 or behind a different reverse proxy setup,
  `next start` respects the standard `PORT` env var — add `PORT=3001` (for example) to `.env`
  and update the Nginx `proxy_pass` to match.

## Notes / open questions

- `.cfc` calls are plain `GET` requests with `method` (and any other params, e.g. `type`,
  `campus`) in the query string — confirmed against a real captured browser request. The
  upstream WebGate also appears to require a `Referer` header and a cookie established by
  first loading the dashboard page (see `warmUpSession` in `src/lib/erau/client.ts`).
- `STATUS_ID` values (e.g. `5`) are shown as-is; no status legend has been confirmed yet.

