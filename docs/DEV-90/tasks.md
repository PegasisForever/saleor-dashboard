## T-691827db: Add remount guard test for order-navigation copy-state reset

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-002 [FIX] desktop-ux/F-001, deep-review pass-002 [FIX] correctness/F-001
- Supersedes: —

### Context

**desktop-ux/F-001** — Production wire-up remounts `OrderCopyLinkButton` when `order.id` changes so stale checkmark/label state cannot carry across orders, but no unit or integration test exercises an `orderId` prop change or parent key remount.

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`
- Trigger: Staff copies the link on order A (check icon + "Order link copied" label visible), then navigates to order B within the ~2 s feedback window via in-app order link or browser history (~200–500 ms navigation latency). Order B's TopNav should show default copy affordance, not order A's copied state.
- Impact: A regression removing `key={order.id}` would ship without CI signal; users could briefly see the wrong order's "copied" confirmation on a different order's header.
- Evidence: Parent passes `key={order.id}` at `OrderDetailsPage.tsx:211`. Grep shows no test references `key={order.id}` or remount-on-id-change. Shallow review iter-3 noted the same gap.
- Suggested fix: Add a test rendering `OrderCopyLinkButton` with `useClipboard` mocked to `[true, jest.fn()]`, then `rerender` with a new `key`/`orderId` and assert `aria-label` returns to "Copy order link" and check icon state resets.

**correctness/F-001** — T-473f727d added `key={order.id}` so navigating between orders remounts `OrderCopyLinkButton` and clears stale `useClipboard` copied feedback. The fix is correct in production code but has zero automated coverage — removing the `key` while keeping `orderId={order.id}` would not fail CI.

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`; test gap across `src/orders/components/OrderCopyLinkButton/`
- Trigger: Staff user copies order A's link (check icon + "Order link copied" appear). Within ~2000 ms, navigates to order B via order list click, browser back/forward, or in-app link. Developer later refactors TopNav and drops the `key` prop.
- Impact: User sees "Order link copied" checkmark on order B's TopNav and may believe B's URL is in the clipboard when only A's URL was copied.
- Evidence:

```211:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
```

Grep for `key={order.id}` / navigation reset in `**/*.{test,spec}*` → 0 matches. Shallow review iter-3 F-002 documents the same gap. Component tests render `OrderCopyLinkButton` in isolation without key-based remount (`OrderCopyLinkButton.test.tsx:57-60`).

- Suggested fix: Add a test that renders `<OrderCopyLinkButton key="order-a" … />`, simulates copied state, rerenders with `key="order-b"`, and asserts default copy icon/label (or add a focused Playwright step on order-details navigation).

Production integration (T-473f727d fix already landed):

```210:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
```

PRD requires the button to show default copy affordance on each order — navigation must not inherit prior copy state.

