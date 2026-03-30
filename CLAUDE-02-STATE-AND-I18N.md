# CLAUDE-02-STATE-AND-I18N.md — Booking state model & language selector

> **Extends**: `CLAUDE.md` (the base implementation spec)
> **Scope**: Two features that cut across the entire codebase — implement these as part of the same build, not as a follow-up.

---

## Feature 1: Tentative vs confirmed booking state

### Problem

The Shared Outlook Calendar is edited directly by the host (Femke) — confirming reservations, adding manual bookings, moving dates, deleting cancellations. The web app must be resilient to any CRUD action the host performs in Outlook, and never allow a double booking regardless of what state an event is in.

### State machine

Outlook's native `showAs` property is the single source of truth for booking state:

| Outlook `showAs` | App status    | Calendar display     | Blocks dates? |
|-------------------|---------------|----------------------|---------------|
| `tentative`       | `pending`     | Hatched amber/dashed | Yes           |
| `busy`            | `confirmed`   | Solid salmon         | Yes           |
| `oof`             | `confirmed`   | Solid salmon         | Yes           |
| `free`            | *(ignored)*   | Available (green)    | No            |
| Deleted/cancelled | *(gone)*      | Available (green)    | No            |

**Critical safety rule**: Both `tentative` and `busy` block dates. A guest can never book dates that have any non-free event. The worst possible human error (host forgets to confirm) results in dates staying blocked — safe by default.

### State transitions

```
Guest submits form
    │
    ▼
[TENTATIVE] ──── showAs: tentative, category: "Web Booking"
    │
    ├── Host changes showAs to Busy ──► [CONFIRMED] (showAs: busy)
    │
    └── Host deletes event ──────────► [DECLINED] (dates freed)


Host adds manual booking in Outlook
    │
    ▼
[CONFIRMED] ──── showAs: busy (Outlook default for new events)
```

### Implementation changes

#### api/shared/graph.js — getBookedRanges()

Update the return mapping to include a `status` field derived from `showAs`:

```javascript
return events.map((e) => ({
  start: e.start.dateTime.slice(0, 10),
  end: e.end.dateTime.slice(0, 10),
  subject: e.subject || 'Reserved',
  status: e.showAs === 'tentative' ? 'pending' : 'confirmed',
}));
```

The filter should include `tentative`, `busy`, and `oof`. Exclude `free` and `unknown`:

```javascript
const events = (response.value || []).filter(
  (e) => !e.isCancelled && ['busy', 'oof', 'tentative'].includes(e.showAs)
);
```

#### api/shared/graph.js — createReservation()

Add the `"Web Booking"` category to every event the API creates. This lets the host distinguish web-created from manually-created events, and lets the API identify its own events for future features (reminders, cleanup):

```javascript
const eventBody = {
  subject: `🏠 Reservation: ${guestName} (${guests} guests)`,
  // ... existing body, start, end fields ...
  showAs: 'tentative',
  categories: ['Web Booking'],
};
```

#### api/src/functions/availability.js

The response shape changes — `bookedRanges` items now include `status`:

```json
{
  "bookedRanges": [
    {
      "start": "2026-06-14",
      "end": "2026-06-21",
      "status": "pending",
      "subject": "Reservation: Jan de Vries"
    },
    {
      "start": "2026-07-05",
      "end": "2026-07-18",
      "status": "confirmed",
      "subject": "Reservation: Familie Müller"
    }
  ]
}
```

Note: the `subject` field is included for debugging/transparency but should NOT be shown to guests (privacy). The frontend only uses `start`, `end`, and `status`.

#### src/App.jsx

Update `isDateBooked` to also expose status. Add a helper:

```javascript
const getDateStatus = (date) => {
  const d = date.toISOString().slice(0, 10);
  const range = bookedRanges.find((r) => d >= r.start && d < r.end);
  if (!range) return 'available';
  return range.status; // 'pending' or 'confirmed'
};
```

Pass `getDateStatus` to the Calendar component.

#### src/components/Calendar.jsx

Each day cell now gets one of three booked states:

- `confirmed` → class `.booked-confirmed` — solid salmon background (existing `.booked` style)
- `pending` → class `.booked-pending` — hatched amber with dashed border (new)
- both block interaction (cursor: not-allowed, onClick ignored)

```jsx
const status = getDateStatus(date);
const booked = status !== 'available';

let className = 'cal-cell day';
if (status === 'confirmed') className += ' booked-confirmed';
if (status === 'pending') className += ' booked-pending';
// ... rest of existing class logic for selectable, past, etc.
```

#### src/App.css — new styles for pending state

```css
.cal-cell.booked-confirmed {
  background: var(--color-booked-bg);
  color: var(--color-booked);
  cursor: not-allowed;
}

.cal-cell.booked-pending {
  background: repeating-linear-gradient(
    135deg,
    #faeeda 0px,
    #faeeda 3px,
    transparent 3px,
    transparent 6px
  );
  color: #854f0b;
  border: 1px dashed #ef9f27;
  cursor: not-allowed;
}
```

#### Legend update

Add a third booked state to the legend:

```
● Available    ● Confirmed booking    ◧ Pending request    ● Past / off-season
```

The pending legend dot should match the hatched amber style.

### Edge cases handled by this design

| Scenario | Result |
|----------|--------|
| Host forgets to confirm (stays tentative forever) | Dates stay blocked. Safe. |
| Host creates manual event (defaults to busy) | Picked up as confirmed. Correct. |
| Host moves dates on confirmed booking | Reflected on next API call (5-min cache). |
| Host accidentally sets event to "free" | Dates become available. Rare — requires deliberate dropdown change. |
| Two guests try to book same dates concurrently | Second POST gets 409 — API double-checks before creating. |
| Host deletes a pending request | Dates freed immediately. Guest's confirmation screen is already shown (fire-and-forget), no rollback needed. |
| Host adds an overlapping manual booking to a pending one | Both events exist. Dates stay blocked. Host sorts it out in Outlook. |

---

## Feature 2: Language selector (EN / NL / DE)

### Rationale

The house is in German-speaking Switzerland, the owners are Dutch, and many guests are international. Support English (default), Dutch, and German with persistence so returning visitors don't have to re-select.

### Architecture

A lightweight i18n approach — no external library. All translatable strings live in a single `src/i18n.js` file. The current locale is stored in a React context and persisted to `localStorage`.

### File: src/i18n.js

This file exports three things:
1. `translations` — an object keyed by locale, containing all UI strings
2. `LOCALES` — array of supported locales with labels and flag codes
3. `defaultLocale` — `'en'`

