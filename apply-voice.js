const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
function read(f) { return fs.readFileSync(path.join(ROOT, f), "utf-8"); }
function write(f, s) { fs.writeFileSync(path.join(ROOT, f), s, "utf-8"); }

function count(str, sub) {
  let c = 0, i = 0;
  while ((i = str.indexOf(sub, i)) !== -1) { c++; i += sub.length; }
  return c;
}

// ---------- DC source ----------
let dc = read("app/inCommonApp v2.dc.html");

const tplA = '<div aria-hidden="true" style="font:400 15px var(--fb);color:var(--ac2-hi)">&#10038;</div>\n          </header>';
const tplB = '<div aria-hidden="true" style="font:400 15px var(--fb);color:var(--ac2-hi)">&#10038;</div>\n            <sc-if value="{{ orListenOn }}" hint-placeholder-val="{{ false }}">\n              <div style="display:flex;flex-direction:column;align-items:center;gap:6px">\n                <button data-lift onClick="{{ orListenGo }}" aria-pressed="{{ orListening }}" style="all:unset;cursor:pointer;box-sizing:border-box;min-height:44px;display:flex;align-items:center;justify-content:center;padding:0 22px;border-radius:999px;background:var(--ac);color:var(--onac);font:700 13px var(--fu);letter-spacing:.02em">{{ orListenLabel }}</button>\n                <p style="margin:0;font:400 11.5px/1.5 var(--fu);color:var(--mut)">{{ orListenNote }}</p>\n              </div>\n            </sc-if>\n          </header>';
if (count(dc, tplA) !== 2) throw new Error("tpl count=" + count(dc, tplA));
dc = dc.split(tplA).join(tplB);

const vA = '      orShowReading: !!r,\n';
const vB = '      orShowReading: !!r,\n      orListenOn: !!r,\n      orListening: !!(this._orVoice && this._orVoice.on),\n      orListenLabel: this._orVoice && this._orVoice.on ? \'Stop listening\' : \'Listen to the reading\',\n      orListenNote: this.orListenNote(),\n';
if (count(dc, vA) !== 1) throw new Error("vals count=" + count(dc, vA));
dc = dc.replace(vA, vB);

dc = dc.replace('  oracleAsk(period, depth, again, quiet) {', '  oracleAsk(period, depth, again, quiet) {\n    this.orListenStop();');
dc = dc.replace('go: () => this.setState({ orDepth: k })', "go: () => { this.orListenStop(); this.setState({ orDepth: k }); }");
dc = dc.replace('go: () => this.setState({ orPeriod: k })', "go: () => { this.orListenStop(); this.setState({ orPeriod: k }); }");
dc = dc.replace("orConsentGo: () => { this.writeLS(this.oracleConsentKey(), true); if (depth === 'deep') this.orOpenDeep(slot); this.oracleAsk(period, depth); },", "orConsentGo: () => { this.orListenStop(); this.writeLS(this.oracleConsentKey(), true); if (depth === 'deep') this.orOpenDeep(slot); this.oracleAsk(period, depth); },");
dc = dc.replace("orAskGo: () => { if (depth === 'deep') this.orOpenDeep(slot); this.oracleAsk(period, depth); },", "orAskGo: () => { this.orListenStop(); if (depth === 'deep') this.orOpenDeep(slot); this.oracleAsk(period, depth); },");
dc = dc.replace("orDeepGo: () => { this.orOpenDeep(slot); if (!this.oracleCached(period, 'deep') && !(this._orBusy && this._orBusy[slot])) this.oracleAsk(period, 'deep'); },", "orDeepGo: () => { this.orListenStop(); this.orOpenDeep(slot); if (!this.oracleCached(period, 'deep') && !(this._orBusy && this._orBusy[slot])) this.oracleAsk(period, 'deep'); },");

const eA = "    timeout: 'This reading took too long to write. Try again in a minute.'\n  }))('The Oracle is silent for now. Please return a little later.', 'The oracle is resting. Try again in a minute.');";
const eB = "    timeout: 'This reading took too long to write. Try again in a minute.',\n    voice: 'The voice is silent for now. Your device will read aloud instead.'\n  }))('The Oracle is silent for now. Please return a little later.', 'The oracle is resting. Try again in a minute.');";
if (!dc.includes(eA)) throw new Error("err anchor missing");
dc = dc.replace(eA, eB);

