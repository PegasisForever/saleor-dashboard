import { getAppMountUriForRedirect } from "@dashboard/utils/urls";

import {
  getOrderShareableUrl,
  orderListPath,
  orderListUrl,
  orderListUrlWithCustomerEmail,
  orderListUrlWithCustomerId,
  orderPath,
} from "./urls";

jest.mock("@dashboard/utils/urls", () => ({
  ...(jest.requireActual("@dashboard/utils/urls") as object),
  getAppMountUriForRedirect: jest.fn(),
}));

const mockGetAppMountUriForRedirect = getAppMountUriForRedirect as jest.MockedFunction<
  typeof getAppMountUriForRedirect
>;

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

  describe("getOrderShareableUrl", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      delete (window as { location?: unknown }).location;
      // @ts-expect-error - mocking location for tests
      window.location = { origin: "https://dashboard.example.com" };
    });

    afterEach(() => {
      // @ts-expect-error - restoring location after mock
      window.location = originalLocation;
    });

    it("builds absolute URL with origin, mount prefix, and order path", () => {
      // Arrange
      const orderId = "T3JkZXI6MTIz";

      mockGetAppMountUriForRedirect.mockReturnValue("/dashboard");

      // Act
      const result = getOrderShareableUrl(orderId);

      // Assert
      expect(result).toContain("https://dashboard.example.com");
      expect(result).toContain("/dashboard");
      expect(result).toContain(orderPath(orderId));
      expect(result).toBe("https://dashboard.example.com/dashboard/orders/T3JkZXI6MTIz");
    });

    it("builds URL without mount prefix when mount URI is empty (root deploy)", () => {
      // Arrange
      const orderId = "T3JkZXI6MTIz";

      mockGetAppMountUriForRedirect.mockReturnValue("");

      // Act
      const result = getOrderShareableUrl(orderId);

      // Assert
      expect(result).toBe("https://dashboard.example.com/orders/T3JkZXI6MTIz");
    });
  });
});
