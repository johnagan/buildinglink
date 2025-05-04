/**
 * @fileoverview BuildingLink Client - A TypeScript client for interacting with the BuildingLink
 * This module provides a client implementation for authenticating and making requests to
 * the BuildingLink system, handling various authentication flows and redirects.
 *
 * @license MIT
 */

import { parse, HTMLElement } from "node-html-parser";
import { parseLibrary } from "./models/index";

import type {
  BuildingLinkToken,
  BuildingLinkBuilding,
  BuildingLinkOccupant,
  BuildingLinkVendor,
  BuildingLinkEvent,
  BuildingLinkUser,
  BuildingLinkAnnouncement,
  BuildingLinkDelivery,
  BuildingLinkLibrary,
} from "./models/index.ts";

/** Base URL for BuildingLink web interface */
const BUILDINGLINK_BASE_URL = "https://www.buildinglink.com";

/** Base URL for BuildingLink API */
const BUILDINGLINK_API_BASE_URL = "https://api.buildinglink.com";

/** Base path for BuildingLink tenant interface */
const BUILDINGLINK_TENANT_PATH = "V2/Tenant";

/** Path to the BuildingLink home page */
const BUILDINGLINK_HOME_PATH = "Home/DefaultNew.aspx";

/**
 * BuildingLink authentication credentials
 */
export interface BuildingLinkOptions {
  /** BuildingLink username */
  username: string;
  /** BuildingLink password */
  password: string;
  /** BuildingLink's subscription key to their Azure instance */
  subscriptionKey: string;
  /** BuildingLink's API key for their authentication API */
  apiKey: string;
  /** Base URL for BuildingLink instance */
  baseUrl?: string;
}

/**
 * Extended Response type that includes BuildingLink specific properties
 */
export interface BuildingLinkResponse extends Response {
  /** Raw HTML response content */
  html: string;
  /** HTML Document instance for HTML parsing */
  document: HTMLElement;
}

/**
 * BuildingLink client for handling authentication and requests
 * This client manages session state, handles redirects, and maintains authentication
 */
export class BuildingLink {
  /** History of visited URLs */
  public history: string[] = [];
  /** Login credentials */
  public options: BuildingLinkOptions;
  /** Session cookies */
  public cookies: Record<string, string> = {};
  /** Authentication token */
  public token: BuildingLinkToken | undefined;
  /** Client hooks */
  public hooks: {
    requests: Array<(url: string, request: RequestInit) => Promise<RequestInit>>;
    responses: Array<(response: BuildingLinkResponse) => Promise<BuildingLinkResponse>>;
  };

  /**
   * Creates a new BuildingLink client instance
   * @param options - BuildingLink client options including username, password, and base URL
   */
  constructor(options: BuildingLinkOptions) {
    // Set option defaults
    this.options = {
      baseUrl: BUILDINGLINK_BASE_URL,
      ...options,
    };

    // Default hooks
    this.hooks = {
      requests: [this.addHistory, this.addCookies],
      responses: [this.updateCookies, this.handleHTMLResponse, this.handleRedirects, this.handleAuthentication],
    };
  }

  /**
   * Checks if the client is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  get isAuthenticated(): boolean {
    return "bl.auth.cookie.oidc" in this.cookies;
  }

  /**
   * Adds session cookies to the request headers
   * @param url - URL of the request
   * @param request - Request object to modify
   * @returns {Promise<RequestInit>} Promise resolving to the modified request
   */
  private addCookies(url: string, request: RequestInit): Promise<RequestInit> {
    // Don't add cookies to API requests
    if (url.includes("users.us1.buildinglink.com") || url.includes("api.buildinglink.com")) {
      return Promise.resolve(request);
    }

    const cookie = Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    request.headers = { ...request.headers, cookie };
    return Promise.resolve(request);
  }

  /**
   * Adds a history entry to the client
   * @param url - URL of the request
   * @param request - Request object to modify
   * @returns {Promise<RequestInit>} Promise resolving to the modified request
   */
  private addHistory(url: string, request: RequestInit): Promise<RequestInit> {
    const method = request.method || "GET";

    // If authenticated, clear history
    if (this.isAuthenticated) {
      this.history = [];
      return Promise.resolve(request);
    }

    // Create history entry
    const histryEntry = `[${method.toUpperCase()}] ${url}`;

    // Check for circular redirects
    if (this.history.includes(histryEntry)) {
      throw new Error(`Circular redirect detected: ${histryEntry}`);
    } else {
      this.history.push(histryEntry); // Add to history
    }

    return Promise.resolve(request);
  }

  /**
   * Updates session cookies from response headers
   * @param response - Response object containing cookies
   * @returns {Promise<BuildingLinkResponse>} Promise resolving to the original response
   */
  private updateCookies(response: BuildingLinkResponse): Promise<BuildingLinkResponse> {
    response.headers.getSetCookie().forEach((c) => {
      const [name, value] = c.split(";")[0].split("=");
      this.cookies[name.trim()] = decodeURIComponent(value.trim());
    });

    return Promise.resolve(response);
  }

