# CLAUDE.md — Alte Liebe Booking Web App

## Project overview

Build a booking web app for a Swiss holiday home called "Alte Liebe" located in Biel, 3918 Wiler (Lötschental), Switzerland. The app lets guests view availability (sourced from a Shared Outlook Calendar via Microsoft Graph) and submit reservation requests.

**Stack**: React (Vite) frontend + Azure Functions API backend, deployed as a single Azure Static Web App (free tier). Custom domain: `booking.alteliebe.com`.

**Estimated cost**: €0/month (SWA free tier includes CDN, SSL, custom domain, 500K function invocations).

---

## Architecture

```
Guest Browser (React SPA)
    │
    ├── Static assets served by Azure SWA CDN
    │
    └── /api/* proxied to managed Azure Functions
            │
            ├── GET  /api/availability  →  Microsoft Graph calendarView
            └── POST /api/reservation   →  Microsoft Graph create event
                        │
                Shared Outlook Calendar (source of truth)
```

---

## Parallelization strategy

This project has two independent workstreams that can run in parallel terminals:

### Terminal 1: Frontend (React + Vite)
- Project root scaffolding (package.json, vite.config.js, index.html)
- React components (App, Calendar, ReservationForm)
- CSS (alpine-luxe theme)
- staticwebapp.config.json

### Terminal 2: API (Azure Functions + Microsoft Graph)
- api/ directory with its own package.json
- Shared Graph client helper
- GET /api/availability function
- POST /api/reservation function
- local.settings.json template

### Terminal 3 (after both complete): Integration & polish
- GitHub Actions workflow
- README
- .gitignore
- Local dev test instructions
- Final review pass

---

## Design system — "Alpine Luxe"

The design should feel like a boutique alpine guesthouse — warm, organic, refined. NOT generic SaaS.

### Fonts
- Display/headings: `'Cormorant Garamond'` (Google Fonts) — serif, elegant, chalet-menu feel
- Body/UI: `'DM Sans'` (Google Fonts) — clean, modern sans-serif
- Load from Google Fonts in index.html: weights 400, 600, 700 for Cormorant; 400, 500, 600 for DM Sans

### Color palette
```css
--color-bg: #faf8f5;           /* warm off-white, like old paper */
--color-bg-warm: #f5f0ea;      /* slightly warmer surface */
--color-surface: #ffffff;       /* cards */
--color-text: #2c2420;         /* dark warm brown */
--color-text-muted: #8a7e76;   /* medium brown-gray */
--color-text-light: #b5aa9e;   /* light brown hint text */
--color-primary: #3d5a3e;      /* forest green — main action color */
--color-primary-light: #4a6e4b;
--color-primary-soft: #e8efe8; /* green tint for backgrounds */
--color-accent: #c47a4a;       /* terracotta/amber — accent, highlights */
--color-booked: #d4a69a;       /* salmon — booked dates */
--color-booked-bg: #fce8e3;    /* light salmon background */
--color-selected: #3d5a3e;     /* same as primary — selected dates */
--color-selected-bg: #d5e4d5;
--color-range-bg: #eaf2ea;     /* light green for date range */
--color-past: #e8e4df;         /* gray for past/off-season */
--color-error: #c44a4a;
--color-error-bg: #fce3e3;
--color-border: #e0dbd5;
--color-border-light: #ece8e2;
```

### UI characteristics
- Subtle grain texture overlay (SVG filter, very low opacity ~0.03)
- Generous whitespace, no visual clutter
- Rounded corners (8px default, 16px for cards)
- Minimal shadows (sm: 0 1px 3px, md: 0 4px 16px)
- Logo mark: ✦ symbol in terracotta above "Alte Liebe" in Cormorant Garamond
- Tagline: "A home in the Swiss mountains" in italic Cormorant
- Mobile-first responsive design (breakpoint at 640px)

---

## Property details (from guest information PDF)

Use these details to inform the app content:

