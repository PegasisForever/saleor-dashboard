---
agent: step-7-deep-simplify-order-copy-link-pass-1
input_branch: 8428347a1c77b9fc3d4b8c33a5da12a724556a8d
verdict: fail
---

## Summary

The order-copy-link implementation is lean overall — it correctly reuses `useClipboard`, `ClipboardCopyIcon`, `urlJoin`, and domain URL helpers rather than introducing new primitives. Three simplification gaps remain: a redundant null guard in the copy handler, an unused error-message cluster wired only in Storybook, and repetitive Storybook story boilerplate that meta-level decorators could collapse.

## Findings

### F-001 [WARNING] Redundant `orderId` guard in copy handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:23-26` vs `:31-33`
- Description: `handleCopy` early-returns when `!orderId`, but the component already returns `null` at lines 31-33 for the same condition. The button never mounts without a truthy `orderId`, so the handler guard is unreachable dead code.
- Evidence:

```tsx
const handleCopy = useCallback(() => {
  if (!orderId) {
    return;
  }
  copy(getOrderAbsoluteUrl(orderId));
}, [copy, orderId]);

if (!orderId) {
  return null;
}
```

- Suggested fix: Remove the `if (!orderId)` block from `handleCopy`. TypeScript already narrows `orderId` to `string` after the render guard, so the callback can call `copy(getOrderAbsoluteUrl(orderId))` directly (or inline the handler without `useCallback` if preferred).

### F-002 [WARNING] Unused error-message cluster adds dead production surface

- Location: `src/orders/components/OrderCopyLinkButton/messages.ts:9-13`; `OrderCopyLinkButton.stories.tsx:81-90`; `locale/defaultMessages.json` (`Hztpse`)
- Description: `copyOrderLinkFailed` is defined, extracted to locale, and rendered only in the Storybook `Error` story. Production `OrderCopyLinkButton.tsx` never references it, and `useClipboard` (`src/hooks/useClipboard.ts:23-25`) swallows clipboard failures with a console warning only. This leaves an orphaned i18n string and story-only failure UI that readers may assume is wired up.
- Evidence: Grep for `copyOrderLinkFailed` hits only `messages.ts`, `OrderCopyLinkButton.stories.tsx`, and `locale/defaultMessages.json` — not the component under test.
- Suggested fix: Either defer the message/locale entry and Error story until failure handling ships, or wire `useClipboard` failure state into the component now. Keeping scaffold-only artifacts adds maintenance surface without simplifying the shipped feature.

### F-003 [WARNING] Repetitive Storybook story boilerplate

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:25-107`
- Description: Eight stories each define a custom `render` that wraps `<OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />` in `<StoryWrapper>`, duplicating the same padding wrapper and order-id arg despite `meta.args.orderId` already being set. Hover/Focus/Active/Loading differ only by a wrapper `className`.
- Evidence: `Default`, `Disabled`, and six other stories repeat `<StoryWrapper>…<OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />…</StoryWrapper>` with only the inner wrapper div changing.
- Suggested fix: Add a `decorators: [(Story) => <StoryWrapper><Story /></StoryWrapper>]` on `meta`, rely on `args.orderId`, and use a small helper like `withStoryClass(className)` for pseudo-state stories. Cuts ~40 lines and keeps state stories focused on the one differing class.
