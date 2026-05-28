---
agent: step-7-deep-correctness-order-copy-link-button-pass-3
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
verdict: pass
---

## Summary

Pass-3 correctness review of the cumulative `order-copy-link-button` diff (~509 LOC, 10 `src/` files) confirms production behavior matches all PRD acceptance criteria: TopNav placement with `order?.id` guard and `key={order.id}` remount, absolute URL composition via `getShareableOrderUrl` → `orderUrl` (`encodeURIComponent`), clipboard copy through shared `useClipboard`, and copied feedback (icon, aria-label/title, aria-live). Iter-5 test remediation closes pass-2 gaps for remount simulation and copied-state accessible names. No BLOCKERs. Two SHOULD-FIX findings remain for integration-boundary and click→feedback transition test coverage; two WARNINGs note assistive-tech re-announce and cross-navigation clipboard ordering edge cases.

## Findings

### F-001 [SHOULD-FIX] OrderDetailsPage TopNav integration is untested

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`
- Description: PRD AC1 and AC10 require the copy button in order-details TopNav immediately before metadata when `order.id` is present, omitted (not disabled) when absent, and remounted via `key={order.id}` on navigation. Production wiring is correct, but no automated test reads `OrderDetailsPage` — removing the conditional, dropping `key={order.id}`, or reversing button order would not fail CI.
- Trigger: Developer refactors TopNav children in `OrderDetailsPage.tsx` — e.g., removes `key={order.id}`, moves copy button after metadata, or drops `{order?.id ? … : null}` — while component-level tests in `OrderCopyLinkButton.test.tsx` still pass (they render the button in isolation with their own `key`).
- Impact: Staff navigating from order A (after copying) to order B could see stale “Order link copied” feedback on order B’s TopNav, or the copy button could appear on pages without a valid order id, or appear after the metadata button instead of before it.
- Evidence:

```210:219:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
              <Button
                variant="secondary"
                icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
                onClick={onOrderShowMetadata}
                data-test-id="show-order-metadata"
```

Grep: zero `OrderDetailsPage*.test.*` files; zero `copy-order-link` references under `playwright/`. Remount test at `OrderCopyLinkButton.test.tsx:91-125` simulates parent `key` in isolation, not via `OrderDetailsPage`.

- Suggested fix: Add an `OrderDetailsPage` unit test (or Playwright assertion) that renders TopNav with a fixture order and asserts `[data-test-id="copy-order-link"]` precedes `[data-test-id="show-order-metadata"]`, is absent when `order.id` is undefined, and includes `key={order.id}` on the copy button element.

### F-002 [SHOULD-FIX] Click→copied feedback transition untested through real hook

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:48-89`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:30-64`
- Description: PRD AC3 requires that after a successful copy the icon switches to check and `aria-label`/`title` update to “Order link copied” for ~2 seconds. The click test mocks `useClipboard` and only asserts the URL argument; the copied-state test seeds `[true, jest.fn()]` statically. Neither proves the click handler drives the runtime transition through the real hook.
- Trigger: Developer breaks the wiring between `useClipboard`’s `copied` state and `isCopied` / label / `ClipboardCopyIcon` (e.g., stops passing `copied` to `hasBeenClicked`) while keeping `handleCopy` calling `copy(...)` — the mocked click test at `:48-68` stays green.
- Impact: Staff click “Copy order link”, clipboard receives the correct URL, but the button never shows the check icon or “Order link copied” label — user cannot confirm success without pasting manually.
- Evidence:

```48:68:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
  it("copies shareable order URL when clicked", async () => {
    mockUseClipboard.mockReturnValue([false, mockCopy]);
    // ...
    await user.click(screen.getByTestId("copy-order-link"));
    expect(mockCopy).toHaveBeenCalledWith(expectedUrl);
  });