- **Address**: Biel, 3918 Wiler (Lötschental), Switzerland
- **Sleeping**: 3 bedrooms — 2 with bunk beds, 1 with double bed (two single mattresses). All mattresses 200x80cm. 4 single duvets, 2 double duvets, 6 pillows.
- **Max guests**: ~8 (practical limit based on beds)
- **Season**: May 1 — November 1 (summer season only; winter has separate complex opening procedures)
- **Pricing**:
  - CHF 45 per person per night
  - Minimum CHF 120 per night
  - Tourist tax: CHF 4.80/adult/night, CHF 2.40/child (6-16)/night
- **Payment**: Bank transfer to Raiffeisen Wiler, IBAN CH65 8080 8006 8772 1900 6, tnv Femke Maria Harten
- **WiFi**: Available for CHF 25/week, must be pre-arranged with host
- **Check-in**: Key lockbox by front door (code shared upon booking confirmation)
- **Guest cards**: Guests must register via tourist check-in portal to receive free gondola + bus cards
- **Guests must bring**: Towels, kitchen towels, bed linens, toilet paper, Nespresso cups
- **Available in house**: Spices, oil/vinegar, tea, cleaning supplies, games, outdoor toys, JBL speaker, snowshoes, flashlights

---

## File structure

```
alteliebe-booking/
├── CLAUDE.md                        ← this file
├── README.md                        ← setup guide + architecture docs
├── package.json                     ← frontend deps (react, react-dom, vite)
├── vite.config.js                   ← Vite config with /api proxy
├── index.html                       ← HTML entry with Google Fonts
├── staticwebapp.config.json         ← Azure SWA routing
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml               ← GitHub Actions CI/CD
├── src/
│   ├── main.jsx                     ← React entry
│   ├── App.jsx                      ← Main app component (state, routing, data fetching)
│   ├── App.css                      ← Full stylesheet (alpine-luxe theme)
│   └── components/
│       ├── Calendar.jsx             ← Multi-month calendar grid with availability
│       └── ReservationForm.jsx      ← Guest details form with validation
└── api/
    ├── package.json                 ← API deps (@azure/identity, @microsoft/microsoft-graph-client)
    ├── local.settings.json          ← Local env vars template (git-ignored)
    ├── host.json                    ← Azure Functions host config
    ├── shared/
    │   └── graph.js                 ← Microsoft Graph client (app-only auth)
    └── src/
        └── functions/
            ├── availability.js      ← GET /api/availability
            └── reservation.js       ← POST /api/reservation
```

---

## Detailed implementation spec

### index.html
- Charset UTF-8, viewport meta
- Title: "Alte Liebe — Book Your Stay in Switzerland"
- Preconnect to fonts.googleapis.com + fonts.gstatic.com
- Load Cormorant Garamond (ital 400, regular 400/600/700) and DM Sans (400/500/600)
- Single `<div id="root">` + module script to `/src/main.jsx`

### vite.config.js
- React plugin
- Output to `dist/`
- Dev server proxy: `/api` → `http://localhost:7071`

### staticwebapp.config.json
- Navigation fallback to `/index.html` (exclude `/api/*`, `/assets/*`)
- Anonymous auth on `/api/*`
- 404 → rewrite to `/index.html`
- Security headers: X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin

### src/main.jsx
- Standard React 18 createRoot render with StrictMode

### src/App.jsx — Main application component

**State:**
- `bookedRanges` — array of `{start: "YYYY-MM-DD", end: "YYYY-MM-DD"}` from API
- `selectedCheckIn` / `selectedCheckOut` — Date objects or null
- `step` — enum: `'select'` | `'form'` | `'confirmed'`
- `loading` / `submitting` / `error` — UI state
- `confirmation` — response data after successful POST

**Season logic:**
- Season: May 1 (month index 4) to November 1 (month index 10)
- Determine `seasonYear`: if current month > October, use next year
- `seasonStart = new Date(seasonYear, 4, 1)`
- `seasonEnd = new Date(seasonYear, 10, 1)`