  /**
   * Handles the login form submission
   * Processes verification tokens and submits credentials
   *
   * @param response - Response object containing potential login form
   * @param text - HTML content of the response
   * @returns Promise resolving to the authenticated response
   * @throws Error if login fa
   * @private
   */
  private async handleAuthentication(response: BuildingLinkResponse): Promise<BuildingLinkResponse> {
    // If already authenticated, return
    if (this.isAuthenticated) {
      return response;
    }

    // Get form action
    const form = response.document.querySelector("form");
    const action = form?.getAttribute("action") || response.url;

    // Get form inputs
    const formData: Record<string, string> = {};
    const { username, password } = this.options;

    form?.querySelectorAll("input").forEach((elm) => {
      const name = elm.getAttribute("name")!;
      let value = elm.getAttribute("value")!;

      // Set username and password
      if (name === "Username") value = username;
      else if (name === "Password") value = password;

      formData[name] = value;
    });

    // If submitting to OIDC endpoint, store token
    if (action.includes("oidc")) {
      this.token = formData as BuildingLinkToken;
    }

    // Submit the form
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const formResponse = await this.fetch(action, {
      method: "POST",
      headers,
      body: new URLSearchParams(formData),
    });

    // If login failed, throw error
    if (formResponse.status !== 200) {
      const { html } = formResponse as BuildingLinkResponse;
      const errorMessage = html.match(/<div class="validation-summary-errors">(.*?)<\/div>/)?.[1];
      throw new Error(`Failed to login: ${errorMessage}`);
    }

    return formResponse;
  }

  /**
   * Handles HTML responses by loading the HTML content and parsing it with node-html-parser
   * @param response - Response object to handle
   * @returns Promise resolving to an HTMLResponse object
   * @private
   */
  private async handleHTMLResponse(response: BuildingLinkResponse): Promise<BuildingLinkResponse> {
    // Check if response is already HTML and has HTML content
    const contentType = response.headers.get("content-type")?.toLowerCase();
    if (!contentType?.includes("text/html") && !response.html) {
      return response;
    }

    // Load HTML content and parse with node-html-parser
    response.html = await response.text();
    response.document = parse(response.html);

    return response;
  }

  /**
   * Handles redirects by following HTTP redirects and script redirects
   * @param response - Response object to handle
   * @returns Promise resolving to an HTMLResponse object
   * @private
   */
  private async handleRedirects(response: BuildingLinkResponse): Promise<BuildingLinkResponse> {
    // Handle HTTP redirects
    if ([301, 302, 307].includes(response.status)) {
      let location = response.headers.get("location")!;

      // Handle relative paths
      if (location.startsWith("/")) {
        const url = new URL(location, response.url);
        const scope = url.searchParams.get("scope");

        if (scope) {
          // Add internal_resident_app_apis to the scope
          url.searchParams.set("scope", `${scope} internal_resident_app_apis`);
        }

        location = url.toString();
      }

      response = await this.fetch(location);
    }

    // Handle script redirects
    // (Some pages redirect with a script)
    if (response.html) {
      const scriptRedirect = response.html.match(/window\.top\.location\.href\s?="(https?:\/\/[^"]+)/);

