---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
verdict: pass
---

## Summary

The order-copy-link feature correctly composes existing primitives (`useClipboard`, `ClipboardCopyIcon`, Macaw `Button`) and the production path is small and readable. From the simplify angle, the main issues are unnecessary ceremony (`useCallback` that does not stabilize), dead props on the production container API, and story-only scaffolding that is heavier and more fragmented than any peer in the repo. None of these block merge; they are localized simplifications worth tracking.

## Findings

### F-001 [WARNING] `useCallback` on copy handler adds complexity without benefit

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-19`
- Description: `handleCopy` is wrapped in `useCallback`, but `copy` from `useClipboard` is recreated on every render (not memoized inside the hook), `OrderCopyLinkButtonContent` is not wrapped in `React.memo`, and every other clipboard button in the repo uses an inline `onClick={() => copy(...)}` handler.
- Evidence:
  ```tsx
  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);
  ```
  Compare `TrackingNumberDisplay.tsx:57` (`onClick={() => copy(trackingNumber)}`) and `CopyableText.tsx:45` (`onClick={() => copy(text)}`). `useClipboard.ts:12-26` defines `copy` as a plain function body, not stabilized.
- Suggested fix: Inline the handler on `OrderCopyLinkButtonContent` (`onCopy={() => copy(url ?? window.location.href)}`) and drop the `useCallback` import.

### F-002 [WARNING] `disabled` on container is unused production surface

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:6-14`, `OrderCopyLinkButtonContent.tsx:16`
- Description: The container accepts and forwards `disabled`, but production renders `<OrderCopyLinkButton />` with no props. The `Disabled` story already renders `OrderCopyLinkButtonContent` directly, so the container prop is dead API surface.
- Evidence: `OrderDetailsPage.tsx:211` — `<OrderCopyLinkButton />` (no `disabled`). `OrderCopyLinkButton.stories.tsx:42-44` — `render: () => <OrderCopyLinkButtonContent copied={false} disabled />` bypasses the container entirely.
- Suggested fix: Remove `disabled` from `OrderCopyLinkButtonProps` and keep it only on `OrderCopyLinkButtonContent` for the Storybook `Disabled` story.

### F-003 [WARNING] `OrderCopyLinkButtonStoryPreview` exposes props no story uses

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx:6-9,21-25`
- Description: The preview wrapper accepts optional `copied` and `disabled`, but Hover/Focus/Active stories only pass `interactionState`. Those props always fall back to defaults, widening the API without call-site need.
- Evidence: `OrderCopyLinkButton.stories.tsx:30-39` — all three interaction stories call `<OrderCopyLinkButtonStoryPreview interactionState="…" />` with no `copied` or `disabled`. Copied/Disabled states use `OrderCopyLinkButtonContent` directly instead.
- Suggested fix: Drop `copied` and `disabled` from `OrderCopyLinkButtonStoryPreviewProps`, or collapse the three one-line interaction stories into a single parameterized story if the preview wrapper is kept.

### F-004 [WARNING] `Error` story is visually identical to `Default`

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:28,46-58`
- Description: The `Error` story uses the same live `OrderCopyLinkButton` render path as `Default` (meta default args). It differs only by a docs description explaining that clipboard failure looks like Default — there is no mock, play function, or presentational override. The name implies a distinct catalog entry reviewers expect to see.
- Evidence:
  ```tsx
  export const Default: Story = {};
  export const Error: Story = {
    args: { url: SAMPLE_ORDER_URL },
    parameters: { docs: { description: { story: 'Clipboard write failure leaves…' } } },
  };
  ```
- Suggested fix: Remove the `Error` story and document failure behavior in component/story docs only, or render `OrderCopyLinkButtonContent copied={false}` with a docs note (matching how `Copied`/`Disabled` bypass the container).

