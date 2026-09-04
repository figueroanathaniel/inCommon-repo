/*! oki-api.js: inCommon OkiAPI V1.1 (UMD, pure JS, no deps).
 * Transport layer for Oki. Three tiers, in order:
 *   1. Anthropic Claude via a KEY-SAFE route (window.claude.complete in the
 *      prototype sandbox, else your proxy/cloud function). Model by mode:
 *      quick=Haiku, standard=Sonnet, deep=Opus.
 *   2. OpenAI gpt-4o-mini via the same proxy (server holds the key).
 *   3. Oki Offline Library: pre-written, epistemically tagged replies.
 *
 * KEY POLICY (hard rule): API keys NEVER ship in client code. configure()
 * throws if handed anything that looks like a raw key. Production traffic goes
 * through proxyUrl (your server/cloud function adds the key). For prototyping,
 * tokenBrokerUrl may point at a minimal backend minting session tokens that
 * expire in <= 1 hour; tokens live in memory only, never storage.
 *
 * PRIVACY: this module stores NO conversation content. Callers pass messages
 * per request (per consent, ephemeral). Only numeric usage counters are kept,
 * in memory, for this session.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.OkiAPI = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.2';
  var KEY_POLICY = 'API keys never ship in client-side code. Point proxyUrl at a server or cloud function that holds the keys; or, for prototyping only, set tokenBrokerUrl to a minimal backend that mints session tokens expiring in one hour or less. Tokens are held in memory and never persisted.';

  var CONFIG = {
    proxyUrl: '/api/oki',
    tokenBrokerUrl: null,
    // Every mode in OkiPromptBuilder.MODES must appear here. A missing key does
    // not throw: send() falls back to 'standard' and the mode silently downgrades
    // its model, its token budget and its offline branch. ('reading' was unwired
    // in V1.4.5; when it returns it needs an entry here as well as MODES and LIMITS.)
    models: { quick: 'claude-haiku-4-5', standard: 'claude-sonnet-4-5', deep: 'claude-opus-4-5' }, // update ids at integration time
    openaiModel: 'gpt-4o-mini',
    timeoutMs: 12000,
    rate: { perMinute: 6, burst: 3, minIntervalMs: 1500 }
  };

  function looksLikeRawKey(v) { return typeof v === 'string' && /^sk[-_]/i.test(v.trim()); }
  function configure(opts) {
    opts = opts || {};
    if (opts.apiKey || opts.anthropicKey || opts.openaiKey || looksLikeRawKey(opts.token)) {
      throw new Error('OkiAPI refuses raw API keys in the client. ' + KEY_POLICY);
    }
    ['proxyUrl', 'tokenBrokerUrl', 'openaiModel', 'timeoutMs'].forEach(function (k) { if (opts[k] != null) CONFIG[k] = opts[k]; });
    if (opts.models) for (var m in opts.models) if (typeof opts.models[m] === 'string' && opts.models[m]) CONFIG.models[m] = opts.models[m];
    if (opts.rate) for (var r in CONFIG.rate) if (opts.rate[r] != null) CONFIG.rate[r] = opts.rate[r];
    return { proxyUrl: CONFIG.proxyUrl, tokenBrokerUrl: CONFIG.tokenBrokerUrl, models: CONFIG.models, openaiModel: CONFIG.openaiModel };
  }

  // ---- rate limiting (token bucket + min interval) --------------------------
  var BUCKET = { tokens: CONFIG.rate.burst, stamp: Date.now(), lastReq: 0 };
  function refill() {
    var now = Date.now();
    BUCKET.tokens = Math.min(CONFIG.rate.burst, BUCKET.tokens + (now - BUCKET.stamp) * (CONFIG.rate.perMinute / 60000));
    BUCKET.stamp = now;
  }
  function rateCheck() {
    refill();
    var now = Date.now();
    var sinceLast = now - BUCKET.lastReq;
    if (sinceLast < CONFIG.rate.minIntervalMs) return { ok: false, retryAfterMs: CONFIG.rate.minIntervalMs - sinceLast };
    if (BUCKET.tokens < 1) return { ok: false, retryAfterMs: Math.ceil((1 - BUCKET.tokens) / (CONFIG.rate.perMinute / 60000)) };
    BUCKET.tokens -= 1; BUCKET.lastReq = now;
    return { ok: true };
  }
  function rateState() { refill(); return { tokensAvailable: Math.floor(BUCKET.tokens * 10) / 10, burst: CONFIG.rate.burst, perMinute: CONFIG.rate.perMinute, minIntervalMs: CONFIG.rate.minIntervalMs }; }

  // ---- usage tracking (numbers only, in-memory, this session) ---------------
  var USAGE = { requests: 0, inputTokens: 0, outputTokens: 0, errors: 0, rateLimited: 0, byProvider: { anthropic: 0, openai: 0, offline: 0 } };
  function est(text) { return Math.ceil(String(text || '').length / 4); }
  function estPayload(p) { return est(p.system) + p.messages.reduce(function (n, m) { return n + est(m.content); }, 0); }
  function track(provider, inTok, outTok) { USAGE.byProvider[provider]++; USAGE.inputTokens += inTok; USAGE.outputTokens += outTok; }
  function getUsage() { return JSON.parse(JSON.stringify(USAGE)); }
  function resetUsage() { USAGE.requests = 0; USAGE.inputTokens = 0; USAGE.outputTokens = 0; USAGE.errors = 0; USAGE.rateLimited = 0; USAGE.byProvider = { anthropic: 0, openai: 0, offline: 0 }; }

  // ---- session token broker (prototyping path; <=1h expiry; memory only) ----
  var TOKEN = { value: null, expiresAt: 0 };
  function getSessionToken() {
    if (!CONFIG.tokenBrokerUrl) return Promise.resolve(null);
    if (TOKEN.value && Date.now() < TOKEN.expiresAt - 60000) return Promise.resolve(TOKEN.value);
    return withTimeout(fetch(CONFIG.tokenBrokerUrl, { method: 'POST' }).then(function (r) {
      if (!r.ok) throw errOf('broker_http_' + r.status);
      return r.json();
    }).then(function (j) {
      var tok = j.token, exp = j.expiresAt ? Date.parse(j.expiresAt) : Date.now() + Math.min(j.expires_in || 3600, 3600) * 1000;
      if (!tok) throw errOf('broker_no_token');
      if (looksLikeRawKey(tok)) throw errOf('broker_returned_raw_key'); // a broker must mint session tokens, never hand out the real key
      TOKEN.value = tok; TOKEN.expiresAt = Math.min(exp, Date.now() + 3600000);
      return tok;
    }), CONFIG.timeoutMs);
  }

  function errOf(code, detail) { var e = new Error(detail || code); e.code = code; return e; }
  function codeOf(e) { return (e && e.code) || (e && /timeout/i.test(String(e.message)) ? 'timeout' : 'error'); }
  function withTimeout(promise, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(errOf('timeout', 'No reply in ' + ms + ' ms')); }, ms);
      promise.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function authHeaders(token) {
    var h = { 'content-type': 'application/json' };
    if (token) h.authorization = 'Bearer ' + token;
    return h;
  }

  // ---- tier 1: Anthropic ----------------------------------------------------
  function callAnthropic(payload, mode, simulateDown) {
    var model = CONFIG.models[mode] || CONFIG.models.standard;
    if (simulateDown) return Promise.reject(errOf('simulated_outage'));
    // Prototype sandbox transport: window.claude.complete (key managed by the host, never here)
    if (typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function') {
      var prompt = payload.system + '\n\n=== CONVERSATION ===\n' +
        payload.messages.map(function (m) { return m.role.toUpperCase() + ': ' + m.content; }).join('\n') + '\nASSISTANT:';
      return withTimeout(Promise.resolve(window.claude.complete(prompt)), CONFIG.timeoutMs).then(function (text) {
        if (!text || typeof text !== 'string') throw errOf('empty_completion');
        return { text: text, model: model, via: 'window.claude (host-managed key)', usage: { input: estPayload(payload), output: est(text), estimated: true } };
      });
    }
    return getSessionToken().then(function (token) {
      return withTimeout(fetch(CONFIG.proxyUrl + '/anthropic', {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ model: model, system: payload.system, messages: payload.messages, temperature: payload.temperature, max_tokens: payload.max_tokens })
      }), CONFIG.timeoutMs);
    }).then(function (r) {
      if (!r.ok) throw errOf('http_' + r.status);
      return r.json();
    }).then(function (j) {
      var text = Array.isArray(j.content) ? j.content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n') : (j.text || '');
      if (!text) throw errOf('empty_completion');
      var u = j.usage || {};
      return { text: text, model: model, via: 'proxy', usage: { input: u.input_tokens || estPayload(payload), output: u.output_tokens || est(text), estimated: !u.input_tokens } };
    });
  }

  // ---- tier 2: OpenAI fallback ----------------------------------------------
  function callOpenAI(payload, simulateDown) {
    if (simulateDown) return Promise.reject(errOf('simulated_outage'));
    var messages = [{ role: 'system', content: payload.system }].concat(payload.messages);
    return getSessionToken().then(function (token) {
      return withTimeout(fetch(CONFIG.proxyUrl + '/openai', {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ model: CONFIG.openaiModel, messages: messages, temperature: payload.temperature, max_tokens: payload.max_tokens })
      }), CONFIG.timeoutMs);
    }).then(function (r) {
      if (!r.ok) throw errOf('http_' + r.status);
      return r.json();
    }).then(function (j) {
      var text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!text) throw errOf('empty_completion');
      var u = j.usage || {};
      return { text: text, model: CONFIG.openaiModel, via: 'proxy', usage: { input: u.prompt_tokens || estPayload(payload), output: u.completion_tokens || est(text), estimated: !u.prompt_tokens } };
    });
  }

  // ---- tier 3: Oki Offline Library ----------------------------------------
  var LIB = {
    clarity: { pos: 'Fog is often a sign of too many honest options, not too few. It may show up as the same choice reading differently from different moods.', trad: 'Numerology reads a 1 Personal Year as a clearing year: old structures thin so one priority can surface.', prac: 'Name the three options out loud, then sit first with the one you defended without being asked.', q: 'If the fog lifted for one hour, what would you look at first?' },
    calm: { pos: 'A loud mind usually has one underfed worry doing most of the talking. You might recognize it by the thought that returns in the same words.', trad: 'Most traditions borrow stillness from the body first: breath before belief.', prac: 'Four slow breaths, exhale counted to six, a volume knob and not a fix.', q: 'What is the one sentence your mind keeps repeating today?' },
    courage: { pos: 'Avoidance often guards something you value, not something you fear. It may show up as protecting a relationship by not testing it.', trad: 'The I Ching tends to frame crossings like this as smaller than they look from the near bank.', prac: 'Shrink the avoided thing to its first two minutes, and do only that.', q: 'What would the bravest boring version of this step look like?' },
    connection: { pos: 'Wanting connection is already a form of it: the reach precedes the bridge. You may feel closest to people right after being honest, not impressive.', trad: 'Relational frameworks mostly agree on one mechanism: small, specific bids answered quickly.', prac: 'Send one message today that asks a real question and expects a real answer.', q: 'Who came to mind first just now, and what stopped you last time?' },
    meaning: { pos: 'Meaning tends to be assembled in hindsight, not found in the moment. Events can feel random now and patterned later.', trad: 'Traditions differ loudly here: some read seasons, some read lessons; inCommon holds both and lets your record decide.', prac: 'Write the last month as one plain paragraph, then underline the sentence that surprised you.', q: 'What would this stretch need to teach for it to have been worth it?' },
    decision: { pos: 'A decision that won\u2019t settle is often two decisions wearing one coat: what you want, and what you want to want. The difference shows in which one tires you.', trad: 'Decision frameworks across systems converge on separating the choice from its timing.', prac: 'Decide provisionally tonight, tell no one, and watch your first feeling tomorrow.', q: 'If both paths went fine, which person would you rather have been the one who chose?' },
    fallback: { pos: 'I can sit with this. It may look different once said out loud. You might already hear it differently now.', trad: 'No system speaks directly to this, and inCommon\u2019s rule is that silence beats a stretched interpretation.', prac: 'Say one more sentence about it: the one you left out.', q: 'What made today the day this came up?' }
  };
  function libKey(message) {
    var m = String(message || '').toLowerCase();
    if (/listen/.test(m)) return 'listen';
    if (/clarity|foggy|clear/.test(m)) return 'clarity';
    if (/calm|loud|anxio|quiet/.test(m)) return 'calm';
    if (/courage|avoid|afraid|brave/.test(m)) return 'courage';
    if (/connect|people|lonel|friend/.test(m)) return 'connection';
    if (/meaning|happening|why|purpose/.test(m)) return 'meaning';
    if (/decision|decide|choice|choos/.test(m)) return 'decision';
    return 'fallback';
  }
  function callOffline(payload, mode, intention) {
    var lastUser = ''; payload.messages.forEach(function (m) { if (m.role === 'user') lastUser = m.content; });
    var key = intention && (LIB[intention] || intention === 'listen') ? intention : libKey(lastUser);
    if (key === 'listen') {
      if (mode === 'quick') return '[OBSERVED] I heard what you said, and I\u2019m not going to interpret it unless you ask me to.';
      if (mode === 'deep') return 'Recognition: [OBSERVED] I heard what you said, in your words. No reading attached.\nAgency: Nothing gets interpreted here unless you invite it; the floor stays yours.\nAction: [PRACTICE] Say one more sentence: the one you left out.\nReflection: When you\u2019re ready, tell me whether saying it changed anything. Your read outranks mine.';
      return '[OBSERVED] I heard what you said, and I\u2019m not going to interpret it unless you ask me to. The floor stays yours. What else wants saying?';
    }
    var p = LIB[key] || LIB.fallback;
    if (mode === 'quick') return '[POSSIBILITY] ' + p.pos;
    if (mode === 'deep') return 'Recognition: [POSSIBILITY] ' + p.pos + '\nAgency: A chart can describe the tide. It doesn\u2019t sign your choices; this one stays yours.\nAction: [PRACTICE] ' + p.prac + '\nReflection: ' + p.q + ' Your read outranks mine.';
    return '[POSSIBILITY] ' + p.pos + ' [TRADITIONAL] ' + p.trad + ' ' + p.q;
  }

  // ---- the chain --------------------------------------------------------------
  function send(payload, opts) {
    opts = opts || {};
    if (!payload || typeof payload.system !== 'string' || !Array.isArray(payload.messages)) {
      return Promise.resolve({ ok: false, provider: null, error: { code: 'bad_payload', detail: 'Expected the OkiPromptBuilder shape: {system, messages, temperature, max_tokens}.' } });
    }
    var rl = rateCheck();
    if (!rl.ok) { USAGE.rateLimited++; return Promise.resolve({ ok: false, provider: null, error: { code: 'rate_limited', retryAfterMs: Math.ceil(rl.retryAfterMs) } }); }
    USAGE.requests++;
    var mode = CONFIG.models[opts.mode] ? opts.mode : 'standard';
    var sim = opts.simulate || {};
    var attempts = [];
    return callAnthropic(payload, mode, sim.anthropic).then(function (r) {
      track('anthropic', r.usage.input, r.usage.output);
      return { ok: true, provider: 'anthropic', model: r.model, via: r.via, text: r.text, usage: r.usage, degraded: false, attempts: attempts };
    }).catch(function (e1) {
      attempts.push({ provider: 'anthropic', error: codeOf(e1) }); USAGE.errors++;
      return callOpenAI(payload, sim.openai).then(function (r) {
        track('openai', r.usage.input, r.usage.output);
        return { ok: true, provider: 'openai', model: r.model, via: r.via, text: r.text, usage: r.usage, degraded: true, attempts: attempts };
      }).catch(function (e2) {
        attempts.push({ provider: 'openai', error: codeOf(e2) }); USAGE.errors++;
        var text = callOffline(payload, mode, opts.intention);
        track('offline', 0, est(text));
        return { ok: true, provider: 'offline', model: 'oki-offline-library', via: 'local, pre-written', text: text, usage: { input: 0, output: est(text), estimated: true }, degraded: true, attempts: attempts };
      });
    });
  }

  return { configure: configure, send: send, getUsage: getUsage, resetUsage: resetUsage, rateState: rateState,
    OFFLINE_LIBRARY: LIB, KEY_POLICY: KEY_POLICY, MODELS: CONFIG.models, VERSION: VERSION };
}));