**Data fetching:**
- On mount, `GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Parse response `{bookedRanges: [{start, end, subject, showAs}]}`

**Date selection logic:**
1. First click → set checkIn, clear checkOut
2. Second click:
   - If before checkIn → replace checkIn
   - If after checkIn → validate no booked dates in range → set checkOut → advance to 'form' step
3. If range conflicts with booked dates → show error toast (auto-dismiss 4s)

**Helper functions:**
- `isDateBooked(date)` — check if date falls within any booked range
- `isDateInSeason(date)` — within season bounds
- `isDateSelectable(date)` — in season + not booked + not in past
- `findNextAvailable()` — scan from today to seasonEnd, find first stretch ≥2 free nights
- `formatDate(d)` — `toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'long', year:'numeric'})`

**Reservation submit:**
- `POST /api/reservation` with `{checkIn, checkOut, guestName, email, phone, guests, message}`
- On 409 → show "dates no longer available" error
- On success → set confirmation data, advance to 'confirmed' step

**Layout structure:**
1. Background grain overlay div (fixed, pointer-events none)
2. Header: ✦ mark + "Alte Liebe" + tagline
3. Main (max-width 960px centered):
   - Hero: "Reserve Your Stay" + season info
   - Error banner (conditional)
   - If confirmed → Confirmation card
   - Else:
     - Selection bar (check-in → check-out + nights badge)
     - Calendar component
     - Legend row
     - Suggestion (next available, shown when no dates selected)
     - Reservation form (shown when step === 'form')
4. Footer: "Alte Liebe · Switzerland" + contact email

### src/components/Calendar.jsx

**Props:** `seasonStart, seasonEnd, bookedRanges, selectedCheckIn, selectedCheckOut, onDateClick, isDateSelectable, isDateBooked`

**MonthGrid sub-component:**
- Props: year, month, plus parent's date helpers
- Calculate days in month, first day of week (Monday=0 start)
- Render month name header (Cormorant Garamond)
- Weekday headers row: Mo Tu We Th Fr Sa Su
- Grid of day cells with classes:
  - `.booked` — salmon background, small dot indicator
  - `.selectable` — green text, cursor pointer, hover scale(1.1)
  - `.check-in` / `.check-out` — green fill, white text, slight scale+shadow
  - `.in-range` — light green background
  - `.past` — muted, half opacity
  - `.today` — terracotta outline
- Each cell: onClick → onDateClick(date), keyboard accessible (Enter/Space)

**Calendar wrapper:**
- Generate array of months from seasonStart to seasonEnd
- Render in CSS grid: `repeat(auto-fill, minmax(280px, 1fr))` with 1.5rem gap
- Each month in a white card with light border and shadow-sm

### src/components/ReservationForm.jsx

**Props:** `checkIn, checkOut, nightCount, onSubmit, onCancel, submitting`

**Local state:**
- `form`: `{guestName, email, phone, guests: 2, message}`
- `errors`: validation errors object

**Validation:**
- guestName: required, trimmed
- email: required, basic regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- guests: 1-12 range (max 12 to be safe; practical max ~8 based on beds)

**Layout:**
1. Form header: "Complete Your Reservation" + date range + nights badge
2. Pricing info banner (amber/warm background):
   - "CHF 45 per person per night (min. CHF 120/night)"
   - "Tourist tax: CHF 4.80/adult, CHF 2.40/child (6-16) per night"
3. Form rows (2-column grid on desktop, stacked on mobile):
   - Row 1: Full name* + Email*
   - Row 2: Phone (optional) + Number of guests
   - Full width: Message textarea (optional), placeholder: "Anything we should know? Special requests, arrival time, etc."
4. Actions row: "← Change Dates" ghost button + "Request Reservation" primary button
5. Submitting state: spinner + "Sending…" on button

### src/App.css

Full stylesheet implementing the alpine-luxe design system. Key sections:
- CSS variables (all colors, radius, shadows, fonts, transitions)
- Reset (box-sizing, margin, padding)
- Grain overlay (SVG noise filter background, fixed, 3% opacity)
- Header styles (warm gradient background, centered)
- Main container (960px max-width)
- Hero section
- Error banner with slide-down animation
- Selection bar (flex row, responsive)
- Calendar grid (auto-fill columns)
- Month grid cards
- Day cell states (all the date styling variants)
- Legend row
- Suggestion banner
- Loading spinner
- Reservation form card
- Form elements (inputs, textarea, labels, errors)
- Buttons (primary green, ghost outline)
- Confirmation card
- Footer
- Responsive breakpoint at 640px:
  - Single column calendar
  - Stacked selection bar
  - Stacked form rows
  - Full-width buttons

### api/package.json
```json
{
  "name": "alteliebe-api",
  "version": "1.0.0",
  "dependencies": {
    "@azure/identity": "^4.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.7"
  }
}
```

### api/host.json
```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

