---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
verdict: fail
---

## Summary

Production wiring for the order-details copy-link button is structurally correct: it copies `window.location.href` via the shared `useClipboard` hook, toggles icon/labels per PRD, matches the adjacent metadata button styling, and is placed immediately before `show-order-metadata` in `OrderDetailsPage`. Unit tests pass (4/4 container, 6/6 hook). However, load-bearing PRD acceptance criteria lack automated verification at the integration boundary (TopNav placement, E2E selector), and the shared `useClipboard` timer implementation can reset the “copied” state early under rapid clicks—violating the 2-second feedback contract for this button.

## Findings

### F-001 [SHOULD-FIX] No automated test for TopNav placement acceptance criterion

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219`
- Description: PRD AC1 requires `OrderCopyLinkButton` immediately to the left of the metadata button (`data-test-id="show-order-metadata"`). The JSX order is correct, but no unit test renders `OrderDetailsPage` (or a TopNav fragment) to assert sibling DOM order or co-presence of `copy-order-link` before `show-order-metadata`. Storybook `InOrderDetailsTopNav` mirrors layout but does not exercise the production page component.
- Evidence:
  ```tsx
  <TopNav href={backLinkUrl} title={<Title order={order} />}>
    <OrderCopyLinkButton />
    <Button ... data-test-id="show-order-metadata" />
  ```
  Grep over `src/` and `playwright/` finds no test asserting this ordering. No `OrderDetailsPage*.test.*` file exists.
- Suggested fix: Add a focused test (e.g. render `OrderDetailsPage` with minimal order fixture) that queries `[data-test-id="copy-order-link"]` and `[data-test-id="show-order-metadata"]` and asserts copy precedes metadata in DOM order.

### F-002 [SHOULD-FIX] PRD E2E selector has no Playwright coverage

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx:37`; `playwright/` tree
- Description: PRD specifies `data-test-id="copy-order-link"` for E2E targeting, but no Playwright spec or page object references this selector. Existing `playwright/tests/orders.spec.ts` navigates to order details but never exercises copy-link behavior or presence.
- Evidence: `rg 'copy-order-link' playwright/` → zero matches. PRD line 15: `` `data-test-id="copy-order-link"` for E2E targeting ``.
- Suggested fix: Add a Playwright test in the orders suite that opens an order details page, clicks `[data-test-id="copy-order-link"]`, and asserts clipboard content equals the page URL (or at minimum that the button is visible and precedes metadata).

### F-003 [SHOULD-FIX] Rapid re-clicks can shorten 2-second “copied” feedback via shared hook timers

- Location: `src/hooks/useClipboard.ts:12-21`
- Description: PRD AC3 requires the check icon for 2 seconds after a successful copy. `useClipboard` schedules a new timeout on each successful `writeText` without clearing a prior pending timeout. A second click within 2s overwrites `timeout.current` while the first timer remains armed; when the first timer fires, its callback calls `clear()` (which clears the _latest_ timer id) and sets `copied` false—potentially reverting feedback before 2s elapsed from the most recent copy.
- Evidence:
  ```typescript
  timeout.current = window.setTimeout(() => {
    clear();
    setCopyStatus(false);
  }, 2000);
  ```
  `useClipboard.test.ts:105-130` verifies double-copy keeps `copied === true` but does not advance timers to expose premature reset. `OrderCopyLinkButton` has no debounce (`OrderCopyLinkButton.tsx:17-19`).
- Suggested fix: In `useClipboard.copy`, call `clear()` before scheduling a new timeout after success so only one reset timer is active.

### F-004 [WARNING] Error Storybook story does not simulate clipboard failure

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:46-58`
- Description: The `Error` story documents that clipboard failure leaves the default visual state, but it renders the same live `OrderCopyLinkButton` as `Default` with no mock/rejection of `navigator.clipboard.writeText`. Runtime behavior equals the success path; failure is only covered in `useClipboard.test.ts`.
- Evidence: Story has docs description only; `args: { url: SAMPLE_ORDER_URL }` with no custom render or clipboard stub.
- Suggested fix: Add a story render that stubs `navigator.clipboard.writeText` to reject, or document explicitly that Error is a visual reference only.

### F-005 [WARNING] Empty `url` prop copies empty string instead of falling back to `window.location.href`

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-18`
- Description: Nullish coalescing (`??`) only substitutes for `null`/`undefined`. A caller passing `url=""` would copy an empty string and still show “Order link copied” on successful `writeText("")`. Production omits `url` (`OrderDetailsPage.tsx:211`), so this is latent unless the optional prop is misused in tests or future callers.
- Evidence: `copy(url ?? window.location.href)` — no guard for empty/whitespace strings. No test covers `url=""`.
- Suggested fix: Use `(url && url.trim()) ? url : window.location.href` or reject empty strings before calling `copy`.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useClipboard` wiring, `url ?? window.location.href` fallback.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational button; intl labels, `data-test-id`, icon sizing.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `copyOrderLink` / `orderLinkCopied` message IDs.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — four mocked-hook unit tests; all pass.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + TopNav composition mirror.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only interaction CSS wrapper; omits `onCopy`.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only Macaw token overrides.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — production integration; `<OrderCopyLinkButton />` before metadata button inside `<Form>`.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` props with defaults preserved.
- `locale/defaultMessages.json:3173-3176,7258-7261` — extracted entries for `FzcMi0` and `bqtu1/`.

