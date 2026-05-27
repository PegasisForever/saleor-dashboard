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

- Status: pending
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

- [ ] `playwright/tests/orders.spec.ts` (or a co-located spec) includes a test that navigates to an existing order details page via `goToExistingOrderPage`
- [ ] Test asserts `[data-test-id="copy-order-link"]` is visible on the order details TopNav
- [ ] Test clicks `[data-test-id="copy-order-link"]` and asserts success feedback (accessible name changes to "Order link copied" and/or check icon appears)
- [ ] Test asserts `[data-test-id="copy-order-link"]` precedes `[data-test-id="show-order-metadata"]` in DOM order
- [ ] Playwright test passes when run against a configured backend (follow repo's existing E2E invocation pattern)

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
