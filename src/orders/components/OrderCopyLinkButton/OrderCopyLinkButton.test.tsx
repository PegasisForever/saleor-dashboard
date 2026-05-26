import { useClipboard } from "@dashboard/hooks/useClipboard";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard");

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;

describe("OrderCopyLinkButton", () => {
  it("calls copy with absolute URL when button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCopy = jest.fn();
    const orderId = "T3JkZXI6MTIz";

    mockUseClipboard.mockReturnValue([false, mockCopy]);

    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    // Act
    const copyButton = screen.getByRole("button", { name: /copy order link/i });

    await user.click(copyButton);

    // Assert
    expect(mockCopy).toHaveBeenCalledWith(`http://localhost/orders/${encodeURIComponent(orderId)}`);
  });

  it("shows check icon after link is copied", () => {
    // Arrange
    mockUseClipboard.mockReturnValue([true, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId="T3JkZXI6MTIz" />
      </Wrapper>,
    );

    // Assert
    const button = screen.getByRole("button", { name: /copy order link/i });
    const checkIcon = button.querySelector(".lucide-check");

    expect(checkIcon).toBeInTheDocument();
  });

  it("shows copy icon when link has not been copied", () => {
    // Arrange
    mockUseClipboard.mockReturnValue([false, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId="T3JkZXI6MTIz" />
      </Wrapper>,
    );

    // Assert
    const button = screen.getByRole("button", { name: /copy order link/i });
    const copyIcon = button.querySelector(".lucide-copy");

    expect(copyIcon).toBeInTheDocument();
  });

  it("does not render when orderId is empty", () => {
    // Arrange & Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId="" />
      </Wrapper>,
    );

    // Assert
    expect(screen.queryByTestId("copy-order-link")).not.toBeInTheDocument();
  });
});
