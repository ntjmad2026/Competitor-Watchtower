# Competitor Watchtower

An AI powered competitive intelligence dashboard for NinjaTrader's marketing team. Run a briefing and get a structured, sourced picture of what competitors are doing (new product launches, pricing moves, messaging shifts, and campaign activity) across three business units in about five minutes.

---

## What it does

The Watchtower scans **11 competitors across 3 business units** using live web research powered by Claude (Anthropic's AI). Every briefing is fresh it searches the web in real time, cross checks findings against sources, and surfaces only verified or flagged activity from the last 28 days.

**Business units covered:**

| Business Unit | Competitors Tracked |
|---|---|
| D2C Core | tastytrade, Robinhood, Webull, TradeStation, Interactive Brokers |
| D2C International | IG Group, eToro, Plus500 |
| Eval / Prop | TopStepX, TradeSea, AlphaTrader |

**What each section shows:**

- **Lead Signal** — the single most important competitor move in the last 10 days, selected by scoring significance and futures market relevance
- **Biggest Moves** — the top 3 competitor actions ranked by impact
- **TL;DR** — a plain English summary of the competitive landscape and action items for NinjaTrader
- **Platform & Feature Launches** — new products, tools, or capabilities competitors have shipped
- **Website Messaging Watch** — how competitor homepages and value propositions read right now
- **Action Items** — specific suggested responses for the NinjaTrader marketing team
- **Standing Context** — older activity (29–60 days) kept for background awareness

Briefings are saved locally so you can reopen any past scan instantly without re-running it.

---

## Before you start — the one thing you need

A **Claude Pro or Team subscription** at [claude.ai](https://claude.ai). That's it. The AI research runs through your own Claude account (no separate API costs), and the launcher installs everything else itself.

Setup takes about 15 minutes, once. After that, using the tool is a double-click.

---

## Setup — do this once, in this order

**Step 1 — Download the folder**

On this page, click the green **Code** button → **Download ZIP**, then double-click the ZIP to unzip it. Put the folder anywhere you like, such as your Desktop.

*Comfortable with git? `git clone https://github.com/ntjmad2026/Competitor-Watchtower.git` works too.*

**Step 2 — Open `Start Watchtower.command` (and get past the macOS warning)**

Double-click `Start Watchtower.command` inside the folder. The first time, macOS warns it "could not verify" the file — that's normal for anything downloaded from the internet. The once-only fix:

1. Click **Done** on the warning (not "Move to Trash")
2. Open **System Settings → Privacy & Security** and scroll down to the Security section
3. Click **Open Anyway** next to the blocked-file message, and confirm
4. Double-click the file again — it runs, and macOS never asks about it again

**Step 3 — Let the launcher install what it needs**

- If Node.js (the engine the server runs on) is missing, the launcher opens the download page for you: click the green **LTS** button, run the installer with the default options, then double-click `Start Watchtower.command` again.
- It then installs the project's dependencies by itself (about a minute — text scrolling by is normal) and opens the Watchtower in your browser.

Your browser will show a **setup page** asking for your Claude token. That's your cue for Step 4.

**Step 4 — Get your Claude token (one time, about 2 minutes)**

Open Terminal (`Cmd + Space`, type `Terminal`, hit Enter) and run these two lines, one at a time:
```
sudo npm install -g @anthropic-ai/claude-code
```
This asks for your **Mac login password** — the typing is invisible, that's normal. Type it and hit Enter. Then:
```
claude setup-token
```
A browser window asks you to log in to Claude. After you approve, Terminal prints your token — a long string starting with `sk-ant`. **Copy it.**

> **Security rule:** your token is tied to your personal Claude account. Never share it, paste it into Slack, or send it over email. If you think it's been exposed, run `claude setup-token` again for a fresh one.

**Step 5 — Paste the token**

Back on the setup page, paste the token and click **Save and open the dashboard**. The tool verifies it with Claude on the spot — a good token lands you in the dashboard; a bad paste gets a plain-English message saying what to fix.

That's the whole setup. You never do any of this again.

---

## Running a briefing

**Step 1 — Start the server**

Double-click `Start Watchtower.command`. Your browser opens the dashboard automatically.

Leave the launcher window open the entire time you're using the tool — the server only runs while that window is open. (Terminal fans: `node server.js` from the project folder does the same thing.)

**Step 2 — Open the dashboard**

It opens by itself. If you closed the tab, go to:
```
http://localhost:8787
```

**Step 3 — Run a briefing**

1. Select a **Business Unit** from the tabs at the top (D2C Core, D2C International, or Eval/Prop)
2. Click **Run Briefing**
3. A progress screen will show which competitors are being researched this takes about **5 minutes**
4. The full briefing appears when complete

**To reopen a past briefing:** Click the history icon in the top right corner of the dashboard and select any previous scan. Past briefings reload instantly with no AI calls needed.

**Source verification** runs automatically on every briefing — a second pass checks each finding against a fresh search before it appears. Anything that can't be confirmed is labeled "unverified" so you always know how much to trust a claim.

**Step 4 — Stop the server when done**

Close the launcher window (or press `Control + C` in it). Next time, just double-click `Start Watchtower.command` again.

---

## Troubleshooting

**Terminal says `command not found: npm`**
You've jumped to Step 4 before Steps 2–3 — Node.js isn't installed yet (`npm` comes with it). Double-click `Start Watchtower.command` first; it walks you through installing Node. Then retry the token commands.

**The page won't load / "Cannot connect"**
The server isn't running. Double-click `Start Watchtower.command`.

**"Port already in use" error when starting the server**
The launcher clears stuck sessions automatically, so you should rarely see this. If you started the server manually and hit it, run:
```
lsof -ti:8787 | xargs kill
```
Then start again.

**Briefing finishes but shows 0 results or everything is blank**
The most common cause is a slow web search that timed out. Run the briefing again — it usually works on the second attempt. If it keeps happening, your Claude token may have expired: run `claude setup-token` in Terminal to get a fresh one, then go to `http://localhost:8787/setup` and paste the new token there. No file editing needed.

**"Auth error" or the setup page appears again**
Your saved token is missing or no longer valid. Get a fresh one with `claude setup-token`, then paste it at `http://localhost:8787/setup`. (The token lives in a hidden `.env` file in the project folder — the setup page manages it for you.)

**macOS says it "could not verify" the file / blocks it as possible malware**
This always happens on the first open of a downloaded copy — it's macOS being cautious about internet downloads, not a problem with the tool. Click **Done**, then go to **System Settings → Privacy & Security**, scroll to the Security section, click **Open Anyway** next to the blocked-file message, and double-click the launcher again. One time only. (On older versions of macOS, right-clicking the file and choosing **Open** works instead.)

---

## How the tool stays current

The tool compares competitors against a description of NinjaTrader in `nt-context.js`. That file is deliberately **evergreen** — it covers who NT is and what it durably ships, with no launch dates or roadmap specifics, so it cannot silently go stale. Anything time-sensitive comes from the live web research in each scan instead.

It only needs a review when something identity-level changes — an acquisition, a brand-new product category, a pricing-model restructure — roughly once or twice a year. The last review date is stamped at the top of the file. To update it: edit the file (it's plain text) or ask a Claude session to revise it, run `npm test` to confirm the built-in fact guards still pass, then commit and push — teammates get it on their next `git pull`.

---

## Files in this project

| File | What it is |
|---|---|
| `Start Watchtower.command` | The one-click launcher — installs what's needed and starts everything |
| `watchtower.html` | The entire dashboard — UI, research logic, and scoring in one file |
| `server.js` | The local server that handles Claude API calls and the first-run setup page |
| `nt-context.js` | Evergreen NinjaTrader context — needs review only when identity-level facts change |
| `package.json` | Project configuration and dependency list |
| `.gitignore` | Tells git to never upload your `.env` file or `node_modules/` folder |
| `.env` | **Never share or upload your personal credentials** (the setup page creates this for you) |

---

## Each person needs their own credentials

The tool is designed to run on individual machines using each person's own Claude account. **Do not share your `.env` file or token with teammates** they need to follow the same setup steps and generate their own token with `claude setup-token`.

If the token setup doesn't work or someone doesn't have a Claude account, contact IT team or Josh Delsman (josh.delsman@ninjatrader.com) they can help get people set up with Claude access directly.

---

## Questions and support

Built by Jack Madera (jack.madera@ninjatrader.com) — Summer 2026 internship project.
