import type {
  Journey,
  Departure,
  Disruption,
  FormattedTrip,
  FormattedDeparture,
  FormattedDisruption,
  FormattedStation,
} from './types';

/**
 * Resolve station code from name or return the code if already provided
 */
export async function resolveStationCode(stationInput: string, apiKey: string): Promise<string | null> {
  // If it's already a code (short string), return it
  if (stationInput.length <= 4) {
    return stationInput.toUpperCase();
  }
  
  // Search for the station
  const url = new URL('https://gateway.apiportal.ns.nl/places-api/v2/places');
  url.searchParams.set('q', stationInput);
  url.searchParams.set('type', 'Station');
  url.searchParams.set('size', '1');
  url.searchParams.set('countryCode', 'NL');
  
  const response = await fetch(url.toString(), {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
  });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  // @ts-ignore
  return data.payload?.[0]?.stationCode || null;
}

/**
 * Calculate duration between two timestamps
 */
export function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate delay in minutes between planned and actual time
 */
export function calculateDelayMinutes(planned: string, actual: string): number {
  const plannedTime = new Date(planned);
  const actualTime = new Date(actual);
  return Math.round((actualTime.getTime() - plannedTime.getTime()) / 60000);
}

/**
 * Format journey data for clean MCP output
 */
export function formatTrips(trips: Journey[]): FormattedTrip[] {
  return trips.map(trip => ({
    plannedDeparture: trip.legs[0]?.origin.plannedDateTime || '',
    actualDeparture: trip.legs[0]?.origin.actualDateTime || '',
    plannedArrival: trip.legs[trip.legs.length - 1]?.destination.plannedDateTime || '',
    actualArrival: trip.legs[trip.legs.length - 1]?.destination.actualDateTime || '',
    duration: calculateDuration(
      trip.legs[0]?.origin.plannedDateTime || '',
      trip.legs[trip.legs.length - 1]?.destination.plannedDateTime || ''
    ),
    transfers: trip.legs.length - 1,
    optimal: trip.optimal,
    punctuality: trip.punctuality,
    price: trip.fares?.[0]?.priceInCents ? `€${(trip.fares[0].priceInCents / 100).toFixed(2)}` : 'Price not available',
    legs: trip.legs.map(leg => ({
      from: leg.origin.name,
      to: leg.destination.name,
      transport: leg.product.displayName,
      departureTrack: leg.origin.track,
      arrivalTrack: leg.destination.track,
      plannedDeparture: leg.origin.plannedDateTime,
      actualDeparture: leg.origin.actualDateTime,
      plannedArrival: leg.destination.plannedDateTime,
      actualArrival: leg.destination.actualDateTime,
      cancelled: leg.cancelled,
      crowdForecast: leg.crowdForecast,
    })),
  }));
}

/**
 * Format departure data for clean MCP output
 */
export function formatDepartures(departures: Departure[]): FormattedDeparture[] {
  return departures.map(dep => ({
    destination: dep.direction,
    trainType: dep.product.displayName,
    plannedDeparture: dep.plannedDateTime,
    actualDeparture: dep.actualDateTime,
    delay: dep.actualDateTime ? calculateDelayMinutes(dep.plannedDateTime, dep.actualDateTime) : 0,
    track: dep.actualTrack || dep.plannedTrack,
    trackChanged: dep.actualTrack !== dep.plannedTrack,
    cancelled: dep.cancelled,
    crowdForecast: dep.crowdForecast,
    operator: dep.product.operatorName,
    status: dep.departureStatus,
  }));
}

/**
 * Format disruption data for clean MCP output
 */
export function formatDisruptions(disruptions: Disruption[]): FormattedDisruption[] {
  return disruptions.map(disruption => ({
    id: disruption.id,
    type: disruption.type,
    title: disruption.title,
    topic: disruption.topic,
    isActive: disruption.isActive,
    description: disruption.freeText?.body || disruption.freeText?.lead || 'No description available',
    impact: disruption.impact?.description,
    start: disruption.start,
    end: disruption.end,
    expectedDuration: disruption.expectedDuration?.description,
    additionalTravelTime: disruption.summaryAdditionalTravelTime?.label,
    affectedStations: disruption.publicationSections?.map(section => 
      section.section.stations.map(station => station.name)
    ).flat() || [],
  }));
}

/**
 * Format station search results for clean MCP output
 */
export function formatStations(payload: any[]): FormattedStation[] {
  // NS Places API returns stations nested in payload[0].locations
  const stations = payload[0]?.locations || [];
  
  return stations.map((station: any) => ({
    name: station.name || 'Unknown',
    code: station.stationCode || 'Unknown',
    country: 'NL', // NS API is Netherlands only
    type: station.type || 'Station',
    lat: station.lat || 0,
    lng: station.lng || 0,
  }));
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string) {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${message}`,
      },
    ],
  };
}

/**
 * Create a successful MCP response with formatted data
 */
export function createSuccessResponse(data: any) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Validate NS API key format
 */
export function isValidAPIKey(apiKey: string): boolean {
  // NS API keys are typically 32 character hex strings
  return /^[a-f0-9]{32}$/i.test(apiKey);
}

/**
 * Build NS API URL with parameters
 */
export function buildNSApiUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`https://gateway.apiportal.ns.nl/${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Make authenticated request to NS API
 */
export async function makeNSApiRequest(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`NS API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
