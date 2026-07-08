#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Competitor Watchtower — local server (Claude Agent SDK edition)
//
// Serves watchtower.html and answers the dashboard's /api/messages
// requests through the Claude Agent SDK. The SDK reads its credentials
// from the environment automatically:
//
//   • CLAUDE_CODE_OAUTH_TOKEN  → uses your Claude subscription (no API $)
//   • ANTHROPIC_API_KEY        → uses API credits (takes precedence if both set)
//
// This file NEVER reads or hardcodes the secret — the SDK picks it up from
// the env, so the exact same code path works in local dev and in production.
//
// Usage:  node server.js
// ─────────────────────────────────────────────────────────────
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '@anthropic-ai/claude-agent-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load local env from a gitignored .env (no-op if the file is absent).
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* no .env */ }

const PORT = process.env.PORT || 8787;
let REQ_SEQ = 0; // per-boot API call counter, used by the terminal narration below
const HTML_FILE = path.join(__dirname, 'watchtower.html');
const CONTEXT_FILE = path.join(__dirname, 'nt-context.js');

// ── Startup credential diagnostics (informational only — the SDK does the
//    actual auth from the env; we never branch app logic on this) ──────────
function reportAuth() {
  const hasKey = !!(process.env.ANTHROPIC_API_KEY || '').trim();
  const hasOAuth = !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || '').trim();
  if (hasKey && hasOAuth) {
    console.warn('  ⚠  Both ANTHROPIC_API_KEY and CLAUDE_CODE_OAUTH_TOKEN are set.');
    console.warn('     The API key WINS and your subscription token is ignored.');
    console.warn('     For subscription (no-cost) testing, unset the API key:');
    console.warn('         unset ANTHROPIC_API_KEY   (and remove it from .env)\n');
  } else if (hasOAuth) {
    console.log('  ✓ Auth: Claude subscription OAuth token (no API credits used).\n');
  } else if (hasKey) {
    console.log('  ✓ Auth: ANTHROPIC_API_KEY (usage billed to your API account).\n');
  } else {
    console.log('  ● First-run setup: no credential yet — that\'s expected on a fresh install.');
    console.log('    The page that opens in your browser will ask for your Claude token.');
    console.log('    Paste it there and you\'re done. (Manual alternative: see the README.)\n');
  }
}

// ── Translate a Messages-API-shaped body into one Agent SDK run ───────────
function buildPrompt(messages) {
  const list = Array.isArray(messages) ? messages : [];
  const userMsgs = list.filter(m => m.role !== 'assistant');
  // Single user turn (the common case for this app): pass the content straight through.
  if (list.length === 1 || userMsgs.length === 1) {
    const m = list[list.length - 1];
    return typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
  }
  // Multi-turn: flatten into a labelled transcript.
  return list.map(m => {
    const c = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
    return `${String(m.role).toUpperCase()}: ${c}`;
  }).join('\n\n');
}

