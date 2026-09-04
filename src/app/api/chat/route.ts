import { NextRequest } from "next/server";
import { getSystemPrompt } from "@/lib/tools";
import { Language, ToolId } from "@/lib/types";

export const runtime = "nodejs";

interface ChatRequest {
  tool: ToolId;
  language: Language;
  messages: { role: string; content: string }[];
}

const VALID_TOOLS: ToolId[] = ["excuse", "cooked", "apology", "decision"];

const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?(previous|your|prior)\s+(instructions?|rules?|prompts?)/i,
  /system\s*prompt/i,
  /you\s+are\s+(an?\s+)?(ai|language\s+model|chatbot|assistant)/i,
  /what\s+(model|technology|api)\s+(are\s+you|do\s+you\s+use)/i,
  /groq|openai|anthropic|meta|llama/i,
  /write\s+(a\s+)?(code|program|script|html)/i,
  /pretend\s+you\s+(are|were|have)/i,
  /act\s+as\s+if\s+you/i,
  /roleplay\s+as/i,
  /how\s+do\s+I\s+(hack|bypass|crack)/i,
];

function isPromptInjection(text: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(text));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

  if (!apiKey) {
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const body: ChatRequest = await req.json();
    const { tool, language, messages } = body;

    if (!VALID_TOOLS.includes(tool)) {
      return new Response("Invalid tool", { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("No messages", { status: 400 });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg || typeof lastUserMsg.content !== "string") {
      return new Response("Invalid message", { status: 400 });
    }

    if (lastUserMsg.content.length > 2000) {
      return new Response("Message too long", { status: 400 });
    }

    if (isPromptInjection(lastUserMsg.content)) {
      return new Response(
        "That request is outside the scope of this tool.",
        { status: 400 }
      );
    }

    const sanitizedMessages = messages.map((m) => ({
      role: m.role === "user" || m.role === "assistant" ? m.role : "user",
      content: typeof m.content === "string" ? m.content.slice(0, 2000) : "",
    }));

    const systemPrompt = getSystemPrompt(tool, language);

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...sanitizedMessages,
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        stream: true,
        temperature: 0.9,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("Groq API error:", response.status, errBody);
      return new Response("AI service temporarily unavailable", { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(encoder.encode(token));
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } catch (err) {
          console.error("Stream reading error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response("Something went wrong", { status: 500 });
  }
}
