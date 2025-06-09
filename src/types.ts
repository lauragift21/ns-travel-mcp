// MCP Protocol Types
export interface MCPRequest {
  method: string;
  params: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

export interface MCPResponse {
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: object;
  }>;
  content?: Array<{
    type: string;
    text: string;
  }>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

// NS API Response Types
export interface NSStation {
  code: string;
  namen: {
    lang: string;
    middel: string;
    kort: string;
  };
  land: string;
  lat: number;
  lng: number;
  radius: number;
  naderenRadius: number;
  EVACode: string;
  stationType: string;
}

export interface NSProduct {
  number: string;
  categoryCode: string;
  shortCategoryName: string;
  longCategoryName: string;
  operatorCode: string;
  operatorName: string;
  operatorAdministrativeCode: number;
  type: string;
  displayName: string;
}

export interface NSLocation {
  name: string;
  lng: number;
  lat: number;
  countryCode: string;
  uicCode: string;
  stationCode: string;
  type: string;
  prognosisType?: string;
  plannedDateTime?: string;
  actualDateTime?: string;
  plannedTimeZoneOffset?: number;
  actualTimeZoneOffset?: number;
  track?: string;
}

export interface NSLeg {
  product: NSProduct;
  origin: NSLocation;
  destination: NSLocation;
  direction: string;
  cancelled: boolean;
  crowdForecast: string;
}

export interface NSFare {
  priceInCents: number;
  product: string;
  travelClass: string;
  discountType: string;
}

export interface Journey {
  idx: number;
  legs: NSLeg[];
  checksum: string;
  crowdForecast: string;
  punctuality: number;
  optimal: boolean;
  fareRoute: {
    routeId: string;
    origin: {
      varCode: number;
      name: string;
    };
    destination: {
      varCode: number;
      name: string;
    };
  };
  fares: NSFare[];
  fareLegs: Array<{
    origin: {
      varCode: number;
      name: string;
    };
    destination: {
      varCode: number;
      name: string;
    };
  }>;
  productFare: NSFare[];
  type: string;
  shareUrl: {
    uri: string;
  };
  realtime: boolean;
  routeId: string;
  registerJourney: {
    url: string;
    searchUrl: string;
    status: string;
    checkinStatus: string;
  };
}

export interface Departure {
  direction: string;
  name: string;
  plannedDateTime: string;
  actualDateTime: string;
  plannedTimeZoneOffset: number;
  actualTimeZoneOffset: number;
  journeyDetail: Array<{
    type: string;
    link: {
      uri: string;
    };
  }>;
  product: NSProduct;
  trainCategory: string;
  cancelled: boolean;
  routeStations: Array<{
    uicCode: string;
    mediumName: string;
  }>;
  departureStatus: string;
  origin: NSLocation;
  destination: NSLocation;
  track: string;
  plannedTrack: string;
  actualTrack: string;
  crowdForecast: string;
}

export interface Disruption {
  id: string;
  type: string;
  title: string;
  topic: string;
  isActive: boolean;
  freeText: {
    title: string;
    reasonText: string;
    header: string;
    lead: string;
    body: string;
  };
  start: string;
  end: string;
  period: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
  impact: {
    value: number;
    description: string;
  };
  expectedDuration: {
    description: string;
    endTime: string;
  };
  summaryAdditionalTravelTime: {
    label: string;
    shortLabel: string;
    minimumDurationInMinutes: number;
    maximumDurationInMinutes: number;
  };
  publicationSections: Array<{
    section: {
      stations: Array<{
        uicCode: string;
        stationCode: string;
        name: string;
        coordinate: {
          lat: number;
          lng: number;
        };
        countryCode: string;
      }>;
      direction: string;
    };
    consequence: {
      section: {
        stations: Array<{
          uicCode: string;
          stationCode: string;
          name: string;
          coordinate: {
            lat: number;
            lng: number;
          };
          countryCode: string;
        }>;
        direction: string;
      };
      description: string;
      level: string;
    };
  }>;
}

// Formatted Response Types (for clean MCP output)
export interface FormattedTrip {
  plannedDeparture: string;
  actualDeparture: string;
  plannedArrival: string;
  actualArrival: string;
  duration: string;
  transfers: number;
  optimal: boolean;
  punctuality: number;
  price: string;
  legs: FormattedLeg[];
}

export interface FormattedLeg {
  from: string;
  to: string;
  transport: string;
  departureTrack?: string;
  arrivalTrack?: string;
  plannedDeparture?: string;
  actualDeparture?: string;
  plannedArrival?: string;
  actualArrival?: string;
  cancelled: boolean;
  crowdForecast: string;
}

export interface FormattedDeparture {
  destination: string;
  trainType: string;
  plannedDeparture: string;
  actualDeparture: string;
  delay: number;
  track: string;
  trackChanged: boolean;
  cancelled: boolean;
  crowdForecast: string;
  operator: string;
  status: string;
}

export interface FormattedDisruption {
  id: string;
  type: string;
  title: string;
  topic: string;
  isActive: boolean;
  description: string;
  impact?: string;
  start: string;
  end: string;
  expectedDuration?: string;
  additionalTravelTime?: string;
  affectedStations: string[];
}

export interface FormattedStation {
  name: string;
  code: string;
  country: string;
  type: string;
  lat: number;
  lng: number;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  NS_API_KEY?: string;
  NS_KV?: KVNamespace;
}

export interface DeparturesParams {
  station: string;
  maxJourneys?: number;
  dateTime?: string;
}

export interface DisruptionsParams {
  station?: string;
  type?: 'maintenance' | 'disruption';
  isActive?: boolean;
}

export interface StationSearchParams {
  query: string;
  maxResults?: number;
  countryFilter?: string;
}

// NS API Response Types for specific endpoints
export interface NSTripsResponse {
  trips: Journey[];
}

export interface NSDeparturesResponse {
  payload: {
    source: string;
    departures: Departure[];
  };
  links: {
    disruptions: {
      uri: string;
    };
  };
  meta: {
    numberOfDisruptions: number;
  };
}

export interface NSDisruptionsResponse extends Array<Disruption> {}

export interface NSPlacesResponse {
  links: Record<string, any>;
  payload: Array<{
    type: string;
    name: string;
    locations: Array<{
      name: string;
      stationCode: string;
      lat: number;
      lng: number;
      open: string;
      link: {
        uri: string;
      };
      extra: Record<string, any>;
      infoImages: any[];
      apps: any[];
      sites: Array<{
        qualifier: string;
        url: string;
      }>;
      extraInfo: any[];
      nearbyMeLocationId: {
        value: string;
        type: string;
      };
    }>;
    open: string;
    keywords: any[];
    stationBound: boolean;
    advertImages: any[];
    infoImages: any[];
  }>;
  meta: Record<string, any>;
}