async function runAgent(body) {
  const { model, system, messages, tools, thinking } = body;
  const wantsWebSearch = Array.isArray(tools)
    && tools.some(t => /web_search/i.test((t && (t.type || t.name)) || ''));

  const options = {
    model,
    // A plain string fully REPLACES the Claude Code agent system prompt with the
    // app's own (data-extraction / fact-checker / strategist) prompt. When the
    // app sends none, use a neutral default so we behave like the raw Messages
    // API rather than the full Claude Code agent persona.
    systemPrompt: (typeof system === 'string' && system)
      ? system
      : 'You are a helpful assistant. Answer directly and follow the user\'s instructions exactly.',
    // Restrict the available built-in tools: web search + web fetch when asked, else none.
    // WebFetch lets the messaging research read a competitor's live homepage directly
    // (site: search snippets don't expose rendered hero copy/taglines well).
    tools: wantsWebSearch ? ['WebSearch', 'WebFetch'] : [],
    allowedTools: wantsWebSearch ? ['WebSearch', 'WebFetch'] : [],
    permissionMode: 'bypassPermissions',
    settingSources: [],            // isolation: ignore ~/.claude + project settings/CLAUDE.md
    // Every scan prompt locks its query count (research: 2 searches, messaging: fetch + 2,
    // verify: 3-search budget), so 12 turns is generous headroom. The old cap of 40 let a
    // wandering call run 15+ searches — one was observed at 437s, monopolizing rate-limit
    // capacity and slowing every sibling call in the scan.
    maxTurns: wantsWebSearch ? 12 : 2,
  };
  if (thinking && thinking.budget_tokens) options.maxThinkingTokens = thinking.budget_tokens;

  // Hard server-side deadline. The dashboard abandons a call at 210s, but without an
  // abort the SDK kept working the dead request (the 437s call above) — wasted tokens
  // and stolen throughput. 230s = the longest client timeout plus grace.
  const ac = new AbortController();
  options.abortController = ac;
  const deadline = setTimeout(() => ac.abort(), 230000);

  let stderr = '';
  options.stderr = d => { stderr += d; };

  let finalText = '';
  let assistantText = '';
  let lastResult = '';
  let assistantErr = '';
  try {
    for await (const msg of query({ prompt: buildPrompt(messages), options })) {
      if (msg.type === 'assistant') {
        for (const block of (msg.message?.content || [])) {
          if (block.type === 'text') assistantText += block.text;
        }
        if (msg.error) assistantErr = msg.error;
      } else if (msg.type === 'result') {
        lastResult = msg.result || lastResult;
        if (msg.subtype === 'success') finalText = msg.result || '';
        else if (!finalText) throw new Error('Agent run failed: ' + msg.subtype);
      }
    }
  } catch (e) {
    if (ac.signal.aborted) throw new Error('Call exceeded the 230s server deadline and was aborted.');
    // Surface the most informative diagnostic we captured, not the opaque
    // "process exited" message. The web-search server tool can fail this way.
    const detail = lastResult || assistantErr || stderr.slice(-400) || e.message;
    const hint = /tool_use ids must be unique|web.?search/i.test(detail)
      ? ' (web-search step failed at the API layer — see README troubleshooting)'
      : '';
    throw new Error(detail + hint);
  } finally {
    clearTimeout(deadline);
  }
  // A "success" result can still wrap an upstream API error in its text.
  if (/^API Error:/.test(finalText)) throw new Error(finalText);
  // Shape the reply exactly like the Anthropic Messages API so the dashboard's
  // getText()/safeJSON() parse it unchanged.
  return {
    id: 'msg_local',
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text: finalText || assistantText }],
    stop_reason: 'end_turn',
    usage: {},
  };
}

// ── First-run setup — in-browser token entry ───────────────────────────────
// If the server starts with no credential, GET / serves a one-field setup page
// instead of the dashboard: the user pastes their Claude token, we validate it
// with a real (tiny) API call, write it to .env with owner-only permissions,
// and the next page load flips straight into the app — no Terminal, no dotfile
// editing. The token value is never logged and never echoed back, and the
// endpoint only accepts requests from this machine (loopback). GET /setup
// re-opens the page any time (e.g. to rotate an expired token).
function hasCred() {
  return !!((process.env.ANTHROPIC_API_KEY || '').trim() || (process.env.CLAUDE_CODE_OAUTH_TOKEN || '').trim());
}

