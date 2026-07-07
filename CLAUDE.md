# Competitor Watchtower

A competitive-intelligence dashboard for NinjaTrader product marketers (PMMs). It scans each
competitor across the live web and files a weekly briefing — positioning moves, feature/platform
launches, and website-messaging shifts — with every comparison grounded in NinjaTrader's real
product lineup. A tiny local Node server backs it with the Claude Agent SDK.

## Who I am / how I work (Jack)

- Product Marketing intern at NinjaTrader on the D2C Core PMM team, reporting to Neha Mehra. The
  Watchtower is my summer capstone. On a Mac; a fast-learning coding beginner — explain non-obvious
  choices, but don't over-explain.
- Be terse and direct. I want honest, opinionated recommendations with the real tradeoff stated —
  not validation or padding. Push back when something is over-engineered.
- "Ponytail" (when I say "clean this up" or "ponytail"): the laziest thing that works, simplest and
  most minimal, question whether a thing needs to exist at all, prefer built-in over custom, one
  line over fifty.

## Run it

- Double-click `Start Watchtower.command`, or run `node server.js` (alias: `npm start`).
- Open `http://localhost:8787`.
- Stop with `Ctrl+C` in the server window.

## Layout

- `watchtower.html` — the **entire app**: CSS, HTML, and JS all inline in one file. No build step.
- `server.js` — Node ESM HTTP server. Serves the HTML and bridges `/api/messages`.
- `nt-context.js` — the NinjaTrader product facts (`window.NT_CONTEXT`), refreshed independently. Single source of truth for NT comparisons.
- `test.js` — dependency-free validation harness (`npm test`). Config integrity, recency, scoring, JSON repair, NT invariants; `npm run test:live` adds a server smoke test.
- `HANDOFF.md` — handoff & maintenance runbook (add a competitor, refresh the facts, the open decision, the roadmap). The doc to read when taking this over.
- `.env` — holds `CLAUDE_CODE_OAUTH_TOKEN`. **Gitignored. Never commit it.**
- `.env.example`, `.gitignore`, `README.md`, `Start Watchtower.command`, `package.json`.

## Hard rules

- **Never hardcode, print, or commit credentials.** The SDK reads the token from the environment
  on its own; `server.js` never touches the secret value. Keep `.env` gitignored.
- **No build step, no framework, no npm UI dependencies.** The dashboard is vanilla inline JS by
  design. Do not introduce React, a bundler, or client libraries. Logos are hand-rolled
  (Clearbit favicon with an initials fallback) — keep any new visuals dependency-free too.
- **Pin the Agent SDK to `^0.3.x`.** Versions 0.1.x have a web-search bug (`tool_use ids must be
  unique`). If web search breaks, check the SDK version first.
- After editing `watchtower.html`, **syntax-check the inline script** before claiming it works:
  ```bash
  node -e "const fs=require('fs');const h=fs.readFileSync('watchtower.html','utf8');fs.writeFileSync('/tmp/wt.js',h.match(/<script>([\s\S]*)<\/script>/)[1])" && node --check /tmp/wt.js && echo OK
  ```
  Then run **`npm test`** (config integrity, recency, scoring, JSON repair, NT invariants — no deps,
  <1s). Run it before sharing a build or after editing the `COMP` registry or `nt-context.js`.

## Server (`server.js`)

- The dashboard POSTs Messages-API-shaped payloads to `/api/messages`. The server translates each
  into a Claude Agent SDK `query()` call and returns `{content:[{type:'text',text}]}` so the page's
  `getText`/`safeJSON` parse it unchanged. Preserve this response shape.
- Web-search requests map to the SDK `WebSearch` tool; non-tool requests use `tools:[]`.
- `server.requestTimeout` and `headersTimeout` are set to `0` on purpose — long web-search runs must
  not be cut off by Node. **Do not reintroduce server-side timeouts.** (Per-request timeouts live in
  the client `apiCall`.)
- Auth precedence: `ANTHROPIC_API_KEY` **wins** over `CLAUDE_CODE_OAUTH_TOKEN` if both are set. Keep
  the API key unset locally so testing runs on the subscription token at no API cost.

## Dashboard architecture (`watchtower.html`)

The expensive, easy-to-regress part. Keep these invariants:

- **One web search per API call.** Each competitor is researched by 3 parallel sub-calls
  (`researchPositioning`, `researchLaunches`, `researchMessaging`) merged in `research()`. Verify
  runs as 3 parallel per-category calls (`verifyGroup`). **Never chain multiple web searches inside a
  single API call** — sequential in-call searches are the timeout bottleneck this design exists to
  avoid.