```javascript
export const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇨🇭' },
];

export const defaultLocale = 'en';

export const translations = {
  en: {
    // Header
    tagline: 'A home in the Swiss mountains',

    // Hero
    heroTitle: 'Reserve your stay',
    heroSeason: 'Season {year}: May 1 — November 1',
    heroSubtitle: 'Select your check-in and check-out dates below.',

    // Selection bar
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    selectDate: 'Select a date',
    nightCount: '{n} night | {n} nights',

    // Calendar
    monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    dayNamesShort: ['Mo','Tu','We','Th','Fr','Sa','Su'],

    // Legend
    legendAvailable: 'Available',
    legendConfirmed: 'Confirmed booking',
    legendPending: 'Pending request',
    legendPast: 'Past / off-season',

    // Suggestion
    nextAvailable: 'Next available: {start} — {end} ({nights} nights free)',
    seasonFullyBooked: 'Unfortunately, the entire season appears to be booked.',

    // Form
    formTitle: 'Complete your reservation',
    formPricing: 'CHF 45 per person per night (min. CHF 120/night). Tourist tax: CHF 4.80/adult, CHF 2.40/child (6–16) per night.',
    labelName: 'Full name',
    labelEmail: 'Email',
    labelPhone: 'Phone (optional)',
    labelGuests: 'Number of guests',
    labelMessage: 'Message (optional)',
    placeholderName: 'Your full name',
    placeholderEmail: 'you@example.com',
    placeholderPhone: '+41 ...',
    placeholderMessage: 'Anything we should know? Special requests, arrival time, etc.',
    btnChangeDates: '← Change dates',
    btnSubmit: 'Request reservation',
    btnSubmitting: 'Sending…',
    required: 'Required',
    invalidEmail: 'Invalid email address',
    guestsRange: 'Between 1 and {max} guests',

    // Confirmation
    confirmTitle: 'Reservation request sent',
    confirmMessage: 'Thank you, {name}! We\'ve received your reservation request for {checkIn} — {checkOut} ({nights} nights).',
    confirmNote: 'You will receive a confirmation email at {email} shortly. The reservation is pending until confirmed by the host.',
    confirmGuestCards: 'After confirmation, you\'ll need to register via the tourist check-in portal to receive guest cards for free gondola and bus access in the valley.',
    btnAnother: 'Make another reservation',

    // Errors
    errorLoadAvailability: 'Unable to load availability. Please try again later.',
    errorDatesConflict: 'Your selection includes booked dates. Please choose different dates.',
    errorDatesUnavailable: 'These dates are no longer available. Please select different dates.',
    errorCalendarAccess: 'Calendar access error. Please contact the host.',
    errorGeneric: 'Could not complete reservation. Please try again.',

    // Footer
    footerLocation: 'Alte Liebe · Wiler, Lötschental, Switzerland',
    footerContact: 'Questions? Contact us at',

    // What to bring reminder (shown on confirmation)
    bringReminder: 'Please remember to bring: towels, bed linens, kitchen towels, toilet paper, and Nespresso cups.',
  },

  nl: {
    tagline: 'Een huis in de Zwitserse bergen',

    heroTitle: 'Reserveer uw verblijf',
    heroSeason: 'Seizoen {year}: 1 mei — 1 november',
    heroSubtitle: 'Selecteer hieronder uw in- en uitcheckdatum.',

    checkIn: 'Inchecken',
    checkOut: 'Uitchecken',
    selectDate: 'Selecteer een datum',
    nightCount: '{n} nacht | {n} nachten',

    monthNames: ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'],
    dayNamesShort: ['Ma','Di','Wo','Do','Vr','Za','Zo'],

    legendAvailable: 'Beschikbaar',
    legendConfirmed: 'Bevestigde boeking',
    legendPending: 'In afwachting',
    legendPast: 'Verleden / buiten seizoen',

    nextAvailable: 'Eerstvolgende beschikbaar: {start} — {end} ({nights} nachten vrij)',
    seasonFullyBooked: 'Helaas lijkt het hele seizoen volgeboekt.',

    formTitle: 'Rond uw reservering af',
    formPricing: 'CHF 45 per persoon per nacht (min. CHF 120/nacht). Toeristenbelasting: CHF 4,80/volwassene, CHF 2,40/kind (6–16) per nacht.',
    labelName: 'Volledige naam',
    labelEmail: 'E-mailadres',
    labelPhone: 'Telefoon (optioneel)',
    labelGuests: 'Aantal gasten',
    labelMessage: 'Bericht (optioneel)',
    placeholderName: 'Uw volledige naam',
    placeholderEmail: 'u@voorbeeld.nl',
    placeholderPhone: '+31 6 ...',
    placeholderMessage: 'Is er iets dat we moeten weten? Speciale wensen, aankomsttijd, etc.',
    btnChangeDates: '← Datum wijzigen',
    btnSubmit: 'Reservering aanvragen',
    btnSubmitting: 'Verzenden…',
    required: 'Verplicht',
    invalidEmail: 'Ongeldig e-mailadres',
    guestsRange: 'Tussen 1 en {max} gasten',

    confirmTitle: 'Reserveringsverzoek verzonden',
    confirmMessage: 'Bedankt, {name}! We hebben uw reserveringsverzoek ontvangen voor {checkIn} — {checkOut} ({nights} nachten).',
    confirmNote: 'U ontvangt binnenkort een bevestigingsmail op {email}. De reservering is in afwachting tot deze door de gastheer is bevestigd.',
    confirmGuestCards: 'Na bevestiging dient u zich te registreren via het toeristen check-in portaal om gastenkaarten te ontvangen voor gratis gebruik van de gondel en bus in het dal.',
    btnAnother: 'Nieuwe reservering maken',

    errorLoadAvailability: 'Kan beschikbaarheid niet laden. Probeer het later opnieuw.',
    errorDatesConflict: 'Uw selectie bevat geboekte data. Kies andere data.',
    errorDatesUnavailable: 'Deze data zijn niet meer beschikbaar. Selecteer andere data.',
    errorCalendarAccess: 'Agendatoegang mislukt. Neem contact op met de gastheer.',
    errorGeneric: 'Reservering kon niet worden voltooid. Probeer het opnieuw.',

    footerLocation: 'Alte Liebe · Wiler, Lötschental, Zwitserland',
    footerContact: 'Vragen? Neem contact op via',

    bringReminder: 'Vergeet niet mee te nemen: handdoeken, beddengoed, keukendoeken, wc-papier en Nespresso-cups.',
  },

  de: {
    tagline: 'Ein Zuhause in den Schweizer Bergen',

    heroTitle: 'Reservieren Sie Ihren Aufenthalt',
    heroSeason: 'Saison {year}: 1. Mai — 1. November',
    heroSubtitle: 'Wählen Sie unten Ihr An- und Abreisedatum.',

    checkIn: 'Anreise',
    checkOut: 'Abreise',
    selectDate: 'Datum wählen',
    nightCount: '{n} Nacht | {n} Nächte',

    monthNames: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
    dayNamesShort: ['Mo','Di','Mi','Do','Fr','Sa','So'],

    legendAvailable: 'Verfügbar',
    legendConfirmed: 'Bestätigte Buchung',
    legendPending: 'Ausstehende Anfrage',
    legendPast: 'Vergangen / Nebensaison',

    nextAvailable: 'Nächste Verfügbarkeit: {start} — {end} ({nights} Nächte frei)',
    seasonFullyBooked: 'Leider scheint die gesamte Saison ausgebucht zu sein.',

    formTitle: 'Reservierung abschliessen',
    formPricing: 'CHF 45 pro Person pro Nacht (mind. CHF 120/Nacht). Kurtaxe: CHF 4.80/Erwachsener, CHF 2.40/Kind (6–16) pro Nacht.',
    labelName: 'Vollständiger Name',
    labelEmail: 'E-Mail-Adresse',
    labelPhone: 'Telefon (optional)',
    labelGuests: 'Anzahl Gäste',
    labelMessage: 'Nachricht (optional)',
    placeholderName: 'Ihr vollständiger Name',
    placeholderEmail: 'sie@beispiel.ch',
    placeholderPhone: '+41 ...',
    placeholderMessage: 'Gibt es etwas, das wir wissen sollten? Besondere Wünsche, Ankunftszeit usw.',
    btnChangeDates: '← Datum ändern',
    btnSubmit: 'Reservierung anfragen',
    btnSubmitting: 'Wird gesendet…',
    required: 'Erforderlich',
    invalidEmail: 'Ungültige E-Mail-Adresse',
    guestsRange: 'Zwischen 1 und {max} Gästen',

    confirmTitle: 'Reservierungsanfrage gesendet',
    confirmMessage: 'Vielen Dank, {name}! Wir haben Ihre Reservierungsanfrage für {checkIn} — {checkOut} ({nights} Nächte) erhalten.',
    confirmNote: 'Sie erhalten in Kürze eine Bestätigungsmail an {email}. Die Reservierung ist ausstehend, bis sie vom Gastgeber bestätigt wird.',
    confirmGuestCards: 'Nach der Bestätigung müssen Sie sich über das Touristen-Check-in-Portal registrieren, um Gästekarten für die kostenlose Nutzung der Gondel und des Busses im Tal zu erhalten.',
    btnAnother: 'Neue Reservierung',

    errorLoadAvailability: 'Verfügbarkeit konnte nicht geladen werden. Bitte versuchen Sie es später erneut.',
    errorDatesConflict: 'Ihre Auswahl enthält gebuchte Daten. Bitte wählen Sie andere Daten.',
    errorDatesUnavailable: 'Diese Daten sind nicht mehr verfügbar. Bitte wählen Sie andere Daten.',
    errorCalendarAccess: 'Kalenderzugriff fehlgeschlagen. Bitte kontaktieren Sie den Gastgeber.',
    errorGeneric: 'Reservierung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',

    footerLocation: 'Alte Liebe · Wiler, Lötschental, Schweiz',
    footerContact: 'Fragen? Kontaktieren Sie uns unter',

    bringReminder: 'Bitte denken Sie daran mitzubringen: Handtücher, Bettwäsche, Geschirrtücher, Toilettenpapier und Nespresso-Kapseln.',
  },
};
```