```

```70:72:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
  it("renders an aria-live status region when copied", () => {
    mockUseClipboard.mockReturnValue([true, jest.fn()]);
```

Hook-level 2s reset is tested in `useClipboard.test.ts:59-141` but not at the component boundary. No assertion on `ClipboardCopyIcon` / check icon swap (contrast: `CopyableText.test.tsx` asserts icon change).

- Suggested fix: Add a component test that does **not** mock `useClipboard`, uses `jest.useFakeTimers()` + mocked `navigator.clipboard.writeText`, clicks the button, asserts default label → “Order link copied” + check icon, advances timers 2000ms, asserts revert to default.

### F-003 [WARNING] Re-click within 2s may not re-announce via aria-live

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:36-64`; `src/hooks/useClipboard.ts:17`
- Description: When staff copy twice within the 2s feedback window, `setCopyStatus(true)` is a no-op on the second success and the aria-live region stays mounted with unchanged text. Polite live regions typically do not re-announce identical content even though clipboard write succeeds again.
- Trigger: Staff clicks “Copy order link”, waits ~500 ms, clicks again within the remaining ~1500 ms feedback window (double-click to confirm or accidental re-click).
- Impact: Clipboard contains the latest URL, but screen reader users may hear no second confirmation — they may believe the second click failed.
- Evidence:

```36:64:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const isCopied = forceCopied || copied;
  // ...
      {isCopied ? (
        <span role="status" aria-live="polite" className={styles.statusRegion}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
```

PRD specifies icon + aria-label feedback, not explicit re-announce on re-click; no test covers this path.

- Suggested fix: Consider briefly unmounting/remounting the status region or incrementing a `key` on re-copy if product wants SR re-announcement; otherwise document as accepted limitation.

### F-004 [WARNING] Cross-order navigation with slow clipboard can leave stale URL in system clipboard

- Location: `src/hooks/useClipboard.ts:12-26`; `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: `useClipboard` fires independent `writeText` promises with no serialization. `key={order.id}` remount gives order B a fresh UI/hook instance, but the OS clipboard is global. If order A’s slow `writeText` resolves after order B’s copy completes, clipboard bytes may contain order A’s URL while order B’s button shows “copied.”
- Trigger: Staff clicks copy on order A, navigates to order B within ~100-500 ms (before A’s clipboard write resolves), clicks copy on order B; A’s promise resolves last (~200-1000 ms after B’s).
- Impact: Staff paste the “copied” link and land on order A instead of order B — wrong order opened in a new tab.
- Evidence:

```12:14:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
```

No in-flight guard or write sequence token. Hook tests resolve promises in call order (`useClipboard.test.ts:105-141`); no out-of-order resolution test. UI remount is correct (`OrderCopyLinkButton.test.tsx:91-125`) but does not assert clipboard contents.

- Suggested fix: Optional monotonic write token in `useClipboard` (ignore stale resolves) or document as rare edge case; low priority given typical sub-10ms clipboard latency.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/hooks/useClipboard.ts:1-33` — `clear()` before rescheduling 2s timer on success; unmount timer cleanup; async `setCopyStatus` without mounted guard.
- `src/hooks/useClipboard.test.ts:1-195` — 13 tests including rapid re-click timer (`:105-141`) and rejection path (`:172-195`); unmount test only after resolved write.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:1-67` — click handler, label swap, aria-live region, `ClipboardCopyIcon` wiring.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:1-9` — delegates to `orderUrl` + `urlJoin` with origin/mount URI.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts:1-77` — default mount, custom mount, encoded special-char IDs.
- `src/orders/components/OrderCopyLinkButton/messages.ts:1-14` — i18n catalog for copy/copied labels.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-51` — active-state icon contrast CSS, visually hidden status region.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:1-126` — click payload, copied aria/title, key-remount simulation (iter-5 delta).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:1-123` — state stories + TopNav composition mirror.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:205-219` — TopNav integration with conditional render + `key={order.id}`.

### Export call sites

- `OrderCopyLinkButton` — exported `OrderCopyLinkButton.tsx:21`; call sites:
  - `OrderDetailsPage.tsx:211` — production; passes `orderId={order.id}`, `key={order.id}` behind `order?.id` guard; **contract respected**.
  - `OrderCopyLinkButton.stories.tsx:95` — Storybook composition; passes `orderId` only; **contract respected** (no production guard needed).
  - `OrderCopyLinkButton.test.tsx:59,77,100,115` — tests; **contract respected**.
- `getShareableOrderUrl` — exported `getShareableOrderUrl.ts:5`; call sites:
  - `OrderCopyLinkButton.tsx:33` — production click path; **contract respected**.
  - `getShareableOrderUrl.test.ts:46,59,72` — unit tests; **contract respected**.
  - `OrderCopyLinkButton.test.tsx:55` — expected URL in click test; **contract respected**.
- `orderCopyLinkButtonMessages` — exported `messages.ts:3`; call sites:
  - `OrderCopyLinkButton.tsx:9,38-40,62` — only consumer; **contract respected**.

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — renders copy button before metadata; `order?.id` guard prevents mount without id; `key={order.id}` forces remount on navigation; never passes `disabled`.
- `OrderNormalDetails/index.tsx:201` — passes `order` + `loading` to `OrderDetailsPage`; inherits TopNav copy button for confirmed orders.
- `OrderUnconfirmedDetails/index.tsx:201` — same pattern for unconfirmed orders.
- `OrderDetails.tsx:180-255` — routes to `OrderNormalDetails` / `OrderDraftDetails` / `OrderUnconfirmedDetails`; draft path uses `OrderDraftPage` (no copy button, PRD out-of-scope).
- `OrderDraftPage.tsx:111-127` — TopNav without copy button; confirms draft exclusion.

### Integration dependencies

- `src/orders/urls.ts:234-235` — `orderUrl` applies `encodeURIComponent`; trailing `?` from `stringifyQs`.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` returns `""` for default mount.
- `src/orders/index.tsx:82-87` — route decodes id via `decodeURIComponent`; confirms single-encoding round-trip.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — copy/check icon swap driven by `hasBeenClicked`.
- `src/auth/utils.ts:108-109` — sibling absolute URL builder strips bare `?` (intentional divergence; shareable URL keeps trailing `?` per tech-plan).

### Tests overlapping this area

- `useClipboard.test.ts` — hook timer, rejection, rapid re-click (12 tests total with others).
- `OrderCopyLinkButton.test.tsx` — 3 tests (click payload, copied a11y, remount).
- `getShareableOrderUrl.test.ts` — 3 URL shape tests.
- `playwright/tests/orders.spec.ts` — order E2E exists; **zero** `copy-order-link` coverage.
- `CopyableText.test.tsx` — sibling copy-button test pattern reference (icon swap assertion).

### Planning artifacts

- `docs/DEV-90/prd.md` — all 10 ACs traced to runtime paths; production conforms.
- `docs/DEV-90/tech-plan.md` — URL shape `{origin}{mount}/orders/{encodedId}?` verified in code + tests.
- `docs/DEV-90/project-context.md` — constitution checklist (named exports, CSS modules, react-intl, useClipboard reuse) satisfied; minor drift: colocated URL helper, locale IDs not extracted.