const cA = '<p style="margin:6px 0 0;text-align:center;font:400 10.5px/1.5 var(--fu);color:var(--mut)">Your first name and a chart summary are sent to Moonshot AI to write each reading.</p>';
const cB = '<p style="margin:6px 0 0;text-align:center;font:400 10.5px/1.5 var(--fu);color:var(--mut)">Your first name and a chart summary are sent to Moonshot AI to write each reading. Listening sends the reading\'s words to be spoken aloud.</p>';
if (count(dc, cA) !== 2) throw new Error("consent count=" + count(dc, cA));
dc = dc.split(cA).join(cB);

// Build methods anchor as array to avoid long line
const mA = [
"  oracleWillAsk(period, depth) {",
"    const st = this.state, cs = st.cloudStatus, slot = this.oracleSlot(period, depth);",
"    if (!this.cloud || !(cs && cs.mode === 'cloud') || this.usingSampleBirth()) return false;",
"    if (!this.readLS(this.oracleConsentKey(), false)) return false;",
"    /* In depth is never asked for on open. The reader presses Consult the",
"       Oracle, and a reading prepared ahead (oraclePrepareAuto) is waiting. */",
"    if (depth === 'deep') return false;",
"    /* The Cycle Audit is asked for on open once it is open to this reader and",
"       there is a passage to read. */",
"    if (period === 'cycle' && (!this.cycleReady() || !this.addonsOpen() || !this.cyclePassages().length)) return false;",
"    if (this.oracleCached(period, depth)) return false;",
"    if (this.orNonQuietBusy().length) return false;",
"    return !(st.orErr && st.orErr.slot === slot);",
"  }",
"  /* THE CODEX ASKED WHEN THE SCREEN OPENED"
].join("\n");

