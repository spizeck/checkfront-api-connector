import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { checkfrontTools } from "@/lib/ai-tools";
import { getSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();

  // AI SDK v6 useChat sends UIMessages with { id, role, parts, createdAt, ... }
  const messages: UIMessage[] = body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Convert UIMessages (parts-based) to ModelMessages (content-based) for streamText
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: getSystemPrompt(),
    messages: modelMessages,
    tools: checkfrontTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