- All competitors run concurrently via `makeLimiter`. Research and verify each fail **open**: a
  failed sub-call leaves partial data (or unflagged cards), never kills the run. Errors collect in
  `scanErrors[]` and render in the collapsible scan log.
- **`NT_CONTEXT` is the single source of truth** for NinjaTrader facts. Inject it verbatim into
  research and synthesis prompts. Never invent NT features, and always distinguish LIVE products from
  ROADMAP. Keep it current — it is the spine of comparison quality. (The one fact never to get wrong:
  Nina is a coaching/insights assistant, **not** an agentic auto-trader.)
- **Recency is enforced in code, not just prompts.** `recencyTier`/`freshenScan` apply the windows on
  every render so cached/old briefings re-filter correctly: the main sections use a 28-day window,
  "Biggest Moves This Week" is strictly the last 7 days, and older-but-still-relevant items drop into
  standing context (exact tier boundaries live in `recencyTier`). The label must be true — on a quiet
  week, Biggest Moves can be short or empty, and that's correct. Don't pad it with older moves.
- Parse all model output with `safeJSON()` (it repairs/truncates malformed JSON). Don't `JSON.parse`
  model responses directly.

## Business units & competitors

Scope is **3 business units** (reduced from 5 in mid-June per PMM feedback; NT Connect and Growth/TE
were dropped). Two adjacent objects in `watchtower.html` are the source of truth: the `BUS` object
(which competitors are in each unit + the unit's framing) and the **`COMP` registry** (per-competitor
research/logo config — one entry each). Adding a competitor = add the name to a BU's `comps` list +
one `COMP` entry; `npm test` fails loudly if those two get out of sync. See `HANDOFF.md` §3.

- **D2C Core** (BU owner Paul Colman, PMM Michelle Haunert): tastytrade, Robinhood, Webull,
  TradeStation, Interactive Brokers.
- **D2C International** (Chris Tripp): IG Group, eToro, Plus500. *(IG Group added — tastytrade's
  parent, the EU derivatives leader; Saxo Bank was dropped.)*
- **Eval/Prop** (BU owner John O'Neil, PMM Kassi Rodgers, competitive intel Rayyan Haque): TopStepX,
  TradeSea, AlphaTrader.

Rules that must hold:

- **Tradovate is owned by NinjaTrader — not a competitor.** Never add or scan it.
- **TradingView is a partner, not a pure competitor** (charts partnership). Flag context when it
  appears; don't treat it as a direct competitor.
- **Eval/Prop tracks platforms, not funded firms** (Apex / TopStep / My Funded Futures were removed
  for this reason). AlphaTrader is the most urgent signal — it launched May 20 and Alpha Futures, an
  NT partner, now runs a competing platform.
- The Eval/Prop list is pending Kassi's sign-off (open: add Wealth Charts? platform-only vs.
  funded-adjacent? confirm TradingView stays out).

## Models

- Research, verify, Ask, and Generate: `claude-sonnet-4-6`.
- Synthesis (the briefing verdict): `claude-opus-4-8`.
- Source verification is a **UI toggle** ("Verify sources", default on). `verifyOn()` reads the live
  checkbox at the start of each run; `VERIFY_DEFAULT` is the headless fallback. On ≈ 5–7 min and more
  accurate; off ≈ 3–4 min for a quick read.

## Content & tone rules (for any PMM text the app generates)

- **Never name individuals** — refer to teams/roles only (PMM, content, paid, lifecycle).
- **Advisory, not directive** — surface the lever and its upside, let the reader decide. No bare
  imperatives.
- **No doom framing** — no "or we lose", existential threats, or fear. NinjaTrader is a category
  leader; recommendations seize opportunity.
- Never force a false comparison (e.g. Nina is a coaching/insights assistant, **not** an agentic
  auto-trader).
- **No em dashes / en dashes in generated text** — house style (VP PMM). The synthesis, Ask, and
  Generate prompts enforce this; use periods, commas, or "and". (The static UI chrome keeps its
  editorial dashes — this rule is only for model-generated PMM copy.)

## Code style

- Match the existing terse, dense style: short helpers (`el`, `S`, `H`, `SF`, `esc`, `slug`),
  compact one-line functions, comments only where intent isn't obvious.
- Use the editorial CSS variables (`--acc`, `--tx`, `--green`, etc.) — don't hardcode hex colors in
  new UI.

## Governance (only if extending beyond this local tool)

- Lethal Trifecta rule: never build a workflow that combines (1) sensitive internal NT data,
  (2) external communication, and (3) untrusted input at once. Internal NT context stays inside this
  controlled tool; any public-facing automation (e.g. an n8n → Slack pulse) stays public-data-only.