const mB = [
"  oracleWillAsk(period, depth) {",
"    const st = this.state, cs = st.cloudStatus, slot = this.oracleSlot(period, depth);",
"    if (!this.cloud || !(cs && cs.mode === 'cloud') || this.usingSampleBirth()) return false;",
"    if (!this.readLS(this.oracleConsentKey(), false)) return false;",
"    /* In depth is never asked for on open. The reader presses Consult the",
"       Oracle, and a reading prepared ahead (oraclePrepareAuto) is waiting. */",
"    if (depth === 'deep') return false;",
"    /* The Cycle Audit is asked for on open once it is open to this reader and",
"       there is a passage to read. */",
"    if (period === 'cycle' && (!this.cycleReady() || !this.addonsOpen() || !this.cyclePassages().length)) return false;",
"    if (this.oracleCached(period, depth)) return false;",
"    if (this.orNonQuietBusy().length) return false;",
"    return !(st.orErr && st.orErr.slot === slot);",
"  }",
"  /* THE ORACLE SPEAKS. One reading at a time, section by section, with the",
"     title spoken before each body. Stopping forgets the queue and releases",
"     the audio context. A failed proxy falls back to the device's own voice.",
"     Nothing is cached across readings: a replay of the same reading reuses",
"     section hashes, so the cloud module may serve from its own cache. */",
"  orListenNote() {",
"    return this.cloud && this.state.cloudStatus && this.state.cloudStatus.mode === 'cloud'",
"      ? 'Your reading is sent to be spoken aloud. Stop at any time.'",
"      : 'Your device will read this aloud. Stop at any time.';",
"  }",
"  orVoiceSegments(r) {",
"    const str = v => typeof v === 'string' ? v : '';",
"    const paras = v => str(v).split(/\\n\\s*\\n/).map(x => x.trim()).filter(Boolean);",
"    const segs = [];",
"    if (str(r.title)) segs.push({ title: 'The Oracle', body: str(r.title) + '. ' + str(r.epigraph) });",
"    const ov = paras(r.overview);",
"    if (ov.length) segs.push({ title: 'Overview', body: ov.join('\\n\\n') });",
"    [['The Stars', r.stars], ['The Design', r.design], ['The Numbers', r.numbers]].forEach(([t, v]) => {",
"      if (str(v)) segs.push({ title: t, body: str(v) });",
"    });",
"    (r.chapters || []).forEach(c => {",
"      if (c && str(c.heading)) segs.push({ title: str(c.heading), body: paras(c.body).join('\\n\\n') });",
"    });",
"    [['Love & Kinship', r.love], ['Work & Purpose', r.work], ['Spirit & Body', r.spirit]].forEach(([t, v]) => {",
"      if (str(v)) segs.push({ title: t, body: str(v) });",
"    });",
"    (r.keyTransits || []).forEach(t => {",
"      if (t && str(t.transit)) segs.push({ title: 'Celestial Currents: ' + str(t.transit), body: str(t.meaning) });",
"    });",
"    if (str(r.shadowWork)) segs.push({ title: 'Shadow Work', body: str(r.shadowWork) });",
"    (r.journalPrompts || []).forEach((q, i) => {",
"      if (str(q)) segs.push({ title: 'For the Journal, question ' + (i + 1), body: str(q) });",
"    });",
"    (r.timing || []).forEach(t => {",
"      if (t && str(t.when)) segs.push({ title: 'Windows of Time: ' + str(t.when), body: str(t.guidance) });",
"    });",
"    if (str(r.ritual)) segs.push({ title: 'A Small Ritual', body: str(r.ritual) });",
"    if (str(r.mantra)) segs.push({ title: 'Mantra', body: str(r.mantra) });",
"    return segs;",
"  }",
"  orListenStop() {",
"    const v = this._orVoice;",
"    if (!v) return;",
"    v.on = false;",
"    try { if (v.source) v.source.stop(); } catch (e) {}",
"    try { if (v.ctx && v.ctx.state !== 'closed') v.ctx.close(); } catch (e) {}",
"    if (v._ttsU) { try { window.speechSynthesis.cancel(); } catch (e) {} }",
"    this._orVoice = null;",
"    this.setState({ orListening: false });",
"  }",
"  orListenGo() {",
"    const v = this._orVoice;",
"    if (v && v.on) { this.orListenStop(); return; }",
"    const st = this.state, r = st.orHit && st.orHit.reading;",
"    if (!r) return;",
"    const segs = this.orVoiceSegments(r);",
"    if (!segs.length) return;",
"    const voice = { on: true, idx: 0, segs, ctx: null, source: null, _ttsU: false };",
"    this._orVoice = voice;",
"    this.setState({ orListening: true });",
"    this._orPlayNext(voice);",
"  }",
"  _orPlayNext(voice) {",
"    if (!voice || !voice.on || voice.idx >= voice.segs.length) { this.orListenStop(); return; }",
"    const seg = voice.segs[voice.idx];",
"    const cloud = this.cloud;",
"    if (cloud && cloud.oracleVoice) {",
"      cloud.oracleVoice({ text: seg.body, title: seg.title }).then(res => {",
"        if (!voice.on) return;",
"        if (res.ok && res.audio) {",
"          this._orPlayAudio(voice, res.audio);",
"        } else {",
"          this._orPlayTTS(voice, seg.title + '. ' + seg.body);",
"        }",
"      }).catch(() => {",
"        if (voice.on) this._orPlayTTS(voice, seg.title + '. ' + seg.body);",
"      });",
"    } else {",
"      this._orPlayTTS(voice, seg.title + '. ' + seg.body);",
"    }",
"  }",
"  _orPlayAudio(voice, buf) {",
"    if (!voice || !voice.on) return;",
"    try {",
"      const ctx = new (window.AudioContext || window.webkitAudioContext)();",
"      voice.ctx = ctx;",
"      ctx.decodeAudioData(buf, buffer => {",
"        if (!voice.on) return;",
"        const src = ctx.createBufferSource();",
"        src.buffer = buffer;",
"        src.connect(ctx.destination);",
"        voice.source = src;",
"        src.onended = () => {",
"          if (!voice.on) return;",
"          voice.idx++;",
"          this._orPlayNext(voice);",
"        };",
"        src.start(0);",
"      }, () => {",
"        const seg = voice.segs[voice.idx];",
"        this._orPlayTTS(voice, seg.title + '. ' + seg.body);",
"      });",
"    } catch (e) {",
"      const seg = voice.segs[voice.idx];",
"      this._orPlayTTS(voice, seg.title + '. ' + seg.body);",
"    }",
"  }",
"  _orPlayTTS(voice, text) {",
"    if (!voice || !voice.on) return;",
"    try {",
"      const u = new SpeechSynthesisUtterance(text);",
"      voice._ttsU = true;",
"      u.onend = () => {",
"        if (!voice.on) return;",
"        voice._ttsU = false;",
"        voice.idx++;",
"        this._orPlayNext(voice);",
"      };",
"      u.onerror = () => {",
"        if (!voice.on) return;",
"        voice._ttsU = false;",
"        this.orListenStop();",
"      };",
"      window.speechSynthesis.cancel();",
"      window.speechSynthesis.speak(u);",
"    } catch (e) {",
"      this.orListenStop();",
"    }",
"  }",
"  /* THE CODEX ASKED WHEN THE SCREEN OPENED"
].join("\n");