### Call sites of new/changed exports

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.test.tsx:22,45,65,83`; `OrderCopyLinkButton.stories.tsx:67`. Production call site omits `url`/`disabled`; contract respected.
- `OrderCopyLinkButtonContent` — `OrderCopyLinkButton.tsx:21`; `OrderCopyLinkButtonStoryPreview.tsx:32`; `OrderCopyLinkButton.stories.tsx:43,61`. Story paths omit `onCopy` (intentional for static states; clicks are no-ops).
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx:31,35,39` only; story-only export.
- `OrderCopyLinkButtonStoryInteractionState` (type) — used within `OrderCopyLinkButtonStoryPreview.tsx` only.
- `messages` (`copyOrderLink`, `orderLinkCopied`) — consumed in `OrderCopyLinkButtonContent.tsx:21-23` only.
- `ClipboardCopyIcon` (modified export) — `OrderCopyLinkButtonContent.tsx:30-34` passes `iconSize.medium` + `iconStrokeWidth`; `TrackingNumberDisplay.tsx:56` unchanged (defaults `size=16`, no strokeWidth). Backward-compatible.

### Parent / host components read

- `OrderDetailsPage.tsx:205-233` — renders copy button unconditionally in TopNav; does not pass `order.id` to button (correct per PRD—uses `window.location.href`). `order` is optional elsewhere in file (`order?.status`, etc.) but copy button has no order dependency—no crash risk.
- `OrderNormalDetails/index.tsx:201-237` — passes `order={order}` to `OrderDetailsPage` during loading and loaded states; copy button available whenever page renders.
- `OrderUnconfirmedDetails/index.tsx:201` — also uses `OrderDetailsPage`; copy button present on unconfirmed orders (not excluded by PRD).
- `OrderDraftDetails/index.tsx` — uses `OrderDraftPage`, not `OrderDetailsPage`; copy button correctly absent on draft orders per PRD out-of-scope.

### Integration sites (imports / hooks)

- `src/hooks/useClipboard.ts:3-31` — 2s revert timer, `console.warn` on rejection, unmount cleanup; unchanged in diff; failure path tested in `useClipboard.test.ts:133-156`.
- `src/components/icons/index.ts:12-32` — `iconSize.medium` (20), `iconStrokeWidth` (1.5) match metadata neighbor.
- `src/components/CopyableText/CopyableText.tsx:45-47` — sibling clipboard pattern (static aria-label vs dynamic label in new button).
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx:16,56-61` — sibling `useClipboard` + `ClipboardCopyIcon` consumer.

### Tests overlapping this feature

- `OrderCopyLinkButton.test.tsx` — 4 tests pass (`pnpm run test:quiet` → PASS 4/4).
- `useClipboard.test.ts` — 6 tests pass; covers 2s revert, failure warning, unmount cleanup.
- `CopyableText.test.tsx` — pattern reference; same mock strategy, no failure/timer tests at container layer.
- `playwright/tests/orders.spec.ts` — order flows exist; no `copy-order-link` coverage.
- No `OrderDetailsPage` unit tests in repo.

### Planning artifacts

- `docs/DEV-85/prd.md` — all 8 acceptance criteria traced to code; gaps in automated verification noted above.
- `docs/DEV-85/tech-plan.md` — architecture matches implementation; API conventions N/A (browser clipboard).
- `docs/DEV-85/project-context.md` — conventions followed (named exports, macaw-ui-next, react-intl, co-located messages, Storybook, reuse `useClipboard`/`ClipboardCopyIcon`).
- `docs/DEV-85/ui-design.md` — placement, states, a11y expectations align with code.
