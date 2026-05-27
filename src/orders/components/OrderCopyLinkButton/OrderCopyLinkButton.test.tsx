import { getShareableOrderUrl } from "@dashboard/orders/utils/getShareableOrderUrl";
import Wrapper from "@test/wrapper";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useEffect, useRef, useState } from "react";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/orders/utils/getShareableOrderUrl");

const mockWriteText = jest.fn();

jest.mock("@dashboard/hooks/useClipboard", () => ({
  useClipboard: () => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<null | number>(null);

    const clear = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const copy = useCallback((text: string) => {
      mockWriteText(text);
      setCopied(true);
      timeoutRef.current = window.setTimeout(() => {
        clear();
        setCopied(false);
      }, 2000);
    }, []);

    useEffect(() => clear, []);

    return [copied, copy] as const;
  },
}));

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

    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    // Act
    await user.click(screen.getByTestId("copy-order-link"));

    // Assert
    expect(mockGetShareableOrderUrl).toHaveBeenCalledWith(orderId);
    expect(mockWriteText).toHaveBeenCalledWith(shareableUrl);
  });

  it("renders a disabled button and does not copy when orderId is empty", async () => {
    // Arrange
    const user = userEvent.setup();

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
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  describe("copied feedback timing", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it("shows copied aria-label and title then reverts after 2000ms", async () => {
      // Arrange
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <Wrapper>
          <OrderCopyLinkButton orderId={orderId} />
        </Wrapper>,
      );

      const copyButton = screen.getByTestId("copy-order-link");

      expect(copyButton).toHaveAttribute("aria-label", "Copy order link");
      expect(copyButton).toHaveAttribute("title", "Copy order link");

      // Act
      await user.click(copyButton);

      // Assert
      expect(copyButton).toHaveAttribute("aria-label", "Order link copied");
      expect(copyButton).toHaveAttribute("title", "Order link copied");

      // Act
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Assert
      expect(copyButton).toHaveAttribute("aria-label", "Copy order link");
      expect(copyButton).toHaveAttribute("title", "Copy order link");
    });
  });
});
