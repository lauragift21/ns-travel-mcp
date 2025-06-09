import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  Env,
  Journey,
  NSDeparturesResponse,
  NSPlacesResponse,
} from "./types";
import { env } from "cloudflare:workers";
import {
  resolveStationCode,
  buildNSApiUrl,
  makeNSApiRequest,
  formatTrips,
  formatDepartures,
  formatDisruptions,
  formatStations,
} from "./utils";

function getEnv<Env>() {
  return env as Env;
}

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "NS Travel MCP Server",
    version: "1.0.0",
  });

  async init() {
    // Journey Planning tool
    this.server.tool(
      "plan_journey",
      {
        fromStation: z
          .string()
          .describe(
            "Departure station name or code (e.g., 'Amsterdam Centraal' or 'asd')"
          ),
        toStation: z
          .string()
          .describe(
            "Destination station name or code (e.g., 'Utrecht Centraal' or 'ut')"
          ),
        dateTime: z
          .string()
          .optional()
          .describe(
            "Departure date and time in ISO format (optional, defaults to now)"
          ),
        searchForArrival: z
          .boolean()
          .default(false)
          .describe("Search for arrival time instead of departure time"),
        earlierJourneys: z
          .number()
          .int()
          .min(0)
          .max(5)
          .default(1)
          .describe("Number of earlier journey options to include"),
        laterJourneys: z
          .number()
          .int()
          .min(0)
          .max(5)
          .default(1)
          .describe("Number of later journey options to include"),
      },
      async ({
        fromStation,
        toStation,
        dateTime,
        searchForArrival,
        earlierJourneys,
        laterJourneys,
      }) => {
        const env = getEnv<Env>();
        const apiKey = env?.NS_API_KEY;
        if (!apiKey) {
          throw new Error(
            "NS API key required. Set NS_API_KEY environment variable"
          );
        }
        if (!apiKey) {
          throw new Error(
            "NS API key required. Pass via x-ns-api-key header, apiKey query param, or set NS_API_KEY environment variable"
          );
        }

        // Resolve station codes
        const fromCode = await resolveStationCode(fromStation, apiKey);
        const toCode = await resolveStationCode(toStation, apiKey);

        if (!fromCode || !toCode) {
          throw new Error(
            "Could not resolve station codes. Please check station names."
          );
        }

        // Build API URL
        const url = buildNSApiUrl("reisinformatie-api/api/v3/trips", {
          fromStation: fromCode,
          toStation: toCode,
          searchForArrival: searchForArrival.toString(),
          earlierJourneys: earlierJourneys.toString(),
          laterJourneys: laterJourneys.toString(),
          ...(dateTime && { dateTime }),
        });

        // Make API request
        const data = await makeNSApiRequest(url, apiKey);

        // Format and return response
        const formattedTrips = formatTrips(
          (data as { trips: Journey[] }).trips
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedTrips, null, 2) },
          ],
        };
      }
    );

    // Live Departures tool
    this.server.tool(
      "get_live_departures",
      {
        station: z
          .string()
          .describe(
            "Station name or code (e.g., 'Amsterdam Centraal' or 'asd')"
          ),
        maxJourneys: z
          .number()
          .int()
          .min(1)
          .max(40)
          .default(10)
          .describe("Maximum number of departures to return"),
        dateTime: z
          .string()
          .optional()
          .describe(
            "Date and time to get departures for (ISO format, optional)"
          ),
      },
      async ({ station, maxJourneys, dateTime }) => {
        const env = getEnv<Env>();
        const apiKey = env?.NS_API_KEY;
        if (!apiKey) {
          throw new Error(
            "NS API key required. Pass via x-ns-api-key header, apiKey query param, or set NS_API_KEY environment variable"
          );
        }

        const stationCode = await resolveStationCode(station, apiKey);
        if (!stationCode) {
          throw new Error(
            "Could not resolve station code. Please check station name."
          );
        }

        // Build API URL
        const url = buildNSApiUrl("reisinformatie-api/api/v2/departures", {
          station: stationCode,
          maxJourneys: maxJourneys.toString(),
          ...(dateTime && { dateTime }),
        });

        const data = (await makeNSApiRequest(
          url,
          apiKey
        )) as NSDeparturesResponse;

        // Check if departures exist and is an array
        if (
          !data.payload?.departures ||
          !Array.isArray(data.payload.departures)
        ) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "No departures found",
                    station: stationCode,
                    message: `No departures available for station ${stationCode}`,
                    rawResponse: data,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Format and return response
        const formattedDepartures = formatDepartures(data.payload.departures);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedDepartures, null, 2),
            },
          ],
        };
      }
    );

    // Disruptions Checker tool
    this.server.tool(
      "check_disruptions",
      {
        station: z
          .string()
          .optional()
          .describe("Specific station to check disruptions for (optional)"),
        type: z
          .enum(["maintenance", "disruption"])
          .optional()
          .describe("Type of disruption to filter (optional)"),
        isActive: z
          .boolean()
          .default(true)
          .describe("Only show currently active disruptions"),
      },
      async ({ station, type, isActive }) => {
        const env = getEnv<Env>();
        const apiKey = env?.NS_API_KEY;

        if (!apiKey) {
          throw new Error(
            "NS API key required. Pass via x-ns-api-key header, apiKey query param, or set NS_API_KEY environment variable"
          );
        }

        let endpoint = "reisinformatie-api/api/v3/disruptions";

        if (station) {
          const stationCode = await resolveStationCode(station, apiKey);
          if (stationCode) {
            endpoint = `${endpoint}/station/${stationCode}`;
          }
        }

        const url = buildNSApiUrl(endpoint);
        const data = await makeNSApiRequest(url, apiKey);

        // Check if data is an array
        const disruptions = Array.isArray(data) ? data : [];

        const filteredDisruptions = disruptions
          .filter((d) => !type || d.type === type)
          .filter((d) => !isActive || d.isActive);

        const formattedDisruptions = formatDisruptions(filteredDisruptions);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedDisruptions, null, 2),
            },
          ],
        };
      }
    );

    // Station Search tool
    this.server.tool(
      "search_stations",
      {
        query: z
          .string()
          .describe("Station name or partial name to search for"),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(10)
          .describe("Maximum number of results to return"),
        countryFilter: z
          .string()
          .default("NL")
          .describe("Filter by country code (default: 'NL' for Netherlands)"),
      },
      async ({ query, maxResults, countryFilter }) => {
        const env = getEnv<Env>();
        const apiKey = env?.NS_API_KEY;
        if (!apiKey) {
          throw new Error(
            "NS API key required. Set NS_API_KEY environment variable"
          );
        }
        if (!apiKey) {
          throw new Error(
            "NS API key required. Pass via x-ns-api-key header, apiKey query param, or set NS_API_KEY environment variable"
          );
        }

        // Build API URL
        const url = buildNSApiUrl("places-api/v2/places", {
          q: query,
          type: "stationV2",
          ...(maxResults && { size: maxResults.toString() }),
        });

        const data = (await makeNSApiRequest(url, apiKey)) as NSPlacesResponse;

        const formattedStations = formatStations(data.payload);
        return {
          content: [
            { type: "text", text: JSON.stringify(formattedStations, null, 2) },
          ],
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response("NS Travel MCP Server is running", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
