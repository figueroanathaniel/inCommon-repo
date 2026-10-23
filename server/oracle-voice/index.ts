// server/oracle-voice/index.ts
// ElevenLabs text-to-speech proxy for The Oracle readings.
// Per-section requests, so stopping early never bills for what was not heard.
// The key lives as a Supabase secret; the page never sees it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const DEFAULT_VOICE = Deno.env.get("ORACLE_VOICE_ID") || "yDEpaEXmUSjci1pRBCJf";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown, type = "application/json"): Response {
  return new Response(
    type === "audio/mpeg" ? (body as ArrayBuffer) : JSON.stringify(body),
    { status, headers: { ...CORS, "Content-Type": type } }
  );
}

Deno.serve(async (req: Request) => {
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

  if (!ELEVENLABS_KEY) return reply(503, { reason: "NOT_SET_UP" });

  const fullText = title ? title + ". " + text : text;
  const voiceId = body.voiceId || DEFAULT_VOICE;
  const model = body.model || "eleven_multilingual_v2";

  try {
    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
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
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (elRes.status === 401) return reply(503, { reason: "NOT_SET_UP" });
    if (elRes.status === 429) {
      const data = await elRes.json().catch(() => ({}));
      if (data && data.detail && data.detail.status === "quota_exceeded") {
        return reply(429, { reason: "OUT_OF_CREDITS" });
      }
      return reply(429, { reason: "RATE_LIMITED" });
    }
    if (elRes.status === 422) {
      const data = await elRes.json().catch(() => ({}));
      return reply(422, { reason: "INVALID", detail: data.detail || "voice or model not found" });
    }
    if (!elRes.ok) {
      return reply(503, { reason: "SILENT", status: elRes.status });
    }

    const buf = await elRes.arrayBuffer();
    return reply(200, buf, "audio/mpeg");
  } catch (e) {
    return reply(503, { reason: "OFFLINE", error: (e as Error).message });
  }
});
