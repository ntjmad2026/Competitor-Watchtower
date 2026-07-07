#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Competitor Watchtower — test & validation harness
//
// WHY THIS EXISTS
//   The advice when this tool moved off Claude chat was: "write tests to
//   validate the data and logic before circulating to PMMs." This harness is
//   that gate. It has NO dependencies — plain Node. Run it before you share a
//   build or after editing the registry / NT context.
//
// WHAT IT CHECKS (offline, fast — no API calls, no token needed):
//   1. Config integrity — every BU competitor resolves to a registry entry,
//      every registry entry is used by a BU, and each has a site + logo. This
//      is the check that catches the classic "added a competitor, forgot a
//      lookup → silently researched the wrong company" mistake.
//   2. Recency logic — the 7 / 28 / 60-day windows behave at the boundaries.
//   3. Scoring — futures-weighted threat + biggest-move selection are sane and
//      deterministic (same input → same output).
//   4. JSON repair — safeJSON survives the malformed model output it must.
//   5. NT context invariants — the non-negotiable facts are present and the
//      LIVE-vs-ROADMAP / "Nina is not an auto-trader" / "Tradovate is ours"
//      guardrails still hold.
//
// OPTIONAL LIVE SMOKE TEST (needs the server running + a valid token):
//   node test.js --live      → also hits GET / , GET /nt-context.js , and a
//                              tiny POST /api/messages ping on localhost:8787.
//
// Usage:  node test.js   (alias: npm test)   |   node test.js --live
// Exit code is non-zero if any check fails, so CI / a pre-share script can gate on it.
// ─────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = fs.readFileSync(path.join(__dirname, 'watchtower.html'), 'utf8');

// ── tiny test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failed++; failures.push(msg); console.log('  ✗ ' + msg); } }
function section(name) { console.log('\n• ' + name); }
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); // n days from today, YYYY-MM-DD

// ── Load the dashboard's pure logic + config WITHOUT a browser ─────────────
// We evaluate the inline <script> with minimal DOM stubs (nothing in it runs the
// DOM at load time) and hand back the functions/objects we want to exercise.
function loadApp() {
  const body = HTML.match(/<script>([\s\S]*)<\/script>/)[1];
  const stubs = `
    const window={NT_CONTEXT:'',addEventListener(){}};
    const document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
    const localStorage={getItem:()=>null,setItem(){},removeItem(){}};
    const navigator={clipboard:{writeText(){}}};
    const requestAnimationFrame=cb=>{ if(cb) cb(); return 0; };
  `;
  const exports = 'return {BUS,COMP,SEARCH_SITE,COMP_LOGO_DOMAIN,SEARCH_QUALIFIER,COMP_DOMAINS,buildQueries,dayNum,recencyTier,withinWeek,withinWindow,itemScore,computeThreat,computeBiggestMoves,headlineOverlap,safeJSON,slug};';
  // eslint-disable-next-line no-new-func
  return new Function(stubs + '\n' + body + '\n' + exports)();
}

let app;
try { app = loadApp(); }
catch (e) { console.error('FATAL: could not evaluate watchtower.html inline script:\n', e); process.exit(1); }

// ── 1. CONFIG INTEGRITY ────────────────────────────────────────────────────
section('Config integrity (BU lists ↔ competitor registry)');
const { BUS, COMP, SEARCH_SITE, COMP_LOGO_DOMAIN, SEARCH_QUALIFIER, COMP_DOMAINS } = app;
const buNames = Object.values(BUS).flatMap(b => b.comps);
const regNames = Object.keys(COMP);

ok(buNames.length === new Set(buNames).size, 'no competitor is listed in two BUs at once');
for (const name of buNames) {
  ok(COMP[name], `BU competitor "${name}" has a registry (COMP) entry`);
  if (COMP[name]) {
    ok(!!COMP[name].site, `"${name}" has a search site: query`);
    ok(!!COMP[name].logo, `"${name}" has a logo domain`);
  }
}
for (const name of regNames) ok(buNames.includes(name), `registry entry "${name}" is used by a BU (no orphans)`);
// Derived lookups must agree with the registry (this is the consolidation's whole point)
ok(regNames.every(n => SEARCH_SITE[n] === COMP[n].site), 'SEARCH_SITE derives correctly from COMP');
ok(regNames.every(n => COMP_LOGO_DOMAIN[n] === COMP[n].logo), 'COMP_LOGO_DOMAIN derives correctly from COMP');
ok(Object.keys(SEARCH_QUALIFIER).every(n => COMP[n] && COMP[n].qualifier), 'SEARCH_QUALIFIER only holds competitors that declared one');
ok(Object.keys(COMP_DOMAINS).every(n => Array.isArray(COMP[n].official)), 'COMP_DOMAINS only holds look-alikes with an official-domain list');
// The two rules that must never silently break:
ok(!regNames.some(n => /tradovate/i.test(n)) && !buNames.some(n => /tradovate/i.test(n)), 'Tradovate is NOT a tracked competitor (it is owned by NT)');
ok(!buNames.some(n => /^tradingview$/i.test(n)), 'TradingView is NOT a direct competitor in any BU (it is a charts partner)');