### F-005 [WARNING] TopNav spacing baked into presentational component

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:40`
- Description: `marginRight={3}` is hard-coded on the copy button. Spacing between TopNav actions is a layout concern; the adjacent metadata button carries its own `marginRight={3}` inline in `OrderDetailsPage`, while warehouse metadata omits it. Embedding margin in the leaf component makes reuse outside this TopNav slot awkward.
- Evidence: `OrderCopyLinkButtonContent.tsx:40` — `marginRight={3}`. `OrderDetailsPage.tsx:218` — metadata `Button` also has `marginRight={3}`. `WarehouseDetailsPage.tsx:100-106` — metadata button has no `marginRight`.
- Suggested fix: Move `marginRight={3}` to the TopNav integration site (`OrderDetailsPage`) or accept it as a prop with default `3` only at the call site.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — thin container; `useCallback` + optional `url`/`disabled` props.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational Macaw button; label swap on `copied`.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two i18n strings per PRD.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only pseudo-state wrapper.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token overrides targeting `data-test-id="copy-order-link"`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — eight stories mixing container/content/preview render paths.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — mocks `useClipboard`; four container-level tests.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-218` — TopNav host; renders copy button before metadata.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth`; defaults preserve existing consumer.
- `locale/defaultMessages.json` — `bqtu1/` and `FzcMi0` message entries added.
- `docs/DEV-85/prd.md`, `docs/DEV-85/tech-plan.md` — intended complexity (container/content split, story preview layer).

### Call sites of new/changed exports

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (no props; uses `window.location.href` fallback — contract respected). `OrderCopyLinkButton.stories.tsx:67` (`url={SAMPLE_ORDER_URL}` for composition story — contract respected). `OrderCopyLinkButton.test.tsx:22,45,65,83` (test harness — contract respected).
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21` (passes `copied`, `disabled`, `onCopy={handleCopy}` — contract respected). `OrderCopyLinkButton.stories.tsx:43,61` (static state stories, no `onCopy` — intentional non-interactive snapshots). `OrderCopyLinkButtonStoryPreview.tsx:32` (no `onCopy` — intentional).
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only (interaction-state snapshots — contract respected; unused props noted in F-003).
- `OrderCopyLinkButtonStoryInteractionState` (type export) — no external importers per `rg OrderCopyLinkButtonStoryInteractionState` (type used only inside preview file).
- `messages` — consumed only in `OrderCopyLinkButtonContent.tsx:22-23`.
- `ClipboardCopyIcon` (modified export) — `OrderCopyLinkButtonContent.tsx:30-34` (passes medium sizing — contract respected). `TrackingNumberDisplay.tsx:56` (unchanged `<ClipboardCopyIcon hasBeenClicked={copied} />` — defaults preserve prior behavior).

### Parent / host components

- `OrderDetailsPage.tsx:210-218` — renders `<OrderCopyLinkButton />` inside `TopNav` immediately before metadata button; no props passed; order object optional elsewhere in file but not dereferenced for copy button — wire-up correct.

### Integration dependencies read

- `src/hooks/useClipboard.ts` — clipboard write + 2s reset; caller assumes sync invocation, async side effect; failure logs warning only — matches PRD.
- `src/components/icons/index.ts` (via imports) — `iconSize.medium` / `iconStrokeWidth` align with adjacent metadata button.

### Sibling / peer patterns compared

- `src/components/CopyableText/CopyableText.tsx` — nearest shared clipboard+button pattern; hover-reveal tertiary button, inline Lucide icons, static labels.
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — nearest orders-domain peer; same `useClipboard` + `ClipboardCopyIcon`, inline handler.
- `src/orders/components/OrderTransaction/.../PspReference.tsx` — inline icon toggle, static `buttonMessages.copyToClipboard`.
- `src/warehouses/components/WarehouseDetailsPage/WarehouseDetailsPage.tsx:99-106` — TopNav metadata secondary icon button without extracted component.

### Tests overlapping this code path

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — container tests only; no `OrderCopyLinkButtonContent` unit file.
- `src/components/CopyableText/CopyableText.test.tsx` — parallel mock-`useClipboard` recipe (not broken by this diff).
- `src/hooks/useClipboard.test.ts` — hook-level failure/timer coverage (delegated from component tests by design).
