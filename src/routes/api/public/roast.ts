import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

const LEVELS: Record<string, string> = {
  mild: "Keep it playful and affectionate. Tease, never wound. Two short paragraphs max.",
  savage:
    "Be sharp and funny with real bite, like a friend who knows exactly where it hurts but still likes them. Two short paragraphs max.",
  brutal:
    "Go hard and relentless, comedy-roast style, but stay clever rather than cruel. Two short paragraphs max.",
};

/* ------------------------------------------------------- cache + fair queue */

/**
 * Identical prompts are extremely common (people retry the same bio), so a
 * short-lived in-isolate cache removes most duplicate upstream spend. Cached
 * answers are replayed as a normal SSE stream so the client stays unchanged.
 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 300;
const cache = new Map<string, { text: string; at: number }>();

function cacheGet(key: string): string | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // refresh LRU position
  cache.delete(key);
  cache.set(key, hit);
  return hit.text;
}

function cacheSet(key: string, text: string) {
  if (text.trim().length < 20) return;
  cache.set(key, { text, at: Date.now() });
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/** Replays cached text as an OpenAI-compatible SSE stream. */
function replay(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,60}/g) ?? [text];
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "x-roast-cache": "hit",
    },
  });
}

/**
 * Rate-limit aware queue: caps concurrent upstream calls so a traffic spike
 * queues instead of hammering the provider (and instead of crashing us), and
 * sheds load politely once the queue is long.
 */
const MAX_CONCURRENT = 4;
const MAX_QUEUE = 24;
let inFlight = 0;
const waiting: Array<() => void> = [];

async function acquire(): Promise<boolean> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1;
    return true;
  }
  if (waiting.length >= MAX_QUEUE) return false;
  await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight += 1;
  return true;
}

function release() {
  inFlight = Math.max(0, inFlight - 1);
  const next = waiting.shift();
  if (next) next();
}