### api/local.settings.json (template, git-ignored)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_TENANT_ID": "<your-azure-ad-tenant-id>",
    "AZURE_CLIENT_ID": "<your-app-registration-client-id>",
    "AZURE_CLIENT_SECRET": "<your-app-registration-client-secret>",
    "CALENDAR_USER_ID": "<mailbox-email-or-user-id>",
    "CALENDAR_ID": "<shared-calendar-id-or-leave-empty-for-default>"
  }
}
```

### api/shared/graph.js — Microsoft Graph client

**getGraphClient():**
- Singleton pattern — initialize once, reuse
- Uses `ClientSecretCredential` from @azure/identity (app-only auth, no user login)
- Reads AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET from env
- Creates `TokenCredentialAuthenticationProvider` with scope `https://graph.microsoft.com/.default`
- Returns `Client.initWithMiddleware({ authProvider })`

**getBookedRanges(from, to):**
- GET `/users/{CALENDAR_USER_ID}/calendars/{CALENDAR_ID}/calendarView`
  - If CALENDAR_ID is empty, use `/users/{CALENDAR_USER_ID}/calendarView` (default calendar)
- Query params: `startDateTime={from}T00:00:00Z`, `endDateTime={to}T23:59:59Z`
- Select: subject, start, end, showAs, isCancelled
- Top: 200 (max expected events in a season)
- Filter results: exclude cancelled, include busy + oof + tentative
- Map to: `{start: "YYYY-MM-DD", end: "YYYY-MM-DD", subject, showAs}`

**createReservation({checkIn, checkOut, guestName, email, phone, guests, message}):**
- POST to same calendar endpoint `/events`
- Event body:
  - subject: `🏠 Reservation: {guestName} ({guests} guests)`
  - body: HTML table with all guest details
  - start: `{checkIn}T14:00:00` timezone `Europe/Zurich`
  - end: `{checkOut}T11:00:00` timezone `Europe/Zurich`
  - isAllDay: false
  - showAs: `tentative` (host confirms manually)
  - categories: `["Reservation Request"]`

### api/src/functions/availability.js

- Route: `GET /api/availability`
- Auth level: anonymous
- Query params: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD) — required
- Calls `getBookedRanges(from, to)`
- Returns `{bookedRanges: [...]}` with 5-minute cache header
- Error: 500 with message

### api/src/functions/reservation.js

- Route: `POST /api/reservation`
- Auth level: anonymous
- Body: `{checkIn, checkOut, guestName, email, phone?, guests?, message?}`
- Validation:
  - Required: checkIn, checkOut, guestName, email
  - checkOut must be after checkIn
- **Double-check availability** (race condition prevention):
  - Call `getBookedRanges(checkIn, checkOut)`
  - If any existing event overlaps → return 409 with "dates no longer available"
- If available → `createReservation(...)` → return 201 with confirmation
- Handle Graph 401/403 → return 500 "Calendar access error"

### .github/workflows/deploy.yml

Standard Azure Static Web Apps deployment:
- Trigger: push to main, PR to main
- Steps: checkout → npm ci → npm run build → Azure/static-web-apps-deploy@v1
- Config: app_location="/", api_location="api", output_location="dist"
- Secret: AZURE_SWA_TOKEN

### .gitignore
```
node_modules/
dist/
api/local.settings.json
.env
.env.local
*.log
```

### README.md

