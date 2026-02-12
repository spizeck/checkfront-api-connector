import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";
import { getSessionId, setSessionId } from "@/lib/session";
import { sessionCreateSchema, sessionAlterSchema } from "@/lib/validations";

export async function GET() {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: "No active session" }, { status: 404 });
    }
    const data = await getClient().getSession(sessionId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If alter is present, modify existing session
    if (body.alter && body.session_id) {
      const parsed = sessionAlterSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid request" },
          { status: 400 },
        );
      }
      const data = await getClient().alterSession({
        session_id: parsed.data.session_id,
        alter: parsed.data.alter,
      });
      return NextResponse.json(data);
    }

    // Otherwise create/add to session with SLIP
    const parsed = sessionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "slip is required" },
        { status: 400 },
      );
    }

    const existingSessionId = parsed.data.session_id || (await getSessionId());
    const data = await getClient().createSession({
      slip: parsed.data.slip,
      session_id: existingSessionId,
    });

    await setSessionId(data.booking.session.id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
