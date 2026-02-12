import { NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";

export async function GET() {
  try {
    const data = await getClient().getBookingForm();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
