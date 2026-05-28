import { getAppMountUriForRedirect } from "@dashboard/utils/urls";

import { getShareableOrderUrl } from "./getShareableOrderUrl";

jest.mock("@dashboard/utils/urls", () => {
  const actual = jest.requireActual("@dashboard/utils/urls");

  return {
    ...actual,
    getAppMountUriForRedirect: jest.fn(),
  };
});

const mockGetAppMountUriForRedirect = getAppMountUriForRedirect as jest.MockedFunction<
  typeof getAppMountUriForRedirect
>;

describe("getShareableOrderUrl", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as { location?: unknown }).location;
    Object.defineProperty(window, "location", {
      value: { origin: "https://dashboard.example.com" },
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("returns absolute URL with default mount", () => {
    // Arrange
    mockGetAppMountUriForRedirect.mockReturnValue("");

    const orderId = "T3JkZXI6MQ==";

    // Act
    const result = getShareableOrderUrl(orderId);

    // Assert
    expect(result).toBe("https://dashboard.example.com/orders/T3JkZXI6MQ%3D%3D?");
  });

  it("returns absolute URL with custom subpath mount", () => {
    // Arrange
    mockGetAppMountUriForRedirect.mockReturnValue("/dashboard");

    const orderId = "T3JkZXI6MQ==";

    // Act
    const result = getShareableOrderUrl(orderId);

    // Assert
    expect(result).toBe("https://dashboard.example.com/dashboard/orders/T3JkZXI6MQ%3D%3D?");
  });

  it("encodes order id via orderUrl with trailing query marker", () => {
    // Arrange
    mockGetAppMountUriForRedirect.mockReturnValue("");

    const orderId = "order/with/special chars";

    // Act
    const result = getShareableOrderUrl(orderId);

    // Assert
    expect(result).toBe(`https://dashboard.example.com/orders/${encodeURIComponent(orderId)}?`);
  });
});
