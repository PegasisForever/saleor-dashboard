---
agent: step-7-deep-simplify-order-copy-link-button-pass-3
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
verdict: pass
---

## Summary

Pass-3 simplify review on the cumulative order-copy-link-button diff (including iter-6 `copyGeneration` / `clear()` / E2E). Production wiring correctly composes shared `useClipboard` and `ClipboardCopyIcon`; the container/content split is PRD-mandated. Remaining issues are non-blocking simplification debt: unnecessary `useCallback`, dead container props, shared-hook API expansion for a single SR remount consumer, duplicate i18n formatting, fragmented Storybook surface, and layout margin duplicated with TopNav `gap`. No BLOCKERs.

## Findings

### F-001 [WARNING] `useCallback` does not stabilize the copy handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-19`
- Description: `handleCopy` is wrapped in `useCallback`, but `copy` from `useClipboard` is recreated on every hook render (not memoized). `OrderCopyLinkButtonContent` is not memoized, so the callback is recreated every render anyway. Sibling clipboard UIs use inline `onClick={() => copy(...)}`.
- Evidence:

```17:19:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);
```

Peers: `TrackingNumberDisplay.tsx:57`, `CopyableText.tsx:45`, `PspReference.tsx:105`.

- Suggested fix: Inline `onCopy={() => copy(url ?? window.location.href)}` and remove the `useCallback` import.

### F-002 [WARNING] Container `disabled` prop is unused in production

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:6-14,25`; `OrderDetailsPage.tsx:211`
- Description: PRD states production TopNav does not pass `disabled`; the only production call site is `<OrderCopyLinkButton />` with no props. The `Disabled` story renders `OrderCopyLinkButtonContent` directly, so the container `disabled` forward is dead API surface.
- Evidence:

```211:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
              <OrderCopyLinkButton />
```

```42:44:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Disabled: Story = {
  render: () => <OrderCopyLinkButtonContent copied={false} disabled />,
};
```

- Suggested fix: Drop `disabled` from `OrderCopyLinkButtonProps`; keep it only on `OrderCopyLinkButtonContent` for Storybook.

### F-003 [WARNING] `copyGeneration` expands shared `useClipboard` for one consumer

- Location: `src/hooks/useClipboard.ts:3-5,19,34`; `OrderCopyLinkButton.tsx:15,24`; `OrderCopyLinkButtonContent.tsx:48`
- Description: Iter-6 correctly fixes SR re-announce on rapid re-copy, but the fix pushes a third tuple element and `copyGeneration` state into the shared hook. Five other production consumers still destructure `[copied, copy]` only; mocks across the repo now return a 3-tuple. A feature-local counter incremented in the container (on successful copy via a callback or thin wrapper) would keep `useClipboard` at two return values.
- Evidence:

```15:15:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const [copied, copy, copyGeneration] = useClipboard();
```

`grep useClipboard` in `src/`: only `OrderCopyLinkButton.tsx` reads element `[2]`.

- Suggested fix: Consider moving generation/remount key to the feature layer (e.g. local `useState` bumped when `copied` transitions or via a narrow `useClipboardWithGeneration` wrapper) so the shared hook contract stays `[boolean, fn]`.

### F-004 [WARNING] Duplicate `formatMessage` when `copied` is true

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:25-27,49`
- Description: When `copied` is true, `label` already holds `messages.orderLinkCopied`, but the aria-live span formats the same message again.
- Evidence:

```25:27:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
```

```47:50:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
      {copied ? (
        <span key={copyGeneration} aria-live="polite" className={styles.visuallyHidden}>
          {intl.formatMessage(messages.orderLinkCopied)}
```

- Suggested fix: Render `{label}` inside the live region when `copied` (or derive a single `copiedLabel` once).

### F-005 [WARNING] `OrderCopyLinkButtonStoryPreview` exposes unused props and an exported type with no external consumers

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx:4-9,21-25`; `OrderCopyLinkButton.stories.tsx:30-39`
- Description: `copied` and `disabled` on the preview interface are never passed by Hover/Focus/Active stories (defaults always apply). `OrderCopyLinkButtonStoryInteractionState` is exported but only referenced inside the same file.
- Evidence: Hover story at `stories.tsx:31` passes only `interactionState="hover"`. `grep OrderCopyLinkButtonStoryInteractionState` → only `OrderCopyLinkButtonStoryPreview.tsx`.

- Suggested fix: Remove unused props from the preview interface (or route Disabled/Copied through the preview); make the interaction-state type file-private.

### F-006 [WARNING] `Error` story is visually identical to `Default`

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:28,46-58`
- Description: `Error` uses the same meta default render (`OrderCopyLinkButton` with `url` args) as `Default`; failure is documented only in `parameters.docs.description`. UI design lists an `error` state, but the story does not demonstrate it—adding cognitive load without a distinct snapshot.
- Evidence:

```28:28:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Default: Story = {};
```

```46:58:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Error: Story = {
  args: {
    url: SAMPLE_ORDER_URL,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clipboard write failure leaves the button visually identical to Default ...',
```