function setupPage() {
  return '<!doctype html><html><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<title>Watchtower — Connect your Claude account</title>'
  + '<style>'
  + 'body{margin:0;background:#f7f4ee;color:#1c1b18;font:16px/1.55 Georgia,"Times New Roman",serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}'
  + '.card{max-width:560px;width:100%;background:#fffdf8;border:1px solid #e2ddd2;border-radius:10px;padding:36px 40px;box-shadow:0 12px 40px rgba(28,27,24,.08)}'
  + '.kicker{font:600 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#e8420a;margin-bottom:10px}'
  + 'h1{font-size:26px;margin:0 0 6px;letter-spacing:-.01em}'
  + 'p{margin:10px 0;color:#4c483f}'
  + 'label{display:block;font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6b665a;margin:22px 0 8px}'
  + 'input{width:100%;box-sizing:border-box;padding:12px 14px;font:14px ui-monospace,Menlo,monospace;border:1px solid #d8d2c4;border-radius:6px;background:#fff}'
  + 'input:focus{outline:2px solid rgba(232,66,10,.2);border-color:#e8420a}'
  + 'button{margin-top:16px;width:100%;padding:13px;font:600 14px Georgia,serif;color:#fff;background:#1c1b18;border:none;border-radius:6px;cursor:pointer}'
  + 'button:hover{background:#e8420a}button:disabled{opacity:.55;cursor:wait}'
  + 'details{margin-top:20px;border-top:1px solid #eee8db;padding-top:14px}'
  + 'summary{cursor:pointer;font-weight:600;font-size:14px}'
  + 'code{display:block;background:#1c1b18;color:#f7f4ee;padding:9px 12px;border-radius:6px;font:13px ui-monospace,Menlo,monospace;margin:8px 0;user-select:all}'
  + '.hint{font-size:13px;color:#8a8474}'
  + '#msg{margin-top:14px;font-size:14px;min-height:20px}#msg.err{color:#c8362a}#msg.ok{color:#137a57}'
  + '</style></head><body><div class="card">'
  + '<div class="kicker">NinjaTrader · Competitive Intelligence</div>'
  + '<h1>Competitor Watchtower</h1>'
  + '<p>One step before your first briefing: connect your Claude account. Paste your personal token below — it is saved only on this computer.</p>'
  + '<label for="tok">Your Claude token</label>'
  + '<input id="tok" type="password" placeholder="sk-ant-…" autocomplete="off" spellcheck="false">'
  + '<div class="hint" style="margin-top:6px">It starts with "sk-ant". Treat it like a password — it is tied to your personal Claude account.</div>'
  + '<button id="save">Save and open the dashboard</button>'
  + '<div id="msg"></div>'
  + '<details><summary>How to get a token (one time, about 2 minutes)</summary>'
  + '<p class="hint" style="margin-top:10px">You need a Claude Pro or Team account (claude.ai). Open the Terminal app (Cmd+Space, type Terminal) and run these two lines. The second opens a browser login, then prints your token:</p>'
  + '<code>npm install -g @anthropic-ai/claude-code</code>'
  + '<code>claude setup-token</code>'
  + '<p class="hint">Copy the long value it prints and paste it above.</p>'
  + '</details></div>'
  + '<script>'
  + 'var btn=document.getElementById("save"),tok=document.getElementById("tok"),msg=document.getElementById("msg");'
  + 'function go(){var t=tok.value.trim();'
  + 'if(!t){msg.className="err";msg.textContent="Paste your token first.";return;}'
  + 'btn.disabled=true;msg.className="";msg.textContent="Checking your token with Claude… (a few seconds)";'
  + 'fetch("/api/setup-token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t})})'
  + '.then(function(r){return r.json().then(function(j){return{r:r,j:j};});})'
  + '.then(function(x){if(x.r.ok&&x.j.ok){msg.className="ok";msg.textContent="✓ Verified — opening your dashboard…";setTimeout(function(){location.href="/";},700);}'
  + 'else{msg.className="err";msg.textContent=x.j.error||"That token did not work — check it and try again.";btn.disabled=false;}})'
  + '.catch(function(){msg.className="err";msg.textContent="Could not reach the local server — is it still running?";btn.disabled=false;});}'
  + 'btn.addEventListener("click",go);tok.addEventListener("keydown",function(e){if(e.key==="Enter")go();});'
  + '</scr' + 'ipt></body></html>';
}

