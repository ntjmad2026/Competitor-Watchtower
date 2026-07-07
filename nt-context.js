// ═════════════════════════════════════════════════════════════════════════
// NINJATRADER PRODUCT CONTEXT — single source of truth for the Watchtower
// ═════════════════════════════════════════════════════════════════════════
//
// WHAT THIS IS
//   The factual baseline about NinjaTrader that gets injected verbatim into
//   every research + synthesis prompt. It is the spine of comparison quality:
//   Claude compares competitors against what NT *actually* ships — not guesses.
//   This file is loaded by watchtower.html (via <script src="/nt-context.js">)
//   and served by server.js. It sets window.NT_CONTEXT.
//
// WHY IT LIVES IN ITS OWN FILE (not inline in watchtower.html)
//   So it can be refreshed independently of the dashboard code, by anyone on
//   the team, in one small file — no need to touch the large HTML app.
//   The tool itself never touches Confluence; this file is the hand-off point.
//   See HANDOFF.md (refresh runbook) for the full rationale + steps.
//
// HOW TO KEEP IT CURRENT (the refresh workflow)
//   In a Claude Code session connected to NinjaTrader Confluence, ask Claude to
//   SEARCH Confluence for the latest NT product, pricing, roadmap, and GTM
//   information, rewrite this string, and commit it. The whole team gets the
//   update on their next `git pull`. No API tokens, no MCP, no special setup is
//   required to RUN the tool — only to UPDATE this file.
//
//   SEARCH, don't hard-link. Confluence pages get moved, renamed, archived, or
//   superseded — fixed page IDs rot. A topic search across the relevant spaces
//   stays current where a saved link will not. Suggested approach:
//     • Spaces to favor: DPM (Product Management), DM (Marketing),
//       IL (Research & Insights), DSE/DES (Engineering trackers).
//     • Filter to recently modified (last ~30–60 days), sort by latest.
//     • Search terms: pricing / commissions / plans; roadmap; launch / GA /
//       beta; GTM; Single Stock Futures (SSF); copy trading / Project Plunder /
//       NT Prop Premium; Follow Trading / Collective2; NinjaTrader Forge;
//       Account-Level Lockout / Risk Manager; Web Trader UI; Nina / NT MCP;
//       prediction markets / Kalshi; stablecoin / Kraken; WealthKernel / PEDSL.
//     • Always cross-check LIVE-vs-roadmap and exact dates/pricing before trust.
//       Commission cents and a few standing facts (Account Dashboard, NT Connect)
//       live on PUBLIC ninjatrader.com pages, not Confluence — verify there.
//   Cloud: ninjatrader.atlassian.net
//
// LAST REFRESHED: 2026-07-07  (by Jack Madera, via Claude + Confluence — full refresh
//   from the RYG report, NTT Marketing Huddle, and PMM:PM Sync. NOTE: the Confluence
//   SSF Release Timeline page still showed the pre-slip July 12/13 dates at refresh
//   time; the locked July 27 first-trade date comes from CME's press release and the
//   July 2 SSF GTM sync, which are newer than the Confluence pages.)
//
// LAST-REFRESH SOURCES (starting points only — verify they still exist and
// RE-SEARCH for newer/moved pages; do not assume these IDs are still canonical):
//   • DPM — Single Stock Futures Release Timeline ............ page 5394694159 (WARNING: lagged the July 27 slip as of 2026-07-07 — cross-check dates against the latest GTM sync)
//   • DPM — PRD: NT Copy Trader ............................. page 5301010433
//   • DM  — Project Plunder: Detailed organic content plan .. page 5414355066
//   • DM  — NTT Marketing Huddle (weekly GTM status) ........ page 5056757825
//   • DM  — NTT - PMM:PM Sync (feature status by week) ...... page 5097717777
//   • DM  — Messaging - Existing Features (WIP) ............. page 4990566475
//   • DPM — Initiative Status & RYG Report (cross-product) .. page 5416812546 (best single status snapshot)
//   • DPM — Mini PRD: NINA Integration with NT MCP .......... page 5368184852
//   • DPM — NinjaTrader Forge (+ PRD) ...................... pages 5328863332 / 5337022544
//   • DM  — Prediction Markets - Signal Phase .............. page 5138219017
//   • DSE — Web Trader Alpha — Sprint Tracker .............. page 5139234859 (Open Beta date)
// ═════════════════════════════════════════════════════════════════════════

