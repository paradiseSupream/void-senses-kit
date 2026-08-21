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

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.5-flash",
            stream: true,
            messages: [
              {
                role: "system",
                content: `You are a stand-up comedian writing a roast. ${LEVELS[level]} Never reference protected characteristics (race, religion, gender identity, disability, nationality), never make medical or psychological claims, and never threaten. Output plain text only.`,
              },
              { role: "user", content: `Roast this: ${target}` },
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          const message =
            upstream.status === 429
              ? "The AI is rate limited right now. Try again in a moment."
              : upstream.status === 402
                ? "AI credits are exhausted for this workspace."
                : "The roast engine could not be reached.";
          console.error("roast upstream error", upstream.status, detail.slice(0, 400));
          return json({ error: message }, upstream.status === 429 ? 429 : 502);
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-store",
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
