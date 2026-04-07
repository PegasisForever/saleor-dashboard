import * as Sentry from "@sentry/react";

import { type CataloguePredicateAPI, type OrderPredicateAPI } from "../types";
import { parseCataloguePredicate, parseOrderPredicate } from "./predicateSchemas";

jest.mock("@sentry/react", () => ({
  captureException: jest.fn(),
}));

describe("parseOrderPredicate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should parse valid order predicate", () => {
    // Arrange
    const input: OrderPredicateAPI = {
      discountedObjectPredicate: {
        baseSubtotalPrice: { range: { gte: "10", lte: "100" } },
      },
    };

    // Act
    const result = parseOrderPredicate(input);

    // Assert
    expect(result).toEqual(input);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("should parse order predicate with nested OR/AND", () => {
    // Arrange
    const input: OrderPredicateAPI = {
      OR: [
        {
          discountedObjectPredicate: {
            baseTotalPrice: { eq: "50" },
          },
        },
      ],
      discountedObjectPredicate: {
        baseSubtotalPrice: { range: { gte: "10" } },
      },
    };

    // Act
    const result = parseOrderPredicate(input);

    // Assert
    expect(result).toEqual(input);
  });

  it("should return null and report to Sentry for invalid data", () => {
    // Arrange
    const input = { invalid: "data" };

    // Act
    const result = parseOrderPredicate(input);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to parse order predicate JSON" }),
      expect.objectContaining({ extra: expect.objectContaining({ value: input }) }),
    );
  });

  it("should return null and report to Sentry for null input", () => {
    // Act
    const result = parseOrderPredicate(null);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe("parseCataloguePredicate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should parse valid catalogue predicate with product ids", () => {
    // Arrange
    const input: CataloguePredicateAPI = {
      productPredicate: { ids: ["p1", "p2"] },
    };

    // Act
    const result = parseCataloguePredicate(input);

    // Assert
    expect(result).toEqual(input);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("should parse catalogue predicate with multiple predicate types", () => {
    // Arrange
    const input: CataloguePredicateAPI = {
      productPredicate: { ids: ["p1"] },
      categoryPredicate: { ids: ["c1"] },
      collectionPredicate: { ids: ["col1"] },
      variantPredicate: { ids: ["v1"] },
    };

    // Act
    const result = parseCataloguePredicate(input);

    // Assert
    expect(result).toEqual(input);
  });

  it("should parse catalogue predicate with nested OR", () => {
    // Arrange
    const input: CataloguePredicateAPI = {
      OR: [{ productPredicate: { ids: ["p1"] } }, { categoryPredicate: { ids: ["c1"] } }],
    };

    // Act
    const result = parseCataloguePredicate(input);

    // Assert
    expect(result).toEqual(input);
  });

  it("should return null and report to Sentry for invalid data", () => {
    // Arrange
    const input = "not an object";

    // Act
    const result = parseCataloguePredicate(input);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to parse catalogue predicate JSON" }),
      expect.objectContaining({ extra: expect.objectContaining({ value: input }) }),
    );
  });

  it("should return null and report to Sentry when ids are not strings", () => {
    // Arrange
    const input = { productPredicate: { ids: [123, 456] } };

    // Act
    const result = parseCataloguePredicate(input);

    // Assert
    expect(result).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
