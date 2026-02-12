import { NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";
import { getSessionId, clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: "No active session" }, { status: 404 });
    }
    await getClient().clearSession(sessionId);
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