[Source: docs/DEV-90/findings/deep-review/pass-002/desktop-ux-order-copy-link-button.md#F-001]
[Source: docs/DEV-90/findings/deep-review/pass-002/correctness-order-copy-link-button.md#F-001]
[Source: docs/DEV-90/prd.md#Acceptance criteria]

### Acceptance

- [ ] `OrderCopyLinkButton.test.tsx` includes a test that renders the button with `useClipboard` mocked to `[true, jest.fn()]` and a first `key`/`orderId`, then `rerender`s with a different `key` and `orderId`, and asserts the button's `aria-label` (and `title`) return to "Copy order link"
- [ ] The same test (or companion assertion) verifies copied feedback does not persist after remount — e.g. `getByRole("status")` is absent or button accessible name is no longer "Order link copied"
- [ ] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` passes
- [ ] `pnpm run lint` passes on touched files

## T-339596b4: Assert copied-state aria-label and title on copy button

- Status: pending
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-002 [FIX] desktop-ux/F-002
- Supersedes: —

### Context

**desktop-ux/F-002** — PRD AC3 requires `aria-label` and `title` to update to "Order link copied" after success. The copied-state test asserts only the `role="status"` region text, not the button's accessible name attributes that keyboard and screen-reader users rely on when focus remains on the button.

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:70-86`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-40,56-57`
- Trigger: User activates copy with Enter while focus is on `[data-test-id="copy-order-link"]`; clipboard write succeeds within ~10 ms. Inspect button `aria-label`/`title` in the DOM.
- Impact: A regression that updates only the icon or live region but not `aria-label`/`title` would pass CI while violating PRD AC3 for assistive-tech users focused on the control.
- Evidence: Label swap is implemented at `OrderCopyLinkButton.tsx:38-40,56-57`. Test at `:70-86` checks `getByRole("status")` text only. Storybook `Copied` story shows button name "Order link copied" in the a11y tree (verified in chrome walkthrough).
- Suggested fix: In the existing copied-state test, add `expect(screen.getByTestId("copy-order-link")).toHaveAttribute("aria-label", "Order link copied")` and matching `title` assertion.

Label derivation and button attributes (runtime already correct):

```38:40:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const label = isCopied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
```

```56:57:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
        title={label}
        aria-label={label}
```

PRD AC3:

> After a successful copy, the button icon switches from copy to check (`ClipboardCopyIcon`) for ~2 seconds and `aria-label` / `title` update to the `orderCopyLinkButtonMessages.orderLinkCopied` string ("Order link copied")

UI design screen-reader flow:

> Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button" (label persists while check icon visible)

Existing copied-state test gap:

```70:86:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
  it("renders an aria-live status region when copied", () => {
    // Arrange
    mockUseClipboard.mockReturnValue([true, jest.fn()]);

    // Act
    render(
      <Wrapper>
        <OrderCopyLinkButton orderId="T3JkZXI6MQ==" />
      </Wrapper>,
    );

    // Assert
    const statusRegion = screen.getByRole("status");

    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveTextContent("Order link copied");
  });
```

[Source: docs/DEV-90/findings/deep-review/pass-002/desktop-ux-order-copy-link-button.md#F-002]
[Source: docs/DEV-90/prd.md#Acceptance criteria]
[Source: docs/DEV-90/ui-design.md#Accessibility]

### Acceptance

- [ ] The copied-state test in `OrderCopyLinkButton.test.tsx` (mock `useClipboard` → `[true, jest.fn()]`) asserts `screen.getByTestId("copy-order-link")` has `aria-label="Order link copied"` and `title="Order link copied"`
- [ ] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` passes
- [ ] `pnpm run lint` passes on touched files

## T-fe1adbc0: Clear useClipboard timer before scheduling reset on re-click

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 [FIX] desktop-ux/F-002, deep-review pass-001 [FIX] correctness/F-003
- Supersedes: —

### Context

**desktop-ux/F-002** — `copy()` schedules a new 2s reset timeout without clearing a prior pending timeout. A second click before the first timeout fires leaves two timers running; when the earlier timer fires, it clears the later timer and sets `copied` false prematurely.

- Location: `src/hooks/useClipboard.ts:12-21`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:32-34`
- Trigger: User clicks copy-link on order details; within ~500–1500 ms (before the first 2s window elapses), clicks copy-link again (double-click or confirm-the-copy gesture).
- Impact: Check icon and "Order link copied" label revert to the default copy state hundreds of milliseconds early (~500 ms early if second click at t=1500 ms). Clipboard still holds the latest URL, but visual/a11y confirmation disappears while the user still expects ~2s feedback.
- Evidence: `copy()` overwrites `timeout.current` without calling `clear()` first (`useClipboard.ts:18-21`).
- Suggested fix: Call `clear()` at the start of `copy()` before scheduling a new timeout in `useClipboard.ts` (benefits all consumers), or debounce/disable the button while `copied` is true in `OrderCopyLinkButton`.

**correctness/F-003** — `copy()` schedules a 2s reset timer on each success but does not clear a prior timer before scheduling the next. A second click ~500ms after the first leaves the first timer armed; when it fires it clears the second timer and sets `copied` false early (~1.5s after the second click, not ~2s).

- Location: `src/hooks/useClipboard.ts` (consumed by `OrderCopyLinkButton.tsx:30-34`)
- Trigger: User clicks the copy button, then clicks again within ~300–800ms to confirm the copy (common double-click or "did it work?" tap).
- Impact: Check icon and "Order link copied" label revert to copy/default sooner than ~2 seconds after the **last** click.
- Evidence:

```12:21:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus(true);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
```

- Suggested fix: At the start of `copy()`, call `clear()` before `setTimeout`, or reset the timer on each success so feedback always lasts 2s from the latest click.

Existing hook implementation for reference:

```12:26:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus(true);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
      })
      .catch(() => {
        console.warn("Failed to use clipboard, ensure browser permission is enabled.");
      });
  };
