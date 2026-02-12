// ---- Request Meta ----
export interface RequestMeta {
  status: string;
  resource?: string;
  records?: number;
  limit?: number;
  page?: number;
  pages?: number;
  time?: number;
  timestamp?: number;
  method?: string;
  [key: string]: unknown;
}

// ---- API Envelope ----
export interface ApiEnvelope {
  version?: string;
  account_id?: number;
  host_id?: string;
  name?: string;
  locale?: { id: string; lang: string; currency: string };
  request: RequestMeta;
}

// ---- Categories ----
export interface CheckfrontCategory {
  category_id: number;
  name: string;
  description: string;
  pos: number;
  image: string;
  image_url: string;
  qty: number;
  display_color?: string;
}

export interface CategoriesResponse extends ApiEnvelope {
  category: Record<string, CheckfrontCategory>;
}

// ---- Booking Parameters (from item.param) ----
export interface BookingParam {
  price: number;
  lbl: string;
  lock?: number;
  qty: number;
  hide?: number;
  customer_hide?: number;
  req: number;
  range?: number;
  def?: number;
  MIN: number;
  MAX: number;
  guest?: number;
  minor?: number;
  skip?: boolean;
  ignore_for_calculate_min_parameters?: boolean;
}

// ---- Item Image ----
export interface ItemImage {
  title: string;
  src: string;
  path: string;
  url: string;
  url_medium?: string;
  url_small?: string;
}

// ---- Item Rate (rated response) ----
export interface ItemRateSummary {
  title: string;
  details: string;
  price: {
    total: string;
    title: string;
    unit?: string;
    param?: Record<string, string>;
  };
  date?: string;
}

export interface ItemRate {
  status: string;
  available: number;
  slip: string;
  summary: ItemRateSummary;
  sub_total: string;
  start_date?: string;
  end_date?: string;
  event?: Record<string, unknown>;
  dates?: Record<string, unknown>;
  [key: string]: unknown;
}

// ---- Items ----
export interface CheckfrontItem {
  item_id: number;
  sku: string;
  name: string;
  summary: string;
  details?: string;
  category_id: number;
  image: Record<string, ItemImage>;
  stock: number;
  unlimited: number;
  unit?: string;
  url?: string;
  lock?: number;
  visibility?: string;
  pos?: number;
  meta?: string;
  rules?: string | Record<string, unknown>;
  rated?: number;
  type?: string;
  status?: string;
  category?: string;
  tags?: string[];
  // Present only in rated responses (when dates are provided):
  rate?: ItemRate;
  param?: Record<string, BookingParam>;
  package?: Array<Record<string, unknown>>;
  days?: number;
  discount?: Record<string, unknown>;
  qty?: number;
  [key: string]: unknown;
}

export interface ItemsResponse extends ApiEnvelope {
  items: Record<string, CheckfrontItem>;
}

export interface ItemDetailResponse extends ApiEnvelope {
  item: CheckfrontItem;
}

// ---- Calendar / Availability ----
// Calendar returns item.cal as Record<string, number> (date -> stock available)
// plus metadata keys: available, booked, status, span_closed, unit
export interface ItemCalendar {
  item_id: number;
  cal: Record<string, number | string>;
}

export interface CalendarResponse extends ApiEnvelope {
  item: ItemCalendar;
}

// ---- Session ----
export interface SessionItem {
  sku: string;
  item_id: number;
  name: string;
  unit?: string;
  rate: {
    total: string;
    item_total?: string;
    qty?: number;
    summary?: string;
    [key: string]: unknown;
  };
  date?: {
    summary: string;
    start_date: number;
    end_date: number;
  };
  slip: string;
  available: number;
  optin?: string;
  opt?: string;
  [key: string]: unknown;
}

export interface BookingSessionData {
  id: string;
  age: number;
  summary: string;
  start_date: number;
  end_date: number;
  date_desc: string;
  time_desc?: string;
  currency_id?: string;
  sub_total: string;
  tax_total: string;
  tax_inc_total?: string;
  discount?: string;
  total: string;
  due?: string;
  paid_total: string;
  qty: number;
  item: Record<string, SessionItem>;
  tax?: Record<string, unknown>;
  deposit?: unknown;
  [key: string]: unknown;
}

export interface SessionResponse extends ApiEnvelope {
  booking: {
    session: BookingSessionData;
  };
}

// ---- Booking Form ----
export interface FormFieldLayout {
  lbl: string;
  type: string;
  tip?: string;
  sys?: number;
  guest?: number;
  start_hidden?: number;
  filterable?: number;
  options?: Record<string, string>;
  customer?: { form: number; invoice: number; required: number };
  staff?: { form: number; invoice: number; required: number };
  [key: string]: unknown;
}

export interface FormFieldDefine {
  field_id: string;
  is_filter: number;
  layout: FormFieldLayout;
  required: number;
  position: number;
  archived: number;
  customer_profile?: number;
  contact_info?: number;
  filtered?: number;
  apply_to?: unknown[];
  apply_to_guest?: unknown[];
}

export interface FormField {
  value: string;
  define: FormFieldDefine;
}

export interface BookingFormResponse extends ApiEnvelope {
  booking_form_ui: Record<string, FormField>;
  booking_policy?: {
    body: string;
    required: number;
  };
}

// ---- Booking Create ----
export interface BookingCreateResponse extends ApiEnvelope {
  booking: {
    booking_id: string;
    invoice_url: string;
    status: string;
    [key: string]: unknown;
  };
}

// ---- Query Parameter Types ----
export interface ItemQueryParams {
  start_date?: string;
  end_date?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  category_id?: number;
  item_id?: string;
  keyword?: string;
  available?: number;
  param?: Record<string, number>;
  discount_code?: string;
  rules?: "soft" | "off";
  packages?: boolean;
}

export interface SessionCreateParams {
  slip: string | string[];
  session_id?: string;
}

export interface SessionAlterParams {
  session_id: string;
  alter: Record<string, string | number>;
}

export interface BookingCreateParams {
  session_id: string;
  form: Record<string, string>;
}
