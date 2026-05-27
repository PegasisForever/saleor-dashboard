---
agent: step-7-deep-simplify-order-copy-link-button-pass-2
input_branch: 806c79a3f3a57c14580a6498f31124c185483094
verdict: fail
---

## Summary

The order-copy-link feature correctly reuses `useClipboard`, `ClipboardCopyIcon`, and `url-join`/`orderPath` rather than hand-rolling clipboard or URL primitives. Remaining complexity is concentrated in test and Storybook layers: a 26-line stateful `useClipboard` mock duplicates hook behavior already covered in `useClipboard.test.ts`, three interaction-state stories repeat identical render/play logic, and the container/view split spreads a ~60 LOC feature across four source files when sibling clipboard controls (`TrackingNumberDisplay`) stay monolithic. None of these block merge from a correctness standpoint, but they add maintenance surface disproportionate to the feature size.

## Findings

### F-001 [WARNING] Stateful `useClipboard` mock reimplements the hook

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:13-38`
- Description: The test file inlines a full `useClipboard` state machine (copied flag, 2000 ms timeout, cleanup on unmount) instead of using the simpler stub patterns elsewhere (`OrderCustomer.test.tsx:28-30` returns `[false, mockCopy]`; `CopyableText.test.tsx:16-18` uses `mockReturnValue`). The 2000 ms reset contract is already tested in `src/hooks/useClipboard.test.ts:59-81`.
- Evidence:

```13:38:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
jest.mock("@dashboard/hooks/useClipboard", () => ({
  useClipboard: () => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<null | number>(null);
    // ... clear, copy with setTimeout(..., 2000), useEffect cleanup ...
    return [copied, copy] as const;
  },
}));
```

- Suggested fix: Use a static `[false, mockCopy]` mock for click/disabled tests. For copied-label timing, either test `OrderCopyLinkButtonView` with a `copied` prop (Storybook already does this at `OrderCopyLinkButton.stories.tsx:137-145`) or mock `navigator.clipboard.writeText` and use the real hook like `useClipboard.test.ts`.

### F-002 [WARNING] Hover, Focus, and Active stories are triplicated

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:88-131`
- Description: Three stories differ only by CSS wrapper class (`previewHover`, `previewFocus`, `previewActive`) but share identical render bodies (`OrderCopyLinkButtonView copied={false}`) and identical play assertions (`aria-label` = `"Copy order link"`). The play functions do not validate the simulated interaction state.
- Evidence: Lines 88-100 (Hover), 103-115 (Focus), and 118-130 (Active) are structurally identical aside from `storyStyles.*` class names.
- Suggested fix: Collapse into one `InteractionStates` story that renders three CSS-wrapped instances in a row, or drop redundant play functions and rely on visual-only regression for hover/focus/active chrome.

### F-003 [WARNING] Container/view split adds indirection for a tiny feature

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:11-23`, `OrderCopyLinkButtonView.tsx:13-35`
- Description: The feature is split into a 13-line container and a 23-line view—the only `*View.tsx` under `src/orders/components/`. The nearest clipboard sibling (`TrackingNumberDisplay.tsx:12-66`) combines hook wiring and presentation in one file. Five of six stories bypass the container and render the view directly, so most Storybook coverage never exercises the integration path except `Default`.
- Evidence:

```11:23:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
export const OrderCopyLinkButton = ({ orderId }: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy] = useClipboard();
  const disabled = !orderId;
  const handleCopy = useCallback(() => { /* ... */ }, [copy, disabled, orderId]);
  return <OrderCopyLinkButtonView copied={copied} disabled={disabled} onCopy={handleCopy} />;
};
```

- Suggested fix: Merge into a single component file (matching `TrackingNumberDisplay`), exporting optional `copied`/`disabled` props for Storybook state stories if static presentation testing is still needed.

### F-004 [WARNING] Redundant disabled guard in copy handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:13-18`
- Description: `disabled` is derived from `!orderId`, passed to the view as `disabled={disabled}`, and checked again inside `handleCopy`. A disabled macaw `Button` will not invoke `onClick`, so the handler guard duplicates the view-layer enforcement.
- Evidence:

```13:18:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const disabled = !orderId;

  const handleCopy = useCallback(() => {
    if (disabled) {
      return;
    }
```

- Suggested fix: Remove the `if (disabled) return` guard and simplify the handler to `() => copy(getShareableOrderUrl(orderId))`, or drop the explicit `disabled` prop and rely solely on the handler guard (prefer the former for clarity).

### F-005 [WARNING] `ClipboardCopyIcon` size props added but not wired for TopNav parity

- Location: `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:6-7`, `OrderCopyLinkButtonView.tsx:27`, `OrderDetailsPage.tsx:214`
- Description: Optional `size`/`strokeWidth` props were added to `ClipboardCopyIcon` (default `size = 16`, Lucide default stroke ~2), but `OrderCopyLinkButtonView` does not pass them. The adjacent metadata button in the same TopNav uses `iconSize.medium` (20) and `iconStrokeWidth` (1.5). The props expand the shared icon API without being consumed by the feature that motivated them.
- Evidence:

```27:27:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx
      icon={<ClipboardCopyIcon hasBeenClicked={copied} />}
```

vs.

```214:214:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
                icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
```

- Suggested fix: Pass `size={iconSize.medium} strokeWidth={iconStrokeWidth}` from the view (and update stories decorator), or revert the unused props from `ClipboardCopyIcon` if defaults are intentional.

### F-006 [WARNING] Story auth fixtures duplicate `TopNav.stories`

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:18-44`
- Description: `mockUser` and `mockUserContext` blocks are byte-identical to `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-37`. No shared story fixture helper exists in `testUtils/`.
- Evidence: Both files define the same `UserFragment` stub (`id: "user-1"`, `email: "admin@example.com"`, etc.) and identical `UserContextType` shape with `authenticated: true`.
- Suggested fix: Extract a shared `mockStaffUserContext` story helper (or import from `TopNav.stories` if Storybook conventions allow) to avoid drift when auth types change.
