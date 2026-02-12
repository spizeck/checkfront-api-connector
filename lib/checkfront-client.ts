import { getCheckfrontConfig } from "./constants";
import type {
  CategoriesResponse,
  ItemsResponse,
  ItemDetailResponse,
  CalendarResponse,
  SessionResponse,
  BookingFormResponse,
  BookingCreateResponse,
  ItemQueryParams,
  SessionCreateParams,
  SessionAlterParams,
  BookingCreateParams,
} from "./checkfront-types";

export type { CategoriesResponse, ItemsResponse, ItemDetailResponse, CalendarResponse };

export class CheckfrontApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Checkfront API error ${status}: ${body}`);
    this.name = "CheckfrontApiError";
  }
}

export class CheckfrontRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Rate limited. Retry after ${retryAfterSeconds} seconds.`);
    this.name = "CheckfrontRateLimitError";
  }
}

export class CheckfrontClient {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const config = getCheckfrontConfig();
    this.baseUrl = config.baseUrl;
    this.authHeader =
      "Basic " +
      Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        ...options.headers,
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new CheckfrontRateLimitError(
        retryAfter ? parseInt(retryAfter, 10) : 5,
      );
    }

    if (!response.ok) {
      throw new CheckfrontApiError(response.status, await response.text());
    }

    return response.json() as Promise<T>;
  }

  private async requestWithRetry<T>(
    path: string,
    options: RequestInit = {},
    maxRetries = 2,
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(path, options);
      } catch (error) {
        if (
          error instanceof CheckfrontRateLimitError &&
          attempt < maxRetries
        ) {
          await new Promise((r) =>
            setTimeout(r, error.retryAfterSeconds * 1000),
          );
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  }

  private buildItemQueryString(params: ItemQueryParams): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (key === "param" && typeof value === "object") {
        for (const [pKey, pVal] of Object.entries(
          value as Record<string, number>,
        )) {
          searchParams.append(`param[${pKey}]`, String(pVal));
        }
      } else {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  }

  private buildFormBody(data: Record<string, unknown>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(`${key}[]`, String(v)));
      } else if (typeof value === "object" && value !== null) {
        for (const [subKey, subVal] of Object.entries(
          value as Record<string, unknown>,
        )) {
          params.append(`${key}[${subKey}]`, String(subVal));
        }
      } else {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }

  // ---- Categories ----

  async getCategories(): Promise<CategoriesResponse> {
    return this.requestWithRetry<CategoriesResponse>("/category");
  }

  // ---- Items ----

  async getItems(params?: ItemQueryParams): Promise<ItemsResponse> {
    const qs = params ? `?${this.buildItemQueryString(params)}` : "";
    return this.requestWithRetry<ItemsResponse>(`/item${qs}`);
  }

  async getItem(
    itemId: number,
    params?: ItemQueryParams,
  ): Promise<ItemDetailResponse> {
    const qs = params ? `?${this.buildItemQueryString(params)}` : "";
    return this.requestWithRetry<ItemDetailResponse>(`/item/${itemId}${qs}`);
  }

  // ---- Calendar ----

  async getItemCalendar(
    itemId: number,
    params?: { start_date?: string; end_date?: string },
  ): Promise<CalendarResponse> {
    const qs = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    return this.requestWithRetry<CalendarResponse>(`/item/${itemId}/cal${qs}`);
  }

  async getItemsCalendar(params?: {
    start_date?: string;
    end_date?: string;
    item_id?: string;
    category_id?: number;
  }): Promise<CalendarResponse> {
    const qs = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()}`
      : "";
    return this.requestWithRetry<CalendarResponse>(`/item/cal${qs}`);
  }

  // ---- Session ----

  async createSession(params: SessionCreateParams): Promise<SessionResponse> {
    const body = this.buildFormBody({
      slip: params.slip,
      ...(params.session_id ? { session_id: params.session_id } : {}),
    });
    return this.requestWithRetry<SessionResponse>("/booking/session", {
      method: "POST",
      body,
    });
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    return this.requestWithRetry<SessionResponse>(
      `/booking/session?session_id=${sessionId}`,
    );
  }

  async alterSession(params: SessionAlterParams): Promise<SessionResponse> {
    const body = this.buildFormBody({
      session_id: params.session_id,
      alter: params.alter,
    });
    return this.requestWithRetry<SessionResponse>("/booking/session", {
      method: "POST",
      body,
    });
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.requestWithRetry("/booking/session/clear", {
      method: "POST",
      body: `session_id=${sessionId}`,
    });
  }

  // ---- Booking ----

  async getBookingForm(): Promise<BookingFormResponse> {
    return this.requestWithRetry<BookingFormResponse>("/booking/form");
  }

  async createBooking(
    params: BookingCreateParams,
  ): Promise<BookingCreateResponse> {
    const body = this.buildFormBody({
      session_id: params.session_id,
      form: params.form,
    });
    return this.requestWithRetry<BookingCreateResponse>("/booking/create", {
      method: "POST",
      body,
    });
  }
}

// Lazy singleton — avoids calling getCheckfrontConfig() at import/build time
let _client: CheckfrontClient | null = null;
export function getClient(): CheckfrontClient {
  if (!_client) {
    _client = new CheckfrontClient();
  }
  return _client;
}
