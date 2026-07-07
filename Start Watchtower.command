#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Competitor Watchtower — one-click launcher.
#
# Double-click this file to start the Watchtower. It handles setup itself:
#   • checks that Node.js is installed (and walks you to the installer if not)
#   • installs the project's dependencies automatically on first run
#   • clears a stuck previous session on the port, then starts the server
#   • opens your browser — first time ever, the page asks for your Claude token
#
# Keep this window open while you use the tool.
# Close it (or press Control-C) to stop the server.
# ─────────────────────────────────────────────────────────────

cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8787}"

echo ""
echo "  COMPETITOR WATCHTOWER"
echo "  ─────────────────────"

# 1) Node.js — the engine everything runs on.
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  One thing needs installing first: Node.js (free, about a minute)."
  echo ""
  echo "  Your browser is opening nodejs.org now."
  echo "  Click the big green LTS download, run the installer with the"
  echo "  default options, then double-click 'Start Watchtower' again."
  echo ""
  open "https://nodejs.org" 2>/dev/null
  read -n 1 -s -r -p "  (press any key to close this window)"
  echo ""
  exit 1
fi

# 2) Dependencies — installed automatically the first time only.
if [ ! -d node_modules ]; then
  echo ""
  echo "  First-time setup: installing what the server needs (about a minute)."
  echo "  Text will scroll by — that's normal."
  echo ""
  if ! npm install --no-fund --no-audit; then
    echo ""
    echo "  ✗ The install didn't finish. Check your internet connection,"
    echo "    then double-click 'Start Watchtower' to try again."
    read -n 1 -s -r -p "  (press any key to close this window)"
    echo ""
    exit 1
  fi
fi

# 3) Clear a stuck previous session so "port already in use" never greets the user.
STALE=$(lsof -ti tcp:"$PORT" 2>/dev/null)
if [ -n "$STALE" ]; then
  echo ""
  echo "  Clearing a previous Watchtower session…"
  kill $STALE 2>/dev/null
  sleep 1
fi

# 4) Open the dashboard once the server is up. On a brand-new install the page
#    that opens asks for your Claude token — paste it there and you're done.
( sleep 1.5; open "http://localhost:${PORT}" ) &

node server.js
echo ""
echo "  Server stopped. You can close this window."
