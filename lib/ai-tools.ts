import { tool } from "ai";
import { z } from "zod";
import { getClient } from "./checkfront-client";
import { getItemImageUrl, stripHtml } from "./utils";
import { CF_ITEMS } from "./constants";

export const checkfrontTools = {
  getCategories: tool({
    description:
      "Get Sea Saba's booking categories. Use this to see what types of activities are available (diving, snorkeling, sunset cruises).",
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
    description: `Search for Sea Saba activities with availability and pricing. Known items: Advanced 2-Tank Dive (ID ${CF_ITEMS.advanced2Tank}), Classic 2-Tank Dive (ID ${CF_ITEMS.classic2Tank}), Afternoon 1-Tank Dive (ID ${CF_ITEMS.afternoonDive}), Afternoon Snorkel (ID ${CF_ITEMS.afternoonSnorkel}), Sunset Cruise (ID ${CF_ITEMS.sunsetCruise}). When dates and guest counts are provided, returns pricing and SLIP tokens. Param names vary by item (e.g. 'divers', 'snorkeler', 'guest'). IMPORTANT: End dates are INCLUSIVE for all-day items — do NOT add +1.`,
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
      "Check Sea Saba calendar availability for a specific activity over a date range. Returns stock per date (number = spots available, 0 = sold out). Use INCLUSIVE end dates.",
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
      "Add a Sea Saba activity to the booking cart using its SLIP token from searchItems. IMPORTANT: Before adding Advanced 2-Tank Dive (ID 5), confirm the customer meets certification requirements. Before adding Sunset Cruise (ID 194), confirm at least 8 guests.",
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
      "Finalize a Sea Saba booking and get the Checkfront checkout URL for payment. Only call after: (1) items are in the session, (2) all required customer details collected. The checkout link redirects to Checkfront's secure payment page.",
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

  prepareContactRequest: tool({
    description: `Collect customer info for requests that cannot be completed as online bookings. Use this for: sunset cruises with fewer than 8 guests, Discover Scuba Diving, certification courses (Open Water, Advanced, Technical), private charters, fishing trips, or any special request. This pre-fills a contact form that the customer can send to Sea Saba. After calling this, also remind the customer they can reach Sea Saba directly on WhatsApp: +599-416-2246.`,
    inputSchema: z.object({
      customer_name: z.string().describe("Customer's full name"),
      customer_email: z.string().describe("Customer's email address"),
      customer_phone: z.string().optional().describe("Customer's phone or WhatsApp number"),
      request_type: z.enum([
        "sunset_cruise_under_minimum",
        "discover_scuba",
        "open_water_course",
        "advanced_course",
        "technical_diving",
        "private_charter",
        "fishing",
        "group_event",
        "other",
      ]).describe("Type of request"),
      preferred_dates: z.string().optional().describe("Customer's preferred dates"),
      guest_count: z.number().optional().describe("Number of guests"),
      details: z.string().describe("Summary of what the customer is looking for"),
    }),
    execute: async (input) => {
      // For now, return the structured data for display in the chat.
      // When integrated into the main Sea Saba website, this will
      // pre-populate the site's contact form.
      return {
        ...input,
        status: "ready_for_contact_form",
        whatsapp: "+599-416-2246",
        message: "Your request details have been prepared. You can submit this to Sea Saba or contact them directly on WhatsApp.",
      };
    },
  }),
};