if (!dc.includes('  oracleWillAsk(period, depth) {')) throw new Error("methods anchor missing");
dc = dc.replace(mA, mB);
write("app/inCommonApp v2.dc.html", dc);
console.log("1. DC source patched");

// ---------- Cloud module ----------
let ic = read("app/incommon-cloud.js");
const icA = [
"  /* ---------- Codex Luminary ---------- */",
"",
"  /* THE PAID TIER IS ASKED THROUGH THIS MODULE TOO"
].join("\n");

const icB = [
"  /* ---------- Oracle Voice ---------- */",
"",
"  /* ElevenLabs text-to-speech, per-section, so stopping early never bills",
"     for what was not heard. The key lives as a secret; the page never sees",
"     it. Audio is returned as an ArrayBuffer on success, or a reason on",
"     failure, matching the Oracle's own contract. */",
"  function oracleVoice(req) {",
'    if (!client) return Promise.resolve({ ok: false, reason: "off" });',
'    if (!session) return Promise.resolve({ ok: false, reason: "signedOut" });',
"    return Promise.resolve().then(function () {",
'      return client.functions.invoke("oracle-voice", { body: req });',
"    }).then(function (res) {",
"      if (res && !res.error && res.data instanceof ArrayBuffer) {",
'        return { ok: true, audio: res.data };',
"      }",
'      var e = res && res.error, st = e && e.context && e.context.status;',
"      return oracleCode(e).then(function (code) {",
'        if (st === 402 || code === "PREMIUM_REQUIRED") return { ok: false, reason: "premium" };',
'        if (code === "RATE_LIMITED") return { ok: false, reason: "busy" };',
'        if (code === "OUT_OF_CREDITS") return { ok: false, reason: "silent" };',
'        if (code === "TIMEOUT" || st === 504) return { ok: false, reason: "timeout" };',
'        if (st === 404 || code === "NOT_SET_UP") return { ok: false, reason: "notSetUp" };',
'        if (st === 401 || code === "SIGNED_OUT" || code === "MFA_REQUIRED") return { ok: false, reason: "signedOut" };',
'        if (st === 429 || code === "LIMIT") return { ok: false, reason: "limit" };',
'        if (st === 503) return { ok: false, reason: "silent" };',
'        if (e && /FunctionsFetchError|FunctionsRelayError/.test(e.name || "")) return { ok: false, reason: "offline" };',
'        return { ok: false, reason: "error", error: (e && e.message) || "no audio returned" };',
"      });",
"    }).catch(function (e) { return { ok: false, reason: "offline", error: e && e.message }; });",
"  }",
"",
"  /* ---------- Codex Luminary ---------- */",
"",
"  /* THE PAID TIER IS ASKED THROUGH THIS MODULE TOO"
].join("\n");