### Translation helper with interpolation

The `t()` function handles string lookup and variable interpolation (`{name}`, `{year}`, etc.) as well as pluralization (pipe-separated singular|plural):

```javascript
export function createT(locale) {
  const strings = translations[locale] || translations[defaultLocale];
  const fallback = translations[defaultLocale];

  return function t(key, vars = {}) {
    let str = strings[key] || fallback[key] || key;

    // Pluralization: "1 night | 2 nights" split on |
    if (str.includes('|') && vars.n !== undefined) {
      const [singular, plural] = str.split('|').map((s) => s.trim());
      str = vars.n === 1 ? singular : plural;
    }

    // Interpolation: replace {varName} with vars.varName
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, v);
    });

    return str;
  };
}
```

### File: src/LocaleContext.jsx

A React context that manages the current locale and provides the `t()` function.

```javascript
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { defaultLocale, createT } from './i18n';

const STORAGE_KEY = 'alteliebe-locale';

function getInitialLocale() {
  // 1. Check localStorage (returning visitor)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['en', 'nl', 'de'].includes(stored)) return stored;
  } catch (e) { /* localStorage unavailable */ }

  // 2. Check browser language
  const browserLang = navigator.language?.slice(0, 2);
  if (['en', 'nl', 'de'].includes(browserLang)) return browserLang;

  // 3. Default
  return defaultLocale;
}

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (e) { /* ignore */ }
    // Update html lang attribute for accessibility and SEO
    document.documentElement.lang = newLocale;
  }, []);

  const t = useMemo(() => createT(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
```

