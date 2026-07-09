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

## Before you start — what you need

Just two things. The launcher handles everything else (installing dependencies, starting the server, opening your browser) by itself.

### 1. A Claude account

You need a Claude Pro or Team subscription at [claude.ai](https://claude.ai). This is what powers the AI research. The tool runs all searches through your Claude account, so there are no separate API costs or usage fees beyond your existing subscription.

### 2. Your personal Claude token

A token is what connects the tool to your Claude account. Getting one takes about 2 minutes, one time.

> **Easiest order: do Setup Step 2 first.** The token commands below need Node.js, and the launcher in Setup Step 2 installs it for you. Run the launcher, and when the setup page asks for your token, come back here — the same instructions appear on that page. (If Terminal ever says `command not found: npm`, that's the sign Node.js isn't installed yet.)

Open Terminal (`Cmd + Space`, type `Terminal`, hit Enter) and run these two lines:
```
sudo npm install -g @anthropic-ai/claude-code
```
The first line asks for your **Mac login password** — typing is invisible, that's normal. Hit Enter after typing it.
```
claude setup-token
```

A browser window will ask you to log in to Claude. After you approve, Terminal prints your token — a long string starting with `sk-ant`. **Copy it.** You'll paste it into the setup page in a moment. (These same instructions appear on the setup page itself, so you can also just start the tool and follow along there.)

> **Security rule:** Never share your token with anyone, paste it into Slack, or send it over email. It is tied to your personal Claude account. If you think it's been exposed, run `claude setup-token` again for a fresh one.

---

## Setup — do this once

**Step 1 — Get the Watchtower folder**

You'll receive the project as a folder (or a zip — double-click to unzip). Put it anywhere you like, such as your Desktop.

*Comfortable with git? You can clone it instead:* `git clone https://github.com/ntjmad2026/Competitor-Watchtower.git`

**Step 2 — Double-click `Start Watchtower.command`**

The first time, macOS will warn that it "could not verify" the file — that's normal for anything downloaded from the internet. The 30-second fix, once only:

1. Click **Done** on the warning (not "Move to Trash")
2. Open **System Settings → Privacy & Security**, scroll down to the Security section
3. Next to *"Start Watchtower.command" was blocked*, click **Open Anyway** and confirm
4. Double-click the file again — it runs, and macOS never asks about it again

The launcher takes it from there:
- If Node.js (the engine the server runs on) is missing, it opens the download page and tells you exactly what to click — install it, then double-click the launcher again.
- It installs the project's dependencies automatically (about a minute; text will scroll by — that's normal).
- Then it opens the Watchtower in your browser.

**Step 3 — Paste your token**

The first page you see asks for your Claude token. Paste it and click **Save and open the dashboard**. The tool checks the token with Claude right then — if it's good, you land in the dashboard; if not, you get a plain-English message telling you what to fix. That's the whole setup. You never do this again.

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
Node.js isn't installed yet — `npm` comes with it. Easiest fix: double-click `Start Watchtower.command`, which walks you through installing Node. Or install it directly: download the **LTS** version from [nodejs.org](https://nodejs.org), run the installer with default options, then fully quit and reopen Terminal and try again.

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

## How to keep the tool current

The tool's knowledge of NinjaTrader's own products, pricing, and roadmap lives in a file called `nt-context.js`. Claude compares competitors against this baseline, so it needs to stay accurate.

**Refresh it roughly once a month.** To do this, open a Claude Code session connected to NinjaTrader Confluence and ask Claude to update `nt-context.js` with the latest product, pricing, roadmap, and GTM information from the DPM, DM, and IL spaces. Commit and push the updated file, everyone on the team gets the update automatically the next time they run `git pull`.

The date of the last refresh is noted at the top of `nt-context.js`. If it's more than 6 weeks old, the tool may compare competitors against outdated NT information.

---

## Files in this project

| File | What it is |
|---|---|
| `Start Watchtower.command` | The one-click launcher — installs what's needed and starts everything |
| `watchtower.html` | The entire dashboard — UI, research logic, and scoring in one file |
| `server.js` | The local server that handles Claude API calls and the first-run setup page |
| `nt-context.js` | NinjaTrader product and pricing context — update this monthly |
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
