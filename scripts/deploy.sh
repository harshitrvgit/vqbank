#!/bin/bash
set -e

# ── vqbank - Zero-Downtime Deploy Script ──────────────────────────────────────
# Usage: pnpm deploy

PROJECT_DIR="/home/harshitrvpi/code/pro/vqbank"
APP_NAME="vqbank"
ECOSYSTEM_FILE="ecosystem.config.cjs"
ENV_FILE="env/prod.env"

cd "$PROJECT_DIR"

# The ecosystem file passes --env-file=./env/prod.env to Node 22. If the
# file is missing, the process would crash-loop on boot — fail fast instead.
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Missing $ENV_FILE — refusing to deploy."
    exit 1
fi

echo ""
echo "📥 Pulling latest changes..."
# --ff-only refuses to create a merge commit on the prod box; if upstream
# has diverged from local, the deploy stops here with a clear error.
git pull --ff-only

echo ""
echo "📦 Installing dependencies (frozen lockfile)..."
# Strict, reproducible install — pnpm's equivalent of `npm ci`. Fails if
# package.json and pnpm-lock.yaml disagree, so a half-committed dep bump
# can't sneak in. Also enforces the security settings in pnpm-workspace.yaml
# (minimumReleaseAge, trustPolicy, etc.).
pnpm install --frozen-lockfile

echo ""
echo "🔨 Building..."
pnpm build

echo ""

# Check if PM2 process exists
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo "♻️  Reloading $APP_NAME (zero-downtime)..."
    pm2 reload "$ECOSYSTEM_FILE" --only "$APP_NAME" --update-env
else
    echo "🚀 Starting $APP_NAME for the first time..."
    pm2 start "$ECOSYSTEM_FILE" --only "$APP_NAME"
    pm2 save
fi

echo ""
echo "✅ Deploy complete!"
pm2 info "$APP_NAME" --no-color | head -25
