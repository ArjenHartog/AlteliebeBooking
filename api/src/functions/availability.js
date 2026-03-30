const { app } = require("@azure/functions");
const { getBookedRanges } = require("../../shared/graph");

app.http("availability", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "availability",
  handler: async (request, context) => {
    try {
      const url = new URL(request.url);
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");

      if (!from || !to) {
        return {
          status: 400,
          jsonBody: {
            error: "Missing required query parameters: from, to (YYYY-MM-DD format)",
          },
        };
      }

      // Validate date format (basic check)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(from) || !dateRegex.test(to)) {
        return {
          status: 400,
          jsonBody: {
            error: "Invalid date format. Use YYYY-MM-DD.",
          },
        };
      }

      const bookedRanges = await getBookedRanges(from, to);

      return {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300",
          "Content-Type": "application/json",
        },
        jsonBody: { bookedRanges },
      };
    } catch (err) {
      context.error("Error fetching availability:", err.message);

      return {
        status: 500,
        jsonBody: {
          error: "Failed to fetch availability. Please try again later.",
        },
      };
    }
  },
});
