import * as Sentry from "@sentry/react";
import { z } from "zod";

import { type CataloguePredicateAPI, type OrderPredicateAPI } from "../types";

const decimalFilterInputSchema = z.object({
  eq: z.any().optional(),
  oneOf: z.array(z.any()).optional(),
  range: z
    .object({
      gte: z.any().optional(),
      lte: z.any().optional(),
    })
    .optional(),
});

const discountedObjectPredicateSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    baseSubtotalPrice: decimalFilterInputSchema.optional(),
    baseTotalPrice: decimalFilterInputSchema.optional(),
    AND: z.array(discountedObjectPredicateSchema).optional(),
    OR: z.array(discountedObjectPredicateSchema).optional(),
  }),
);

const orderPredicateSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    OR: z.array(orderPredicateSchema).optional(),
    AND: z.array(orderPredicateSchema).optional(),
    discountedObjectPredicate: discountedObjectPredicateSchema,
  }),
);

const cataloguePredicateSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    OR: z.array(cataloguePredicateSchema).optional(),
    AND: z.array(cataloguePredicateSchema).optional(),
    productPredicate: z.object({ ids: z.array(z.string()) }).optional(),
    categoryPredicate: z.object({ ids: z.array(z.string()) }).optional(),
    collectionPredicate: z.object({ ids: z.array(z.string()) }).optional(),
    variantPredicate: z.object({ ids: z.array(z.string()) }).optional(),
  }),
);

export function parseOrderPredicate(value: unknown): OrderPredicateAPI | null {
  const result = orderPredicateSchema.safeParse(value);

  if (!result.success) {
    Sentry.captureException(new Error("Failed to parse order predicate JSON"), {
      extra: { value, zodError: result.error.format() },
    });

    return null;
  }

  return result.data as OrderPredicateAPI;
}

export function parseCataloguePredicate(value: unknown): CataloguePredicateAPI | null {
  const result = cataloguePredicateSchema.safeParse(value);

  if (!result.success) {
    Sentry.captureException(new Error("Failed to parse catalogue predicate JSON"), {
      extra: { value, zodError: result.error.format() },
    });

    return null;
  }

  return result.data as CataloguePredicateAPI;
}