```

[Source: docs/DEV-90/findings/deep-review/pass-001/desktop-ux-order-copy-link-button.md#F-002]
[Source: docs/DEV-90/findings/deep-review/pass-001/correctness-order-copy-link-button.md#F-003]

### Acceptance

- [ ] `copy()` in `src/hooks/useClipboard.ts` calls `clear()` before scheduling a new 2s reset timeout on each successful write
- [ ] `src/hooks/useClipboard.test.ts` includes a test that advances fake timers after two rapid `copy()` calls and asserts `copied` remains `true` for a full 2s from the **second** click (not shortened by the first timer)
- [ ] `pnpm run test:quiet src/hooks/useClipboard.test.ts` passes
- [ ] `pnpm run lint` passes on touched files

## T-473f727d: Reset copied feedback when navigating between orders

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 [FIX] desktop-ux/F-001
- Supersedes: —

### Context

**desktop-ux/F-001** — `OrderCopyLinkButton` holds `useClipboard` state locally and is mounted without a `key` on `order.id`. When the user navigates from order A to order B within the 2s feedback window, the same component instance keeps `copied=true` and shows the check icon plus "Order link copied" label on order B's page even though the user never copied B's link.

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-36`
- Trigger: On order details for order A, click copy-link (success feedback appears). Within ~2000 ms, navigate to another order (browser back/forward, order list click, or in-app link) so order B's details render.
- Impact: User sees "Order link copied" checkmark on order B's TopNav and may believe B's link is already in the clipboard when only A's URL was copied.
- Evidence: Parent renders `{order?.id ? <OrderCopyLinkButton orderId={order.id} /> : null}` with no `key` (`OrderDetailsPage.tsx:211`). Codebase precedent: `CustomerOrders.tsx:101` uses `key={order ? order.id : "skeleton"}`.
- Suggested fix: Add `key={order.id}` on `OrderCopyLinkButton` in `OrderDetailsPage.tsx`, or reset clipboard state in `OrderCopyLinkButton` via `useEffect` when `orderId` changes.

Current integration:

```210:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              {order?.id ? <OrderCopyLinkButton orderId={order.id} /> : null}
```

PRD states the button is omitted when `order.id` is missing; navigation between orders with ids must not inherit prior copy state.

