/**
 * OpenAI-compatible adapter standing in for Floot's @floot/ai module
 * (flootAi.chat against "gpt-6-luna"). Uses the Responses API because it is
 * the closest public match to the options the original handlers pass
 * (instructions / input / reasoning.effort / text.format json_schema).
 */

export class AiOutOfCreditsError extends Error {
  constructor(message?: string) {
    super(message ?? "AI features are temporarily unavailable.");
    this.name = "AiOutOfCreditsError";
  }
}

export class AiRateLimitError extends Error {
  constructor(message?: string) {
    super(message ?? "Rate limited");
    this.name = "AiRateLimitError";
  }
}

export interface AiChatOptions {
  model?: string;
  instructions?: string;
  input: string;
  reasoning?: { effort?: "low" | "medium" | "high" };
  /** When given, requests strict JSON_SCHEMA output under this name. */
  jsonSchema?: Record<string, unknown>;
  jsonSchemaName?: string;
}

function apiKey(): string {
  return process.env.OPENAI_API_KEY ?? "";
}

export function aiConfigured(): boolean {
  return apiKey().length > 0;
}

export async function aiChat(options: AiChatOptions): Promise<string> {
  const key = apiKey();
  if (!key) {
    throw new AiOutOfCreditsError(
      "AI features are temporarily unavailable. Please contact the app owner."
    );
  }

  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = options.model && options.model !== "gpt-6-luna"
    ? options.model
    : (process.env.OPENAI_MODEL ?? "gpt-4o-mini");

  const body: Record<string, unknown> = {
    model,
    input: options.input,
  };
  if (options.instructions) body.instructions = options.instructions;
  if (options.reasoning?.effort) body.reasoning = { effort: options.reasoning.effort };
  if (options.jsonSchema) {
    body.text = {
      format: {
        type: "json_schema",
        name: options.jsonSchemaName ?? "codex_response",
        schema: options.jsonSchema,
        strict: true,
      },
    };
  }

  let res: Response;
  try {
    res = await fetch(`${base}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AiOutOfCreditsError(
      `Oracle request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (res.status === 429) {
    await res.text().catch(() => "");
    throw new AiRateLimitError("The oracle is resting. Try again in a minute.");
  }
  // 401 bad key, 402/403 plan, 408 etc. all map to the credits-style error
  // the app already knows how to render.
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[codex] oracle error", res.status, text.slice(0, 500));
    if (res.status === 400 && /json_schema|response_format|format/i.test(text)) {
      // Strict-schema unsupported on this provider: retry once as plain text.
      return aiChatPlain({ ...options, model });
    }
    throw new AiOutOfCreditsError(
      "AI features are temporarily unavailable. Please contact the app owner."
    );
  }

  const json = (await res.json()) as {
    output_text?: string;
    output?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };
  const raw: string =
    json.output_text ??
    (json.output ?? [])
      .filter((o) => o.type === "message")
      .flatMap((o) => o.content ?? [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text ?? "")
      .join("");
  if (!raw) {
    throw new AiOutOfCreditsError("The oracle answered in silence. Try again.");
  }
  return raw;
}

async function aiChatPlain(options: AiChatOptions & { model: string }): Promise<string> {
  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const res = await fetch(`${base}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: options.model,
      instructions: `${options.instructions ?? ""}\n\nRespond with ONLY a JSON object matching this schema: ${JSON.stringify(options.jsonSchema)}`,
      input: options.input,
    }),
  });
  if (!res.ok) {
    await res.text().catch(() => "");
    throw new AiOutOfCreditsError(
      "AI features are temporarily unavailable. Please contact the app owner."
    );
  }
  const json = (await res.json()) as { output_text?: string };
  if (!json.output_text) {
    throw new AiOutOfCreditsError("The oracle answered in silence. Try again.");
  }
  return json.output_text;
}
