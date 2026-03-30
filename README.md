# Alte Liebe — Booking Web App

A booking web app for **Alte Liebe**, a Swiss holiday home in Biel, 3918 Wiler (Lötschental), Switzerland. Guests can view availability (sourced from a Shared Outlook Calendar via Microsoft Graph) and submit reservation requests.

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

## Cost

| Resource | Tier | Monthly Cost |
|----------|------|-------------|
| Azure Static Web App | Free | €0 |
| Azure Functions (managed) | Included in SWA free tier | €0 |
| Custom domain + SSL | Included | €0 |
| CDN | Included | €0 |
| **Total** | | **€0/month** |

## Prerequisites

- Node.js 18+
- Azure subscription
- Azure AD app registration with **Calendars.ReadWrite** application permission (admin-consented)
- A shared Outlook calendar to use as the booking source of truth

## Setup

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations → New registration
2. Name: `AlteliebeBooking`
3. Supported account types: Single tenant
4. After creation, go to **API permissions** → Add permission → Microsoft Graph → Application permissions → `Calendars.ReadWrite`
5. Click **Grant admin consent**
6. Go to **Certificates & secrets** → New client secret → copy the value
7. Note the **Application (client) ID** and **Directory (tenant) ID** from the Overview page

### 2. Find Calendar IDs

Use [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer):

```
GET https://graph.microsoft.com/v1.0/users/{email}/calendars
```

Note the `id` of the shared calendar you want to use. If using the default calendar, leave `CALENDAR_ID` empty.

### 3. Create Azure Static Web App

```bash
az staticwebapp create \
  --name alteliebe-booking \
  --resource-group <your-rg> \
  --source https://github.com/<owner>/AlteliebeBooking \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist" \
  --login-with-github
```

### 4. Configure Environment Variables

In the Azure Portal, go to your Static Web App → Configuration → Application settings:

| Setting | Value |
|---------|-------|
| `AZURE_TENANT_ID` | Your Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Your app registration client ID |
| `AZURE_CLIENT_SECRET` | Your app registration client secret |
| `CALENDAR_USER_ID` | Email or user ID of the mailbox owner |
| `CALENDAR_ID` | Calendar ID (leave empty for default calendar) |

### 5. Custom Domain (optional)

1. Add a CNAME record: `booking.alteliebe.com` → `<your-swa>.azurestaticapps.net`
2. In Azure Portal → Static Web App → Custom domains → Add → `booking.alteliebe.com`

### 6. Deploy

Push to `main` — GitHub Actions will build and deploy automatically.

## Local Development

### Frontend

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` with API proxy to `http://localhost:7071`.

### API

```bash
cd api
npm install
# Copy local.settings.json and fill in your Azure AD credentials
func start
```

Requires [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4.

### Both together

Run in two terminals:
- Terminal 1: `npm run dev` (frontend on :5173)
- Terminal 2: `cd api && func start` (API on :7071)

## How It Works

### Availability Check
1. Frontend loads → calls `GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`
2. API queries Microsoft Graph `calendarView` for the season date range
3. Returns booked date ranges (busy, tentative, out-of-office events)
4. Calendar renders with booked dates highlighted in salmon

### Reservation Flow
1. Guest selects check-in and check-out dates on the calendar
2. Fills in the reservation form (name, email, guests, optional message)
3. Frontend POSTs to `/api/reservation`
4. API **double-checks availability** (prevents race conditions)
5. If available → creates a tentative calendar event with guest details
6. If conflict → returns 409 and frontend shows "dates no longer available"
7. Host sees the tentative event in Outlook and confirms manually

## Project Structure

```
alteliebe-booking/
├── CLAUDE.md                        # Project spec
├── README.md                        # This file
├── package.json                     # Frontend deps
├── vite.config.js                   # Vite config with /api proxy
├── index.html                       # HTML entry with Google Fonts
├── staticwebapp.config.json         # Azure SWA routing
├── .gitignore
├── .github/workflows/deploy.yml     # CI/CD
├── src/
│   ├── main.jsx                     # React entry
│   ├── App.jsx                      # Main app component
│   ├── App.css                      # Alpine-luxe theme
│   └── components/
│       ├── Calendar.jsx             # Calendar grid
│       └── ReservationForm.jsx      # Booking form
└── api/
    ├── package.json                 # API deps
    ├── host.json                    # Azure Functions config
    ├── local.settings.json          # Local env vars (git-ignored)
    ├── shared/graph.js              # Microsoft Graph client
    └── src/functions/
        ├── availability.js          # GET /api/availability
        └── reservation.js           # POST /api/reservation
```

## Future Enhancements

- Email notifications via Graph sendMail
- Rate limiting on reservation endpoint
- Admin page for managing bookings
- iCal feed export
- Multi-language support (EN/DE/NL)
- Seasonal pricing display
