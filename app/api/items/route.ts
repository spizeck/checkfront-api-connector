import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/checkfront-client";
import { handleApiError } from "@/lib/utils";
import type { ItemQueryParams } from "@/lib/checkfront-types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: ItemQueryParams = {};

    if (searchParams.has("category_id"))
      params.category_id = Number(searchParams.get("category_id"));
    if (searchParams.has("start_date"))
      params.start_date = searchParams.get("start_date")!;
    if (searchParams.has("end_date"))
      params.end_date = searchParams.get("end_date")!;
    if (searchParams.has("date"))
      params.date = searchParams.get("date")!;
    if (searchParams.has("item_id"))
      params.item_id = searchParams.get("item_id")!;
    if (searchParams.has("keyword"))
      params.keyword = searchParams.get("keyword")!;
    if (searchParams.has("available"))
      params.available = Number(searchParams.get("available"));
    if (searchParams.has("discount_code"))
      params.discount_code = searchParams.get("discount_code")!;

    // Parse nested param.* keys (e.g., param.adults=2)
    const bookingParams: Record<string, number> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("param.")) {
        const paramName = key.slice(6);
        bookingParams[paramName] = Number(value);
      }
    });
    if (Object.keys(bookingParams).length > 0) {
      params.param = bookingParams;
    }

    const data = await getClient().getItems(
      Object.keys(params).length > 0 ? params : undefined,
    );
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
