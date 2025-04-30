/**
 * @fileoverview BuildingLink Client - A TypeScript client for interacting with the BuildingLink
 * This module provides a client implementation for authenticating and making requests to
 * the BuildingLink system, handling various authentication flows and redirects.
 *
 * @license MIT
 */

import { BuildingLinkLibrary } from "./library";
import { parse, HTMLElement } from "node-html-parser";

/** Base URL for BuildingLink web interface */
const BUILDINGLINK_BASE_URL = "https://www.buildinglink.com";

/** Base path for BuildingLink tenant interface */
const BUILDINGLINK_TENANT_PATH = "/V2/Tenant";

/**
 * BuildingLink authentication credentials
 */
export interface BuildingLinkOptions {
  /** BuildingLink username */
  username: string;
  /** BuildingLink password */
  password: string;
  /** Base URL for BuildingLink instance */
  baseUrl?: string;
}

/**
 * BuildingLink authentication token structure
 * Contains OAuth2/OIDC standard fields
 */
export interface BuildingLinkToken extends Record<string, string> {
  /** Authorization code */
  code: string;
  /** JWT ID token */
  id_token: string;
  /** OAuth2 access token */
  access_token: string;
  /** Token type (typically "Bearer") */
  token_type: string;
  /** Token expiration time in seconds */
  expires_in: string;
  /** OAuth2 scope */
  scope: string;
  /** OAuth2 state parameter */
  state: string;
  /** OIDC session state */
  session_state: string;
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
export class BuildingLinkClient {
  /** Login credentials */
  public options: BuildingLinkOptions;
  /** Session cookies */
  public cookies: Record<string, string> = {};
  /** Library instance */
  public library: BuildingLinkLibrary;
  /** Authentication token */
  public token: BuildingLinkToken | null = null;
  /** Client hooks */
  public hooks: {
    requests: Array<(request: RequestInit) => Promise<RequestInit>>;
    responses: Array<(response: BuildingLinkResponse) => Promise<BuildingLinkResponse>>;
  };

  /**
   * Creates a new BuildingLink client instance
   * @param options - BuildingLink client options including username, password, and base URL
   */
  constructor(options: BuildingLinkOptions) {
    // Set options
    this.options = options;

    // Set options
    if (!this.options.baseUrl) {
      this.options.baseUrl = BUILDINGLINK_BASE_URL;
    }

    // Append section parsers
    this.library = new BuildingLinkLibrary(this);

    // Default hooks
    this.hooks = {
      requests: [this.addCookies],
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
   * @param request - Request object to modify
   * @returns {Promise<RequestInit>} Promise resolving to the modified request
   */
  private async addCookies(request: RequestInit): Promise<RequestInit> {
    const cookie = Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    request.headers = { ...request.headers, cookie };
    return request;
  }

  /**
   * Updates session cookies from response headers
   * @param response - Response object containing cookies
   * @returns {Promise<BuildingLinkResponse>} Promise resolving to the original response
   */
  private async updateCookies(response: BuildingLinkResponse): Promise<BuildingLinkResponse> {
    response.headers.getSetCookie().forEach((c) => {
      const [name, value] = c.split(";")[0].split("=");
      this.cookies[name.trim()] = decodeURIComponent(value.trim());
    });

    return response;
  }

  /**
   * Handles the login form submission
   * Processes verification tokens and submits credentials
   *
   * @param response - Response object containing potential login form
   * @param text - HTML content of the response
   * @returns Promise resolving to the authenticated response
   * @throws Error if login fails
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
        location = new URL(location, response.url).toString();
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
      options = await fn.bind(this)(options);
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
  async fetchTenantPage(path: string): Promise<BuildingLinkResponse> {
    return this.fetch(`${BUILDINGLINK_TENANT_PATH}/${path}`);
  }
}

export default BuildingLinkClient;
