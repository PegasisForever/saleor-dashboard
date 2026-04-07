import * as Sentry from "@sentry/react";

import { parseEditorJsOutput } from "./parseEditorJsOutput";

jest.mock("@sentry/react", () => ({
  captureException: jest.fn(),
}));

describe("parseEditorJsOutput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should parse valid EditorJS JSON string", () => {
    // Arrange
    const editorData = {
      time: 1234567890,
      blocks: [
        { id: "block1", type: "paragraph", data: { text: "Hello world" } },
        { id: "block2", type: "header", data: { text: "Title", level: 2 } },
      ],
      version: "2.28.0",
    };
    const input = JSON.stringify(editorData);

    // Act
    const result = parseEditorJsOutput(input);

    // Assert
    expect(result).toEqual(editorData);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("should parse minimal EditorJS JSON with only blocks", () => {
    // Arrange
    const editorData = {
      blocks: [{ type: "paragraph", data: { text: "Hello" } }],
    };
    const input = JSON.stringify(editorData);

    // Act
    const result = parseEditorJsOutput(input);

    // Assert
    expect(result).toEqual(editorData);
  });

  it("should return null for null input without reporting to Sentry", () => {
    // Act
    const result = parseEditorJsOutput(null);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("should return null for undefined input without reporting to Sentry", () => {
    // Act
    const result = parseEditorJsOutput(undefined);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("should return null for empty string without reporting to Sentry", () => {
    // Act
    const result = parseEditorJsOutput("");

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("should return null and report to Sentry for invalid JSON string", () => {
    // Arrange
    const input = "not valid json {{{";

    // Act
    const result = parseEditorJsOutput(input);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(SyntaxError),
      expect.objectContaining({ extra: { value: input } }),
    );
  });

  it("should return null and report to Sentry for valid JSON with wrong shape", () => {
    // Arrange
    const input = JSON.stringify({ foo: "bar" });

    // Act
    const result = parseEditorJsOutput(input);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to parse EditorJS output" }),
      expect.objectContaining({ extra: expect.objectContaining({ value: input }) }),
    );
  });

  it("should return null and report to Sentry when blocks have wrong shape", () => {
    // Arrange
    const input = JSON.stringify({
      blocks: [{ missing: "type and data" }],
    });

    // Act
    const result = parseEditorJsOutput(input);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
