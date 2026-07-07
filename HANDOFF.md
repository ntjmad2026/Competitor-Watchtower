# Competitor Watchtower — Handoff & Maintenance

This is the one doc to read if you are taking over the Watchtower or just keeping it
current. It covers what it is, how to run it, the three edits you will actually make
(add a competitor, refresh the NT facts, change scope), how to test before you share,
the one open decision, and the validated roadmap for where it goes next.

Audience: NinjaTrader PMMs. It is meant to be **clone-it-and-run** — drop in a Claude
credential, `node server.js`, open the page. No build step, no framework, no API keys
to manage for normal use.

---

## 1. What it is (90 seconds)

A competitive-intelligence dashboard for the PMM team. You pick a business unit and hit
**Run Briefing**; Claude reads each competitor across the live web — grounded in
NinjaTrader's *actual* product lineup — and files a weekly PMM briefing covering three
insight types: **positioning moves, feature/platform launches, and website-messaging
shifts**. It produces a TL;DR, do-this-week action items, a "biggest moves" spotlight,
and an Ask bar for follow-up questions. Every comparison is weighted
**futures-first** (NT is a futures brokerage).

Three files do the work:

| File | What it is |
|------|------------|
| `watchtower.html` | The **entire app** — CSS, HTML, and JS inline in one file. No build step. |
| `server.js` | A tiny local Node server. Serves the page and bridges `/api/messages` to the Claude Agent SDK (your credential never reaches the browser). |
| `nt-context.js` | The **single source of truth for NinjaTrader facts**, injected into every prompt. This is the file that decays fastest — see §4. |

Supporting: `test.js` (the pre-share gate), `README.md` (auth + run), `CLAUDE.md`
(deep architecture notes for anyone editing the code), `Start Watchtower.command`
(double-click launcher).

---

## 2. Run it

- Double-click **`Start Watchtower.command`**, or `node server.js` (`npm start`).
- Open `http://localhost:8787`. Stop with `Ctrl+C`.
- Auth: a `CLAUDE_CODE_OAUTH_TOKEN` in `.env` (subscription, no API cost) for local use;
  an `ANTHROPIC_API_KEY` in production. See `README.md` for the one-time setup.
- **Verify Sources toggle** (top bar): ON = each claim is re-checked against a fresh
  web search and flagged if unconfirmed (more accurate, ~5–7 min). OFF = faster
  (~3–4 min) for a quick read. Default ON.

---

## 3. Add or remove a competitor (the most common edit)

Everything about a competitor now lives in **two adjacent places** in `watchtower.html`
(this used to be 5 places, which silently broke things). To **add** one:

1. Add its display name to the right business unit's `comps` list in the `BUS` object.
2. Add **one** entry to the `COMP` registry just below it:

```js
'Webull': {site:'site:webull.com', logo:'webull.com'},
```

