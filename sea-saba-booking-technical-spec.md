# Sea Saba Booking Tool --- Technical Architecture Specification

Version: 1.0\
Status: Active Development

------------------------------------------------------------------------

## 1. System Overview

Standalone Next.js 14 application integrating with Checkfront API v3.

Two booking paths: - Guided Form - AI Chat (Claude via Vercel AI SDK)

All payments handled by redirecting to Checkfront invoice_url.

------------------------------------------------------------------------

## 2. Tech Stack

-   Next.js 14 (App Router, TypeScript)
-   Tailwind CSS
-   Vercel AI SDK
-   Zod
-   date-fns

------------------------------------------------------------------------

## 3. Project Structure

checkfront-api-connector/ - app/ - lib/ - hooks/ - components/

Key modules:

lib/checkfront-client.ts - Handles Basic Auth - Handles rate limiting
(429 retry) - Handles form-encoded POST bodies

lib/date-range.ts - toCfDate() - addDaysInclusive() -
inclusiveDaysBetween()

------------------------------------------------------------------------

## 4. Checkfront Integration Model

Flow:

1.  Rated item request with start_date and end_date (inclusive)
2.  Extract SLIP token
3.  POST SLIP to /booking/session
4.  Create booking via /booking/create
5.  Redirect to invoice_url

Multi-day bookings use one rated call per item with inclusive date
range.

------------------------------------------------------------------------

## 5. Security

-   API credentials stored server-side only
-   No secrets exposed to browser
-   All Checkfront calls proxied via API routes

------------------------------------------------------------------------

## 6. Inclusive Date Enforcement

-   All Day items must use inclusive end_date
-   Date utilities must centralize formatting
-   No +1 day logic allowed for these items

------------------------------------------------------------------------

## 7. AI Chat Integration

AI tools:

-   getCategories
-   searchItems
-   checkAvailability
-   addToSession
-   getBookingFormFields
-   createBooking
-   clearSession

Claude Sonnet via Vercel AI SDK maxSteps: 10

------------------------------------------------------------------------

## 8. Operational Safeguards

-   Advanced dive eligibility confirmation
-   Sunset cruise minimum enforcement
-   Session expiration handling
-   429 exponential backoff