/** Models that just returned 429/5xx are skipped for a cooldown window. */
const cooldown = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function onCooldown(model: string) {
  const until = cooldown.get(model) ?? 0;
  if (until > Date.now()) return true;
  if (until) cooldown.delete(model);
  return false;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`sov::${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const Route = createFileRoute("/api/public/roast")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { target?: string; level?: string };
        try {
          body = (await request.json()) as { target?: string; level?: string };
        } catch {
          return json({ error: "Invalid JSON body." }, 400);
        }

        const target = (body.target ?? "").trim().slice(0, 800);
        const level = (body.level ?? "savage").toLowerCase();
        if (target.length < 3) {
          return json({ error: "Give me something to work with — at least a few words." }, 400);
        }
        if (!LEVELS[level]) {
          return json({ error: "Unknown roast level." }, 400);
        }

        const cacheKey = `${level}::${target.toLowerCase().replace(/\s+/g, " ")}`;
        const cached = cacheGet(cacheKey);
        if (cached) return replay(cached);

        const apiKey = process.env["LOVABLE_API_KEY"];
        const openRouterKey = process.env["OPENROUTER_API_KEY"];
        if (!apiKey && !openRouterKey)
          return json({ error: "AI is not configured for this project." }, 500);


        const supabaseUrl = process.env["SUPABASE_URL"];
        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (supabaseUrl && serviceKey) {
          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown";
          const ipHash = await hashIp(ip);
          const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: row } = await admin
            .from("roast_requests")
            .select("id,request_count,last_request")
            .eq("ip_hash", ipHash)
            .maybeSingle();

          const now = Date.now();
          if (row) {
            const fresh = now - new Date(row.last_request as string).getTime() < WINDOW_MS;
            if (fresh && (row.request_count as number) >= LIMIT) {
              return json(
                { error: "Rate limit reached: 10 roasts per hour. Try again shortly." },
                429,
              );
            }
            await admin
              .from("roast_requests")
              .update({
                request_count: fresh ? (row.request_count as number) + 1 : 1,
                last_request: new Date(now).toISOString(),
              })
              .eq("id", row.id as string);
          } else {
            await admin.from("roast_requests").insert({ ip_hash: ipHash, request_count: 1 });
          }
        }

        const system = `You are a stand-up comedian writing a roast. ${LEVELS[level]} Never reference protected characteristics (race, religion, gender identity, disability, nationality), never make medical or psychological claims, and never threaten. Output plain text only.`;
        const messages = [
          { role: "system", content: system },
          { role: "user", content: `Roast this: ${target}` },
        ];

        type Attempt = { url: string; key: string; model: string; extra?: Record<string, string> };
        const attempts: Attempt[] = [];
        if (openRouterKey) {
          for (const model of [
            "google/gemini-2.0-flash-lite-001",
            "meta-llama/llama-3.1-8b-instruct",
            "deepseek/deepseek-chat",
          ]) {
            attempts.push({
              url: "https://openrouter.ai/api/v1/chat/completions",
              key: openRouterKey,
              model,
              extra: {
                "HTTP-Referer": "https://sensesofvoid.app",
                "X-Title": "Senses of Void",
              },
            });
          }
        }
        if (apiKey) {
          attempts.push({
            url: "https://ai.gateway.lovable.dev/v1/chat/completions",
            key: apiKey,
            model: "google/gemini-3.5-flash",
            extra: { "X-Lovable-AIG-SDK": "fetch" },
          });
        }

        if (!(await acquire())) {
          return json(
            { error: "The roast queue is full right now — try again in a few seconds." },
            429,
          );
        }

        let upstream: Response | null = null;
        let lastStatus = 502;
        try {
        for (const attempt of attempts) {
          if (onCooldown(attempt.model)) continue;
          let res: Response;
          try {
            res = await fetch(attempt.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${attempt.key}`,
                ...(attempt.extra ?? {}),
              },
              body: JSON.stringify({ model: attempt.model, stream: true, messages }),
            });
          } catch (err) {
            console.error("roast network error", attempt.model, String(err).slice(0, 200));
            continue;
          }
          if (res.ok && res.body) {
            upstream = res;
            break;
          }
          lastStatus = res.status;
          if (res.status === 429 || res.status >= 500) {
            cooldown.set(attempt.model, Date.now() + COOLDOWN_MS);
          }
          const detail = await res.text().catch(() => "");
          console.error("roast upstream error", attempt.model, res.status, detail.slice(0, 300));
          // 401/403 (bad key) and 5xx/404 => try next provider; 429 also worth failing over once.
        }
        } finally {
          if (!upstream) release();
        }

        if (!upstream || !upstream.body) {
          const message =
            lastStatus === 429
              ? "The AI is rate limited right now. Try again in a moment."
              : lastStatus === 402
                ? "AI credits are exhausted right now."
                : "The roast engine could not be reached.";
          return json({ error: message }, lastStatus === 429 ? 429 : 502);
        }


        // Pass the stream straight through while accumulating the text so the
        // next identical request is served from cache for free.
        const decoder = new TextDecoder();
        let collected = "";
        const reader = upstream.body.getReader();
        const passthrough = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
              cacheSet(cacheKey, collected);
              release();
              controller.close();
              return;
            }
            const text = decoder.decode(value, { stream: true });
            for (const line of text.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const raw = trimmed.slice(5).trim();
              if (!raw || raw === "[DONE]") continue;
              try {
                const parsed = JSON.parse(raw) as { choices?: { delta?: { content?: string } }[] };
                collected += parsed.choices?.[0]?.delta?.content ?? "";
              } catch {
                /* partial chunk */
              }
            }
            controller.enqueue(value);
          },
          cancel() {
            release();
            void reader.cancel();
          },
        });

        return new Response(passthrough, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-store",
            "x-roast-cache": "miss",
          },
        });
      },
    },
  },
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
