import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getShareableOrderUrl } from "@dashboard/orders/utils/getShareableOrderUrl";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard");
jest.mock("@dashboard/orders/utils/getShareableOrderUrl");

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;
const mockGetShareableOrderUrl = getShareableOrderUrl as jest.MockedFunction<
  typeof getShareableOrderUrl
>;

describe("OrderCopyLinkButton", () => {
  const orderId = "T3JkZXI6MQ==";
  const shareableUrl = "https://example.com/dashboard/orders/T3JkZXI6MQ==";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetShareableOrderUrl.mockReturnValue(shareableUrl);
  });

  it("calls useClipboard copy with getShareableOrderUrl(orderId) when clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCopy = jest.fn();

    mockUseClipboard.mockReturnValue([false, mockCopy]);

    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    // Act
    await user.click(screen.getByTestId("copy-order-link"));

    // Assert
    expect(mockGetShareableOrderUrl).toHaveBeenCalledWith(orderId);
    expect(mockCopy).toHaveBeenCalledWith(shareableUrl);
  });

  it("renders a disabled button and does not copy when orderId is empty", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCopy = jest.fn();

    mockUseClipboard.mockReturnValue([false, mockCopy]);

    render(
      <Wrapper>
        <OrderCopyLinkButton orderId="" />
      </Wrapper>,
    );

    const copyButton = screen.getByTestId("copy-order-link");

    // Assert
    expect(copyButton).toBeDisabled();

    // Act
    await user.click(copyButton);

    // Assert
    expect(mockGetShareableOrderUrl).not.toHaveBeenCalled();
    expect(mockCopy).not.toHaveBeenCalled();
  });
});
