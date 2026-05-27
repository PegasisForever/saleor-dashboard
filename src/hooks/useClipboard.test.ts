import { act, renderHook } from "@testing-library/react";

import { useClipboard } from "./useClipboard";

describe("useClipboard", () => {
  let mockWriteText: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockWriteText = jest.fn().mockResolvedValue(undefined);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    consoleWarnSpy.mockRestore();
  });

  it("should return initial state with copied as false", () => {
    // Arrange & Act
    const { result } = renderHook(() => useClipboard());

    // Assert
    const [copied, copy] = result.current;

    expect(copied).toBe(false);
    expect(typeof copy).toBe("function");
  });

  it("should copy text to clipboard and set copied to true", async () => {
    // Arrange
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());
    const textToCopy = "Hello, World!";

    // Act
    const [, copy] = result.current;

    await act(async () => {
      copy(textToCopy);
      await Promise.resolve();
    });

    // Assert
    expect(mockWriteText).toHaveBeenCalledWith(textToCopy);
    expect(result.current[0]).toBe(true);
  });

  it("should reset copied to false after 2 seconds", async () => {
    // Arrange
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    // Act
    const [, copy] = result.current;

    await act(async () => {
      copy("test text");
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Assert
    expect(result.current[0]).toBe(false);
  });

  it("should clear timeout on unmount", async () => {
    // Arrange
    mockWriteText.mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() => useClipboard());

    // Act
    const [, copy] = result.current;

    await act(async () => {
      copy("test text");
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(true);

    unmount();

    // Assert
    expect(jest.getTimerCount()).toBe(0);
  });

  it("should handle multiple copy calls", async () => {
    // Arrange
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());

    // Act
    const [, copy] = result.current;

    await act(async () => {
      copy("first text");
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(true);

    await act(async () => {
      copy("second text");
      await Promise.resolve();
    });

    // Assert - should still be true after second copy
    expect(mockWriteText).toHaveBeenCalledTimes(2);
    expect(mockWriteText).toHaveBeenCalledWith("first text");
    expect(mockWriteText).toHaveBeenCalledWith("second text");
    expect(result.current[0]).toBe(true);
  });

  it("should increment copyGeneration on each successful copy even when copied stays true", async () => {
    // Arrange
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());
    const [, copy] = result.current;

    // Act - first copy
    await act(async () => {
      copy("first text");
      await Promise.resolve();
    });

    // Assert
    expect(result.current[2]).toBe(1);

    // Act - second copy within 2s window
    await act(async () => {
      copy("second text");
      await Promise.resolve();
    });

    // Assert
    expect(result.current[0]).toBe(true);
    expect(result.current[2]).toBe(2);
  });

  it("should keep copied true until 2s after the last copy when copying twice within 2s", async () => {
    // Arrange
    mockWriteText.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClipboard());
    const [, copy] = result.current;

    // Act - first copy
    await act(async () => {
      copy("first text");
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(true);

    // Act - second copy within 2s window (before first timer fires)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      copy("second text");
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(true);

    // Assert - still true 1.5s after second copy (would fail if first timer orphaned)
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current[0]).toBe(true);

    // Assert - resets 2s after the second copy
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current[0]).toBe(false);
  });

  it("should handle clipboard write rejection and log warning", async () => {
    // Arrange
    const mockError = new Error("Clipboard permission denied");

    mockWriteText.mockRejectedValue(mockError);

    const { result } = renderHook(() => useClipboard());
    const textToCopy = "Hello, World!";

    // Act
    const [, copy] = result.current;

    await act(async () => {
      copy(textToCopy);
      await Promise.resolve();
    });

    // Assert
    expect(mockWriteText).toHaveBeenCalledWith(textToCopy);
    expect(result.current[0]).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to use clipboard, ensure browser permission is enabled.",
    );
  });

  it("should log warning and skip write when clipboard API is unavailable", () => {
    // Arrange
    Object.assign(navigator, { clipboard: undefined });

    const { result } = renderHook(() => useClipboard());
    const [, copy] = result.current;

    // Act
    copy("Hello, World!");

    // Assert
    expect(mockWriteText).not.toHaveBeenCalled();
    expect(result.current[0]).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to use clipboard, ensure browser permission is enabled.",
    );
  });
});