window.NT_CONTEXT = `NINJATRADER — WHAT WE ACTUALLY ARE (factual baseline for every comparison; do NOT invent NT features or capabilities not listed here, and distinguish LIVE products from ROADMAP — never claim NT ships something still in development):
• WHO WE ARE: a US futures & options-on-futures trading PLATFORM and brokerage for active, self-directed traders. Operating since 2003, ~2M users, consistently rated a top / "Best Futures Broker." NFA-regulated FCM (NinjaTrader Clearing). Acquired by Kraken (Payward) for ~$1.5B (deal closed May 2025), which adds crypto/stablecoin reach and scale — but NT remains a futures-first brokerage. NT's edge is depth and control for serious traders (advanced charting, order-flow analytics, automation) — NOT a simplified mass-retail app.
• PLATFORMS: a modern platform on DESKTOP (flagship NinjaTrader 8, Windows-first, the deepest toolset), WEB, and MOBILE (iOS/Android). A Web Trader UI refresh is in beta — early-access/closed beta running now, OPEN beta launching the week of July 13 2026 (live-trading flip still pending beta feedback; demo-first), GA targeted ~Aug 28 2026. A unified account Dashboard is LIVE — the single hub for funding, tax docs, performance tracking, education, and community.
• SIGNATURE TOOLS (LIVE): SuperDOM (fast one-click order ladder); Order Flow+ (premium order-flow analytics) and Trader+ (premium tools incl. ATM automated trade management, advanced alerts); 100+ indicators; Strategy Analyzer + Market Replay (backtesting/replay); NinjaScript (C# framework to build, backtest, and automate strategies). Large third-party Ecosystem/marketplace (1,000s of add-ons) plus a REST API. "AI Generate" is an experimental genetic-algorithm strategy optimizer inside Strategy Analyzer; an AI Strategy Builder + "Ear to the Ground" desktop AI features are targeting GA ~Aug 4 2026.
• PRICING (per-side commissions by plan; tiered model last revised ~June 2025 — verify cents against the public ninjatrader.com fee page): Free — ~$1.29 standard/E-mini, ~$0.39 micro; Monthly ($99/mo) — ~$0.99 / ~$0.29; Lifetime ($1,499 one-time) — ~$0.59 / ~$0.09. No account minimums. On top: exchange/clearing/NFA fees (~$0.19–0.25/contract) + routing via CQG or Rithmic, and a $35/mo inactivity fee on the Free plan (charged once funded if no round-trip that month; legacy accounts on the older $25 fee). Every plan includes Desktop+Web+Mobile, top-of-book data, advanced charting, and free unlimited simulated trading; a funded live account unlocks real-time data, Order Flow+, and Market Replay. Low margins (~$50 intraday micros, ~$500 popular index futures).
• MARKETS & CONNECTIVITY: 100+ futures contracts (equity index, rates, metals, energy, ag) plus forex (competitive spreads, high-speed FX execution) and options on futures; sizes from standard/E-mini down to micro (MES, MNQ…) and nano (1/100th); crypto futures (micro BTC/ETH via CME, nano BTC/ETH via Coinbase Derivatives). Exchange access: CME Group, ICE US, Eurex. The platform is broker-agnostic — beyond NT Brokerage it connects to third-party brokers (AMP, etc.) via CQG/Rithmic with a Multi-Broker subscription.
• NINA — NT's in-platform AI assistant (LIVE and expanding). Today Nina is a COACHING / INSIGHTS assistant: it surfaces trade insights ("Nina Insights" — Nina Trading Insights began a staged rollout ~late June 2026), educates, answers questions, and delivers in-app "nudges." Confirmed in build for Q3 2026 (three mini-PRDs): an Insights "discover" layer, a web-app "nudge"/intercept layer, and a "chat-to-action" spine via NT's MCP (the Q3 foundation — audited, gated writes). CRITICAL: Nina is NOT an autonomous/agentic system that trades on a user's behalf — even the Q3 chat-to-action work is assistant-mediated and audited. Do NOT equate Nina with competitor "agentic trading" / auto-execution agents (false comparison); compare on accurate grounds (coaching/insights/education AI), and where a competitor ships autonomous execution NT has no equivalent of, say so plainly. (A "Digital Trading Coach" insight type — flags trader warning signs and suggests risk adjustments — is on the Q3 roadmap within Nina Insights, not yet shipped.)
• ACTIVE TIER-1 LAUNCH — SINGLE STOCK FUTURES (SSF): single-name futures listed with CME. LAUNCH DATE IS LOCKED: first trade date is July 27 2026 — CME's press release named the date explicitly. (This moved from the earlier July 13 target; the whole NT rollout sequence shifted ~2 weeks with it.) 54 top US names (S&P 500 / Nasdaq-100 / Russell 1000 — e.g. NVDA, TSLA, META, GOOGL; 4 already live as test instruments: SGOOG, SMETA, SNVDA, STSLA), financially settled, ~6x capital efficiency, near-24h trading. Day-1 tradable scope was tracking ~13 of the 54 names, and CME plans ~20 additional MICRO SSF contracts on/near day one; CME has confirmed a $1M Q3 marketing co-op. NT go-to-market: pre-launch comms (in-app "coming soon" + standalone risk-disclosure page) begin ~July 13; trader-facing marketing launch July 27 with ORGANIC channels only on day one; PAID channels held until ~July 29 at the earliest, gated on liquidity and product stability. Lucid is NT's first SSF prop partner. First-mover window in US retail vs IBKR/TradeStation/Saxo; internally framed as a bridge to attract newer traders. (A SSF-leveraged "self-prop" angle is also planned.)
• EVAL / PROP LAYER (two parts): (a) NT Technologies ("NT Tech") supplies platform, tech and infrastructure to many third-party prop firms (so some "competitors" are also customers — weigh that before framing a prop signal as a pure threat); (b) NT runs its OWN funded/evaluation programs — NinjaTrader Prop and Tradovate Prop (eval challenges that scale to simulated-funded tiers which convert to live on passing). LIVE/IN-FLIGHT risk guardrails: Account-Level Lockout (manual lockout / risk discipline — shipped AFTER TopStep had it): the MOBILE lockout has SHIPPED (live in production, zero admin escalations); the WEB lockout is in BETA (Lucid cohort, ~100 users) with a GA target ~July 29 2026; a DESKTOP-native Prop Trader Lockout is in the NT Desktop 8.1.8.0 release targeted ~July 7 2026. Lockout is heavily used — tens of thousands of manual lockout events across ~20K unique users per week, a strong risk-discipline proof point vs TopStep. Auto-liquidation / Risk Manager is live; Risk Manager v2 is DEPLOYED and rolling out staged on Tradovate accounts (GA target ~early-to-mid July 2026), with migration to NT accounts in dev; a Trader Evaluation (TE) Dashboard for Eval firms is in beta (Lucid cohort); Simple TP/SL (one-tap attach of take-profit/stop-loss, Core + Eval) is entering BETA ~early July 2026. Trade Copier (mirror trades across accounts) is live. International expansion is active and now runs through WealthKernel (UK, gated on UK regulatory approval) and the NT-EU / PEDSL program (EU), rather than a generic "UK/EU push."
• ENGAGEMENT / GROWTH: Arena — simulated funded-trading competitions (single/multi/five-day; trade-level insights + discipline/consistency improvements on the Q3 roadmap; extending access to non-NTB users); Sim+ enhanced simulator; lifecycle messaging on Braze. UFC brand partnership in flight — first major event activation July 11 2026 (UFC 329), co-marketed with prop partner Tradeify (new-customer-only offer). TWO DISTINCT COPY/SOCIAL-TRADING EFFORTS — do not conflate them: (1) "FOLLOW TRADING" — a Growth/TE social/copy-trading pilot powered by a Collective2 white-label (first live leader onboarded, ramping July 2026); and (2) MAJOR NEW LAUNCH — "PROJECT PLUNDER" (internal codename only; consumer name NOT finalized, "Premium" is a placeholder): NT Prop's FIRST direct-to-consumer recurring-revenue subscription, anchored to NATIVE, cloud-based, MULTI-FIRM COPY TRADING. It lets a trader link prop accounts across NT/TDV Prop-enabled firms under ONE login and run leader/follower copy trading (one leader, up to 20 followers) with platform-native guaranteed-price fills — no third-party tool, no VPS, no desktop required. Tiers: Essential (free) vs Premium (~$49/mo, ~$39/mo annual, 7-day trial); a Pro tier is anchored as "coming 2027." Marketing GTM target ~Aug 10 2026 (flexible; leadership channel + investment plan review mid-July 2026); full production rollout trails to end-Aug/early-Sep. It DIRECTLY targets third-party copier tools (Tradesyncer, Replikanto — $39–$149/mo) and aims to win switchers from TopStepX, TradeSea, and WealthCharts. Month-1 goal ~40K sign-ups.
• ON THE HORIZON: PREDICTION / EVENT MARKETS — an Innovation Lab platform routing Kalshi event contracts (predict.ninjatrader.com) with a trader-grade UI (DOM, brackets, risk controls); now in ALPHA heading to closed beta (a coming differentiator, currently a standalone platform). NINJATRADER FORGE — a modernized desktop client (Electron/React rebuild of NT Desktop, AI-assisted workflows, cross-platform, marketplace-driven Ecosystem, reusing the existing NT engine); Q4 2026 target, in discovery/validation — a strategically significant desktop bet. Stablecoin / Kraken-wallet funding (Kraken synergy) — target ~Aug 1 2026. Continued Nina/AI expansion — internally NT sees a ~2-3 quarter window before competitor "AI in futures" matures. (Kraken-side: Kraken Perps launched and crypto-collateral / perps work is in flight — relevant only where it bleeds into futures.)
• B2B (OUT OF SCOPE for this briefing): NT Connect (NTC) — partner/brokerage infrastructure letting fintechs/brokerages offer regulated futures AND prediction markets via one API (distinct from NT Tech / NTT). Do not treat as a D2C competitor signal.
• TRADOVATE: ACQUIRED by NinjaTrader — part of NT, NOT a competitor. Never treat Tradovate as a rival.
• STRATEGIC FRAME: NinjaTrader wins by serving the Disciplined & Strategic (D&S) trader — someone who treats trading as a craft — across Novice → Persistent → Prosumer stages. FUTURES-FIRST LENS: NT competes in US futures, options-on-futures, and prop/eval-funded FUTURES trading. Weigh every competitor signal by its relevance to that futures-first business — a competitor's equities-only, crypto-only, or general-investing move matters mainly insofar as it bleeds into futures, prop/eval-funded futures, or the copy-trading funnel above. PARTNER-VS-THREAT NUANCE: because NT Tech powers many third-party prop firms, a given prop competitor may be partly a customer/partner — note that dynamic rather than framing every prop move as a pure threat. Known vulnerability: loyalty leans on switching costs more than deep belief NT helps traders reach their goals. The job of this briefing is to find where competitors are gaining ground in futures and where NT has a credible, ownable response — not to predict NT's demise.`;
