## Context
You need a standalone booking tool that gives customers a better UX for booking tours/activities than the default Checkfront interface. The tool offers two paths: a guided multistep form and an AI chatbot (powered by Claude). Both paths query the Checkfront API v3 for availability/pricing and ultimately redirect customers to Checkfront's checkout page for payment. Built as a standalone Next.js app now, integrated into your main site later.

## Tech Stack

Next.js 14+ (App Router) with TypeScript
Tailwind CSS for styling
Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for the chatbot
Zod for validation
date-fns for date handling


## Project Structure
checkfront-api-connector/
├── .env.local                    # API credentials (not committed)
├── .env.example                  # Template
├── next.config.ts
├── tailwind.config.ts
├── package.json
│
├── app/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing: choose form or chatbot
│   ├── globals.css
│   ├── guided/
│   │   ├── layout.tsx            # Progress bar wrapper
│   │   └── page.tsx              # Form orchestrator (manages 7 steps)
│   ├── chat/
│   │   └── page.tsx              # Chat interface page
│   └── api/
│       ├── categories/route.ts
│       ├── items/route.ts
│       ├── items/[itemId]/route.ts
│       ├── items/[itemId]/calendar/route.ts
│       ├── session/route.ts
│       ├── session/clear/route.ts
│       ├── booking/form/route.ts
│       ├── booking/create/route.ts
│       └── chat/route.ts         # AI streaming endpoint
│
├── lib/
│   ├── checkfront-client.ts      # API client class
│   ├── checkfront-types.ts       # TypeScript types
│   ├── ai-tools.ts               # Claude tool definitions
│   ├── constants.ts              # Env vars, config
│   ├── session.ts                # Cookie helpers
│   └── utils.ts                  # Shared utilities
│
├── hooks/
│   ├── use-booking-form.ts       # Multistep form state
│   └── use-booking-session.ts    # Session API calls
│
└── components/
    ├── ui/                       # button, card, input, select, spinner, stepper, badge
    ├── landing/                  # hero-section, path-card
    ├── guided/                   # step-category, step-dates, step-params, step-items,
    │                             # step-review, step-customer, step-confirm,
    │                             # item-card, booking-summary
    └── chat/                     # chat-interface, message-bubble, tool-result-card,
                                  # chat-input, suggested-actions

## Implementation Phases

### Phase 1: Project Setup

Initialize Next.js with create-next-app (TypeScript, Tailwind, App Router)
Install deps: ai, @ai-sdk/anthropic, zod, date-fns
Create .env.example and .env.local with Checkfront + Anthropic credentials
Configure next.config.ts (image domains for checkfront.com)
Create lib/constants.ts with env var validation
Verify: npm run dev starts clean

### Phase 2: Checkfront API Client + Types

lib/checkfront-types.ts — interfaces for categories, items, sessions, bookings, calendar, form fields
lib/checkfront-client.ts — class wrapping all Checkfront endpoints with Basic Auth, form-encoded POST bodies, rate limit handling (429 retry), typed responses
lib/session.ts — HTTP-only cookie helpers for session_id
lib/utils.ts — date conversion (YYYYMMDD), currency formatting, array helpers
Verify: Call getCategories() from a temp route, confirm typed response

### Phase 3: Backend API Routes (9 routes)
Each route instantiates CheckfrontClient, calls the appropriate method, handles errors:

GET /api/categories — list categories
GET /api/items — list/search items (supports rated queries with dates + params)
GET /api/items/[itemId] — single item detail
GET /api/items/[itemId]/calendar — item availability calendar
POST /api/session — create or modify session (add SLIP, alter quantities)
POST /api/session/clear — clear session
GET /api/booking/form — get required customer fields
POST /api/booking/create — finalize booking, return invoice_url
POST /api/chat — AI streaming endpoint (Phase 6)
Verify: Hit each route with curl/REST client against your Checkfront account

### Phase 4: Landing Page + Base UI

Root layout with font, Tailwind, header/footer
Landing page with hero section + two path cards (Guided / AI Chat)
Base UI components: button, card, input, select, spinner, stepper, badge
Verify: Landing page renders, both links navigate to /guided and /chat

### Phase 5: Guided Multistep Form

7-step booking flow managed by useBookingForm hook (useReducer):
StepComponentAPI CallUser Action1. Categorystep-categoryGET /api/categoriesSelect a category2. Datesstep-datesGET /api/items/[id]/calendar (optional)Pick start/end date3. Party Sizestep-paramsGET /api/items (unrated, for param schema)Set adults/children/guests4. Itemsstep-itemsGET /api/items (rated, with dates+params)Select an item (gets SLIP)5. Reviewstep-reviewPOST /api/session (create with SLIP)Review booking summary6. Customerstep-customerGET /api/booking/formFill required fields7. Confirmstep-confirmPOST /api/booking/createSubmit → redirect to invoice_url

Verify: Complete a full booking flow end-to-end, land on Checkfront checkout

### Phase 6: AI Chatbot

lib/ai-tools.ts — 7 tools using Vercel AI SDK tool() with Zod schemas:

getCategories, searchItems, checkAvailability, addToSession, getBookingFormFields, createBooking, clearSession


app/api/chat/route.ts — uses streamText with @ai-sdk/anthropic, Claude Sonnet, system prompt, tools, maxSteps: 10
app/chat/page.tsx — uses useChat hook from AI SDK
Chat components: interface, message bubbles, rich tool result cards (item grids, session summary, checkout link), input bar
Verify: Conversational booking flow: ask about activities → get options → select → provide details → get checkout link

### Phase 7: Polish

Error boundaries (app/error.tsx, per-route)
Retry logic with exponential backoff for 429s
Session expiration detection + recovery
Loading skeletons for categories, items, session
Responsive design (mobile-first)
Accessibility (focus rings, labels, aria-live, WCAG contrast)
Zod validation on all form submissions and API inputs

### Key Design Decisions

Vercel AI SDK over raw Anthropic SDK — provides useChat + streamText + automatic tool-call loops, eliminating manual SSE/tool wiring
Server-side Checkfront credentials — API keys never reach the browser; all calls proxied through API routes
SLIP tokens fetched fresh at item selection step — SLIPs are one-time-use and can expire, so never cached
Session managed via HTTP-only cookie for the form path; via conversation context for the chat path
Claude Sonnet for chatbot (fast + good tool use) rather than Opus (slower, more expensive for real-time chat)
Hand-built UI components with Tailwind rather than a component library — keeps it lightweight and easy to restyle for main site integration