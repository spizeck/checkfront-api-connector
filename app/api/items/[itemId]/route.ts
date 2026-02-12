import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";
import type { ItemQueryParams } from "@/lib/checkfront-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const queryParams: ItemQueryParams = {};

    if (searchParams.has("start_date"))
      queryParams.start_date = searchParams.get("start_date")!;
    if (searchParams.has("end_date"))
      queryParams.end_date = searchParams.get("end_date")!;

    const bookingParams: Record<string, number> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("param.")) {
        bookingParams[key.slice(6)] = Number(value);
      }
    });
    if (Object.keys(bookingParams).length > 0) {
      queryParams.param = bookingParams;
    }

    const data = await getClient().getItem(
      Number(itemId),
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    );
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
