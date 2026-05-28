# Deployment Guide

How vqbank is deployed on a single Linux host (Raspberry Pi in the
current setup, but anything that runs Node and nginx will do). It assumes
you already have a working pm2 + nginx + cloudflared stack on the box
serving other apps — this guide adds vqbank without disrupting them.

## Architecture

```
[ Visitor ]
    │  HTTPS
    ▼
[ Cloudflare edge ]
    │  TLS terminates here. Cloudflare also injects CF-Connecting-IP
    │  and X-Forwarded-For with the real visitor IP.
    ▼
[ cloudflared tunnel ]
    │  Runs on the host. Forwards matching hostnames to local services.
    │
    ▼ HTTP, localhost
[ nginx :80 ]                  vhost: vqbank.harshitrv.in
    │  Reverse-proxies to the app, forwards X-Forwarded-For.
    │
    ▼ HTTP, 127.0.0.1
[ pm2 fork process :3002 ]     name: vqbank
       │
       └── Node 22 (pinned)  ──►  Mongo Atlas (sessions + papers)
```

Every layer is replaceable independently. The app sees the visitor's
real IP because `app.set('trust proxy', 'loopback')` in
[`app.ts`](../app.ts) tells Express to honour `X-Forwarded-For` when it
comes from a loopback address.

## Stack components

| Layer | Tool | Version pin | Where pinned |
|---|---|---|---|
| Runtime | Node | 22.x | [`.nvmrc`](../.nvmrc), `engines.node` in [`package.json`](../package.json) |
| Package manager | pnpm | 11.4.0 | `packageManager` field in [`package.json`](../package.json), auto-fetched by Corepack |
| Process supervisor | pm2 | 6.x | system-wide |
| Reverse proxy | nginx | any recent | system |
| Tunnel | cloudflared | any | system |
| Database | MongoDB Atlas | 7.x | external |

## Prerequisites on the host

One-time setup before the first deploy:

1. **Node 22 via nvm**

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   source ~/.nvm/nvm.sh
   nvm install 22
   ```

2. **Corepack enabled** (ships with Node 22; activates pnpm from the
   `packageManager` field automatically on first run)

   ```bash
   corepack enable
   ```

3. **pm2 installed globally**

   ```bash
   npm install -g pm2
   ```

4. **pm2 startup unit** so processes resurrect on reboot (one-time)

   ```bash
   pm2 startup systemd
   # follow the sudo command it prints
   ```

5. **nginx + cloudflared** — assumed already running with a tunnel
   pointed at `http://localhost:80`. If you need to set up cloudflared
   from scratch, see Cloudflare's tunnel docs; it's beyond this guide.

6. **Env file**: create [`env/prod.env`](../env/) with the secrets the
   app expects. The file is gitignored and never enters the pm2 dump.

   ```ini
   PORT=3002
   NODE_ENV=production
   SIGN_COOKIE=<long-random-hex>
   JWT_SECRET=<long-random-hex>
   JWT_EXP=7d
   MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
   ```

   The port can be anything not already used on the host — nginx will
   route to it. Avoid 3000-3010 if you share the box with other Node
   apps that default to those ranges.

## First-time deploy

From a fresh clone of the repo on the host:

```bash
cd /home/harshitrvpi/code/pro/vqbank

# nvm picks Node 22 from .nvmrc
nvm use

# pnpm installs the exact versions in pnpm-lock.yaml. Will refuse if
# package.json and the lockfile disagree. Also enforces the security
# settings in pnpm-workspace.yaml (minimumReleaseAge, trustPolicy, ...).
pnpm install --frozen-lockfile

# Compile TS → dist/, copy views and public assets
pnpm build

# Hand off to pm2
pm2 start ecosystem.config.cjs --only vqbank

# Snapshot so the app survives reboot. This is additive — your other
# pm2 apps are included in the dump, not removed.
pm2 save

# Confirm it's listening
curl http://127.0.0.1:3002/status
# → {"message":"Server is running"}
```

Then wire up the proxy layer (sections below).

## Day-to-day deploy

After the first-time setup, all subsequent deploys go through one
script:

```bash
pnpm deploy
```

Which runs [`scripts/deploy.sh`](../scripts/deploy.sh):