if (!ic.includes(icA)) throw new Error("cloud anchor missing");
ic = ic.replace(icA, icB);
ic = ic.replace('    tarotRead: tarotRead,\n', '    tarotRead: tarotRead,\n    oracleVoice: oracleVoice,\n');
write("app/incommon-cloud.js", ic);
console.log("2. Cloud module patched");

// ---------- Server function ----------
const sDir = path.join(ROOT, "server", "oracle-voice");
if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
const sCode = [
'// server/oracle-voice/index.ts',
'// ElevenLabs text-to-speech proxy for The Oracle readings.',
'// Per-section requests, so stopping early never bills for what was not heard.',
'// The key lives as a Supabase secret; the page never sees it.',
'',
'import { createClient } from "https://esm.sh/@supabase/supabase-js@2";',
'',
'const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;',
'const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;',
'const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";',
'const DEFAULT_VOICE = Deno.env.get("ORACLE_VOICE_ID") || "yDEpaEXmUSjci1pRBCJf";',
'',
'const CORS = {',
'  "Access-Control-Allow-Origin": "*",',
'  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",',
'  "Access-Control-Allow-Methods": "POST, OPTIONS",',
'};',
'',
'function reply(status: number, body: unknown, type = "application/json"): Response {',
'  return new Response(',
'    type === "audio/mpeg" ? (body as ArrayBuffer) : JSON.stringify(body),',
'    { status, headers: { ...CORS, "Content-Type": type } }',
'  );',
'}',
'',
'Deno.serve(async (req: Request) => {',
'  if (req.method === "OPTIONS") return reply(204, {});',
'  if (req.method !== "POST") return reply(405, { reason: "METHOD_NOT_ALLOWED" });',
'',
'  const auth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).auth;',
'  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\\s+/i, "");',
'  const { data: { user }, error: userErr } = await auth.getUser(token);',
'  if (userErr || !user) return reply(401, { reason: "SIGNED_OUT" });',
'',
'  const body = await req.json().catch(() => ({}));',
'  const text = typeof body.text === "string" ? body.text.trim() : "";',
'  const title = typeof body.title === "string" ? body.title.trim() : "";',
'  if (!text) return reply(400, { reason: "EMPTY" });',
'',
'  if (!ELEVENLABS_KEY) return reply(503, { reason: "NOT_SET_UP" });',
'',
'  const fullText = title ? title + ". " + text : text;',
'  const voiceId = body.voiceId || DEFAULT_VOICE;',
'  const model = body.model || "eleven_multilingual_v2";',
'',
'  try {',
'    const elRes = await fetch(',
'      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,',
'      {',
'        method: "POST",',
'        headers: {',
'          "Accept": "audio/mpeg",',
'          "Content-Type": "application/json",',
'          "xi-api-key": ELEVENLABS_KEY,',
'        },',
'        body: JSON.stringify({',
'          text: fullText,',
'          model_id: model,',
'          voice_settings: { stability: 0.5, similarity_boost: 0.75 },',
'        }),',
'      }',
'    );',
'',
'    if (elRes.status === 401) return reply(503, { reason: "NOT_SET_UP" });',
'    if (elRes.status === 429) {',
'      const data = await elRes.json().catch(() => ({}));',
'      if (data && data.detail && data.detail.status === "quota_exceeded") {',
'        return reply(429, { reason: "OUT_OF_CREDITS" });',
'      }',
'      return reply(429, { reason: "RATE_LIMITED" });',
'    }',
'    if (elRes.status === 422) {',
'      const data = await elRes.json().catch(() => ({}));',
'      return reply(422, { reason: "INVALID", detail: data.detail || "voice or model not found" });',
'    }',
'    if (!elRes.ok) {',
'      return reply(503, { reason: "SILENT", status: elRes.status });',
'    }',
'',
'    const buf = await elRes.arrayBuffer();',
'    return reply(200, buf, "audio/mpeg");',
'  } catch (e) {',
'    return reply(503, { reason: "OFFLINE", error: (e as Error).message });',
'  }',
'});',
''
].join("\n");
write("server/oracle-voice/index.ts", sCode);
console.log("3. Server function created");
console.log("All patches applied successfully.");
