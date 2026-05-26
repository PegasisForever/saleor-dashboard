import { getOrderAbsoluteUrl } from "./getOrderAbsoluteUrl";

describe("getOrderAbsoluteUrl", () => {
  it("returns absolute URL with default mount at /", () => {
    // Arrange
    const orderId = "T3JkZXI6MTIz";

    // Act
    const absoluteUrl = getOrderAbsoluteUrl(orderId);

    // Assert
    expect(absoluteUrl).toBe(`http://localhost/orders/${encodeURIComponent(orderId)}`);
  });

  it("returns absolute URL with dashboard mounted under /dashboard/", () => {
    // Arrange
    window.__SALEOR_CONFIG__ = {
      ...window.__SALEOR_CONFIG__,
      APP_MOUNT_URI: "/dashboard/",
    };

    const orderId = "T3JkZXI6MTIz";

    // Act
    const absoluteUrl = getOrderAbsoluteUrl(orderId);

    // Assert
    expect(absoluteUrl).toBe(`http://localhost/dashboard/orders/${encodeURIComponent(orderId)}`);
  });
});
