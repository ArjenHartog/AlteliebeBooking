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
    legendToday: 'Today',
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

    // Hero
    heroBadge: 'L\u00f6tschental, Switzerland',
    heroTagline: 'Your mountain home since 1742',

    // What to bring reminder (shown on confirmation)
    bringReminderTitle: 'Don\'t forget to bring: ',
    bringReminder: 'Towels, bed linens, kitchen towels, toilet paper, and Nespresso cups.',
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
    legendToday: 'Vandaag',
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

    heroBadge: 'L\u00f6tschental, Zwitserland',
    heroTagline: 'Uw berghuis sinds 1742',
    bringReminderTitle: 'Vergeet niet mee te nemen: ',
    bringReminder: 'Handdoeken, beddengoed, keukendoeken, wc-papier en Nespresso-cups.',
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
    legendToday: 'Heute',
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

    heroBadge: 'L\u00f6tschental, Schweiz',
    heroTagline: 'Ihr Berghaus seit 1742',
    bringReminderTitle: 'Bitte mitbringen: ',
    bringReminder: 'Handt\u00fccher, Bettw\u00e4sche, Geschirrt\u00fccher, Toilettenpapier und Nespresso-Kapseln.',
  },
};

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
