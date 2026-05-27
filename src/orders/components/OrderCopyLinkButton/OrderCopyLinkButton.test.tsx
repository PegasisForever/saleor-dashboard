import { useClipboard } from "@dashboard/hooks/useClipboard";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard");

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;

describe("OrderCopyLinkButton", () => {
  it("copies window.location.href to clipboard when url prop is omitted", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCopy = jest.fn();

    mockUseClipboard.mockReturnValue([false, mockCopy]);

    render(
      <Wrapper>
        <OrderCopyLinkButton />
      </Wrapper>,
    );

    // Act
    const copyButton = screen.getByRole("button", { name: /copy order link/i });

    await user.click(copyButton);

    // Assert
    expect(mockCopy).toHaveBeenCalledWith(window.location.href);
  });

  it("copies explicit url prop to clipboard when provided", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCopy = jest.fn();
    const orderUrl = "https://example.com/dashboard/orders/abc123";

    mockUseClipboard.mockReturnValue([false, mockCopy]);

    render(
      <Wrapper>
        <OrderCopyLinkButton url={orderUrl} />
      </Wrapper>,
    );

    // Act
    const copyButton = screen.getByRole("button", { name: /copy order link/i });

    await user.click(copyButton);

    // Assert
    expect(mockCopy).toHaveBeenCalledWith(orderUrl);
  });

  it("shows check icon and copied label after link is copied", () => {
    // Arrange
    mockUseClipboard.mockReturnValue([true, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton />
      </Wrapper>,
    );

    // Assert
    const button = screen.getByRole("button", { name: /order link copied/i });
    const checkIcon = button.querySelector(".lucide-check");

    expect(checkIcon).toBeInTheDocument();
  });

  it("shows copy icon and default label when link has not been copied", () => {
    // Arrange
    mockUseClipboard.mockReturnValue([false, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton />
      </Wrapper>,
    );

    // Assert
    const button = screen.getByRole("button", { name: /copy order link/i });
    const copyIcon = button.querySelector(".lucide-copy");

    expect(copyIcon).toBeInTheDocument();
  });
});