1. Sanity-checks `env/prod.env` exists.
2. Sources nvm and switches to the Node version in `.nvmrc`.
3. `git pull --ff-only` — refuses merge commits on the prod box.
4. `pnpm install --frozen-lockfile` — reproducible, strict.
5. `pnpm build`.
6. If vqbank is already in pm2: `pm2 reload ecosystem.config.cjs --only vqbank --update-env`.
   Otherwise: `pm2 start ecosystem.config.cjs --only vqbank && pm2 save`.
7. Prints `pm2 info vqbank` summary.

The whole script is name-scoped to `vqbank` via `--only`, so other pm2
apps on the host are never touched.

## Manual pm2 operations

All commands assume you're on the host. None of them touch your other
apps because they're all scoped by name.

```bash
# Status
pm2 list                          # all apps
pm2 describe vqbank               # vqbank details

# Logs
pm2 logs vqbank                   # tail both streams, ctrl-C to exit
pm2 logs vqbank --lines 200       # last 200 lines, no tail
pm2 logs vqbank --err             # stderr only

# Lifecycle (every one scoped to vqbank)
pm2 reload vqbank                 # zero-downtime in cluster, restart in fork
pm2 restart vqbank                # hard restart, ~1 second outage
pm2 stop vqbank                   # stop without removing
pm2 delete vqbank                 # remove from pm2 list entirely

# After any lifecycle change you want to survive reboot:
pm2 save
```

Avoid the global versions (`pm2 restart all`, `pm2 reload all`,
`pm2 kill`) — they'd bounce every app on the host.

## Configuration reference

### [`ecosystem.config.cjs`](../ecosystem.config.cjs)

CommonJS file (the `.cjs` extension matters because
`package.json` sets `"type": "module"`).

