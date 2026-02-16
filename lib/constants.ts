function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// These are evaluated lazily on first access in server-side code
export const getCheckfrontConfig = () => {
  const host = requireEnv("CHECKFRONT_HOST");
  return {
    baseUrl: `https://${host}/api/3.0`,
    apiKey: requireEnv("CHECKFRONT_API_KEY"),
    apiSecret: requireEnv("CHECKFRONT_API_SECRET"),
  };
};

export const SESSION_COOKIE_NAME = "cf_session_id";
export const SESSION_COOKIE_MAX_AGE = 60 * 30; // 30 minutes

export const BOOKING_STEPS = [
  "activity",
  "dates",
  "guests",
  "review",
  "details",
  "checkout",
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

export const CF_ITEMS = {
  advanced2Tank: 5,
  classic2Tank: 133,
  afternoonDive: 11,
  afternoonSnorkel: 12,
  sunsetCruise: 194,
  rentalGear: 176,
  marineParkFee: 68,
} as const;

// ---- Activity param & config types ----

export interface ItemParam {
  key: string;        // Checkfront param report ID
  label: string;      // Display label
  isLocal?: boolean;  // Local rate — must be booked as separate line item
}

export interface ActivityConfig {
  name: string;
  shortDesc: string;
  pickupTime: string;
  certRequired?: string;
  params: ItemParam[];
  minTotalGuests?: number; // Minimum total across all params (e.g. 8 for sunset cruise)
}

/** Single source of truth for all bookable activities, their params, and config */
export const ACTIVITY_INFO: Record<number, ActivityConfig> = {
  [CF_ITEMS.advanced2Tank]: {
    name: "Advanced 2-Tank Dive",
    shortDesc: "Deep Walls & Pinnacles (Up to 110 ft / 33 m) - advanced divers only",
    pickupTime: "8:30 AM pickup",
    certRequired: "Advanced Open Water & 20 dives, or Open Water & 50 dives",
    params: [
      { key: "diver2026rate", label: "Divers" },
      { key: "diver", label: "Divers (Local Rate)", isLocal: true },
    ],
  },
  [CF_ITEMS.classic2Tank]: {
    name: "Classic 2-Tank Dive",
    shortDesc: "Scenic Reefs (Max 70 ft / 21 m) — all certified divers welcome",
    pickupTime: "10:00 AM pickup",
    certRequired: "Open Water or Scuba Diver (with private guide)",
    params: [
      { key: "diver2026rate", label: "Divers" },
      { key: "diver", label: "Divers (Local Rate)", isLocal: true },
    ],
  },
  [CF_ITEMS.afternoonDive]: {
    name: "Afternoon 1-Tank Dive",
    shortDesc: "Relaxed Reef Dive (Max 70 ft / 21 m), great add-on or lighter day option",
    pickupTime: "12:30 PM pickup",
    certRequired: "Open Water or Scuba Diver (with private guide)",
    params: [
      { key: "diver2026rate", label: "Divers" },
      { key: "diver", label: "Divers (Local Rate)", isLocal: true },
    ],
  },
  [CF_ITEMS.afternoonSnorkel]: {
    name: "Afternoon Snorkel",
    shortDesc: "No certification needed — explore Saba's reefs",
    pickupTime: "12:30 PM pickup",
    certRequired: "Comfortable swimmer",
    params: [
      { key: "snorkeler", label: "Snorkelers" },
      { key: "snorkelerlocal", label: "Snorkelers (Local Rate)", isLocal: true },
    ],
  },
  [CF_ITEMS.sunsetCruise]: {
    name: "Sunset Cruise",
    shortDesc: "Evening cruise around Saba (minimum 8 guests)",
    pickupTime: "Evening",
    params: [
      { key: "adult", label: "Adults" },
      { key: "youngadult1417", label: "Young Adults (14-17)" },
      { key: "child513", label: "Children (5-13)" },
    ],
    minTotalGuests: 8,
  },
  [CF_ITEMS.rentalGear]: {
    name: "Full Rental Gear",
    shortDesc: "BCD, regulator, wetsuit, mask, fins, dive computer — added per diver per day",
    pickupTime: "Same as dive",
    params: [
      { key: "fullrentalgear", label: "Full Rental Gear" },
    ],
  },
    [CF_ITEMS.marineParkFee]: {
    name: "Marine Park Fee",
    shortDesc: "$3 per dive goes to support Saba's marine park, $1 per dive goes to support the Hyperbaric Chamber",
    pickupTime: "Same as dive",
    params: [
      { key: "diver2023rate", label: "Diver" },
      { key: "snorkeler", label: "Snorkeler" },
    ],
  },
};
