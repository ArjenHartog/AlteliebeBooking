const { ClientSecretCredential } = require("@azure/identity");
const {
  Client,
} = require("@microsoft/microsoft-graph-client");
const {
  TokenCredentialAuthenticationProvider,
} = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");

let graphClient = null;

/**
 * Returns a singleton Microsoft Graph client using app-only (client credentials) auth.
 */
function getGraphClient() {
  if (graphClient) {
    return graphClient;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  graphClient = Client.initWithMiddleware({ authProvider });

  return graphClient;
}

/**
 * Fetches booked date ranges from the shared Outlook calendar.
 *
 * @param {string} from - Start date in YYYY-MM-DD format
 * @param {string} to - End date in YYYY-MM-DD format
 * @returns {Promise<Array<{start: string, end: string, subject: string, showAs: string}>>}
 */
async function getBookedRanges(from, to) {
  const client = getGraphClient();
  const calendarUserId = process.env.CALENDAR_USER_ID;
  const calendarId = process.env.CALENDAR_ID;

  if (!calendarUserId) {
    throw new Error("Missing required environment variable: CALENDAR_USER_ID");
  }

  // Build the endpoint: use specific calendar if CALENDAR_ID is set, otherwise default calendar
  let endpoint;
  if (calendarId && calendarId.trim() !== "") {
    endpoint = `/users/${calendarUserId}/calendars/${calendarId}/calendarView`;
  } else {
    endpoint = `/users/${calendarUserId}/calendarView`;
  }

  const response = await client
    .api(endpoint)
    .query({
      startDateTime: `${from}T00:00:00Z`,
      endDateTime: `${to}T23:59:59Z`,
      $select: "subject,start,end,showAs,isCancelled",
      $top: 200,
    })
    .get();

  const events = response.value || [];

  // Filter: exclude cancelled events, include only busy/oof/tentative
  const validShowAs = ["busy", "oof", "tentative"];

  return events
    .filter(
      (event) =>
        !event.isCancelled && validShowAs.includes(event.showAs)
    )
    .map((event) => ({
      start: event.start.dateTime.substring(0, 10),
      end: event.end.dateTime.substring(0, 10),
      subject: event.subject,
      showAs: event.showAs,
    }));
}

/**
 * Creates a reservation event on the shared Outlook calendar.
 *
 * @param {Object} details - Reservation details
 * @param {string} details.checkIn - Check-in date YYYY-MM-DD
 * @param {string} details.checkOut - Check-out date YYYY-MM-DD
 * @param {string} details.guestName - Guest full name
 * @param {string} details.email - Guest email
 * @param {string} [details.phone] - Guest phone (optional)
 * @param {number} [details.guests] - Number of guests (optional, defaults to 2)
 * @param {string} [details.message] - Special requests (optional)
 * @returns {Promise<Object>} The created event from Graph API
 */
async function createReservation({ checkIn, checkOut, guestName, email, phone, guests, message }) {
  const client = getGraphClient();
  const calendarUserId = process.env.CALENDAR_USER_ID;
  const calendarId = process.env.CALENDAR_ID;

  if (!calendarUserId) {
    throw new Error("Missing required environment variable: CALENDAR_USER_ID");
  }

  const guestCount = guests || 2;

  // Build HTML body with guest details table
  const htmlBody = `
<table style="border-collapse: collapse; font-family: Arial, sans-serif; width: 100%;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Guest Name</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(guestName)}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Email</td>
    <td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Phone</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${phone ? escapeHtml(phone) : "—"}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Guests</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${guestCount}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Check-in</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(checkIn)} (14:00)</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Check-out</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(checkOut)} (11:00)</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Message</td>
    <td style="padding: 8px; border: 1px solid #ddd;">${message ? escapeHtml(message) : "—"}</td>
  </tr>
</table>
`.trim();

  const event = {
    subject: `\u{1F3E0} Reservation: ${guestName} (${guestCount} guests)`,
    body: {
      contentType: "HTML",
      content: htmlBody,
    },
    start: {
      dateTime: `${checkIn}T14:00:00`,
      timeZone: "Europe/Zurich",
    },
    end: {
      dateTime: `${checkOut}T11:00:00`,
      timeZone: "Europe/Zurich",
    },
    isAllDay: false,
    showAs: "tentative",
    categories: ["Reservation Request"],
  };

  // Build the endpoint
  let endpoint;
  if (calendarId && calendarId.trim() !== "") {
    endpoint = `/users/${calendarUserId}/calendars/${calendarId}/events`;
  } else {
    endpoint = `/users/${calendarUserId}/events`;
  }

  const createdEvent = await client.api(endpoint).post(event);

  return createdEvent;
}

/**
 * Escapes HTML special characters to prevent XSS in event body.
 */
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = { getGraphClient, getBookedRanges, createReservation };