Fields: `site` (the exact `web_search` site: query — **omit it if you are unsure of the
domain**, a wrong one silently returns a different company), `logo` (official domain, used
for both the homepage-messaging fetch and the logo), `qualifier` (only for namesake
collisions, e.g. `' prop OR futures'`), `official` (only for look-alikes that share a
name with a different company — feeds the verifier's wrong-entity guard).

To **remove**: delete it from both places. Then run `npm test` — the config-integrity
checks will fail loudly if a BU name has no registry entry, or vice-versa.

**Hard rules that must never break** (the tests enforce these):
- **Tradovate is owned by NinjaTrader — never a competitor.** Never add it.
- **TradingView is a charts partner, not a direct competitor.** It belongs (if anywhere)
  in a Growth/Engagement lens for its competition layer vs. Arena, not as a D2C rival.
- **Eval/Prop tracks platforms, not funded firms** (that is why Apex / TopStep funded /
  My Funded Futures were removed; TopStepX / TradeSea / AlphaTrader are the *platforms*).
- Some prop "competitors" also run on NT's own platform (NT Tech) — weigh partner-vs-threat
  before framing a prop signal as a pure threat.

---

## 4. Refresh the NinjaTrader facts (`nt-context.js`)

This is the spine of quality. If NT_CONTEXT is stale, every comparison is subtly wrong.
The full runbook lives in the header comment of `nt-context.js`. In short:

- **When:** on any product ship, pricing change, or major GTM moment; at minimum monthly,
  and always before a leadership briefing.
- **How:** open a Claude Code session in this folder with the Atlassian/Confluence
  connector, ask Claude to **search** Confluence (favor spaces DPM / DM / IL, filter to
  the last 30–60 days), rewrite the `window.NT_CONTEXT` string, have a human SME sanity-check
  it, and commit. The whole team gets it on `git pull`.
- **Search, don't hard-link.** Page IDs rot. The header lists last-known source pages as
  *starting points only* — re-search for newer/moved pages every time.
- **Always cross-check LIVE vs ROADMAP and exact dates/pricing.** A few facts live on the
  public ninjatrader.com fee page, not Confluence (commission cents, NT Connect) — verify
  there. Never claim NT ships something that is still in beta/discovery.
- Keep the guardrails: distinguish LIVE vs ROADMAP; **Nina is a coaching/insights
  assistant, NOT an agentic auto-trader**; Tradovate is part of NT; futures-first lens.

`npm test` checks that those guardrails are still present after any refresh.

---

## 5. Test before you share (the gate)

```bash
npm test          # offline: config integrity, recency windows, scoring, JSON repair, NT invariants
npm run test:live # the above + a live smoke test of the running server (needs the server up)
```

84 checks, no dependencies, runs in under a second. Run it after editing the registry or
the NT context, and before circulating a build. A non-zero exit means something a PMM would
have seen as a bug. (This is the "write tests before sharing with PMMs" step from the
engineering review.)

---

## 6. The one open decision

**Eval/Prop competitor list — pending sign-off from the Eval/Prop PMM (Kassi).** The
review note was drafted but, as of this writing, not yet returned. Three questions are in it:

1. **Add Wealth Charts?** It was named in the original platform-competitor list and is
   currently on "watch," not in the tool. If the answer is yes, it is now a two-line add
   (see §3) — likely `'Wealth Charts': {site:'site:wealthcharts.com', logo:'wealthcharts.com'}`.
2. **Platform-only vs. funded-adjacent** — directionally settled (platforms), needs formal OK.
3. **Confirm TradingView stays out** as a direct competitor (it is a partner) — directionally settled.

Until that returns, the live set is **TopStepX · TradeSea · AlphaTrader**, and AlphaTrader
is the most urgent signal (a former top NT partner that launched its own platform).

---

## 7. Where it goes next (validated roadmap)

The three insight types are necessary but cover roughly half of what moves the needle in
US futures. Outside research + team feedback converge on these additions, in priority
order. **Before building any of them, confirm an existing tool doesn't already own it** —
the team's standing guidance is don't rebuild what Search Console / Profound (keywords/AEO)
or Sprout Social (social/Reddit sentiment) already cover. Validate MVP quality first, then expand.

1. **Pricing / commission / margin watch** — the single most comparable lever in futures and
   the highest-ROI gap; it changes often. (Also requested internally as a promotions tracker.)
2. **Regulatory feed** — CFTC enforcement + NFA BASIC actions are decisive in the prop space
   and are public but never on a competitor's website.
3. **App-store changelog watch** — the fastest-moving competitor surface; reveals shipping
   velocity before any marketing page does.
4. **Sentiment** (Trustpilot / Reddit) — leading indicator of churn/switching — *via existing
   social-listening tools*, not a new scraper.
5. **Ad / creative monitoring** (Meta Ad Library, Google Ads Transparency) for live promo offers.
6. **Trend / zoom-out view** — monthly/quarterly deltas across briefings (history is in
   localStorage today, so this needs a shared store to travel across machines).

Architecture runway already documented elsewhere: a GitHub skill library for durability past
the internship, and a public-data-only n8n → Slack pulse (which must never combine internal
NT data + external comms + untrusted web input — the "lethal trifecta" governance rule).

---

## 8. Gotchas worth knowing

- **Pin the Agent SDK to `^0.3.x`.** Versions 0.1.x had a web-search bug ("tool_use ids must
  be unique"). If web search breaks, check the SDK version first.
- **Don't reintroduce server-side request timeouts.** `server.js` sets them to 0 on purpose —
  long web-search runs must not be cut off. Per-request timeouts live in the client.
- **Recency is enforced in code, not just the prompt** — the 28-day window re-applies on every
  render, so cached/old briefings re-filter correctly. On a quiet week, "Biggest Moves" can be
  short or empty. That is correct; don't pad it.
- **Logos** come from Google's keyless favicon service (the old Clearbit API was sunset by
  HubSpot in Dec 2025). If they ever stop, the 2-letter monogram is the built-in fallback and
  the dashboard keeps working — you can drop the remote logo entirely for a zero-dependency look.
- After editing `watchtower.html`, syntax-check the inline script (command is in `CLAUDE.md`)
  and run `npm test`.