| Field | Value | Why |
|---|---|---|
| `name` | `vqbank` | Used by every `--only vqbank` flag. Must stay unique across pm2 processes on the host. |
| `script` | `dist/app.js` | Built JS entry, produced by `pnpm build`. |
| `interpreter` | `/home/harshitrvpi/.nvm/versions/node/v22.22.3/bin/node` | **Absolute path.** Pinning here means the pm2 daemon can run under any Node version while vqbank uses Node 22. See pitfall #2. |
| `node_args` | `--env-file=./env/prod.env` | Node 22's native env loader. Replaces `env-cmd` for production. |
| `cwd` | `__dirname` | Force pm2 to chdir to the repo root regardless of where it's launched. |
| `exec_mode` | `fork` | Single process. Cluster mode is broken with ESM entries — see pitfall #1. |
| `instances` | `1` | Implied by fork mode. |
| `autorestart` | `true` | pm2 restarts on crash. |
| `max_memory_restart` | `500M` | RSS soft cap; pm2 graceful-restarts if exceeded. |
| `min_uptime` | `10s` | Below this, a restart counts as "unstable". |
| `max_restarts` | `10` | After 10 unstable restarts pm2 stops trying (and won't take the app down further until manually intervened). |
| `restart_delay` | `2000` | 2s between restart attempts; avoids hammering Mongo at boot. |
| `out_file` / `error_file` | `logs/vqbank.{out,err}.log` | Project-local logs. `logs/` is gitignored. |
| `merge_logs` | `true` | Single stream per file even in cluster mode (harmless in fork). |
| `log_date_format` | `YYYY-MM-DD HH:mm:ss Z` | Timestamps every log line. |

### [`scripts/deploy.sh`](../scripts/deploy.sh)

The one-shot deployer. Strict bash (`set -e`), name-scoped pm2 calls,
fails loudly on missing env file. Read it top-to-bottom if anything
about the deploy flow surprises you.

### Nginx vhost

Drop this at `/etc/nginx/sites-available/vqbank.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vqbank.harshitrv.in;

    # Multer caps uploads at 5MB; this gives headroom for multipart overhead.
    client_max_body_size 10m;

    # Surface the real visitor IP to the app.
    # In app.ts: app.set('trust proxy', 'loopback')
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;

    proxy_http_version 1.1;
    proxy_connect_timeout 30s;
    proxy_send_timeout    30s;
    proxy_read_timeout    60s;

    location / {
        proxy_pass http://127.0.0.1:3002;
    }

    location = /favicon.ico { log_not_found off; access_log off; }
    location = /robots.txt  { log_not_found off; access_log off; }
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/vqbank.conf \
           /etc/nginx/sites-enabled/vqbank.conf
sudo nginx -t
sudo systemctl reload nginx
```

### cloudflared ingress

Add to `~/.cloudflared/config.yml` (or wherever your tunnel config
lives) **above** the catch-all 404 entry:

```yaml
ingress:
  # ... existing entries above ...
  - hostname: vqbank.harshitrv.in
    service: http://localhost:80
  # keep this last
  - service: http_status:404
```

Route DNS and restart cloudflared:

```bash
cloudflared tunnel route dns <your-tunnel-name> vqbank.harshitrv.in
sudo systemctl restart cloudflared
```

## Common pitfalls

Notes from things that actually broke during setup. Skim before
debugging — most "weird" pm2 failures match one of these.

### 1. pm2 cluster mode + ESM = silent worker death

The app is ESM (`"type": "module"` in package.json). pm2's cluster
mode wraps the entry in a CommonJS bootstrap script that uses dynamic
`import()` to load ESM — and the timing of the cluster IPC ack handshake
doesn't always line up. Workers die before the app code even runs, and
no log line is written to either `logs/vqbank.err.log` or
`~/.pm2/logs/vqbank-error.log`. The pm2 CLI hangs waiting for a "ready"
signal that never comes.

**Symptom**: `pm2 start` hangs for ~30s or longer; `pm2 jlist` shows
the app in `waiting restart` with `pid=0` and `restart_time=9`; no logs
anywhere.

**Fix**: stay on `exec_mode: 'fork'` with `instances: 1`. If you ever
need to scale, run multiple fork instances on adjacent ports and put
them behind an nginx `upstream` block — that's also more transparent
to debug than pm2 cluster.

### 2. Tilde in `interpreter` doesn't expand

pm2 spawns the worker via `child_process.spawn(interpreter, ...)`. No
shell is involved, so `~/.nvm/versions/node/v22.22.3/bin/node` is taken
literally. The worker can't start, pm2 retries, you hit `max_restarts`
in ~20 seconds with nothing useful in logs.

**Fix**: always use absolute paths in the `interpreter` field. Replace
`~` with `/home/<user>` explicitly.

### 3. pm2 CLI commands hang even when the daemon is fine

Occasionally `pm2 list`, `pm2 start`, etc. block indefinitely while
your other apps stay perfectly healthy. The daemon is doing its job;
the CLI is stuck rendering progress output or waiting on an
unflushed IPC frame.

**Workaround**: wrap in `timeout` and redirect output to a file:

```bash
timeout 10 pm2 list --no-color > /tmp/pm2_list.log 2>&1
cat /tmp/pm2_list.log
```

For `pm2 jlist` you get structured JSON which is more reliable when the
table renderer is what's misbehaving:

```bash
timeout 10 pm2 jlist > /tmp/pm2_jlist.json 2>&1
node -e 'require("/tmp/pm2_jlist.json").forEach(p => console.log(p.name, p.pm2_env.status))'
```

### 4. `pm2 save` is additive, never destructive

`pm2 save` snapshots the **currently running** process list into
`~/.pm2/dump.pm2`. It does not remove anything; it just records what's
there right now. So running `pm2 save` after starting vqbank captures
all four apps (your existing three + vqbank), and `pm2 resurrect` (or
the systemd startup unit) brings them all back on reboot.

If you ever stop an app and forget to `pm2 save`, the dump still has
the old entry, and that app will come back on reboot. Run `pm2 save`
again after any intentional `pm2 stop`/`pm2 delete` you want to survive
reboot.

### 5. `engineStrict: true` rejects wrong Node versions

[`pnpm-workspace.yaml`](../pnpm-workspace.yaml) sets `engineStrict: true`
to enforce `engines.node: ">=22.0.0 <23.0.0"`. If you try to `pnpm
install` or `pnpm build` under Node 20 (very common — Cursor's
embedded Node, `apt`'s old Node packages, etc.) it fails loudly:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)
```

**Fix**: `nvm use` before any pnpm command, or rely on
[`scripts/deploy.sh`](../scripts/deploy.sh) which sources nvm itself.
The pm2 process at runtime is unaffected because the ecosystem file
pins an absolute Node 22 interpreter path.

### 6. Stale `specifier:` lines in `pnpm-lock.yaml` after manual edits

If you hand-edit `package.json` (e.g. strip caret ranges to pin exact
versions), the `specifier:` fields in `pnpm-lock.yaml` will still show
the old form until you run `pnpm install` again. Reproducibility is
preserved — `--frozen-lockfile` keeps installing the same resolved
versions — but the diff that appears the next time anyone runs
`pnpm install` can be confusing.

**Fix**: after any manual edit to `package.json`, run `pnpm install`
once to refresh the lockfile metadata.

### 7. `--frozen-lockfile` is strict about drift

The deploy script uses `pnpm install --frozen-lockfile`, which is the
pnpm equivalent of `npm ci`. It refuses to install if `package.json`
and `pnpm-lock.yaml` disagree about what versions are wanted. If you
ever bump a dep manually without regenerating the lockfile, the deploy
will fail at the install step — fail loudly, before any code goes
live, which is the right behavior.

### 8. `minimumReleaseAge` quarantines fresh deps

[`pnpm-workspace.yaml`](../pnpm-workspace.yaml) sets
`minimumReleaseAge: 2880` (2 days). Any version of any package
published less than 2 days ago will be refused. This is intentional
supply-chain hygiene — most malicious releases are caught and pulled
from npm within hours.

**If you legitimately need a brand-new release**: add the package to
`minimumReleaseAgeExclude` in `pnpm-workspace.yaml`, install, then
remove it from the exclude list once it's older than 2 days.

### 9. `trust proxy` mismatch hides the real client IP

If you forget the `proxy_set_header X-Forwarded-For
$proxy_add_x_forwarded_for;` line in the nginx vhost, the app sees
`127.0.0.1` for every request. The rate limiter in
[`middlewares/v1/rateLimit.ts`](../middlewares/v1/rateLimit.ts)
then throttles the whole site collectively — one busy visitor 429s
everyone else.

**Verification**: hit the public URL from your phone on cellular (not
your home wifi), and check `logs/vqbank.out.log` — morgan should log
your phone's external IP, not `127.0.0.1`. If you see `127.0.0.1`, the
nginx config is missing the header.

### 10. Logs only appear in `logs/` once the worker has started

The `out_file` / `error_file` paths in the ecosystem file are opened
by the worker process itself. If the worker dies before that point
(broken interpreter path, missing env file, syntax error in compiled
output) you'll see nothing in `logs/vqbank.err.log` — the error lands
in `~/.pm2/logs/vqbank-error.log` instead (or sometimes nowhere
visible, if pm2's daemon couldn't even fork the worker).

**When debugging a startup failure**, check both locations:

```bash
tail -50 logs/vqbank.err.log
tail -50 ~/.pm2/logs/vqbank-error.log
```

Also try running the same command pm2 would run, by hand:

```bash
/home/harshitrvpi/.nvm/versions/node/v22.22.3/bin/node \
  --env-file=./env/prod.env dist/app.js
```

If that works standalone, the problem is in the pm2 wrapper layer
(usually pitfall #1 or #2).

## Troubleshooting checklist

When the app is down or misbehaving, work through this in order:

1. `pm2 describe vqbank` — status, uptime, restart count, last error.
2. `tail -100 logs/vqbank.err.log` and `tail -100 ~/.pm2/logs/vqbank-error.log`.
3. `curl -s http://127.0.0.1:3002/status` from the host — bypasses
   nginx and the tunnel. If this works, the app is fine and the
   problem is in the proxy chain.
4. `sudo nginx -t && sudo systemctl status nginx` — config valid? Service running?
5. `sudo systemctl status cloudflared` — tunnel running?
6. From an external machine: `curl -i https://vqbank.harshitrv.in/status`.
7. If everything else looks fine but rate limits are weirdly aggressive,
   check whether nginx is forwarding `X-Forwarded-For` (pitfall #9).
