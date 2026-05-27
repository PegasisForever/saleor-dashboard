---
agent: step-7-deep-simplify-order-copy-link-button-pass-2
input_branch: 1a61e6bb7dfa0fca04c32a4801da8c1d43f0a4d6
verdict: pass
---

## Summary

Simplify-angle pass-2 on the cumulative order-copy-link-button diff (including loop-back fixes: `useClipboard` timer `clear()`, aria-live SR region, placement unit test, Playwright E2E) finds no merge-blocking issues. The production path correctly reuses `useClipboard` and `ClipboardCopyIcon` and matches TopNav secondary-button conventions. Six WARNINGs flag avoidable complexity: unnecessary `useCallback`, dead container `disabled` prop, unused `OrderCopyLinkButtonStoryPreview` props, a non-demonstrating `Error` story, layout margin baked into the leaf component atop TopNav `gap`, and duplicate `formatMessage` for the aria-live span. Story-only scaffolding (preview + CSS module) is justified by the tech plan but heavier than any other clipboard UI in the repo.

## Findings

### F-001 [WARNING] Unnecessary `useCallback` on copy handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-19`
- Description: `handleCopy` is wrapped in `useCallback`, but `copy` from `useClipboard` is recreated on every render (not memoized inside the hook), `OrderCopyLinkButtonContent` is not wrapped in `React.memo`, and every other clipboard button in the repo uses an inline `onClick={() => copy(...)}` handler.
- Evidence:

```17:19:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);
```

Peers: `TrackingNumberDisplay.tsx:57`, `CopyableText.tsx:45`, `PspReference.tsx:105`, `OrderCustomer.tsx:285` — all inline, no `useCallback`.
- Suggested fix: Inline the handler on `OrderCopyLinkButtonContent` (`onCopy={() => copy(url ?? window.location.href)}`) and remove the `useCallback` import.

### F-002 [WARNING] Dead `disabled` prop on container

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:6-14`, `OrderCopyLinkButtonContent.tsx:12`
- Description: The container accepts and forwards `disabled`, but production renders `<OrderCopyLinkButton />` with no props. The `Disabled` story already renders `OrderCopyLinkButtonContent` directly, so the container prop is unused API surface per PRD (“Storybook coverage only; TopNav integration does not pass `disabled`”).
- Evidence: `OrderDetailsPage.tsx:211` — `<OrderCopyLinkButton />`. `OrderCopyLinkButton.stories.tsx:42-44` — `render: () => <OrderCopyLinkButtonContent copied={false} disabled />` bypasses the container.
- Suggested fix: Remove `disabled` from `OrderCopyLinkButtonProps` and keep it only on `OrderCopyLinkButtonContent` for the Storybook `Disabled` story.

### F-003 [WARNING] `OrderCopyLinkButtonStoryPreview` exposes props no story uses

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx:6-9,21-25`
- Description: `copied` and `disabled` are declared on the preview props but Hover/Focus/Active stories only pass `interactionState`; Copied and Disabled stories render `OrderCopyLinkButtonContent` directly instead.
- Evidence:

```30:39:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Hover: Story = {
  render: () => <OrderCopyLinkButtonStoryPreview interactionState="hover" />,
};
// Focus, Active — same pattern
```

```60:62:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Copied: Story = {
  render: () => <OrderCopyLinkButtonContent copied />,
};
```
- Suggested fix: Drop `copied`/`disabled` from `OrderCopyLinkButtonStoryPreviewProps`, or route Copied/Disabled through the preview for one story entry point.

### F-004 [WARNING] `Error` story does not demonstrate error state

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:28,46-58`
- Description: `Error` uses the same live `OrderCopyLinkButton` render path as `Default` (same args, no clipboard mock/rejection). Reviewers must read docs text to learn the story’s intent; it adds maintenance surface without visual or behavioral delta.
- Evidence:

```28:28:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Default: Story = {};
```

```46:58:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Error: Story = {
  args: { url: SAMPLE_ORDER_URL },
  parameters: { docs: { description: { story: 'Clipboard write failure leaves...' } } },
};
```

No `play` function, decorator, or `OrderCopyLinkButtonContent` static render unlike `Copied`/`Disabled`.
- Suggested fix: Render `OrderCopyLinkButtonContent copied={false}` with a docs note (matching `Copied`/`Disabled`), or add a story decorator that mocks `navigator.clipboard.writeText` rejection.

### F-005 [WARNING] `marginRight={3}` baked into presentational component

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:43`
- Description: TopNav already applies `gap={2}` between children (`TopNav/Root.tsx:72`). Copy button hard-codes `marginRight={3}` inside the leaf while the adjacent metadata button sets `marginRight={3}` at the host (`OrderDetailsPage.tsx:218`), duplicating spacing concerns and diverging from `WarehouseDetailsPage` metadata (no `marginRight`).
- Evidence:

```43:43:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
        marginRight={3}
```

