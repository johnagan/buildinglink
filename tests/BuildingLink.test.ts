import { BuildingLink, BuildingLinkResponse } from "../src";
import { parse } from "node-html-parser";
import { config } from "dotenv";
config({ path: ".env.test" });

const { BUILDINGLINK_USERNAME, BUILDINGLINK_PASSWORD } = process.env;

describe("BuildingLink", () => {
  if (!BUILDINGLINK_USERNAME || !BUILDINGLINK_PASSWORD) {
    throw new Error("Missing environment variables: BUILDINGLINK_USERNAME or BUILDINGLINK_PASSWORD");
  }

  describe("Authentication", () => {
    let client: BuildingLink;

    describe("Real-world authentication", () => {
      beforeAll(() => {
        // Initialize client with test credentials
        client = new BuildingLink({
          username: BUILDINGLINK_USERNAME!,
          password: BUILDINGLINK_PASSWORD!,
        });
      });

      it("can authenticate", async () => {
        const response = await client.page("Home/Default.aspx");
        expect(client.isAuthenticated).toBe(true);
        expect(client.token).toBeDefined();
        expect(response.status).toBe(200);
      });

      it("fetches original url after authentication", async () => {
        const { url, status } = await client.page("Home/Default.aspx");

        expect(status).toBe(200);
        expect(url).toBe("https://www.buildinglink.com/V2/Tenant/Home/DefaultNew.aspx");
      });
    });

    describe("Mock authentication", () => {
      it("correctly initializes with default options", () => {
        const client = new BuildingLink({
          username: "testuser",
          password: "testpass",
        });

        expect(client.cookies).toEqual({});
        expect(client.token).toBeUndefined();
        expect(client.isAuthenticated).toBe(false);
        expect(client.hooks.requests.length).toBe(2);
        expect(client.hooks.responses.length).toBe(4);
      });

      it("skips authentication if already authenticated", async () => {
        const testClient = new BuildingLink({
          username: "testuser",
          password: "testpass",
        });

        testClient.cookies = { "bl.auth.cookie.oidc": "test-token" };

        const mockResponse = {} as BuildingLinkResponse;
        const result = await (testClient as any).handleAuthentication.call(testClient, mockResponse);

        expect(result).toBe(mockResponse);
      });
      it("correctly initializes with custom options", () => {
        const options = {
          username: "testuser",
          password: "testpass",
          baseUrl: "https://test.example.com",
        };
        const client = new BuildingLink(options);
        expect(client.isAuthenticated).toBe(false);
      });
      it("submits login form with credentials", async () => {
        const testClient = new BuildingLink({
          username: "testuser",
          password: "testpass",
        });

        const mockDocument = parse(`
        <form action="/login" method="post">
          <input type="hidden" name="ReturnUrl" value="/dashboard" />
          <input type="text" name="Username" value="" />
          <input type="password" name="Password" value="" />
        </form>
      `);

        const mockResponse = {
          document: mockDocument,
          url: "https://www.buildinglink.com/login",
        } as unknown as BuildingLinkResponse;

        const mockFetchResponse = {
          status: 200,
        } as BuildingLinkResponse;

        testClient.fetch = jest.fn().mockResolvedValue(mockFetchResponse);

        const result = await (testClient as any).handleAuthentication.call(testClient, mockResponse);

        expect(testClient.fetch).toHaveBeenCalledWith("/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: expect.any(URLSearchParams),
        });

        const callArgs = (testClient.fetch as jest.Mock).mock.calls[0];
        const bodyParams = callArgs[1].body;
        expect(bodyParams.get("Username")).toBe("testuser");
        expect(bodyParams.get("Password")).toBe("testpass");
        expect(bodyParams.get("ReturnUrl")).toBe("/dashboard");
      });

      it("stores token when submitting to OIDC endpoint", async () => {
        const testClient = new BuildingLink({
          username: "testuser",
          password: "testpass",
        });

        const mockDocument = parse(`
        <form action="/oidc/token" method="post">
          <input type="hidden" name="code" value="auth_code" />
          <input type="hidden" name="id_token" value="id_token_value" />
          <input type="hidden" name="access_token" value="access_token_value" />
          <input type="hidden" name="token_type" value="Bearer" />
          <input type="hidden" name="expires_in" value="3600" />
          <input type="hidden" name="scope" value="openid profile" />
          <input type="hidden" name="state" value="state_value" />
          <input type="hidden" name="session_state" value="session_state_value" />
        </form>
      `);

        const mockResponse = {
          document: mockDocument,
          url: "https://www.buildinglink.com/login",
        } as unknown as BuildingLinkResponse;

        testClient.fetch = jest.fn().mockResolvedValue({ status: 200 } as BuildingLinkResponse);

        await (testClient as any).handleAuthentication.call(testClient, mockResponse);

        expect(testClient.token).toEqual({
          code: "auth_code",
          id_token: "id_token_value",
          access_token: "access_token_value",
          token_type: "Bearer",
          expires_in: "3600",
          scope: "openid profile",
          state: "state_value",
          session_state: "session_state_value",
        });
      });

      it("throws error when login fails", async () => {
        const testClient = new BuildingLink({
          username: "testuser",
          password: "testpass",
        });

        const mockDocument = parse(`<form action="/login" method="post"></form>`);

        const mockResponse = {
          document: mockDocument,
          url: "https://www.buildinglink.com/login",
        } as unknown as BuildingLinkResponse;

        const mockErrorResponse = {
          status: 400,
          html: '<div class="validation-summary-errors">Invalid credentials</div>',
        } as BuildingLinkResponse;

        testClient.fetch = jest.fn().mockResolvedValue(mockErrorResponse);

        await expect((testClient as any).handleAuthentication.call(testClient, mockResponse)).rejects.toThrow(
          "Failed to login: Invalid credentials"
        );
      });
    });
  });

  describe("Cookie management", () => {
    it("adds cookies to request headers", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      testClient.cookies = {
        "test-cookie": "test-value",
        "another-cookie": "another-value",
      };

      const request: RequestInit = { headers: { "Content-Type": "application/json" } };
      // Access private method via any type
      const modifiedRequest = await (testClient as any).addCookies.call(testClient, "", request);

      expect(modifiedRequest.headers).toHaveProperty("cookie");
      expect(modifiedRequest.headers.cookie).toContain("test-cookie=test-value");
      expect(modifiedRequest.headers.cookie).toContain("another-cookie=another-value");
    });

    it("updates cookies from response headers", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const response = {
        headers: {
          getSetCookie: jest.fn().mockReturnValue(["cookie1=value1; path=/", "cookie2=value2; path=/; secure"]),
        },
      } as unknown as BuildingLinkResponse;

      await (testClient as any).updateCookies.call(testClient, response);

      expect(testClient.cookies).toEqual({
        cookie1: "value1",
        cookie2: "value2",
      });
    });
  });

  describe("HTML handling", () => {
    it("parses HTML responses", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue("text/html; charset=utf-8"),
        },
        text: jest.fn().mockResolvedValue("<html><body><h1>Test</h1></body></html>"),
      } as unknown as BuildingLinkResponse;

      const result = await (testClient as any).handleHTMLResponse.call(testClient, mockResponse);

      expect(result.html).toBe("<html><body><h1>Test</h1></body></html>");
      expect(result.document).toBeDefined();
      expect(result.document.querySelector("h1")?.text).toBe("Test");
    });

    it("skips non-HTML responses", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
      } as unknown as BuildingLinkResponse;

      const result = await (testClient as any).handleHTMLResponse.call(testClient, mockResponse);

      expect(result.html).toBeUndefined();
      expect(result.document).toBeUndefined();
    });
  });

  describe("Redirect handling", () => {
    it("follows HTTP redirects", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const mockFetch = jest.fn().mockResolvedValue({
        status: 200,
        url: "https://www.buildinglink.com/redirected",
      });
      testClient.fetch = mockFetch;

      const mockResponse = {
        status: 302,
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === "location") return "/redirected";
            return null;
          }),
        },
        url: "https://www.buildinglink.com/original",
      } as unknown as BuildingLinkResponse;

      await (testClient as any).handleRedirects.call(testClient, mockResponse);

      expect(mockFetch).toHaveBeenCalledWith("https://www.buildinglink.com/redirected");
    });

    it("follows script-based redirects", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const mockFetch = jest.fn().mockResolvedValue({
        status: 200,
        url: "https://www.buildinglink.com/dashboard",
      });
      testClient.fetch = mockFetch;

      const mockResponse = {
        status: 200,
        html: '<script>window.top.location.href="https://www.buildinglink.com/dashboard";</script>',
        url: "https://www.buildinglink.com/login",
      } as unknown as BuildingLinkResponse;

      await (testClient as any).handleRedirects.call(testClient, mockResponse);

      expect(mockFetch).toHaveBeenCalledWith("https://www.buildinglink.com/dashboard");
    });
  });

  describe("Fetch methods", () => {
    it("applies request hooks in order", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const mockFetch = jest.fn().mockResolvedValue({} as BuildingLinkResponse);
      global.fetch = mockFetch;

      const hook1 = jest.fn().mockImplementation(async (url, req) => ({
        ...req,
        headers: { ...req.headers, "X-Hook1": "value1" },
      }));

      const hook2 = jest.fn().mockImplementation(async (url, req) => ({
        ...req,
        headers: { ...req.headers, "X-Hook2": "value2" },
      }));

      testClient.hooks.responses = [];
      testClient.hooks.requests = [hook1, hook2];

      await testClient.fetch("https://example.com/test");

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Hook1": "value1",
            "X-Hook2": "value2",
          }),
        })
      );
    });

    it("applies response hooks in order", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      const mockResponse = {} as BuildingLinkResponse;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const hook1 = jest.fn().mockResolvedValue({ ...mockResponse, hook1: true });
      const hook2 = jest.fn().mockResolvedValue({ ...mockResponse, hook1: true, hook2: true });

      testClient.hooks.responses = [hook1, hook2];

      const result = await testClient.fetch("https://example.com/test");

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          hook1: true,
          hook2: true,
        })
      );
    });

    it("correctly builds tenant path URLs", async () => {
      const testClient = new BuildingLink({
        username: "testuser",
        password: "testpassword",
      });

      testClient.fetch = jest.fn().mockResolvedValue({} as BuildingLinkResponse);

      await testClient.page("Home/Dashboard");

      expect(testClient.fetch).toHaveBeenCalledWith("V2/Tenant/Home/Dashboard", expect.any(Object));
    });
  });

  describe("Additional BuildingLink methods", () => {
    let client: BuildingLink;

    beforeEach(() => {
      client = new BuildingLink({
        username: "testuser",
        password: "testpass",
      });
      client.token = { access_token: "mock-token" } as any;
    });

    it("calls api() with correct headers and returns response", async () => {
      const mockResponse = { status: 200, json: jest.fn().mockResolvedValue({ data: "ok" }) } as any;
      client.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.api("/test/api");
      expect(client.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
            "ocp-apim-subscription-key": expect.any(String),
          }),
        })
      );
      expect(result).toBe(mockResponse);
    });

    it("getLibrary() parses library from page", async () => {
      const mockDocument = { querySelector: jest.fn().mockReturnValue(undefined) } as any;
      client.page = jest.fn().mockResolvedValue({ document: mockDocument, url: "https://test" });

      // Only use jest.spyOn, do not assign parseLibrary directly
      const libraryModule = require("../src/models/Library");
      const parseLibrarySpy = jest
        .spyOn(libraryModule, "parseLibrary")
        .mockReturnValue({ aptDocuments: [], buildingDocuments: [] });

      const result = await client.getLibrary();
      expect(client.page).toHaveBeenCalledWith("Library/Library.aspx");
      expect(parseLibrarySpy).toHaveBeenCalled();
      expect(result).toEqual({ aptDocuments: [], buildingDocuments: [] });
    });

    it("getOccupant() returns occupant from API", async () => {
      const mockOccupant = { id: "occ-1" };
      client.api = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue(mockOccupant) });

      const result = await client.getOccupant();
      expect(client.api).toHaveBeenCalledWith("Properties/AuthenticatedUser/v1/property/occupant/get");
      expect(result).toEqual(mockOccupant);
    });

    it("getUser() returns user from API", async () => {
      const mockUser = { id: "user-1" };
      client.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue(mockUser) });

      const result = await client.getUser();
      expect(client.fetch).toHaveBeenCalledWith(
        "https://users.us1.buildinglink.com/users/authenticated",
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-api-key": expect.any(String),
            Authorization: "Bearer mock-token",
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("getEvents() returns events from API", async () => {
      const mockEvents = [{ id: "event-1" }];
      client.api = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue(mockEvents) });

      const from = new Date("2024-01-01");
      const to = new Date("2024-01-02");
      const result = await client.getEvents(from, to);
      expect(client.api).toHaveBeenCalledWith(
        expect.stringContaining("Calendar/Resident/v2/resident/events/filteredeventsrsvp?")
      );
      expect(result).toEqual(mockEvents);
    });

    it("getDeliveries() paginates and returns all deliveries", async () => {
      const page1 = { value: [{ Id: 1 }], "@odata.nextLink": "/next" };
      const page2 = { value: [{ Id: 2 }] };
      client.api = jest
        .fn()
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue(page1) })
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue(page2) });

      const result = await client.getDeliveries();
      expect(client.api).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ Id: 1 }, { Id: 2 }]);
    });

    it("getPreferredVendors() paginates and returns all vendors", async () => {
      const page1 = { value: [{ Provider: { Id: 1 } }], "@odata.nextLink": "/next" };
      const page2 = { value: [{ Provider: { Id: 2 } }] };
      client.api = jest
        .fn()
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue(page1) })
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue(page2) });

      const result = await client.getVendors();
      expect(client.api).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ Id: 1 }, { Id: 2 }]);
    });

    it("getProperties() returns authorized properties", async () => {
      const mockProperties = { authorizedProperties: { data: [{ id: "prop-1" }] } };
      client.api = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue(mockProperties) });

      const result = await client.getBuildings();
      expect(client.api).toHaveBeenCalledWith("Properties/AuthenticatedUser/v1/property/authorized-properties");
      expect(result).toEqual([{ id: "prop-1" }]);
    });
  });
});
