import { orderPath } from "@dashboard/orders/urls";
import { getAppMountUriForRedirect } from "@dashboard/utils/urls";
import urlJoin from "url-join";

import { getShareableOrderUrl } from "./getShareableOrderUrl";

jest.mock("@dashboard/orders/urls", () => ({
  orderPath: jest.fn((id: string) => `/orders/${id}`),
}));

jest.mock("@dashboard/utils/urls", () => ({
  getAppMountUriForRedirect: jest.fn(() => "/dashboard"),
}));

const mockOrderPath = orderPath as jest.MockedFunction<typeof orderPath>;
const mockGetAppMountUriForRedirect = getAppMountUriForRedirect as jest.MockedFunction<
  typeof getAppMountUriForRedirect
>;

describe("getShareableOrderUrl", () => {
  const orderId = "T3JkZXI6MQ==";
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, origin: "https://example.com" },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("returns urlJoin of origin, mount URI, and order path without query string", () => {
    // Arrange
    mockOrderPath.mockReturnValue(`/orders/${orderId}`);
    mockGetAppMountUriForRedirect.mockReturnValue("/dashboard");

    const expected = urlJoin(
      window.location.origin,
      getAppMountUriForRedirect(),
      orderPath(orderId),
    );

    // Act
    const result = getShareableOrderUrl(orderId);

    // Assert
    expect(result).toBe(expected);
    expect(result).not.toContain("?");
  });
});
