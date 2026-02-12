import { tool } from "ai";
import { z } from "zod";
import { getClient } from "./checkfront-client";
import { getItemImageUrl, stripHtml } from "./utils";

export const checkfrontTools = {
  getCategories: tool({
    description:
      "Get the list of available booking categories (e.g., Tours, Activities). Call this first to show the customer what types of experiences are available.",
    inputSchema: z.object({}),
    execute: async () => {
      const result = await getClient().getCategories();
      const categories = Object.values(result.category || {}).map((cat) => ({
        category_id: cat.category_id,
        name: cat.name,
        description: cat.description,
        item_count: cat.qty,
        image_url: cat.image_url,
      }));
      return { categories };
    },
  }),

  searchItems: tool({
    description:
      "Search for available booking items/activities. When dates and guest counts are provided, returns pricing, availability, and SLIP tokens needed to add items to a booking session. The param names vary by item (e.g. 'divers', 'snorkeler', 'guest', 'student'). Use getCategories first, then search with category_id and dates.",
    inputSchema: z.object({
      category_id: z.number().optional().describe("Filter by category ID"),
      start_date: z
        .string()
        .optional()
        .describe("Start date in YYYYMMDD format"),
      end_date: z
        .string()
        .optional()
        .describe("End date in YYYYMMDD format"),
      keyword: z.string().optional().describe("Search keyword for item name"),
      param: z.record(z.string(), z.number()).optional().describe("Booking parameters as key-value pairs, e.g. {divers: 2} or {guest: 3}. Parameter names vary by item type."),
    }),
    execute: async ({ category_id, start_date, end_date, keyword, param }) => {
      const result = await getClient().getItems({
        category_id,
        start_date,
        end_date,
        keyword,
        param: param && Object.keys(param).length > 0 ? param : undefined,
      });

      const items = Object.values(result.items || {}).map((item) => ({
        item_id: item.item_id,
        name: item.name,
        summary: item.summary ? stripHtml(item.summary) : "",
        category_id: item.category_id,
        image_url: getItemImageUrl(item.image),
        available: item.rate?.available ?? item.stock,
        stock: item.stock,
        price: item.rate?.summary?.price?.total,
        price_unit: item.rate?.summary?.price?.unit,
        slip: item.rate?.slip,
        status: item.rate?.status,
        param_names: item.param ? Object.entries(item.param)
          .filter(([, p]) => !p.hide && !p.customer_hide && !p.lock)
          .map(([key, p]) => ({ key, label: p.lbl, min: p.MIN, max: p.MAX }))
          : undefined,
      }));
      return { items, count: items.length };
    },
  }),

  checkAvailability: tool({
    description:
      "Check calendar availability for a specific item over a date range. Returns which dates have stock available (number = spots available, 0 = sold out).",
    inputSchema: z.object({
      item_id: z.number().describe("The item ID to check availability for"),
      start_date: z.string().describe("Start date in YYYYMMDD format"),
      end_date: z.string().describe("End date in YYYYMMDD format"),
    }),
    execute: async ({ item_id, start_date, end_date }) => {
      const result = await getClient().getItemCalendar(item_id, {
        start_date,
        end_date,
      });
      // Calendar response: result.item.cal is Record<string, number|string>
      // Filter out metadata keys, return only date entries
      const cal = result.item?.cal || {};
      const dates: Record<string, number> = {};
      for (const [key, val] of Object.entries(cal)) {
        if (/^\d{8}$/.test(key) && typeof val === "number") {
          dates[key] = val;
        }
      }
      return { item_id: result.item?.item_id, dates };
    },
  }),

  addToSession: tool({
    description:
      "Add an item to the booking session (cart) using its SLIP token. The SLIP comes from a rated item search. Returns the session with pricing totals.",
    inputSchema: z.object({
      slip: z.string().describe("The SLIP token from a rated item search"),
      session_id: z
        .string()
        .optional()
        .describe("Existing session ID to add to"),
    }),
    execute: async ({ slip, session_id }) => {
      const result = await getClient().createSession({ slip, session_id });
      const s = result.booking.session;
      return {
        session_id: s.id,
        items: s.item,
        summary: s.summary,
        total: s.total,
        date_desc: s.date_desc,
      };
    },
  }),

  getBookingFormFields: tool({
    description:
      "Get the required customer form fields needed to complete a booking (name, email, phone, etc.).",
    inputSchema: z.object({}),
    execute: async () => {
      const result = await getClient().getBookingForm();
      const fields = Object.entries(result.booking_form_ui || {})
        .filter(([, field]) => {
          if (field.define.archived === 1) return false;
          if (field.define.layout.start_hidden === 1) return false;
          const cf = field.define.layout.customer?.form;
          if (cf !== undefined && cf !== 1) return false;
          return true;
        })
        .sort((a, b) => a[1].define.position - b[1].define.position)
        .map(([key, field]) => ({
          field_name: key,
          label: field.define.layout.lbl,
          type: field.define.layout.type,
          required: !!field.define.required,
          options: field.define.layout.options,
        }));
      return { fields };
    },
  }),

  createBooking: tool({
    description:
      "Finalize a booking with the session and customer details. Returns the checkout URL for payment. Only call this after collecting all required customer form fields.",
    inputSchema: z.object({
      session_id: z.string().describe("The booking session ID"),
      customer_name: z.string().describe("Customer full name"),
      customer_email: z.string().describe("Customer email address"),
      customer_phone: z
        .string()
        .optional()
        .describe("Customer phone number"),
      additional_fields: z
        .record(z.string(), z.string())
        .optional()
        .describe("Any additional form fields as key-value pairs"),
    }),
    execute: async ({
      session_id,
      customer_name,
      customer_email,
      customer_phone,
      additional_fields,
    }) => {
      const form: Record<string, string> = {
        customer_name,
        customer_email,
        ...(customer_phone ? { customer_phone } : {}),
        ...(additional_fields || {}),
      };
      const result = await getClient().createBooking({ session_id, form });
      return {
        booking_id: result.booking.booking_id,
        invoice_url: result.booking.invoice_url,
        status: result.booking.status,
      };
    },
  }),

  clearSession: tool({
    description: "Clear the current booking session / cart. Use when the customer wants to start over.",
    inputSchema: z.object({
      session_id: z.string().describe("The session ID to clear"),
    }),
    execute: async ({ session_id }) => {
      await getClient().clearSession(session_id);
      return { success: true };
    },
  }),
};
