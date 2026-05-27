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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns urlJoin of origin, mount URI, and order path without query string", () => {
    // Arrange
    const encodedOrderId = encodeURIComponent(orderId);

    mockOrderPath.mockReturnValue(`/orders/${encodedOrderId}`);
    mockGetAppMountUriForRedirect.mockReturnValue("/dashboard");

    const expected = urlJoin(
      window.location.origin,
      getAppMountUriForRedirect(),
      orderPath(encodedOrderId),
    );

    // Act
    const result = getShareableOrderUrl(orderId);

    // Assert
    expect(mockOrderPath).toHaveBeenCalledWith(encodedOrderId);
    expect(result).toBe(expected);
    expect(result).not.toContain("?");
  });

  it("encodes order ID characters that are invalid in URL path segments", () => {
    // Arrange
    const orderIdWithSpecialChars = "T3Jk/ZXI6+MQ==";
    const encodedOrderId = encodeURIComponent(orderIdWithSpecialChars);

    mockOrderPath.mockImplementation((id: string) => `/orders/${id}`);
    mockGetAppMountUriForRedirect.mockReturnValue("/dashboard");

    // Act
    const result = getShareableOrderUrl(orderIdWithSpecialChars);

    // Assert
    expect(mockOrderPath).toHaveBeenCalledWith(encodedOrderId);
    expect(result).toContain(encodedOrderId);
    expect(result).not.toContain("+");
    expect(result).not.toContain("/ZXI6");
  });
});
