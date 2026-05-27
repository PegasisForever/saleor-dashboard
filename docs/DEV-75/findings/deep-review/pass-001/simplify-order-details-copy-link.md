---
agent: step-7-deep-simplify-order-details-copy-link-pass-1
input_branch: e4ebc9531190c0993a632681a64d25ca24dc19db
verdict: pass
---

## Summary

The order-details copy-link implementation is a small, well-factored feature (~215 LOC across 7 source files) that correctly reuses `useClipboard`, `ClipboardCopyIcon`, `orderPath`, `urlJoin`, and `getAppMountUriForRedirect`. No hand-rolled clipboard or URL utilities duplicate existing repo abstractions. Two WARNING-level simplification opportunities remain: Storybook-only `previewState` coupling in the production component API, and low-value duplicate story `play` assertions that do not exercise state-specific visuals.

## Findings

### F-001 [WARNING] Storybook `previewState` expands the production component contract

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` (lines 12–18, 29, 39–43), `OrderCopyLinkButton.module.css` (lines 2–17), `OrderCopyLinkButton.stories.tsx`
- Description: The shipped component exports `OrderCopyLinkButtonPreviewState`, accepts an optional `previewState` prop, merges it into runtime `copied` state, and applies `.buttonPreviewHover` / `.buttonPreviewFocus` / `.buttonPreviewActive` classes—all exclusively for static Storybook canvases. `OrderDetailsPage` never passes `previewState`, but the prop, exported type, conditional logic, and preview CSS classes remain in the production bundle and public API surface.
- Evidence:

```12:43:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
export type OrderCopyLinkButtonPreviewState = "hover" | "focus" | "active" | "copied";
// ...
  previewState?: OrderCopyLinkButtonPreviewState;
// ...
  const copied = previewState === "copied" || copiedFromClipboard;
// ...
  const buttonClassName = clsx(
    styles.button,
    previewState === "hover" && styles.buttonPreviewHover,
    previewState === "focus" && styles.buttonPreviewFocus,
    previewState === "active" && styles.buttonPreviewActive,
  );
```

  `ui-design.md` documents this as an intentional tradeoff (“production CSS mirror classes — not story-isolated CSS”), but the same visual coverage could be achieved with a Storybook-only wrapper that applies classes and forces copied UI without extending the production props interface.
- Suggested fix: Extract a `OrderCopyLinkButtonStoryPreview` (or Storybook decorator) that wraps the production component, applies preview CSS classes externally, and mocks copied state for the `Copied` story. Keep `:focus-visible` / `:active` styles in the production CSS module; remove `previewState`, the exported preview type, and preview-only clsx branches from the shipped component.

### F-002 [WARNING] Hover/Focus/Active story `play` functions add noise without guarding state visuals

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` (lines 59–83)
- Description: The `Hover` and `Focus` stories run identical `play` blocks that only assert `title="Copy order link"`—the same default label the `Default` story already shows. The `Active` story only asserts `toBeVisible()`, which also passes on `Default`. These play functions add maintenance surface without verifying hover elevation, focus ring, or active scale—the visual differences the stories exist to demonstrate.
- Evidence:

```59:83:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Hover: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} previewState="hover" />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const button = getButton(canvasElement);
    await expect(button).toHaveAttribute("title", "Copy order link");
  },
};
// Focus story: identical title assertion
// Active story: only toBeVisible()
```

- Suggested fix: Drop the redundant `play` functions for visual-only state stories (static canvas differentiation is sufficient per ui-design), or assert state-specific signals (e.g. presence of preview CSS class, computed `box-shadow` / `transform`) if automated regression coverage is desired.
