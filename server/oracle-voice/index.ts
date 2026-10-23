// server/oracle-voice/index.ts
// ElevenLabs text-to-speech proxy for The Oracle readings.
// Per-piece requests (the app sends a paragraph at a time), so stopping
// early never bills for what was not heard, and every piece is generated
// fresh: one long input flattens the voice toward its end.
// The key lives as a Supabase secret; the page never sees it.
// Plain JavaScript on purpose: the dashboard editor's parser has refused
// TypeScript annotations, and Deno runs this file exactly the same without
// them.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const DEFAULT_VOICE = Deno.env.get("ORACLE_VOICE_ID") || "yDEpaEXmUSjci1pRBCJf";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status, body, type = "application/json") {
  return new Response(
    type === "audio/mpeg" ? body : JSON.stringify(body),
    { status, headers: { ...CORS, "Content-Type": type } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return reply(204, {});
  if (req.method !== "POST") return reply(405, { reason: "METHOD_NOT_ALLOWED" });

  const auth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).auth;
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: { user }, error: userErr } = await auth.getUser(token);
  if (userErr || !user) return reply(401, { reason: "SIGNED_OUT" });

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!text) return reply(400, { reason: "EMPTY" });

  if (!ELEVENLABS_KEY) {
    console.error("oracle-voice: ELEVENLABS_API_KEY is not set on this function");
    return reply(503, { reason: "NOT_SET_UP" });
  }

  const fullText = title ? title + ". " + text : text;
  const voiceId = body.voiceId || DEFAULT_VOICE;
  const model = body.model || "eleven_multilingual_v2";

  try {
    const elRes = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voiceId) + "/stream",
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_KEY,
        },
        body: JSON.stringify({
          text: fullText,
          model_id: model,
          /* The app sends the reading a paragraph at a time, so prosody
             never flattens the way it does on one long input. Stability a
             touch under half keeps the voice expressive without wavering,
             style asks it to lean into the words, and speaker boost keeps
             the level from falling away at the ends of phrases. */
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (elRes.status === 401) {
      console.error("oracle-voice: ElevenLabs refused the key (401) - check ELEVENLABS_API_KEY");
      return reply(503, { reason: "NOT_SET_UP" });
    }
    if (elRes.status === 429) {
      const data = await elRes.json().catch(() => ({}));
      if (data && data.detail && data.detail.status === "quota_exceeded") {
        console.error("oracle-voice: ElevenLabs quota exceeded");
        return reply(429, { reason: "OUT_OF_CREDITS" });
      }
      console.error("oracle-voice: ElevenLabs rate limited");
      return reply(429, { reason: "RATE_LIMITED" });
    }
    if (elRes.status === 422) {
      const data = await elRes.json().catch(() => ({}));
      console.error("oracle-voice: ElevenLabs 422", JSON.stringify((data && data.detail) || {}));
      return reply(422, { reason: "INVALID", detail: data.detail || "voice or model not found" });
    }
    if (!elRes.ok) {
      const detail = await elRes.text().catch(() => "");
      console.error("oracle-voice: ElevenLabs answered " + elRes.status, detail.slice(0, 500));
      return reply(503, { reason: "SILENT", status: elRes.status });
    }

    /* Streamed straight through, so the reader's download overlaps
       ElevenLabs' generation instead of starting after it. */
    return reply(200, elRes.body, "audio/mpeg");
  } catch (e) {
    console.error("oracle-voice: fetch to ElevenLabs failed", e && e.message);
    return reply(503, { reason: "OFFLINE", error: e && e.message });
  }
});
