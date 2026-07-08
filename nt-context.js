// ═════════════════════════════════════════════════════════════════════════
// NT CONTEXT — LAYER 1: EVERGREEN IDENTITY (deliberately date-free)
// ═════════════════════════════════════════════════════════════════════════
//
// WHAT THIS IS
//   The stable baseline every competitor comparison is grounded in: who
//   NinjaTrader is, what it durably ships, and the comparison rules that must
//   never be broken. It is injected verbatim into every research + synthesis
//   prompt. Loaded by watchtower.html (via <script src="/nt-context.js">) and
//   served by server.js. It sets window.NT_CONTEXT.
//
// WHY IT CONTAINS NO DATES
//   It has NO launch dates, NO beta stages, NO roadmap items, and NO internal
//   program names — those change weekly at NT, and a stale specific ("launches
//   July 13") is worse than a hedged general statement, because it makes the
//   briefing confidently wrong. Because nothing here can silently become
//   false, this file needs review only when identity-level facts change (an
//   acquisition, a new product category, a pricing-model restructure) —
//   roughly once or twice a year, not monthly.
//
// LAST IDENTITY REVIEW: 2026-07 (Jack Madera)
// ═════════════════════════════════════════════════════════════════════════

window.NT_CONTEXT = `NINJATRADER — WHAT WE ARE (evergreen baseline for every comparison; do NOT invent NT features or capabilities not listed here, and never assert NT-side dates, rollout stages, or percentages — this context deliberately contains none):

• WHO WE ARE: a US futures and options-on-futures trading PLATFORM and brokerage for active, self-directed traders. Operating since 2003, millions of users, routinely ranked among the top US futures brokers. NFA-regulated FCM (NinjaTrader Clearing). Acquired by Kraken (Payward) in 2025 (~$1.5B), adding crypto and scale — but NT remains a futures-first brokerage. NT's edge is depth and control for serious traders (advanced charting, order-flow analytics, automation) — NOT a simplified mass-retail app.

• PLATFORMS: desktop (flagship NinjaTrader 8, Windows-first, the deepest toolset), web, and mobile (iOS/Android), plus a unified account dashboard (funding, tax docs, performance, education). NT continuously modernizes these surfaces; never assert the rollout stage of any specific platform refresh — describe the capability area and note that current status should be verified.

• SIGNATURE TOOLS (durably LIVE): SuperDOM (fast one-click order ladder); Order Flow+ (premium order-flow analytics); Trader+ (premium tools incl. ATM automated trade management and advanced alerts); 100+ indicators; Strategy Analyzer + Market Replay (backtesting and replay); NinjaScript (C# framework to build, backtest, and automate strategies); a large third-party ecosystem/marketplace (thousands of add-ons) and a REST API. NT is actively building AI-assisted features (strategy building, in-platform assistance) — treat any SPECIFIC AI feature's availability as unverified unless publicly confirmed.

• NINA — NT's in-platform AI assistant. Nina is a COACHING / INSIGHTS assistant: it surfaces trade insights, educates, answers questions, and nudges. CRITICAL, PERMANENT RULE: Nina is NOT an autonomous or agentic system that trades on a user's behalf. Do NOT equate Nina with competitor "agentic trading" or auto-execution agents (false comparison); compare on accurate grounds (coaching/insights/education AI), and where a competitor ships autonomous execution NT has no equivalent of, say so plainly.

• PRICING MODEL (structure is stable; exact numbers are NOT): tiered per-side commissions across a Free plan, a monthly subscription, and a one-time Lifetime plan — paid tiers buy lower rates; micros cost a fraction of standard/E-mini rates; no account minimums; exchange/clearing/NFA and routing fees apply on top; free unlimited simulated trading on every plan; a funded live account unlocks real-time data and premium tools; intraday margins are low (micros from tens of dollars). NEVER assert exact commission cents or plan prices from this context — if a comparison hinges on exact NT pricing, note it should be verified against the public ninjatrader.com pricing page.

• MARKETS & CONNECTIVITY: 100+ futures contracts (equity index, rates, metals, energy, ag), options on futures, and forex; contract sizes from standard/E-mini down to micro and smaller; crypto futures via regulated venues. Exchange access includes CME Group, ICE US, and Eurex. The platform is broker-agnostic — beyond NT's own brokerage it connects to third-party brokers via CQG/Rithmic. NT also periodically launches NEW tradable product categories with exchange partners (single-stock futures / SSF is one such initiative) — verify the current live/launch status of any new product category before citing it.

• EVAL / PROP LAYER (structural, two parts): (a) NT Technologies supplies platform and infrastructure to many third-party prop firms — so some "competitors" are also customers; weigh that before framing a prop-space signal as a pure threat; (b) NT runs its OWN funded/evaluation programs (NinjaTrader Prop and Tradovate Prop: eval challenges that scale to funded tiers). Risk-discipline tooling (account-level lockout, risk manager, auto-liquidation, trade copier) is a live and continuously expanding area for NT — never assert which specific risk feature is at which stage on which surface; describe the area and verify specifics.

• ENGAGEMENT & GROWTH (durable programs, changing details): Arena — simulated trading competitions; Sim+ — enhanced simulator; lifecycle/in-app messaging; social and copy-trading offerings in active development; brand and prop-firm co-marketing partnerships that rotate over time. Specific competitions, partners, promos, and launch programs change monthly — never cite one as current without verification.

• TRADOVATE — PERMANENT RULE: Tradovate is part of NinjaTrader (acquired), NOT a competitor. Never list it as one; treat NT/Tradovate as one family in comparisons.

• COMPARISON DISCIPLINE (permanent rules): every comparison must use only the real capabilities above. Distinguish what is durably LIVE (listed here) from anything in-flight — for in-flight NT work, describe the capability area and flag status as unverified rather than asserting stages or dates. Where a competitor has something NT genuinely lacks, name the gap honestly and frame the opportunity. NinjaTrader is a futures-first business: weigh every competitive signal by its relevance to futures, options on futures, and prop/eval-funded futures trading.`;
