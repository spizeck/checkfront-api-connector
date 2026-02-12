import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const calParams: { start_date?: string; end_date?: string } = {};
    if (searchParams.has("start_date"))
      calParams.start_date = searchParams.get("start_date")!;
    if (searchParams.has("end_date"))
      calParams.end_date = searchParams.get("end_date")!;

    const data = await getClient().getItemCalendar(
      Number(itemId),
      Object.keys(calParams).length > 0 ? calParams : undefined,
    );
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