// buildQueries: a missing site must SKIP the site query (never fabricate one)
section('Locked query builder');
const q = app.buildQueries('AlphaTrader');
ok(Array.isArray(q.positioning) && q.positioning.length === 2, 'positioning produces 2 locked queries');
ok(q.positioning.every(s => /prop OR futures/.test(s)), 'AlphaTrader namesake qualifier is applied to non-site queries');
ok(q.launches.some(s => /site:/.test(s)), 'a site: query is included when the competitor has a domain');
const fake = app.buildQueries('NoSuchCompetitor');
ok(fake.launches.every(s => !/site:/.test(s)), 'a competitor with no registry entry gets NO site: query (no wrong-company risk)');

// ── 2. RECENCY LOGIC ────────────────────────────────────────────────────────
section('Recency windows (7 / 28 / 60 days, enforced in code)');
ok(app.recencyTier(day(-2)) === 'recent', '2 days ago → recent');
ok(app.recencyTier(day(-27)) === 'recent', '27 days ago → recent (inside 28-day window)');
ok(app.recencyTier(day(-40)) === 'standing', '40 days ago → standing (older but in 60-day context)');
ok(app.recencyTier(day(-90)) === 'drop', '90 days ago → drop');
ok(app.recencyTier(day(10)) === 'drop', 'a future date → drop');
ok(app.recencyTier('') === 'drop' && app.recencyTier('not a date') === 'drop', 'undated / unparseable → drop');
ok(app.withinWeek(day(-3)) === true && app.withinWeek(day(-10)) === false, '"this week" is strictly the last 7 days');

// ── 3. SCORING (futures-weighted, deterministic) ─────────────────────────────
section('Threat + biggest-move scoring');
ok(app.itemScore({ significance: 3, futures_relevance: 'high' }) === 3, 'high-futures major move scores full weight (3 × 1.0)');
// A MINOR but high-futures move (1 × 1.0 = 1.0) must outrank a MAJOR but low-futures one (3 × 0.2 = 0.6).
ok(app.itemScore({ significance: 1, futures_relevance: 'high' }) > app.itemScore({ significance: 3, futures_relevance: 'low' }), 'futures weighting lets a high-futures minor move outrank a flashy non-futures major move');
const lowThreat = { positioning_moves: [{ significance: 1, futures_relevance: 'low', date: day(-3) }], launches: [] };
const highThreat = { positioning_moves: [{ significance: 3, futures_relevance: 'high', date: day(-2) }, { significance: 3, futures_relevance: 'high', date: day(-3) }], launches: [{ significance_score: 3, futures_relevance: 'high', date: day(-1) }] };
ok(app.computeThreat(lowThreat) === 'low', 'a single minor non-futures move → low threat');
ok(app.computeThreat(highThreat) === 'high', 'multiple major futures moves this week → high threat');
ok(app.computeThreat(lowThreat) === app.computeThreat(lowThreat), 'threat is deterministic (same input → same output)');
const bm = app.computeBiggestMoves([{ competitor: 'Foo', positioning_moves: [{ title: 'A', summary: 's', significance: 3, futures_relevance: 'high', date: day(-1) }], launches: [] }], []);
ok(bm.length === 1 && bm[0].competitor === 'Foo' && bm[0].rank === 1, 'biggest-move selection ranks and returns the scored item');
ok(app.computeBiggestMoves([], []).length === 0, 'no data → no biggest moves (graceful, not a crash)');

// ── 3b. REGRESSION GUARDS — the June 29 fix set. These four bugs shipped once
//        (a fork lost them silently); each now has a guard so they can't return. ──
section('Regression guards (June 29 fix set)');
ok(app.itemScore({ significance: 9, futures_relevance: 'high' }) === 3, 'significance is clamped to [1,3] — a malformed model value cannot inflate scores');
ok(app.computeThreat({ positioning_moves: [{ significance: 9, futures_relevance: 'high', date: day(-1) }], launches: [] }) !== 'high', 'one malformed item alone cannot produce a HIGH threat');
const leadBm = app.computeBiggestMoves([{ competitor: 'X', positioning_moves: [
  { title: 'old-20d', summary: 's', significance: 3, futures_relevance: 'high', date: day(-20) },
  { title: 'fresh-5d', summary: 's', significance: 2, futures_relevance: 'high', date: day(-5) },
], launches: [] }], []);
ok(leadBm.length === 1 && leadBm[0].headline === 'fresh-5d', 'Lead Signal pool is capped at LEAD_DAYS — a 20-day-old move cannot win the spotlight');
ok(/LEAD_DAYS=10/.test(HTML), 'LEAD_DAYS constant is present and set to 10 (matches the README\'s "last 10 days")');
const unvBm = app.computeBiggestMoves([{ competitor: 'X', positioning_moves: [{ title: 'u', summary: 's', significance: 3, futures_relevance: 'high', date: day(-1), _v: 'unverified' }], launches: [] }], []);
ok(unvBm[0] && unvBm[0]._v === 'unverified', 'verification status (_v) travels through biggest-move selection to the spotlight');
ok(/spotBadge/.test(HTML), 'the spotlight template renders an unverified badge (spotBadge) for unconfirmed lead moves');
ok(/positioning_moves:\(r\.positioning_moves\|\|\[\]\)\.slice\(0,5\)/.test(HTML) && /launches:\(r\.launches\|\|\[\]\)\.slice\(0,5\)/.test(HTML), 'saveHistory keeps 5 positioning/launches (same as the live cap — a reopened briefing keeps the same lead signal)');

