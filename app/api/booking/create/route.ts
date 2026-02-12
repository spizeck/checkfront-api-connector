import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";
import { getSessionId, clearSessionCookie } from "@/lib/session";
import { bookingCreateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = bookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const sessionId = parsed.data.session_id || (await getSessionId());
    if (!sessionId) {
      return NextResponse.json(
        { error: "No active session. Please add items first." },
        { status: 400 },
      );
    }

    const data = await getClient().createBooking({
      session_id: sessionId,
      form: parsed.data.form,
    });

    // Clear the session cookie after successful booking
    await clearSessionCookie();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