      if (scriptRedirect) {
        response = (await this.fetch(scriptRedirect[1])) as BuildingLinkResponse;
      }
    }

    return response;
  }

  /**
   * Makes an authenticated request to the BuildingLink
   * Handles cookies, redirects, and authentication flows
   *
   * @param url - Target URL for the request
   * @param options - Fetch API options
   * @returns Promise resolving to an enhanced Response object
   */
  async fetch(url: string | URL, options: RequestInit = {}): Promise<BuildingLinkResponse> {
    // Convert URL to absolute URL if relative
    url = new URL(url, BUILDINGLINK_BASE_URL).toString();

    // Apply request hooks
    for (const fn of this.hooks.requests) {
      options = await fn.bind(this)(url, options);
    }

    // Make the request
    let response = (await fetch(url, { ...options, redirect: "manual" })) as BuildingLinkResponse;

    // Apply response hooks
    for (const fn of this.hooks.responses) {
      response = await fn.bind(this)(response);
    }

    return response;
  }

  /**
   * Fetches a resource from the BuildingLink tenant interface
   * @param path - Path relative to the tenant interface
   * @returns Promise resolving to an enhanced Response object
   */
  page(path: string, options: RequestInit = {}): Promise<BuildingLinkResponse> {
    return this.fetch(`${BUILDINGLINK_TENANT_PATH}/${path}`, options);
  }

  /**
   * Fetches a resource from the BuildingLink API
   * @param path - Path relative to the BuildingLink API
   * @returns Promise resolving to an enhanced Response object
   */
  api(path: string, options: RequestInit = {}): Promise<BuildingLinkResponse> {
    const url = new URL(path, BUILDINGLINK_API_BASE_URL);

    // Add API authentication headers
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${this.token?.access_token}`,
      "ocp-apim-subscription-key": this.options.subscriptionKey!,
    };

    return this.fetch(url, options);
  }

  /**
   * Fetches a resource from the BuildingLink tenant interface
   * @param path - Path relative to the tenant interface
   * @returns Promise resolving to an enhanced Response object
   */
  async login(): Promise<BuildingLinkToken | undefined> {
    if (!this.isAuthenticated) {
      await this.page(BUILDINGLINK_HOME_PATH);
    }

    return this.token;
  }

  /**
   * Fetches the library from the BuildingLink tenant interface
   * @returns Promise resolving to the library
   */
  async getLibrary(): Promise<BuildingLinkLibrary> {
    const { document, url } = await this.page("Library/Library.aspx");
    return parseLibrary(document, url);
  }

  /**
   * Fetches the current occupant from the BuildingLink API
   * @returns Promise resolving to the current occupant
   */
  async getOccupant(): Promise<BuildingLinkOccupant> {
    const url = "Properties/AuthenticatedUser/v1/property/occupant/get";
    const response = await this.api(url);
    return await response.json();
  }

  /**
   * Fetches the current user from the BuildingLink API
   * @returns Promise resolving to the current user
   */
  async getUser(): Promise<BuildingLinkUser> {
    const url = "https://users.us1.buildinglink.com/users/authenticated";

    const response = await this.fetch(url, {
      headers: {
        "x-api-key": this.options.apiKey!,
        Authorization: `Bearer ${this.token?.access_token}`,
      },
    });

    return response.json();
  }

  /**
   * Fetches events from the BuildingLink API
   * @param from - The start date of the events
   * @param toDate - The end date of the events
   * @returns Promise resolving to the events
   */
  async getEvents(from: Date, to: Date): Promise<BuildingLinkEvent[]> {
    const fromDateTime = from.toISOString();

    // Set to the end of the day
    to.setHours(23, 59, 59, 999);
    const toDateTime = to.toISOString();

    const params = new URLSearchParams({ fromDateTime, toDateTime });
    const url = `Calendar/Resident/v2/resident/events/filteredeventsrsvp?${params.toString()}`;
    const response = await this.api(url);
    return await response.json();
  }

  /**
   * Fetches the active announcements from the BuildingLink API
   * @returns Promise resolving to the active announcements
   */
  async getAnnouncements(): Promise<BuildingLinkAnnouncement[]> {
    const url = "ContentCreator/Resident/v1/announcements/active";
    const response = await this.api(url);
    return response.json();
  }

  /**
   * Fetches the active deliveries from the BuildingLink API
   * @returns Promise resolving to the active deliveries
   */
  async getDeliveries(): Promise<BuildingLinkDelivery[]> {
    // set the initial query
    const query = {
      $expand: "Location,Type,Authorizations",
      $filter: "IsOpen eq true and Type/IsShownOnTenantHomePage eq true",
      $skip: 0,
    };

    // build the query string
    // can't use URLSearchParams because of the $
    const queryString = Object.entries(query)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    let url = `/EventLog/Resident/v1/Events?${queryString}`;
    const deliveries: BuildingLinkDelivery[] = [];

    while (url) {
      const response = await this.api(url);
      const data = await response.json();

      deliveries.push(...data.value);

      // if there's a next page, fetch it
      url = data["@odata.nextLink"];
    }

    return deliveries;
  }

  /**
   * Fetches the preference vendors from the BuildingLink API
   * @returns Promise resolving to the preference vendors
   */
  async getVendors(): Promise<BuildingLinkVendor[]> {
    const vendors: BuildingLinkVendor[] = [];

    // set the initial query
    const query = {
      $expand: "Provider($expand%3DCategory,Properties,State)",
      $skip: 0,
    };

    // build the query string
    // can't use URLSearchParams because of the $
    const queryString = Object.entries(query)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    let url = `ServicesAndOffers/Resident/v1/PreferredVendors?${queryString}`;

    // Fetch all pages
    while (url) {
      const response = await this.api(url);
      const data = await response.json();

      // Add vendors
      for (const { Provider } of data.value) {
        vendors.push(Provider);
      }

      // @odata.nextLink is the next page of results
      url = data["@odata.nextLink"];
    }

    return vendors;
  }

  /**
   * Fetches the authorized properties from the BuildingLink API
   * @returns Promise resolving to the authorized properties
   */
  async getBuildings(): Promise<BuildingLinkBuilding[]> {
    const url = "Properties/AuthenticatedUser/v1/property/authorized-properties";
    const response = await this.api(url);
    const { authorizedProperties } = await response.json();
    const properties = authorizedProperties.data as BuildingLinkBuilding[];
    return properties;
  }
}

export default BuildingLink;
