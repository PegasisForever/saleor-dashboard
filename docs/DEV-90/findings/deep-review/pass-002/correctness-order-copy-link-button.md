---
agent: step-7-deep-correctness-order-copy-link-button-pass-2
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: pass
---

## Summary

Pass-2 correctness review of the cumulative `order-copy-link-button` diff (~470 LOC in 10 `src/` files) confirms pass-1 remediation landed: `useClipboard` clears prior timers before rescheduling, `OrderDetailsPage` remounts the button via `key={order.id}`, aria-live status region is present, and unit tests cover the URL builder, click→copy payload, hook rapid re-click timing, and copied-state live region. All ten PRD acceptance criteria trace to implemented runtime paths; URL encoding matches sibling `orderUrl` helpers. No BLOCKER defects. One SHOULD-FIX remains: no automated test guards the order-navigation remount fix. Several WARNING-tier coverage and edge-case gaps are noted for follow-up.

## Findings

### F-001 [SHOULD-FIX] No automated test for copy-state reset on order navigation

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`; test gap across `src/orders/components/OrderCopyLinkButton/`
- Description: T-473f727d added `key={order.id}` so navigating between orders remounts `OrderCopyLinkButton` and clears stale `useClipboard` copied feedback. The fix is correct in production code but has zero automated coverage — removing the `key` while keeping `orderId={order.id}` would not fail CI.
- Trigger: Staff user copies order A's link (check icon + "Order link copied" appear). Within ~2000 ms, navigates to order B via order list click, browser back/forward, or in-app link. Developer later refactors TopNav and drops the `key` prop.
- Impact: User sees "Order link copied" checkmark on order B's TopNav and may believe B's URL is in the clipboard when only A's URL was copied.
- Evidence:

```211:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
```

Grep for `key={order.id}` / navigation reset in `**/*.{test,spec}*` → 0 matches. Shallow review iter-3 F-002 documents the same gap. Component tests render `OrderCopyLinkButton` in isolation without key-based remount (`OrderCopyLinkButton.test.tsx:57-60`).

- Suggested fix: Add a test that renders `<OrderCopyLinkButton key="order-a" … />`, simulates copied state, rerenders with `key="order-b"`, and asserts default copy icon/label (or add a focused Playwright step on order-details navigation).

### F-002 [WARNING] OrderDetailsPage TopNav integration untested (AC1)

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`
- Description: PRD AC1 requires `OrderCopyLinkButton` immediately before the metadata button when `order.id` is present. Implementation matches (copy button JSX precedes metadata `Button`), but no unit, integration, or E2E test asserts placement or conditional render.
- Trigger: Developer reorders TopNav children or changes `{order?.id ? … : null}` guard during unrelated TopNav work; CI stays green.
- Impact: Copy button missing from TopNav or appearing after metadata — staff cannot find the control where spec places it.
- Evidence: Only Storybook composition stories mirror layout (`OrderCopyLinkButton.stories.tsx:94-103`). No `OrderDetailsPage*.test.*` exists; Playwright `orders.spec.ts` has no `copy-order-link` reference.
- Suggested fix: Add an integration test rendering `OrderDetailsPage` TopNav slice with mocked order, asserting `[data-test-id="copy-order-link"]` precedes `[data-test-id="show-order-metadata"]`, or extend Playwright order-details flow.

### F-003 [WARNING] Component tests skip post-click label/icon transition (AC3/AC4)

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`
- Description: Click test mocks `useClipboard` and only asserts `mockCopy` payload (`:48-68`). Copied-state test mocks `[true, jest.fn()]` statically (`:70-86`) without verifying `aria-label`/`title` flip from "Copy order link" to "Order link copied" or `ClipboardCopyIcon` check state after a real click path.
- Trigger: Developer breaks label derivation in `OrderCopyLinkButton.tsx:38-40` or `hasBeenClicked` wiring at `:53`; mocked tests still pass.
- Impact: Button copies correct URL but shows wrong accessible name or copy icon after success — screen-reader users get no "Order link copied" confirmation on the button itself.
- Evidence: No assertion on `getByRole("button", { name: /copy order link/i })` default state or post-click name change. Hook-level 2s reset is tested in `useClipboard.test.ts:59-81` but not wired through the component.
- Suggested fix: Add test using real `useClipboard` with fake timers (or unmocked hook) that clicks the button and asserts `aria-label`/`title` update and status region mount.

### F-004 [WARNING] Re-click within 2s may not re-announce via aria-live

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:60-64`; `src/hooks/useClipboard.ts:16-17`
- Description: The aria-live region is conditionally mounted only while `isCopied` is true. A second successful copy within the 2s window calls `setCopyStatus(true)` when already true; the region stays mounted with unchanged text, so screen readers may not emit a second announcement.
- Trigger: Staff user clicks copy-link, hears confirmation, then clicks again within ~300–1500 ms to verify the copy (double-click or "did it work?" gesture). Clipboard write succeeds both times.
- Impact: Second click appears silent to screen-reader users despite successful clipboard update; user may click a third time or assume failure.
- Evidence:

```60:64:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
      {isCopied ? (
        <span role="status" aria-live="polite" className={styles.statusRegion}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
```

No test covers re-click announcement behavior.

- Suggested fix: Add a `key` on the status span tied to copy count/timestamp, or use a persistently mounted live region that briefly clears text before re-setting the message.

### F-005 [WARNING] useClipboard lacks mounted guard on async clipboard resolve

- Location: `src/hooks/useClipboard.ts:15-22`
- Description: The success handler calls `setCopyStatus(true)` without checking whether the hook instance is still mounted. Combined with `key={order.id}` remount on navigation, a slow `writeText` from order A can resolve after the user navigates to order B.
- Trigger: User clicks copy on order A, navigates to order B within ~100–500 ms (before clipboard promise resolves). Network/OS clipboard latency is elevated.
- Impact: React "Can't perform a React state update on an unmounted component" warning in dev; no user-visible stale UI on order B because the new instance starts fresh, but dev noise and StrictMode double-invoke risk remain.
- Evidence: Unmount test only covers timer cleanup after resolved write (`useClipboard.test.ts:83-103`); no test for pending `writeText` at unmount. `.then()` at `useClipboard.ts:15-22` has no abort/mounted flag.
- Suggested fix: Track mounted ref in `useEffect` cleanup and skip `setCopyStatus` when unmounted, or abort via `AbortController` pattern if extended.

## Files / sections inspected

### Touched files (diff since `45b5cef8..HEAD`)

- `src/hooks/useClipboard.ts:16` — `clear()` before scheduling reset on successful write; fixes rapid re-click timer overlap.
- `src/hooks/useClipboard.test.ts:105-141` — new rapid re-click test asserting 2s window from latest click.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — button component, aria-live region, `handleCopy` → `getShareableOrderUrl`.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — delegates encoding to `orderUrl`, composes absolute URL.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — i18n catalog for labels.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — interaction states + sr-only `.statusRegion`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — click payload + static copied live-region tests.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — default mount, subpath mount, special-char encoding.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + TopNav composition.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211` — conditional render + `key={order.id}` before metadata button.

### Export call sites

| Export                        | Call sites                                                                                   | Contract respected?                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `OrderCopyLinkButton`         | `OrderDetailsPage.tsx:211` — production; `OrderCopyLinkButton.stories.tsx:95,44` — Storybook | Yes: parent passes `orderId` only when `order?.id` truthy; `key` matches id for remount. |
| `getShareableOrderUrl`        | `OrderCopyLinkButton.tsx:33` only (no other repo callers per grep)                           | Yes: single internal consumer; tests mirror tech-plan URL shape.                         |
| `orderCopyLinkButtonMessages` | `OrderCopyLinkButton.tsx:9,38-40,62` only                                                    | Yes: all user-visible strings via `formatMessage`.                                       |
| `useClipboard` (modified)     | 8 production consumers; `OrderCopyLinkButton.tsx:30` is the feature consumer                 | Yes: shared hook fix benefits all; timer test added.                                     |

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — renders copy button inside `Form` render prop → `TopNav`; gated on `order?.id`; placed before metadata `Button`; `key={order.id}` for remount on navigation.
- `src/orders/index.tsx:82-87` — route host decodes `%`-encoded id from URL; confirms encoding round-trip with `orderUrl`.

### Integration dependencies read

- `src/orders/urls.ts:234-235` — `orderUrl` applies `encodeURIComponent` + trailing `?`.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` mount-uri helper.
- `src/auth/utils.ts:108-109` — sibling absolute-URL builder (strips bare `?`; shareable URL intentionally keeps it per tech-plan).
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — copy/check icon swap at 16px.
- `src/components/CopyableText/CopyableText.tsx`, `OrderCustomer.tsx`, `TrackingNumberDisplay.tsx` — sibling clipboard patterns for comparison.
- `src/components/Form/Form.tsx:61-64` — TopNav buttons live inside `<form>`; metadata button shares same pattern (pre-existing).

### Tests / mechanical verification

- `pnpm run test:quiet` on three test files — 12/12 pass.
- Playwright `orders.spec.ts --list` — no copy-link scenarios; e2e skipped for this feature surface.
- `docs/DEV-90/prd.md`, `tech-plan.md`, `ui-design.md`, `project-context.md` — PRD/constitution trace.

## Mechanical checks

| Check                   | Status                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| e2e-tests               | skip — no Playwright spec references `copy-order-link`; existing `orders.spec.ts` flows do not exercise copy button                             |
| api-contract            | pass — `getShareableOrderUrl.test.ts` asserts tech-plan URL shape (`origin` + mount + encoded path + trailing `?`)                              |
| prd-conformance         | pass — all 10 ACs traced to runtime code paths                                                                                                  |
| constitution-compliance | pass — reuses `useClipboard`/`ClipboardCopyIcon`, CSS modules, `messages.ts`, named exports; `clsx` per ESLint (not banned `classnames`)        |
| test-coverage           | pass — load-bearing URL builder, click payload, hook timer fix, and aria-live presence covered; integration/nav-reset gaps filed as F-001/F-002 |
