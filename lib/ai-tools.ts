import { tool } from "ai";
import { z } from "zod";
import { getClient } from "./checkfront-client";
import { CF_ITEMS } from "./constants";

export const checkfrontTools = {
  rateItem: tool({
    description: `Get pricing and availability for a specific Sea Saba activity or add-on.
Items and their booking params:
- Advanced 2-Tank Dive (ID ${CF_ITEMS.advanced2Tank}): diver2026rate, diver (local rate)
- Classic 2-Tank Dive (ID ${CF_ITEMS.classic2Tank}): diver2026rate, diver (local rate)
- Afternoon 1-Tank Dive (ID ${CF_ITEMS.afternoonDive}): diver2026rate, diver (local rate)
- Afternoon Snorkel (ID ${CF_ITEMS.afternoonSnorkel}): snorkeler, snorkelerlocal (local rate)
- Sunset Cruise (ID ${CF_ITEMS.sunsetCruise}): adult, youngadult1417, child513 (min 8 total guests)
- Full Rental Gear (ID ${CF_ITEMS.rentalGear}): fullrentalgear — add-on for divers who need equipment
Local-rate guests MUST be booked as a separate rateItem + addToSession call.
Rental gear must use the same dates as the dive it accompanies.
End dates are INCLUSIVE — do NOT add +1.`,
    inputSchema: z.object({
      item_id: z.number().describe("The item ID to rate"),
      start_date: z.string().describe("Start date in YYYYMMDD format"),
      end_date: z.string().describe("End date in YYYYMMDD format"),
      guests: z
        .record(z.string(), z.number())
        .describe(
          "Guest counts by param key, e.g. {diver2026rate: 2} or {adult: 6, child513: 3}",
        ),
    }),
    execute: async ({ item_id, start_date, end_date, guests }) => {
      const result = await getClient().getItem(item_id, {
        start_date,
        end_date,
        param: guests,
      });
      const item = result.item;
      return {
        item_id: item.item_id,
        name: item.name,
        available: item.rate?.available,
        price: item.rate?.summary?.price?.total,
        slip: item.rate?.slip,
        status: item.rate?.status,
      };
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
      // Filter out metadata keys, return only date entries (cap at 14 days)
      const cal = result.item?.cal || {};
      const dates: Record<string, number> = {};
      let count = 0;
      for (const [key, val] of Object.entries(cal)) {
        if (/^\d{8}$/.test(key) && typeof val === "number") {
          dates[key] = val;
          if (++count >= 14) break;
        }
      }
      return { item_id: result.item?.item_id, dates };
    },
  }),

  addToSession: tool({
    description:
      "Add a Sea Saba activity to the booking cart using its SLIP token from rateItem. IMPORTANT: Before adding Advanced 2-Tank Dive (ID 5), confirm the customer meets certification requirements. Before adding Sunset Cruise (ID 194), confirm at least 8 total guests. Local-rate guests must be added as a separate line item.",
    inputSchema: z.object({
      slip: z.string().describe("The SLIP token from rateItem"),
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
        total: s.total,
        date_desc: s.date_desc,
      };
    },
  }),

  createBooking: tool({
    description:
      "Finalize a Sea Saba booking and get the Checkfront checkout URL for payment. Only call after: (1) items are in the session, (2) customer name and email collected. The checkout link redirects to Checkfront's secure payment page.",
    inputSchema: z.object({
      session_id: z.string().describe("The booking session ID"),
      customer_name: z.string().describe("Customer full name"),
      customer_email: z.string().describe("Customer email address"),
      customer_phone: z
        .string()
        .optional()
        .describe("Customer phone number"),
    }),
    execute: async ({
      session_id,
      customer_name,
      customer_email,
      customer_phone,
    }) => {
      const form: Record<string, string> = {
        customer_name,
        customer_email,
        ...(customer_phone ? { customer_phone } : {}),
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
    description:
      "Clear the current booking session / cart. Use when the customer wants to start over.",
    inputSchema: z.object({
      session_id: z.string().describe("The session ID to clear"),
    }),
    execute: async ({ session_id }) => {
      await getClient().clearSession(session_id);
      return { success: true };
    },
  }),

  prepareContactRequest: tool({
    description: `Collect customer info for requests that cannot be completed as online bookings. Use this for: sunset cruises with fewer than 8 guests, Discover Scuba Diving, certification courses (Open Water, Advanced, Technical), private charters, fishing trips, or any special request. After calling this, also remind the customer they can reach Sea Saba directly on WhatsApp: +599-416-2246.`,
    inputSchema: z.object({
      customer_name: z.string().describe("Customer's full name"),
      customer_email: z.string().describe("Customer's email address"),
      customer_phone: z
        .string()
        .optional()
        .describe("Customer's phone or WhatsApp number"),
      request_type: z
        .enum([
          "sunset_cruise_under_minimum",
          "discover_scuba",
          "open_water_course",
          "advanced_course",
          "technical_diving",
          "private_charter",
          "fishing",
          "group_event",
          "other",
        ])
        .describe("Type of request"),
      preferred_dates: z
        .string()
        .optional()
        .describe("Customer's preferred dates"),
      guest_count: z.number().optional().describe("Number of guests"),
      details: z
        .string()
        .describe("Summary of what the customer is looking for"),
    }),
    execute: async (input) => {
      return {
        ...input,
        status: "ready_for_contact_form",
        whatsapp: "+599-416-2246",
        message:
          "Your request details have been prepared. You can submit this to Sea Saba or contact them directly on WhatsApp.",
      };
    },
  }),
};
