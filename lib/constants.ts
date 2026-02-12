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
  "category",
  "dates",
  "params",
  "items",
  "review",
  "customer",
  "confirm",
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

export const CF_ITEMS = {
  advanced2Tank: 5,
  classic2Tank: 133,
  afternoonDive: 11,
  afternoonSnorkel: 12,
  sunsetCruise: 194,
} as const;
