import * as dashboardUrls from "@dashboard/utils/urls";

import {
  getAbsoluteOrderUrl,
  orderListPath,
  orderListUrl,
  orderListUrlWithCustomerEmail,
  orderListUrlWithCustomerId,
} from "./urls";

jest.mock("@dashboard/utils/urls", () => {
  const actualModule = jest.requireActual<typeof dashboardUrls>("@dashboard/utils/urls");

  return {
    ...actualModule,
    getAppMountUriForRedirect: jest.fn(),
  };
});

const mockedGetAppMountUriForRedirect = dashboardUrls.getAppMountUriForRedirect as jest.Mock;

describe("Order URLs", () => {
  describe("orderListUrl", () => {
    it("should return base path when no params provided", () => {
      const result = orderListUrl();

      expect(result).toBe("/orders");
    });

    it("should return base path when params is undefined", () => {
      const result = orderListUrl(undefined);

      expect(result).toBe("/orders");
    });

    it("should build URL with query parameters", () => {
      const params = {
        customer: "test@example.com",
        status: ["UNFULFILLED"],
      };
      const result = orderListUrl(params);

      expect(result).toContain("/orders?");
      expect(result).toContain("customer=test%40example.com");
      expect(result).toContain("status%5B0%5D=UNFULFILLED"); // Arrays are encoded as [0]
    });
  });

  describe("orderListUrlWithCustomerEmail", () => {
    it("should return orderListPath when userEmail is undefined", () => {
      const result = orderListUrlWithCustomerEmail(undefined);

      expect(result).toBe(orderListPath);
    });

    it("should build URL with userEmail filter", () => {
      const userEmail = "test@example.com";
      const result = orderListUrlWithCustomerEmail(userEmail);

      expect(result).toContain("/orders?");
      expect(result).toContain("userEmail");
      expect(result).toContain("test%40example.com");
    });
  });

  describe("getAbsoluteOrderUrl", () => {
    const { location } = window;

    beforeEach(() => {
      delete (window as { location?: unknown }).location;
      Object.defineProperty(window, "location", {
        value: new URL("https://dashboard.example.com"),
        writable: true,
        configurable: true,
      });
      mockedGetAppMountUriForRedirect.mockReturnValue("");
    });

    afterAll(() => {
      Object.defineProperty(window, "location", {
        value: location,
        writable: true,
        configurable: true,
      });
    });

    it("includes encoded order ID in path without query params", () => {
      const orderId = "T3JkZXI6MS8=";

      const result = getAbsoluteOrderUrl(orderId);

      expect(result).toBe("https://dashboard.example.com/orders/T3JkZXI6MS8%3D");
      expect(result).not.toContain("?");
    });

    it("includes mount URI segment when mount differs from default", () => {
      mockedGetAppMountUriForRedirect.mockReturnValue("/dashboard/");

      const result = getAbsoluteOrderUrl("fulfilled-order-id");

      expect(result).toBe("https://dashboard.example.com/dashboard/orders/fulfilled-order-id");
      expect(result).not.toContain("?");
    });
  });

  describe("orderListUrlWithCustomerId", () => {
    it("should return orderListPath when userId is undefined", () => {
      const result = orderListUrlWithCustomerId(undefined);

      expect(result).toBe(orderListPath);
    });

    it("should build URL with customer filter", () => {
      const userId = "VXNlcjoxMjM=";
      const result = orderListUrlWithCustomerId(userId);

      expect(result).toContain("/orders?");
      expect(result).toContain("customer");
      expect(result).toContain(encodeURIComponent(userId));
    });
  });
});