// ── 3c. FIRST-RUN SETUP GUARDS (server.js) — the in-browser token page that
//        replaces manual .env creation. Static invariants only; the live flow
//        is exercised manually (setup page → validate → .env → dashboard). ──
section('First-run setup (server.js)');
const SRV = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
ok(/\/api\/setup-token/.test(SRV), 'the token-entry endpoint exists (/api/setup-token)');
ok(/hasCred\(\)/.test(SRV) && /setupPage\(\)/.test(SRV), 'GET / serves the setup page when no credential is present');
ok(/isLoopback/.test(SRV), 'token submission is loopback-only (never accepted from the network)');
ok(/mode:\s*0o600/.test(SRV), '.env is written with owner-only permissions');
ok(/sk-ant-\[A-Za-z0-9_-\]/.test(SRV), 'tokens are format-checked before any live validation');
ok(!/console\.(log|warn|error)\([^)]*\$\{token/.test(SRV), 'the token value is never interpolated into a log line');
ok(/url === '\/setup'/.test(SRV), '/setup re-opens the page for token rotation');

// ── 4. JSON REPAIR ───────────────────────────────────────────────────────────
section('safeJSON model-output repair');
ok(app.safeJSON('{"a":1}', null).a === 1, 'parses clean JSON');
ok(app.safeJSON('```json\n{"a":1}\n```', null).a === 1, 'strips markdown code fences');
ok(app.safeJSON('here is the data {"a":1} thanks', null).a === 1, 'recovers JSON wrapped in prose');
ok(app.safeJSON('{"ok":true,"obj":{"n":1},"list":["a"', null) !== null, 'closes a truncated object/array rather than failing (needs ≥1 close brace to anchor the repair)');
ok(app.safeJSON('not json at all', 'FB') === 'FB', 'returns the fallback when truly unparseable');

// ── 5. NT CONTEXT INVARIANTS ─────────────────────────────────────────────────
section('NT context invariants (the facts the briefing must never get wrong)');
const ctxSrc = fs.readFileSync(path.join(__dirname, 'nt-context.js'), 'utf8');
const ctxWin = { };
new Function('window', ctxSrc)(ctxWin); // eslint-disable-line no-new-func
const ctx = ctxWin.NT_CONTEXT || '';
ok(ctx.length > 2000, 'NT_CONTEXT is populated');
ok(/NOT an autonomous|NOT an agentic|not an? (autonomous|agentic)/i.test(ctx), 'Nina is explicitly NOT an autonomous/agentic auto-trader');
ok(/Tradovate[\s\S]{0,80}(part of NT|owned by|NOT a competitor)/i.test(ctx), 'Tradovate is flagged as owned by NT, never a competitor');
ok(/ROADMAP/i.test(ctx) && /LIVE/i.test(ctx), 'context distinguishes LIVE from ROADMAP');
ok(/futures-first/i.test(ctx), 'the futures-first strategic lens is present');
ok(/Single Stock Futures|SSF/.test(ctx), 'the active SSF launch is covered');
ok(/LAST REFRESHED/.test(ctxSrc), 'the file carries a LAST REFRESHED date (refresh discipline)');

// ── summary ──────────────────────────────────────────────────────────────────
function report() {
  console.log('\n' + '─'.repeat(60));
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed) { console.log('\n  FAILURES:'); failures.forEach(f => console.log('   ✗ ' + f)); }
  console.log('─'.repeat(60) + '\n');
  process.exit(failed ? 1 : 0);
}

// ── OPTIONAL: live server smoke test (node test.js --live) ────────────────────
if (process.argv.includes('--live')) {
  const PORT = process.env.PORT || 8787;
  const base = `http://localhost:${PORT}`;
  (async () => {
    section('Live smoke test (' + base + ')');
    try {
      const home = await fetch(base + '/');
      const html = await home.text();
      ok(home.ok && /Competitor Watchtower/.test(html), 'GET / serves the dashboard');
      const ntc = await fetch(base + '/nt-context.js');
      ok(ntc.ok && /NT_CONTEXT/.test(await ntc.text()), 'GET /nt-context.js serves the context');
      const ping = await fetch(base + '/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'Reply with exactly: ready' }] })
      });
      const pj = await ping.json();
      ok(ping.ok && /ready/i.test((pj.content || []).map(b => b.text).join('')), 'POST /api/messages bridges to the SDK and returns text');
    } catch (e) {
      ok(false, 'live server reachable on ' + base + ' (start it first: node server.js) — ' + e.message);
    }
    report();
  })();
} else {
  report();
}