```72:72:src/components/AppLayout/TopNav/Root.tsx
          gap={2}
```
- Suggested fix: Remove `marginRight` from `OrderCopyLinkButtonContent` and rely on TopNav `gap`, or apply spacing only at `OrderDetailsPage` integration (same layer as metadata button).

### F-006 [WARNING] Duplicate `formatMessage` for copied label vs aria-live

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:23-25,45-48`
- Description: When `copied` is true, `label` already holds `messages.orderLinkCopied` for `title`/`aria-label`, but the aria-live span calls `formatMessage` again for the same message.
- Evidence:

```23:25:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
```

```46:48:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx
        <span aria-live="polite" className={styles.visuallyHidden}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
```
- Suggested fix: When rendering the live region, reuse `label` (only mount when `copied`, so `label` is already the copied string).

### F-007 [WARNING] Exported story type with no external consumers

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx:4`
- Description: `OrderCopyLinkButtonStoryInteractionState` is exported but only referenced within the same file; no other module imports it (`git grep OrderCopyLinkButtonStoryInteractionState` — matches preview file only).
- Evidence: `export type OrderCopyLinkButtonStoryInteractionState = "hover" | "focus" | "active";` at line 4.
- Suggested fix: Make the type file-private (drop `export`) unless a cross-file consumer is added.

## Files / sections inspected

### Touched / implementation files

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useCallback` + optional `url`/`disabled`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button, aria-live, `marginRight`, label logic.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — hand-rolled `.visuallyHidden` (only clip-pattern usage in `src/`).
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two i18n messages.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only interaction wrapper.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — seven stories, three render paths.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token overrides.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — container tests with mocked hook.
- `src/hooks/useClipboard.ts:12-27` — loop-back `clear()` before reschedule; `copy` still non-memoized.
- `src/hooks/useClipboard.test.ts:133-175` — rapid re-copy timer test.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` (backward-compatible).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — TopNav wire-up, sibling metadata button.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — placement test with heavy mocks.
- `locale/defaultMessages.json` — extracted message hashes.
- `playwright/pages/ordersPage.ts:62-63` — page object selectors.
- `playwright/tests/orders.spec.ts:155-179` — E2E placement + post-click label/icon.
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md`, `docs/DEV-85/ui-design.md` — planned split and story-only preview rationale.

### Call sites of exports (contract check)

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (`<OrderCopyLinkButton />`, no props; uses `window.location.href` fallback). `OrderCopyLinkButton.stories.tsx:16,28,46-48,67` (Storybook). Contract respected.
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21`; `OrderCopyLinkButtonStoryPreview.tsx:32`; `OrderCopyLinkButton.stories.tsx:43,61`. Contract respected; stories omit `onCopy` for static snapshots (intentional).
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only; story-only, no production callers.
- `OrderCopyLinkButtonStoryInteractionState` (type export) — no external callers per `git grep`; used only in `OrderCopyLinkButtonStoryPreview.tsx`.
- `messages` — `OrderCopyLinkButtonContent.tsx:24-25,47` only.
- `ClipboardCopyIcon` (modified) — `OrderCopyLinkButtonContent.tsx:33-37` (passes `size`/`strokeWidth`). `TrackingNumberDisplay.tsx:56` (defaults unchanged). Contract respected.
- `useClipboard` (modified behavior) — all prior consumers unchanged at call signature; timer fix is internal (`grep useClipboard` across `src/`).

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — renders `<OrderCopyLinkButton />` before metadata `Button`; `order` is optional elsewhere in file but copy button does not dereference `order.id` (uses `window.location.href`). Loading/error paths still render TopNav with copy button when page mounts — same as metadata button visibility.

### Sibling / integration reads

- `src/components/CopyableText/CopyableText.tsx` — inline copy handler, static aria-label, no aria-live.
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — nearest peer: `ClipboardCopyIcon` + inline handler.
- `src/orders/components/OrderCustomer/OrderCustomer.tsx:73-98,132-138,285` — local `CopyButton`, three hook instances.
- `src/orders/components/OrderTransaction/.../PspReference.tsx` — hover-reveal + static label.
- `src/components/AppLayout/TopNav/Root.tsx:68-83` — `gap={2}` on children container.
- `src/extensions/.../ManifestErrorMessage/ManifestErrorMessage.tsx:78-86` — persistent `aria-live` on root `Box` (contrast with conditional mount).
- `src/warehouses/components/WarehouseDetailsPage/WarehouseDetailsPage.tsx:99-106` — TopNav metadata without `marginRight`.

### Tests overlapping feature paths

- `OrderCopyLinkButton.test.tsx` — clipboard payload + copied UI + aria-live presence.
- `OrderDetailsPage.test.tsx:91-108` — DOM order copy vs metadata (mocks full page).
- `playwright/tests/orders.spec.ts:155-179` — same DOM order + post-click aria-label/icon (no clipboard content assertion).
- `OrderCopyLinkButton.stories.tsx` `InOrderDetailsTopNav` — visual composition only, no order assertion.
- `useClipboard.test.ts` — timer and rejection (hook-only).