Comprehensive setup guide covering:
1. Architecture diagram (ASCII)
2. Cost breakdown table (all €0)
3. Prerequisites list
4. Step-by-step setup:
   - Azure AD app registration (Calendars.ReadWrite application permission)
   - Finding CALENDAR_USER_ID and CALENDAR_ID via Graph Explorer
   - Creating Azure Static Web App (CLI command + portal alternative)
   - Configuring environment variables
   - Custom domain setup (CNAME for booking.alteliebe.com)
   - Deployment (push to main)
5. Local development instructions (frontend + API in parallel)
6. How it works explanation (availability check flow, reservation flow, conflict prevention)
7. Project structure tree
8. Future enhancements list:
   - Email notifications (Graph sendMail)
   - Rate limiting
   - Admin page
   - iCal feed export
   - Multi-language (EN/DE/NL)
   - Seasonal pricing display

---

## Implementation order

### Phase 1 — Scaffold (both terminals, ~2 min)

**Terminal 1 (frontend):**
```bash
# Initialize, create package.json, vite.config.js, index.html, src/main.jsx
```

**Terminal 2 (API):**
```bash
# Create api/ directory, api/package.json, api/host.json, api/local.settings.json, api/shared/graph.js
```

### Phase 2 — Core implementation (parallel, ~10 min)

**Terminal 1 (frontend):**
1. Create `src/App.css` — full stylesheet
2. Create `src/components/Calendar.jsx` — month grid component
3. Create `src/components/ReservationForm.jsx` — form component
4. Create `src/App.jsx` — main app with all state logic

**Terminal 2 (API):**
1. Create `api/src/functions/availability.js`
2. Create `api/src/functions/reservation.js`

### Phase 3 — Config & docs (either terminal, ~3 min)
1. Create `staticwebapp.config.json`
2. Create `.github/workflows/deploy.yml`
3. Create `.gitignore`
4. Create `README.md`

### Phase 4 — Verify (~2 min)
1. Run `npm install` in root
2. Run `npm install` in api/
3. Run `npm run build` — verify no errors
4. Review all files for completeness

---

## Quality checklist

Before declaring done, verify:

- [ ] `npm run build` succeeds with zero errors
- [ ] All CSS variables defined and used consistently
- [ ] Calendar renders 6 months (May through October)
- [ ] Date selection handles: first click, second click, range validation, conflict detection
- [ ] Form validates required fields with inline error messages
- [ ] Responsive layout works at 640px breakpoint
- [ ] Error states handled: API failure, network error, 409 conflict
- [ ] Loading states: spinner on initial load, button spinner on submit
- [ ] Confirmation screen shows all booking details
- [ ] API double-checks availability before creating event (race condition)
- [ ] Graph client handles missing CALENDAR_ID (falls back to default calendar)
- [ ] Events created as tentative (host confirms in Outlook)
- [ ] Event body contains full guest details in HTML table
- [ ] Timezone set to Europe/Zurich
- [ ] staticwebapp.config.json has navigation fallback
- [ ] .gitignore excludes node_modules, dist, local.settings.json
- [ ] README has complete setup instructions
- [ ] No hardcoded secrets anywhere in the codebase
- [ ] Accessibility: keyboard navigation on calendar cells, aria-labels, role attributes
- [ ] Google Fonts loaded with preconnect for performance

---

## Important constraints

1. **NO other frameworks** — React only, no Next.js, no Remix, no Astro. Vite for bundling.
2. **NO Tailwind** — custom CSS with CSS variables. The alpine-luxe theme is specific and intentional.
3. **NO database** — the Outlook Calendar IS the database. Read and write via Graph API only.
4. **NO user authentication on the frontend** — the booking form is public. API uses app-only Graph auth (server-side only, credentials never exposed to browser).
5. **Azure Functions v4 programming model** — use `app.http()` registration pattern, NOT the old function.json pattern.
6. **Keep it simple** — this is a single-page booking widget, not a full property management system. No admin panel, no payment processing, no email sending (yet). Just: view calendar → pick dates → submit request → see confirmation.
