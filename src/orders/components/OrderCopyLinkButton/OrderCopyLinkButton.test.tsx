import { useClipboard } from "@dashboard/hooks/useClipboard";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard");

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;

describe("OrderCopyLinkButton", () => {
  it("renders an aria-live status region when copied", () => {
    // Arrange
    mockUseClipboard.mockReturnValue([true, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId="T3JkZXI6MQ==" />
      </Wrapper>,
    );

    // Assert
    const statusRegion = screen.getByRole("status");

    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveTextContent("Order link copied");
  });
});