[Source: docs/DEV-90/findings/deep-review/pass-001/desktop-ux-order-copy-link-button.md#F-001]
[Source: docs/DEV-90/prd.md#Acceptance criteria]

### Acceptance

- [ ] `OrderDetailsPage.tsx` renders `<OrderCopyLinkButton key={order.id} orderId={order.id} />` (or equivalent `useEffect` reset on `orderId` change in the button component) so navigating to a different order within the 2s feedback window shows default copy icon and "Copy order link" label
- [ ] `pnpm run lint` passes on touched files

## T-4c7d375b: Add aria-live status region for copy confirmation

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 [FIX] desktop-ux/F-003, deep-review pass-001 [PROMOTE-TO-FIX from WARNING] mobile-ux/F-001
- Supersedes: —

### Context

**desktop-ux/F-003** — Success feedback updates `aria-label` and `title` on the button only. There is no `aria-live` / `role="status"` element to announce "Order link copied" independently of focus. UI design specifies an SR flow where activation is followed by hearing the copied confirmation.

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-57`
- Trigger: Desktop user activates copy-link via mouse click (or activates then moves focus to another TopNav control within ~2000 ms). Screen reader running (NVDA/JAWS/VoiceOver).
- Impact: Mouse users and users who move focus after click often receive no spoken confirmation that copy succeeded — the action appears silent despite the visual check icon swap.
- Evidence: Component sets `aria-label={label}` on the button only (`OrderCopyLinkButton.tsx:55-56`); no live region in render tree.
- Suggested fix: Add a visually hidden `role="status" aria-live="polite"` element that renders the copied message when `isCopied` is true, or adopt the pattern from other notifier-backed clipboard flows.

**mobile-ux/F-001** (PROMOTE-TO-FIX) — After a successful copy, the component updates `aria-label` and `title` to "Order link copied" but provides no `aria-live` region or `role="status"`. Mobile screen readers (VoiceOver, TalkBack) typically do not re-announce a focused button when its `aria-label` changes programmatically.

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:38-56`
- Trigger: Staff user on a 375×812 mobile viewport with VoiceOver or TalkBack enabled taps the copy-link button once; clipboard write succeeds within ~50 ms.
- Impact: User hears "Copy order link, button" on focus but receives no spoken confirmation that the link was copied.
- Suggested fix: Add a visually hidden `aria-live="polite"` element that mirrors the copied message for ~2 s, or use `role="status"` with the copied string when `isCopied` is true.

UI design screen-reader flow requirement:

> Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button" (label persists while check icon visible)

[Source: docs/DEV-90/ui-design.md#Accessibility]
[Source: docs/DEV-90/findings/deep-review/pass-001/desktop-ux-order-copy-link-button.md#F-003]
[Source: docs/DEV-90/findings/deep-review/pass-001/mobile-ux-order-copy-link-button.md#F-001]

Copied-state messages:

```9:13:src/orders/components/OrderCopyLinkButton/messages.ts
  orderLinkCopied: {
    defaultMessage: "Order link copied",
    id: "vcCUT0",
    description: "copy order link button label after successful copy",
  },
```

### Acceptance

- [ ] `OrderCopyLinkButton` renders a visually hidden element with `role="status"` and `aria-live="polite"` that contains `orderCopyLinkButtonMessages.orderLinkCopied` text while `isCopied` is true
- [ ] `OrderCopyLinkButton.test.tsx` (or new test in same file once T-9dcb0344 lands) asserts the live region is present in the DOM when copied state is mocked true
- [ ] `pnpm run lint` passes on touched files

## T-9dcb0344: Add unit tests for shareable URL builder and copy button click path

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 [FIX] correctness/F-001, deep-review pass-001 [FIX] correctness/F-002
- Supersedes: —

### Context

**correctness/F-001** — The exported URL builder is the sole source of clipboard payload (PRD AC2) but has zero Jest coverage. Mount-URI branches (`getAppMountUriForRedirect` returning `""` vs a subpath) and composition with `orderUrl` are untested.

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts`
- Trigger: Any regression in `getAppMountUriForRedirect`, `orderUrl`, or `urlJoin` argument order during a future refactor; CI stays green because nothing asserts `getShareableOrderUrl("T3JkZXI6MQ==")` shape.
- Impact: Staff user clicks copy on an order-details page deployed under a non-default `APP_MOUNT_URI`; clipboard receives a malformed absolute URL.
- Evidence:

```5:8:src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts
export const getShareableOrderUrl = (orderId: string): string => {
  const relativePath = orderUrl(orderId);

  return urlJoin(window.location.origin, getAppMountUriForRedirect(), relativePath);
```

- Suggested fix: Add `getShareableOrderUrl.test.ts` mocking `window.location.origin` and `getAppMountUriForRedirect`, asserting output for default mount, custom mount, and encoded order IDs (mirror `orderUrl` trailing `?`).

**correctness/F-002** — PRD requires click to write `getShareableOrderUrl(orderId)` via `useClipboard` and update icon/labels. No component test mocks `useClipboard` or asserts `copy` receives the shareable URL (pattern exists in `OrderCustomer.test.tsx` and `CopyableText.test.tsx`).

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
- Trigger: Developer changes `handleCopy` to pass a relative path or drops `getShareableOrderUrl`; unit suite does not run for this component.
- Impact: Button shows copied feedback (if hook succeeds) but clipboard holds the wrong string.
- Evidence:

```32:34:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback((): void => {
    copy(getShareableOrderUrl(orderId));
  }, [copy, orderId]);
```

- Suggested fix: Add `OrderCopyLinkButton.test.tsx` with `jest.mock("@dashboard/hooks/useClipboard")`, render via `@test/wrapper`, click `[data-test-id="copy-order-link"]`, assert `mockCopy` called with expected absolute URL.

PRD AC2:

> Clicking the button writes the absolute order URL (`getShareableOrderUrl(orderId)`) to the system clipboard via `useClipboard`

Tech plan URL shape:

```
{window.location.origin}{APP_MOUNT_URI}/orders/{encodedOrderId}?
```

[Source: docs/DEV-90/prd.md#Acceptance criteria]
[Source: docs/DEV-90/tech-plan.md#API conventions]
[Source: docs/DEV-90/findings/deep-review/pass-001/correctness-order-copy-link-button.md#F-001]
[Source: docs/DEV-90/findings/deep-review/pass-001/correctness-order-copy-link-button.md#F-002]

### Acceptance

- [x] `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` exists and asserts absolute URL output for default mount (`getAppMountUriForRedirect` → `""`), custom subpath mount, and `encodeURIComponent` on order id (trailing `?` from `orderUrl`)
- [x] `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` mocks `useClipboard`, clicks `[data-test-id="copy-order-link"]`, and asserts `mockCopy` was called with the same URL `getShareableOrderUrl(orderId)` would produce for the rendered `orderId`
- [x] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` passes
- [x] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` passes
- [x] `pnpm run lint` passes on touched files
