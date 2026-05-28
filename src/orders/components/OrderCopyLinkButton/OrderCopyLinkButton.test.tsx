import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getAppMountUriForRedirect } from "@dashboard/utils/urls";
import Wrapper from "@test/wrapper";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { getShareableOrderUrl } from "./getShareableOrderUrl";
import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

jest.mock("@dashboard/hooks/useClipboard", () => {
  const actual = jest.requireActual<typeof import("@dashboard/hooks/useClipboard")>(
    "@dashboard/hooks/useClipboard",
  );

  return {
    ...actual,
    useClipboard: jest.fn(actual.useClipboard),
  };
});
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
    const copyButton = screen.getByTestId("copy-order-link");
    const statusRegion = screen.getByRole("status");

    expect(copyButton).toHaveAttribute("aria-label", "Order link copied");
    expect(copyButton).toHaveAttribute("title", "Order link copied");
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveTextContent("Order link copied");
  });

  it("resets copied feedback when remounted with a different key (order navigation)", () => {
    // Arrange — order A shows copied state (simulates copy before navigating away)
    mockUseClipboard.mockReturnValue([true, jest.fn()]);

    const orderIdA = "T3JkZXI6MQ==";
    const orderIdB = "T3JkZXI6Mg==";

    const { rerender } = render(
      <Wrapper>
        <OrderCopyLinkButton key={orderIdA} orderId={orderIdA} />
      </Wrapper>,
    );

    const buttonBeforeNavigation = screen.getByTestId("copy-order-link");

    expect(buttonBeforeNavigation).toHaveAttribute("aria-label", "Order link copied");
    expect(buttonBeforeNavigation).toHaveAttribute("title", "Order link copied");
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Act — parent remounts via key={order.id} when staff navigates to order B
    mockUseClipboard.mockReturnValue([false, jest.fn()]);

    rerender(
      <Wrapper>
        <OrderCopyLinkButton key={orderIdB} orderId={orderIdB} />
      </Wrapper>,
    );

    // Assert — fresh instance shows default copy affordance, not order A's feedback
    const buttonAfterNavigation = screen.getByTestId("copy-order-link");

    expect(buttonAfterNavigation).toHaveAttribute("aria-label", "Copy order link");
    expect(buttonAfterNavigation).toHaveAttribute("title", "Copy order link");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("OrderCopyLinkButton click to copied feedback transition", () => {
  const orderId = "T3JkZXI6MQ==";
  let mockWriteText: jest.Mock;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockWriteText = jest.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
      writable: true,
    });

    delete (window as { location?: unknown }).location;
    Object.defineProperty(window, "location", {
      value: { origin: "https://dashboard.example.com" },
      writable: true,
      configurable: true,
    });
    mockGetAppMountUriForRedirect.mockReturnValue("");
    mockUseClipboard.mockImplementation(
      jest.requireActual<typeof import("@dashboard/hooks/useClipboard")>(
        "@dashboard/hooks/useClipboard",
      ).useClipboard,
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    mockUseClipboard.mockReset();
    mockUseClipboard.mockImplementation(
      jest.requireActual<typeof import("@dashboard/hooks/useClipboard")>(
        "@dashboard/hooks/useClipboard",
      ).useClipboard,
    );
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("transitions label and icon on click and reverts after 2 seconds", async () => {
    // Arrange
    const expectedUrl = getShareableOrderUrl(orderId);

    render(
      <Wrapper>
        <OrderCopyLinkButton orderId={orderId} />
      </Wrapper>,
    );

    const button = screen.getByTestId("copy-order-link");

    expect(button).toHaveAttribute("aria-label", "Copy order link");
    expect(button).toHaveAttribute("title", "Copy order link");
    expect(button.querySelector(".lucide-copy")).toBeInTheDocument();
    expect(button.querySelector(".lucide-check")).not.toBeInTheDocument();

    // Act
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    // Assert — copied feedback
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(expectedUrl);
    });
    expect(button).toHaveAttribute("aria-label", "Order link copied");
    expect(button).toHaveAttribute("title", "Order link copied");
    expect(button.querySelector(".lucide-check")).toBeInTheDocument();
    expect(button.querySelector(".lucide-copy")).not.toBeInTheDocument();

    // Act — 2s reset window elapses
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Assert — default affordance restored
    expect(button).toHaveAttribute("aria-label", "Copy order link");
    expect(button).toHaveAttribute("title", "Copy order link");
    expect(button.querySelector(".lucide-copy")).toBeInTheDocument();
    expect(button.querySelector(".lucide-check")).not.toBeInTheDocument();
  });
});
