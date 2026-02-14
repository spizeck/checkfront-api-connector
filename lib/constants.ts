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
} as const;

/** Friendly labels and descriptions for each activity */
export const ACTIVITY_INFO: Record<
  number,
  { name: string; shortDesc: string; pickupTime: string; certRequired?: string }
> = {
  [CF_ITEMS.advanced2Tank]: {
    name: "Advanced 2-Tank Dive",
    shortDesc: "Deep pinnacle sites — Caribbean reef sharks, massive fish schools",
    pickupTime: "8:30 AM pickup",
    certRequired: "AOW + 20 dives, or OW + 50 dives",
  },
  [CF_ITEMS.classic2Tank]: {
    name: "Classic 2-Tank Dive",
    shortDesc: "Walls, reefs, turtles & stingrays — all certified divers welcome",
    pickupTime: "10:00 AM pickup",
  },
  [CF_ITEMS.afternoonDive]: {
    name: "Afternoon 1-Tank Dive",
    shortDesc: "Single dive, great add-on or lighter day option",
    pickupTime: "12:30 PM pickup",
  },
  [CF_ITEMS.afternoonSnorkel]: {
    name: "Afternoon Snorkel",
    shortDesc: "No certification needed — explore Saba's reefs",
    pickupTime: "12:30 PM pickup",
  },
  [CF_ITEMS.sunsetCruise]: {
    name: "Sunset Cruise",
    shortDesc: "Evening cruise around Saba (minimum 8 guests)",
    pickupTime: "Evening",
  },
};