### File: src/components/LanguageSelector.jsx

A compact, always-visible language switcher placed in the header. Three small buttons with the language code, highlighting the active one. Simple, unobtrusive, and obvious.

**Design**: small horizontal pill group in the top-right of the header. Each option is a 2-letter code (EN, NL, DE) — no flags (flags are controversial for languages and render inconsistently across platforms). The active language has the primary green background with white text; inactive ones are ghost-styled.

```jsx
import React from 'react';
import { useLocale } from '../LocaleContext';
import { LOCALES } from '../i18n';

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="lang-selector" role="radiogroup" aria-label="Language">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          className={`lang-btn ${locale === code ? 'active' : ''}`}
          onClick={() => setLocale(code)}
          aria-checked={locale === code}
          role="radio"
          title={label}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

### CSS for the language selector

```css
.lang-selector {
  display: flex;
  gap: 2px;
  background: var(--color-border-light);
  border-radius: 999px;
  padding: 2px;
}

.lang-btn {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: var(--transition);
}

.lang-btn:hover {
  color: var(--color-text);
}

.lang-btn.active {
  background: var(--color-primary);
  color: white;
}
```

### Header layout change

The header needs to accommodate the language selector. Update the header layout to position the selector in the top-right:

```css
.header {
  position: relative; /* for absolute positioning of lang selector */
}

.lang-selector {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
}

/* Mobile: center it above the logo */
@media (max-width: 640px) {
  .lang-selector {
    position: static;
    justify-content: center;
    margin-bottom: 0.75rem;
  }
}
```

### src/main.jsx — wrap app in LocaleProvider

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LocaleProvider } from './LocaleContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>
);
```

### How t() is used throughout components

Every hardcoded string in App.jsx, Calendar.jsx, and ReservationForm.jsx is replaced with a `t()` call. Components access it via the `useLocale` hook:

