import { BuildingLinkClient, BuildingLinkResponse } from "../src/client";
import { parse } from "node-html-parser";
import { config } from "dotenv";
config({ path: ".env.test" });

const { BUILDINGLINK_USERNAME, BUILDINGLINK_PASSWORD } = process.env;

describe("BuildingLinkClient", () => {
  if (!BUILDINGLINK_USERNAME || !BUILDINGLINK_PASSWORD) {
    throw new Error("Missing environment variables: BUILDINGLINK_USERNAME or BUILDINGLINK_PASSWORD");
  }

  describe("Authentication", () => {
    let client: BuildingLinkClient;

    describe("Real-world authentication", () => {
      beforeAll(() => {
        // Initialize client with test credentials
        client = new BuildingLinkClient({
          username: BUILDINGLINK_USERNAME!,
          password: BUILDINGLINK_PASSWORD!,
        });
      });

      it("can authenticate", async () => {
        const response = await client.fetchTenantPage("Home/Default.aspx");
        expect(client.isAuthenticated).toBe(true);
        expect(client.token).toBeDefined();
        expect(response.status).toBe(200);
      });

      it("fetches original url after authentication", async () => {
        const { url, status } = await client.fetchTenantPage("Home/Default.aspx");

        expect(status).toBe(200);
        expect(url).toBe("https://www.buildinglink.com/V2/Tenant/Home/DefaultNew.aspx");
      });
    });

    describe("Mock authentication", () => {
      it("correctly initializes with default options", () => {
        const client = new BuildingLinkClient();
        expect(client.cookies).toEqual({});
        expect(client.token).toBeNull();
        expect(client.isAuthenticated).toBe(false);
        expect(client.hooks.requests.length).toBe(1);
        expect(client.hooks.responses.length).toBe(4);
      });

      it("skips authentication if already authenticated", async () => {
        const testClient = new BuildingLinkClient();
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
        const client = new BuildingLinkClient(options);
        expect(client.isAuthenticated).toBe(false);
      });
      it("submits login form with credentials", async () => {
        const testClient = new BuildingLinkClient({
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
        const testClient = new BuildingLinkClient();

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
        const testClient = new BuildingLinkClient();

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
      const testClient = new BuildingLinkClient();
      testClient.cookies = {
        "test-cookie": "test-value",
        "another-cookie": "another-value",
      };

      const request: RequestInit = { headers: { "Content-Type": "application/json" } };
      // Access private method via any type
      const modifiedRequest = await (testClient as any).addCookies.call(testClient, request);

      expect(modifiedRequest.headers).toHaveProperty("cookie");
      expect(modifiedRequest.headers.cookie).toContain("test-cookie=test-value");
      expect(modifiedRequest.headers.cookie).toContain("another-cookie=another-value");
    });

    it("updates cookies from response headers", async () => {
      const testClient = new BuildingLinkClient();
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
      const testClient = new BuildingLinkClient();
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
      const testClient = new BuildingLinkClient();
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
      const testClient = new BuildingLinkClient();
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
      const testClient = new BuildingLinkClient();
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
      const testClient = new BuildingLinkClient();

      const mockFetch = jest.fn().mockResolvedValue({} as BuildingLinkResponse);
      global.fetch = mockFetch;

      const hook1 = jest.fn().mockImplementation(async (req) => ({
        ...req,
        headers: { ...req.headers, "X-Hook1": "value1" },
      }));

      const hook2 = jest.fn().mockImplementation(async (req) => ({
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
      const testClient = new BuildingLinkClient();

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
      const testClient = new BuildingLinkClient();
      testClient.fetch = jest.fn().mockResolvedValue({} as BuildingLinkResponse);

      await testClient.fetchTenantPage("Home/Dashboard");

      expect(testClient.fetch).toHaveBeenCalledWith("/V2/Tenant/Home/Dashboard");
    });
  });
});
