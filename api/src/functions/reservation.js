const { app } = require("@azure/functions");
const { getBookedRanges, createReservation } = require("../../shared/graph");

app.http("reservation", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reservation",
  handler: async (request, context) => {
    try {
      const body = await request.json();

      const { checkIn, checkOut, guestName, email, phone, guests, message } = body;

      // Validate required fields
      const errors = [];

      if (!checkIn) errors.push("checkIn is required");
      if (!checkOut) errors.push("checkOut is required");
      if (!guestName || !guestName.trim()) errors.push("guestName is required");
      if (!email || !email.trim()) errors.push("email is required");

      if (errors.length > 0) {
        return {
          status: 400,
          jsonBody: { error: "Validation failed", details: errors },
        };
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
        return {
          status: 400,
          jsonBody: { error: "Invalid date format. Use YYYY-MM-DD." },
        };
      }

      // Validate checkOut is after checkIn
      if (checkOut <= checkIn) {
        return {
          status: 400,
          jsonBody: { error: "checkOut must be after checkIn." },
        };
      }

      // Double-check availability to prevent race conditions
      const existingBookings = await getBookedRanges(checkIn, checkOut);

      if (existingBookings.length > 0) {
        // Check if any existing booking actually overlaps with the requested range
        const requestStart = new Date(checkIn);
        const requestEnd = new Date(checkOut);

        const hasConflict = existingBookings.some((booking) => {
          const bookingStart = new Date(booking.start);
          const bookingEnd = new Date(booking.end);
          // Overlap: booking starts before request ends AND booking ends after request starts
          return bookingStart < requestEnd && bookingEnd > requestStart;
        });

        if (hasConflict) {
          return {
            status: 409,
            jsonBody: {
              error: "These dates are no longer available. Please select different dates.",
            },
          };
        }
      }

      // Create the reservation event
      const createdEvent = await createReservation({
        checkIn,
        checkOut,
        guestName: guestName.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : null,
        guests: guests || 2,
        message: message ? message.trim() : null,
      });

      // Calculate number of nights
      const nightCount = Math.round(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
      );

      return {
        status: 201,
        jsonBody: {
          confirmation: {
            eventId: createdEvent.id,
            checkIn,
            checkOut,
            nights: nightCount,
            guestName: guestName.trim(),
            email: email.trim(),
            guests: guests || 2,
            status: "tentative",
            message:
              "Your reservation request has been submitted. The host will confirm your booking shortly.",
          },
        },
      };
    } catch (err) {
      context.error("Error creating reservation:", err.message);

      // Handle Graph API auth errors specifically
      if (err.statusCode === 401 || err.statusCode === 403) {
        return {
          status: 500,
          jsonBody: {
            error: "Calendar access error. Please contact the host.",
          },
        };
      }

      return {
        status: 500,
        jsonBody: {
          error: "Failed to create reservation. Please try again later.",
        },
      };
    }
  },
});