```jsx
import { useLocale } from '../LocaleContext';

export default function ReservationForm({ /* ...props */ }) {
  const { t } = useLocale();

  return (
    <div className="reservation-form">
      <h3>{t('formTitle')}</h3>
      <div className="price-info">{t('formPricing')}</div>
      {/* ... */}
      <label htmlFor="guestName">{t('labelName')} *</label>
      <input placeholder={t('placeholderName')} /* ... */ />
      {/* ... */}
      <button type="submit" disabled={submitting}>
        {submitting ? t('btnSubmitting') : t('btnSubmit')}
      </button>
    </div>
  );
}
```

### Calendar month names and weekday headers

The Calendar component uses the locale-aware month and day names:

```jsx
const { t, locale } = useLocale();

// Month name from translations
const monthName = `${t('monthNames')[month]} ${year}`;

// Weekday headers from translations
const days = t('dayNamesShort'); // ['Mo','Tu','We','Th','Fr','Sa','Su'] or localized
```

### Date formatting

The `formatDate` helper in App.jsx should use the locale for display:

```javascript
const localeMap = { en: 'en-GB', nl: 'nl-NL', de: 'de-CH' };

const formatDate = (d) =>
  d
    ? d.toLocaleDateString(localeMap[locale], {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';
```

This automatically gives you "Sat 6 June 2026" (EN), "za 6 juni 2026" (NL), "Sa. 6. Juni 2026" (DE).

### Persistence behavior

1. **First visit**: check `localStorage` for `alteliebe-locale` → not found → check `navigator.language` → if `nl` or `de`, use that → otherwise default to `en`.
2. **User clicks a language button**: update state + write to `localStorage` + set `document.documentElement.lang`.
3. **Return visit**: read from `localStorage` → found → use it. Browser language is only a fallback for the very first visit.
4. **Private/incognito**: `localStorage` is available but cleared on close. Falls back to browser language detection on next visit. Graceful.

### What NOT to localize

- "Alte Liebe" (the brand name — always as-is)
- "CHF" (currency code — universal)
- Email addresses, phone numbers
- The `info@alteliebe.com` contact address
- Calendar event subjects (always in English — the host reads these in Outlook)

---

## Updated file structure

```
src/
├── main.jsx                     ← wraps App in LocaleProvider
├── i18n.js                      ← translations object + createT helper
├── LocaleContext.jsx             ← React context (locale state + persistence)
├── App.jsx                      ← uses useLocale() for all strings
├── App.css                      ← adds .lang-selector, .booked-pending styles
└── components/
    ├── Calendar.jsx             ← uses t() for month/day names + getDateStatus
    ├── ReservationForm.jsx      ← uses t() for all labels/placeholders/errors
    └── LanguageSelector.jsx     ← EN/NL/DE pill buttons
```

---

## Updated quality checklist (additions to base CLAUDE.md checklist)

### Booking state
- [ ] API returns `status: "pending"` for tentative events, `status: "confirmed"` for busy/oof
- [ ] Events with `showAs: "free"` are excluded (treated as available)
- [ ] API creates events with `showAs: "tentative"` and `categories: ["Web Booking"]`
- [ ] Calendar renders pending dates with hatched amber/dashed style
- [ ] Calendar renders confirmed dates with solid salmon style
- [ ] Both pending and confirmed dates block selection (not clickable)
- [ ] Legend shows three booked states: available, confirmed, pending
- [ ] POST /api/reservation still double-checks — counts both tentative and busy as conflicts

### i18n
- [ ] All visible strings come from t() — zero hardcoded UI text in JSX
- [ ] Language selector visible in header on all screen sizes
- [ ] Active language highlighted with green pill
- [ ] Locale persisted to localStorage on selection
- [ ] First visit auto-detects from navigator.language (nl, de, or default en)
- [ ] Return visit reads from localStorage
- [ ] Date formatting uses locale-specific Intl formatting (en-GB, nl-NL, de-CH)
- [ ] Month names and weekday headers localized
- [ ] Pluralization works (1 nacht vs 2 nachten)
- [ ] Error messages localized
- [ ] Confirmation page localized including "bring" reminder
- [ ] document.documentElement.lang updated on locale change
- [ ] "Alte Liebe", "CHF", and email addresses are NOT localized
