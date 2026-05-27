import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getOrderShareableUrl } from "@dashboard/orders/urls";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard");
jest.mock("@dashboard/orders/urls", () => ({
  ...(jest.requireActual("@dashboard/orders/urls") as object),
  getOrderShareableUrl: jest.fn(),
}));

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;
const mockGetOrderShareableUrl = getOrderShareableUrl as jest.MockedFunction<
  typeof getOrderShareableUrl
>;

describe("OrderCopyLinkButton", () => {
  const orderId = "T3JkZXI6MTIz";
  const shareableUrl = "https://dashboard.example.com/orders/T3JkZXI6MTIz";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrderShareableUrl.mockReturnValue(shareableUrl);
  });

  it("copies shareable URL when button is clicked", async () => {
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
    expect(mockGetOrderShareableUrl).toHaveBeenCalledWith(orderId);
    expect(mockCopy).toHaveBeenCalledWith(shareableUrl);
  });

  it('shows "Copy order link" aria-label before copy', () => {
    // Arrange
    mockUseClipboard.mockReturnValue([false, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    // Assert
    expect(screen.getByTestId("copy-order-link")).toHaveAttribute("aria-label", "Copy order link");
  });

  it('shows "Order link copied" aria-label after copy', () => {
    // Arrange
    mockUseClipboard.mockReturnValue([true, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    // Assert
    expect(screen.getByTestId("copy-order-link")).toHaveAttribute(
      "aria-label",
      "Order link copied",
    );
  });
});