async function verifyAndSaveToken(raw) {
  const token = String(raw || '').trim();
  if (!/^sk-ant-[A-Za-z0-9_-]{20,200}$/.test(token)) {
    throw new Error('That does not look like a Claude token — it should start with "sk-ant-".');
  }
  const envName = token.startsWith('sk-ant-api') ? 'ANTHROPIC_API_KEY' : 'CLAUDE_CODE_OAUTH_TOKEN';
  // Try the new token in-process; restore the previous credential if it fails.
  const prevKey = process.env.ANTHROPIC_API_KEY, prevOauth = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY; delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  process.env[envName] = token;
  try {
    await Promise.race([
      runAgent({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'Reply with exactly: ready' }] }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Verification timed out — check your internet connection and try again.')), 60000)),
    ]);
  } catch (e) {
    delete process.env[envName];
    if (prevKey) process.env.ANTHROPIC_API_KEY = prevKey;
    if (prevOauth) process.env.CLAUDE_CODE_OAUTH_TOKEN = prevOauth;
    const m = String((e && e.message) || e);
    throw new Error(/timed out/i.test(m) ? m
      : 'Claude rejected that token. Generate a fresh one with "claude setup-token" and paste it again.');
  }
  // Verified — persist to .env (owner-only perms), keeping any non-credential settings like PORT.
  const envPath = path.join(__dirname, '.env');
  let keep = [];
  try {
    keep = fs.readFileSync(envPath, 'utf8').split('\n')
      .filter(l => /^\s*[A-Z_]+\s*=/.test(l) && !/^\s*(ANTHROPIC_API_KEY|CLAUDE_CODE_OAUTH_TOKEN)\s*=/.test(l));
  } catch { /* no .env yet */ }
  fs.writeFileSync(envPath,
    ['# Watchtower credentials — written by the setup page. Never share or commit this file.',
     envName + '=' + token, ...keep, ''].join('\n'),
    { mode: 0o600 });
}

// ── HTTP server ───────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // Token entry — accepted from this machine only.
  if (req.method === 'POST' && req.url === '/api/setup-token') {
    const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    if (!isLoopback) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Setup is only allowed from this computer.' }));
      return;
    }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', async () => {
      try {
        const { token } = JSON.parse(body || '{}');
        await verifyAndSaveToken(token);
        console.log('  ✓ Token verified and saved to .env — the dashboard is ready.\n');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String((e && e.message) || e) }));
      }
    });
    return;
  }

  // Re-open the setup page on demand (e.g. to replace an expired token).
  if (req.method === 'GET' && (req.url === '/setup' || req.url.startsWith('/setup?'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(setupPage());
    return;
  }

  if (req.method === 'POST' && req.url === '/api/messages') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      let q = {};
      try { q = JSON.parse(body || '{}'); } catch { /* runAgent surfaces bad shapes */ }
      // Narrate every call in this terminal — metadata only, never prompt content or
      // credentials — so a 5-7 minute scan is visibly alive from the server window too.
      const id = ++REQ_SEQ, t0 = Date.now();
      const kind = Array.isArray(q.tools) && q.tools.length ? 'web search' : 'direct';
      console.log(`  → [${new Date().toLocaleTimeString()}] call #${id} started · ${q.model || 'model?'} · ${kind}`);
      try {
        const reply = await runAgent(q);
        console.log(`  ✓ call #${id} finished in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reply));
      } catch (err) {
        console.log(`  ✗ call #${id} failed after ${((Date.now() - t0) / 1000).toFixed(1)}s · ${String((err && err.message) || err).slice(0, 90)}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { type: 'proxy_error', message: String(err && err.message || err) } }));
      }
    });
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/?'))) {
    // First run: no credential yet → serve the setup page instead of the dashboard.
    // hasCred() is checked per request, so finishing setup flips to the app with no restart.
    if (!hasCred()) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(setupPage());
      return;
    }
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Could not read watchtower.html — make sure it sits next to server.js.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // The NinjaTrader product context lives in its own file (nt-context.js) so it
  // can be refreshed independently of the dashboard. The dashboard loads it via
  // <script src="/nt-context.js"> to populate window.NT_CONTEXT.
  if (req.method === 'GET' && req.url === '/nt-context.js') {
    fs.readFile(CONTEXT_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Could not read nt-context.js — make sure it sits next to server.js.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

// Web-search runs can be slow; don't let Node time out the request mid-search.
server.requestTimeout = 0;
server.headersTimeout = 0;

server.listen(PORT, () => {
  console.log('\n  ✓ Competitor Watchtower is running.');
  console.log('  →  Open this in your browser:  http://localhost:' + PORT + '\n');
  reportAuth();
  console.log('  (Press Control-C in this window to stop the server.)\n');
});
