import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getAppMountUriForRedirect } from "@dashboard/utils/urls";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { getShareableOrderUrl } from "./getShareableOrderUrl";
import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard");
jest.mock("@dashboard/utils/urls", () => {
  const actual = jest.requireActual("@dashboard/utils/urls");

  return {
    ...actual,
    getAppMountUriForRedirect: jest.fn(),
  };
});

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;
const mockGetAppMountUriForRedirect = getAppMountUriForRedirect as jest.MockedFunction<
  typeof getAppMountUriForRedirect
>;

describe("OrderCopyLinkButton", () => {
  const originalLocation = window.location;
  const orderId = "T3JkZXI6MQ==";

  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as { location?: unknown }).location;
    Object.defineProperty(window, "location", {
      value: { origin: "https://dashboard.example.com" },
      writable: true,
      configurable: true,
    });
    mockGetAppMountUriForRedirect.mockReturnValue("");
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("copies shareable order URL when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCopy = jest.fn();

    mockUseClipboard.mockReturnValue([false, mockCopy]);

    const expectedUrl = getShareableOrderUrl(orderId);

    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    // Act
    await user.click(screen.getByTestId("copy-order-link"));

    // Assert
    expect(mockCopy).toHaveBeenCalledWith(expectedUrl);
  });
});
