import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { checkfrontTools } from "@/lib/ai-tools";
import { chatMessageSchema } from "@/lib/validations";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid message format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = parsed.data;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a friendly and helpful booking assistant. Your job is to help customers find and book activities, tours, and experiences.

Key behaviors:
- Start by asking what kind of activity they're interested in, or show available categories using the getCategories tool
- Ask for their preferred dates and party size to find available options
- Present options clearly with names, descriptions, prices, and availability
- When they choose an item, add it to their session using the SLIP token from the search results
- Collect required customer details (name, email, phone) before creating the booking
- After creating the booking, provide the checkout link for payment
- Be conversational but efficient - don't ask too many questions at once
- If something is unavailable, suggest alternatives
- Always confirm the booking details before finalizing

Date format for tools: YYYYMMDD (e.g., 20260315 for March 15, 2026).
Today's date is ${new Date().toISOString().split("T")[0]}.`,
    messages,
    tools: checkfrontTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
