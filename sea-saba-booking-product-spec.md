# Sea Saba Booking Tool --- Product Specification

Version: 1.0\
Status: Active Development

------------------------------------------------------------------------

## 1. Purpose

This document defines the business logic, customer experience, and
operational rules for the Sea Saba standalone booking tool that
integrates with Checkfront API v3.

The goal is to provide a superior UX for booking:

-   Diving
-   Snorkeling
-   Sunset Cruises

The system must generate a single Checkfront invoice/checkout link per
booking.

------------------------------------------------------------------------

## 2. Core Principles

-   Checkfront API v3 is the pricing authority.
-   Multi-day discounts are handled via Checkfront variable rates.
-   The app never calculates discounts locally.
-   All dive/snorkel items are **All Day items** with **inclusive end
    dates**.
-   SLIP tokens are required to build invoices.
-   The system must prevent operationally invalid bookings (e.g., Sunset
    minimum).

------------------------------------------------------------------------

## 3. Inventory Model

### Diving

Advanced 2-Tank → Item 5\
Classic 2-Tank → Item 133\
Afternoon 1-Tank Dive → Item 11

### Snorkeling

Afternoon Snorkel → Item 12

### Sunset Cruise

-   Minimum 8 guests at \$50 each
-   If fewer than 8:
    -   Customer must contact us to combine groups
    -   OR choose private charter (pay for 8)

------------------------------------------------------------------------

## 4. Date Semantics (Critical)

All dive/snorkel items are All Day.

Rules:

-   If start = 2026-02-12 and user selects 3 days → end = 2026-02-14
-   End date is inclusive
-   API must send start_date and end_date exactly as inclusive values
-   Never apply +1 checkout-style shifting

------------------------------------------------------------------------

## 5. Guided Booking Flow

1.  Select Activity
2.  Select Dates (inclusive range)
3.  Select Guest Count
4.  Review Pricing (from rated API call)
5.  Enter Customer Details
6.  Redirect to Checkfront Checkout

------------------------------------------------------------------------

## 6. Sunset Cruise Rules

If guests \< 8: - Show minimum notice - Offer contact request flow - Do
not generate invoice

If guests ≥ 8: - Proceed normally

Optional: - "Private (Pay for 8)" toggle

------------------------------------------------------------------------

## 7. Success Criteria

-   Customers complete bookings without confusion about dates
-   Discounts automatically apply from Checkfront
-   No invalid sunset cruise bookings
-   Invoice totals match Checkfront exactly