- Suggested fix: Collapse into docs on `Default`, or render static `OrderCopyLinkButtonContent copied={false}` with a docs-only note (matching `Copied`/`Disabled` pattern).

### F-007 [WARNING] `marginRight={3}` on copy button duplicates TopNav flex `gap`

- Location: `OrderCopyLinkButtonContent.tsx:45`; `TopNav/Root.tsx:68-72`; `OrderDetailsPage.tsx:218`
- Description: TopNav children wrapper already applies `gap={2}`. Copy button hard-codes `marginRight={3}`; metadata button repeats `marginRight={3}` at the host. Warehouse metadata button omits per-button margin—spacing is inconsistent and harder to reason about at the layout host.
- Evidence:

```45:45:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
        marginRight={3}
```

```68:72:src/components/AppLayout/TopNav/Root.tsx
        <Box
          display="flex"
          flexWrap="nowrap"
          height="100%"
          gap={2}
```

- Suggested fix: Remove `marginRight` from `OrderCopyLinkButtonContent` and rely on TopNav `gap`, or hoist spacing to `OrderDetailsPage` next to both TopNav icon buttons.

## Files / sections inspected

### Touched files (coordinator pass-3 list)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useCallback`, optional `url`/`disabled`, threads `copyGeneration`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button, aria-live, `marginRight`, duplicate formatMessage.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two intl messages; no duplication issue.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — three render paths (container / preview / content); `Error` ≡ `Default`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only pseudo-state tokens; justified per ui-design.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story wrapper; unused props.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — sole `visuallyHidden` in `src/`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — mocks hook; remount test uses Content directly.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — host; `<OrderCopyLinkButton />` no props; order required by Form render (not optional at this line).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — DOM order assertion; mocks 3-tuple.
- `src/hooks/useClipboard.ts` — `clear()` + `copyGeneration`; 3-tuple return.
- `src/hooks/useClipboard.test.ts` — timer orphan + generation tests.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth`; contract OK.
- `src/components/CopyableText/CopyableText.test.tsx` — mock tuple updated to 3 elements.
- `playwright/tests/orders.spec.ts:155-190` — placement, clipboard payload, 2s revert.
- `playwright/pages/ordersPage.ts:62` — page object selectors.
- `locale/defaultMessages.json` — extracted message entries.

### Call sites per export

- **`OrderCopyLinkButton`** — `OrderDetailsPage.tsx:38,211` (production, no props); `OrderCopyLinkButton.test.tsx` (4 renders); `OrderCopyLinkButton.stories.tsx:8,16,67` (meta + InOrderDetailsTopNav). Contract respected at production site.
- **`OrderCopyLinkButtonContent`** — `OrderCopyLinkButton.tsx:22`; `OrderCopyLinkButtonStoryPreview.tsx:32`; stories Disabled/Copied; test remount at `:106,117`. Story/test call sites pass expected props; production path always receives `onCopy` from container.
- **`OrderCopyLinkButtonStoryPreview`** — `OrderCopyLinkButton.stories.tsx:10,31,35,39` only. No production callers.
- **`OrderCopyLinkButtonStoryInteractionState`** (type export) — same file only; no external callers.
- **`messages`** — `OrderCopyLinkButtonContent.tsx:7,26-27,49` only.
- **`useClipboard` (modified)** — 2-tuple: `PspReference.tsx:19`, `TrackingNumberDisplay.tsx:16`, `CopyableText.tsx:14`, `OrderCustomer.tsx:132-134`, `GiftCardCreateDialogCodeContent.tsx:21`, `ChannelForm.tsx:95`. 3-tuple: `OrderCopyLinkButton.tsx:15` only. 2-tuple destructuring remains valid.
- **`ClipboardCopyIcon` (modified)** — `OrderCopyLinkButtonContent.tsx:35-38` (with size/stroke); `TrackingNumberDisplay.tsx:56` (defaults). No contract break.

### Parents / hosts

- **`OrderDetailsPage.tsx:210-219`** — Renders `<OrderCopyLinkButton />` immediately before metadata `Button`; `order` is in scope from page props (required for page render). No `orderId` prop on copy button; uses `window.location.href` per PRD. Wire-up matches AC1 placement.

### Integration / siblings

- **`useClipboard.ts`** — sync fire-and-forget `writeText`; 2s timer; `clear()` before reschedule. Assumptions match caller (no await, failure → console.warn).
- **`TopNav/Root.tsx:68-72`** — flex `gap={2}` vs per-button `marginRight={3}`.
- **`TrackingNumberDisplay.tsx`**, **`CopyableText.tsx`** — simpler single-file clipboard pattern for comparison.
- **`useClipboardCopy.ts`** (extensions) — different notifier contract; not applicable.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx`, `useClipboard.test.ts`, `OrderDetailsPage.test.tsx`, `CopyableText.test.tsx`, `orders.spec.ts` — placement triplicated (unit + E2E); generation remount tested on Content without full container integration.
