## T-75622180: Extend Playwright E2E for clipboard payload and 2s revert

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-002 (correctness-order-copy-link-button/F-001, correctness-order-copy-link-button/F-002)
- Supersedes: —

### Context

PRD AC2 requires writing the current page URL to the clipboard:

> - [ ] Clicking the copy button writes `window.location.href` to the system clipboard

PRD AC3 requires the copied state to revert after 2 seconds:

> - [ ] After a successful copy, the button icon shows a check mark (via `ClipboardCopyIcon`) for 2 seconds, then reverts to the copy icon

[Source: ./docs/DEV-85/prd.md#acceptance-criteria]

**Finding correctness-order-copy-link-button/F-001:** PRD AC2 requires clicking the copy button to write `window.location.href` to the system clipboard. `TC: SALEOR_218` clicks the button and asserts post-click UI feedback (`aria-label`, check icon) but never reads clipboard contents or compares them to the current page URL.

Suggested fix: After click, grant clipboard permissions if needed and assert `await page.evaluate(() => navigator.clipboard.readText())` equals `page.url()` (or the expected order-details URL).

Location: `playwright/tests/orders.spec.ts:155-178`

Evidence:

```typescript
await ordersPage.copyOrderLinkButton.click();
await expect(ordersPage.copyOrderLinkButton).toHaveAttribute("aria-label", "Order link copied");
await expect(ordersPage.copyOrderLinkButton.locator(".lucide-check")).toBeVisible();
```

Unit tests mock `useClipboard` (`OrderCopyLinkButton.test.tsx:8-32`), so the only automated path that could catch a regression where UI feedback fires but the wrong string is written is missing.

**Finding correctness-order-copy-link-button/F-002:** PRD AC3 requires the check icon and copied label to persist for 2 seconds, then revert. Hook behavior is tested in `useClipboard.test.ts:59-80` and rapid re-copy in `:133-173`, but E2E stops immediately after the copied-state assertion with no timer wait or revert check.

Suggested fix: After copied-state assertions, advance time or `waitForTimeout(2100)` and assert default label/icon restored.

Location: `playwright/tests/orders.spec.ts:155-178`, `src/hooks/useClipboard.ts:19-22`

Evidence: E2E ends at line 178 with no `waitForTimeout(2000)` or assertion that `aria-label` returns to `"Copy order link"` and `.lucide-copy` reappears. A UI-only regression that never resets `copied` would not be caught by E2E.

Existing E2E test to extend:

```typescript
test("TC: SALEOR_218 Copy order link button on order details TopNav #e2e #order", async ({
  page,
}) => {
  await ordersPage.goToExistingOrderPage(ORDERS.orderToMarkAsPaidAndFulfill.id);
  // ... visibility + DOM order assertions ...
  await ordersPage.copyOrderLinkButton.click();
  await expect(ordersPage.copyOrderLinkButton).toHaveAttribute("aria-label", "Order link copied");
  await expect(ordersPage.copyOrderLinkButton.locator(".lucide-check")).toBeVisible();
});
```

[Source: playwright/tests/orders.spec.ts:155-178]

Page object locators already exist:

```typescript
    readonly copyOrderLinkButton = page.getByTestId("copy-order-link"),
    readonly showOrderMetadataButton = page.getByTestId("show-order-metadata"),
```

[Source: playwright/pages/ordersPage.ts:62-63]

Follow existing orders E2E patterns: `test.use({ permissionName: "admin" })`, `ORDERS` fixtures from `@data/e2eTestData`, `ordersPage.goToExistingOrderPage(...)`.

### Acceptance

- [ ] `TC: SALEOR_218` grants clipboard read/write permissions (via test fixture or `context.grantPermissions`) before clicking the copy button
- [ ] After click, test asserts `await page.evaluate(() => navigator.clipboard.readText())` equals `page.url()`
- [ ] After copied-state assertions (`aria-label` "Order link copied", `.lucide-check` visible), test waits ≥2100ms and asserts `aria-label` returns to "Copy order link" and `.lucide-copy` is visible
- [ ] Existing visibility and DOM-order assertions in `TC: SALEOR_218` remain intact
- [ ] Playwright test passes when run against a configured backend (follow repo's existing E2E invocation pattern)

## T-d6760a1f: Re-announce copy success to screen readers on rapid re-copy

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-002 (desktop-ux-order-copy-link-button/F-001)
- Supersedes: —

### Context

UI design documents the intended screen-reader flow for each successful copy:

> - Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button"

[Source: ./docs/DEV-85/ui-design.md#accessibility]

**Finding desktop-ux-order-copy-link-button/F-001:** The timer fix correctly keeps `copied === true` through rapid re-copies, but the `aria-live="polite"` region mounts with static text `messages.orderLinkCopied` and is not remounted or mutated on a second successful copy within the 2s window. Because `aria-label`/`title` are already "Order link copied", assistive tech receives no DOM delta on the second tap. UI design explicitly promises the screen-reader flow `"Copy order link, button" → after click → "Order link copied, button"` for each successful copy action; repeat taps during the feedback window are silent to SR users even though visual feedback (check icon) persists.

Suggested fix: Add a monotonic `copyGeneration` counter (ref) incremented on each successful copy; use it as `key` on the live-region span or briefly unmount/remount the region (`copied` flash) to force a polite announcement on every success, including repeat taps within 2s.

Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49` + `src/hooks/useClipboard.ts:16-17`

Evidence:

```tsx
// OrderCopyLinkButtonContent.tsx — live region only when copied; same text every time
{
  copied ? (
    <span aria-live="polite" className={styles.visuallyHidden}>
      {intl.formatMessage(messages.orderLinkCopied)}
    </span>
  ) : null;
}

// useClipboard.ts — second copy within 2s leaves copied at true (no false→true transition)
clear();
setCopyStatus(true);
```

Current presentational implementation (gap: no remount key or generation counter):

```typescript
      {copied ? (
        <span aria-live="polite" className={styles.visuallyHidden}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:45-49]

Container wiring passes `copied` from `useClipboard` only:

```typescript
export const OrderCopyLinkButton = ({
  url,
  disabled = false,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy] = useClipboard();

  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);

  return <OrderCopyLinkButtonContent copied={copied} disabled={disabled} onCopy={handleCopy} />;
};
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx]

Existing unit test asserts live region when `copied=true` but does not cover repeat-copy re-announcement:

```typescript
const liveRegion = container.querySelector("[aria-live='polite']");

expect(liveRegion).toBeInTheDocument();
expect(liveRegion).toHaveTextContent("Order link copied");
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:75-78]

### Acceptance

- [ ] Each successful clipboard write increments a monotonic generation counter (e.g., `copyGeneration`) even when `copied` was already `true`
- [ ] The `aria-live="polite"` live region uses the generation counter as a React `key` (or equivalent remount pattern) so a second copy within the 2s window produces a DOM mutation assistive tech can announce
- [ ] `OrderCopyLinkButton.test.tsx` includes a test that simulates two successful copies within 2s and asserts the live region remounts (e.g., generation key changes or node identity differs)
- [ ] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exits 0
- [ ] `pnpm run lint` and `pnpm run check-types` exit 0 with no new errors in touched files

## T-b01c9816: Fix useClipboard orphan timer on rapid re-copy

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 (desktop-ux-order-copy-link-button/F-002, mobile-ux-order-copy-link-button/F-001, correctness-order-copy-link-button/F-003)
- Supersedes: —

### Context

PRD AC3 requires the check icon and copied label for 2 seconds after each successful copy:

> - [ ] After a successful copy, the button icon shows a check mark (via `ClipboardCopyIcon`) for 2 seconds, then reverts to the copy icon

[Source: ./docs/DEV-85/prd.md#acceptance-criteria]

**Finding desktop-ux-order-copy-link-button/F-002:** PRD AC requires the check icon and copied label for 2 seconds after each successful copy. `useClipboard` schedules a reset timer on every successful write but does not clear a prior timer before assigning a new one. A second click within the first 2s window orphans the earlier timer; when it fires, it clears the newer timer ref and forces `copied` false prematurely—shortening or flickering the success state.

Suggested fix: Call `clear()` at the start of each successful `.then()` before scheduling a new timeout (or reset the timer on every copy invocation). Add a test that copies twice within 2s and asserts `copied` stays true until 2s after the _last_ successful copy.

Location: `src/hooks/useClipboard.ts:12-21`

Evidence:

```typescript
timeout.current = window.setTimeout(() => {
  clear();
  setCopyStatus(false);
}, 2000);
```

**Finding mobile-ux-order-copy-link-button/F-001:** PRD AC3 requires copied icon/labels for 2 seconds after a successful copy. On mobile, users often tap twice when feedback is subtle. `useClipboard` assigns a new `setTimeout` on each success without calling `clear()` first; the first tap's timer can fire after a second tap and reset `copied` to `false` while the user still expects success feedback from the latest tap.

Suggested fix: At the start of the `.then()` handler (before `setCopyStatus(true)`), call `clear()` to cancel any pending timeout so each successful copy gets a fresh 2s window from the most recent tap.

Location: `src/hooks/useClipboard.ts:12-21`

**Finding correctness-order-copy-link-button/F-003:** PRD AC3 requires the check icon for 2 seconds after a successful copy. `useClipboard` schedules a new timeout on each successful `writeText` without clearing a prior pending timeout. A second click within 2s overwrites `timeout.current` while the first timer remains armed; when the first timer fires, its callback calls `clear()` (which clears the _latest_ timer id) and sets `copied` false—potentially reverting feedback before 2s elapsed from the most recent copy.

Suggested fix: In `useClipboard.copy`, call `clear()` before scheduling a new timeout after success so only one reset timer is active.

Location: `src/hooks/useClipboard.ts:12-21`

Current hook implementation (gap: no `clear()` before rescheduling):

```typescript
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
```

[Source: src/hooks/useClipboard.ts]

Existing test `"should handle multiple copy calls"` never advances timers between copies, so the orphan-timer path is untested:

```typescript
await act(async () => {
  copy("second text");
  await Promise.resolve();
});

// Assert - should still be true after second copy
expect(result.current[0]).toBe(true);
```

[Source: src/hooks/useClipboard.test.ts:105-130]

### Acceptance

- [x] `useClipboard.copy` calls `clear()` at the start of the successful `.then()` handler before `setCopyStatus(true)` and before scheduling a new timeout
- [x] `useClipboard.test.ts` includes a test that copies twice within 2s, advances fake timers, and asserts `copied` remains `true` until 2s after the _second_ copy (not prematurely reset by the first timer)
- [x] `pnpm run test:quiet src/hooks/useClipboard.test.ts` exits 0
- [x] `pnpm run lint` and `pnpm run check-types` exit 0 with no new errors in touched files

## T-f8cfd2f7: Add aria-live screen reader feedback for copy success

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 (desktop-ux-order-copy-link-button/F-001)
- Supersedes: —

### Context

UI design documents the intended screen-reader flow:

> - Screen-reader flow: "Copy order link, button" → after click → "Order link copied, button"

[Source: ./docs/DEV-85/ui-design.md#accessibility]

**Finding desktop-ux-order-copy-link-button/F-001:** Copy success updates `aria-label`/`title` on the focused button, but there is no `aria-live` (or `role="status"`) region. Mutating `aria-label` on a focused control is not consistently re-announced by NVDA/JAWS/VoiceOver. The UI design document explicitly promises a screen-reader flow of `"Copy order link, button" → after click → "Order link copied, button"`, which may not occur in practice.

Suggested fix: Add a visually hidden `aria-live="polite"` element that renders `messages.orderLinkCopied` when `copied === true` (and optionally clears on revert), or use an established dashboard pattern for transient status text.

Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:21-39`

Evidence:

```typescript
  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
  // ...
      title={label}
      aria-label={label}
```

Codebase precedent for `aria-live="polite"`:

```typescript
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      aria-live="polite"
```

[Source: src/extensions/views/InstallCustomExtension/components/ManifestErrorMessage/ManifestErrorMessage.tsx:79-84]

Presentational component to extend (keep existing `aria-label`/`title` on the button):

```typescript
export const OrderCopyLinkButtonContent = ({
  copied,
  disabled = false,
  onCopy,
}: OrderCopyLinkButtonContentProps): JSX.Element => {
  const intl = useIntl();

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx]

### Acceptance

- [x] When `copied === true`, `OrderCopyLinkButtonContent` renders a visually hidden element with `aria-live="polite"` whose text is `messages.orderLinkCopied` (via react-intl)
- [x] When `copied === false`, the live region does not announce stale success text (empty or absent content)
- [x] `OrderCopyLinkButton.test.tsx` asserts the live region exists and contains "Order link copied" when the mocked hook returns `[true, …]`
- [x] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exits 0
- [x] `pnpm run lint` and `pnpm run check-types` exit 0 with no new errors in touched files

## T-d1daf9c7: Add OrderDetailsPage TopNav placement integration test

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 (correctness-order-copy-link-button/F-001)
- Supersedes: —

### Context

PRD AC1 requires copy button immediately left of metadata button:

> - [ ] Order details TopNav renders `OrderCopyLinkButton` immediately to the left of the metadata button (`data-test-id="show-order-metadata"`)

[Source: ./docs/DEV-85/prd.md#acceptance-criteria]

**Finding correctness-order-copy-link-button/F-001:** PRD AC1 requires `OrderCopyLinkButton` immediately to the left of the metadata button (`data-test-id="show-order-metadata"`). The JSX order is correct, but no unit test renders `OrderDetailsPage` (or a TopNav fragment) to assert sibling DOM order or co-presence of `copy-order-link` before `show-order-metadata`. Storybook `InOrderDetailsTopNav` mirrors layout but does not exercise the production page component.

Suggested fix: Add a focused test (e.g. render `OrderDetailsPage` with minimal order fixture) that queries `[data-test-id="copy-order-link"]` and `[data-test-id="show-order-metadata"]` and asserts copy precedes metadata in DOM order.

Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`

Evidence:

```tsx
  <TopNav href={backLinkUrl} title={<Title order={order} />}>
    <OrderCopyLinkButton />
    <Button ... data-test-id="show-order-metadata" />
```

Production integration site (JSX order is correct; test coverage is the gap):

```tsx
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              <OrderCopyLinkButton />
              <Button
                variant="secondary"
                icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
                ...
                data-test-id="show-order-metadata"
```

[Source: src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219]

Order fixtures available at `src/orders/fixtures.ts`. Follow existing test patterns: `@test/wrapper`, Arrange/Act/Assert comments, mock heavy GraphQL/extension dependencies as needed for a minimal render.

### Acceptance

- [x] A new test file (e.g. `OrderDetailsPage.test.tsx`) renders `OrderDetailsPage` with a minimal order fixture sufficient to mount the TopNav action cluster
- [x] Test queries `[data-test-id="copy-order-link"]` and `[data-test-id="show-order-metadata"]` and asserts both are present
- [x] Test asserts `copy-order-link` precedes `show-order-metadata` in document order (e.g. `compareDocumentPosition` or `toBeBefore` pattern)
- [x] `pnpm run test:quiet` on the new test file exits 0
- [x] `pnpm run lint` and `pnpm run check-types` exit 0 with no new errors in touched files

## T-f14eb8c7: Add Playwright E2E for copy-order-link button

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: deep-review pass-001 (correctness-order-copy-link-button/F-002)
- Supersedes: —

### Context

PRD scopes the E2E selector:

> - `data-test-id="copy-order-link"` for E2E targeting

[Source: ./docs/DEV-85/prd.md#scope]

**Finding correctness-order-copy-link-button/F-002:** PRD specifies `data-test-id="copy-order-link"` for E2E targeting, but no Playwright spec or page object references this selector. Existing `playwright/tests/orders.spec.ts` navigates to order details but never exercises copy-link behavior or presence.

Suggested fix: Add a Playwright test in the orders suite that opens an order details page, clicks `[data-test-id="copy-order-link"]`, and asserts clipboard content equals the page URL (or at minimum that the button is visible and precedes metadata).

Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:37`; `playwright/` tree

Evidence: `rg 'copy-order-link' playwright/` → zero matches.

Existing navigation helper for order details:

```typescript
  async goToExistingOrderPage(orderId: string) {
    const orderLink = URL_LIST.orders + orderId;

    console.log("Navigating to order details view: " + orderLink);
    await this.page.goto(orderLink);
    await this.waitForDOMToFullyLoad();
  }
```

[Source: playwright/pages/ordersPage.ts:118-124]

Follow existing orders E2E patterns: `test.use({ permissionName: "admin" })`, `ORDERS` fixtures from `@data/e2eTestData`, `ordersPage.goToExistingOrderPage(...)`.

### Acceptance

- [x] `playwright/tests/orders.spec.ts` (or a co-located spec) includes a test that navigates to an existing order details page via `goToExistingOrderPage`
- [x] Test asserts `[data-test-id="copy-order-link"]` is visible on the order details TopNav
- [x] Test clicks `[data-test-id="copy-order-link"]` and asserts success feedback (accessible name changes to "Order link copied" and/or check icon appears)
- [x] Test asserts `[data-test-id="copy-order-link"]` precedes `[data-test-id="show-order-metadata"]` in DOM order
- [x] Playwright test passes when run against a configured backend (follow repo's existing E2E invocation pattern)

## T-04b2dd15: Add OrderCopyLinkButton unit tests and sync i18n catalog

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

The prototype loop shipped the full copy-link feature (container, presentational layer, TopNav integration, Storybook state coverage, and `ClipboardCopyIcon` sizing props). The tech plan explicitly defers unit-test coverage to the integration pass:

> | Missing unit test for `OrderCopyLinkButton` | Add test in integration pass mirroring `CopyableText.test.tsx` pattern |

[Source: ./docs/DEV-85/tech-plan.md#risks]

PRD acceptance criteria the tests must mechanically verify (implementation already exists in source; tests are the gap):

> - [ ] Clicking the copy button writes `window.location.href` to the system clipboard
> - [ ] After a successful copy, the button icon shows a check mark (via `ClipboardCopyIcon`) for 2 seconds, then reverts to the copy icon
> - [ ] After a successful copy, the button `aria-label` and `title` read "Order link copied" (via `messages.orderLinkCopied`); before copy they read "Copy order link" (via `messages.copyOrderLink`)
> - [ ] When clipboard write fails, the button remains in the default (copy icon, "Copy order link") state and `useClipboard` logs a console warning — no unhandled promise rejection
> - [ ] All user-visible strings are defined in `src/orders/components/OrderCopyLinkButton/messages.ts` and rendered through react-intl

[Source: ./docs/DEV-85/prd.md#acceptance-criteria]

Container wiring to test against (mock `useClipboard`; do not re-implement clipboard logic):

```typescript
export const OrderCopyLinkButton = ({
  url,
  disabled = false,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy] = useClipboard();

  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);

  return <OrderCopyLinkButtonContent copied={copied} disabled={disabled} onCopy={handleCopy} />;
};
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx]

Presentational layer exposes `data-test-id="copy-order-link"` and toggles label/icon via `copied`:

```typescript
  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  return (
    <Button
      variant="secondary"
      ...
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx]

Follow the existing clipboard-component test pattern:

```typescript
jest.mock("@dashboard/hooks/useClipboard");

describe("CopyableText", () => {
  it("copies provided text to clipboard when button is clicked", async () => {
    mockUseClipboard.mockReturnValue([false, mockCopy]);
    ...
    await user.click(copyButton);
    expect(mockCopy).toHaveBeenCalledWith(textToCopy);
  });

  it("shows check icon after text is copied", () => {
    mockUseClipboard.mockReturnValue([true, jest.fn()]);
    ...
    expect(checkIcon).toBeInTheDocument();
  });
});
```

[Source: src/components/CopyableText/CopyableText.test.tsx]

Tech-plan risk mitigation also requires syncing extracted messages before merge:

> | Message ID lint (`formatjs/enforce-id`) | Run `pnpm run extract-messages` during integration to normalize hash IDs |

[Source: ./docs/DEV-85/tech-plan.md#risks]

Messages already defined in co-located `messages.ts` (`copyOrderLink` id `bqtu1/`, `orderLinkCopied` id `FzcMi0`) but not yet present in `locale/` JSON catalogs.

### Acceptance

- [x] `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exists with Arrange/Act/Assert structure and mocks `@dashboard/hooks/useClipboard` (same pattern as `CopyableText.test.tsx`)
- [x] Clicking the button calls `mockCopy` with `window.location.href` when `url` prop is omitted
- [x] Clicking the button calls `mockCopy` with the explicit `url` prop when provided
- [x] When `mockUseClipboard` returns `[true, …]`, the button has accessible name "Order link copied" and renders a `.lucide-check` icon
- [x] When `mockUseClipboard` returns `[false, …]`, the button has accessible name "Copy order link" and renders a `.lucide-copy` icon
- [x] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exits 0
- [x] `pnpm run extract-messages` adds entries for message IDs `bqtu1/` and `FzcMi0` to locale JSON files
- [x] `pnpm run lint` and `pnpm run check-types` exit 0 with no new errors in touched files
