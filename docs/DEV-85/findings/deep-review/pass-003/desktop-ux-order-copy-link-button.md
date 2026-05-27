---
agent: step-7-deep-desktop-ux-order-copy-link-button-pass-3
input_branch: 7a4e0a69c93b1092d88419dfd90b9dd892bbc0d8
verdict: pass
---

## Summary

Pass-3 desktop-ux review verified iter-6 loop-back fixes on the order copy-link feature: `useClipboard` now clears timers before reschedule and exposes `copyGeneration` for `aria-live` remount on rapid re-copy; E2E `TC: SALEOR_218` asserts clipboard payload and 2s revert. Production app was unreachable in the worker sandbox; Storybook `InOrderDetailsTopNav` at 1280×800 confirmed TopNav placement and static copied affordances, with clipboard-driven click transitions blocked by HTTP/non-secure Storybook context (`navigator.clipboard` undefined). Unit tests (13/13) pass including live-region remount. No BLOCKERs; two WARNINGs on residual test-coverage gaps for keyboard activation and rapid re-copy E2E.

## Findings

### F-001 [WARNING] AC7 keyboard activation has no automated regression path

- Location: `playwright/tests/orders.spec.ts` (`TC: SALEOR_218`); `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx`
- Description: PRD AC7 requires the copy button to be keyboard-focusable and operable. The implementation uses a native Macaw `Button` (focusable by default), and manual Storybook testing confirmed focus + Enter on the iframe story does not break the control. However, no unit or E2E test exercises Tab → focus → Enter/Space activation; the E2E spec uses `.click()` only, so a regression that broke keyboard handlers would not be caught in CI.
- Evidence:

```179:179:playwright/tests/orders.spec.ts
  await ordersPage.copyOrderLinkButton.click();
```

`OrderCopyLinkButton.test.tsx` uses `@testing-library/user-event` click paths only; no `keyboard` / `{Enter}` cases.

- Suggested fix: Add a Playwright step (or RTL test) that focuses `[data-test-id="copy-order-link"]` and presses `Enter`, then asserts `aria-label` becomes `"Order link copied"` and the check icon appears (with clipboard permissions granted as in the existing spec).

### F-002 [WARNING] Rapid re-copy SR remount is unit-tested only, not E2E-exercised

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:101-126`; `playwright/tests/orders.spec.ts:155-190`
- Description: Iter-6 added `copyGeneration` as `key` on the `aria-live` region so assistive tech re-announces on repeat copies within the 2s window. A presentational rerender test proves DOM node identity changes when generation bumps, but no automated flow double-clicks the real button within 2s and asserts live-region remount or sustained copied affordances.
- Evidence:

```101:125:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
  it("remounts live region when copyGeneration increments during rapid re-copy", () => {
    // rerender OrderCopyLinkButtonContent with copyGeneration={1} then {2}
    expect(liveRegionAfterSecondCopy).not.toBe(liveRegionAfterFirstCopy);
  });
```

`TC: SALEOR_218` performs a single click and does not assert `[aria-live="polite"]` presence or a second click within 2s.

- Suggested fix: Extend `TC: SALEOR_218` with a second `copyOrderLinkButton.click()` before `waitForTimeout(2100)`, optionally asserting `document.querySelectorAll('[aria-live="polite"]').length === 1` and copied label/icon remain until the timer elapses.

## Files / sections inspected

### Touched files (coordinator pass-3 scope)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container wires `useClipboard` 3-tuple + `handleCopy` with `url ?? window.location.href`
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — secondary button, dynamic `aria-label`/`title`, `key={copyGeneration}` live region
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.module.css` — visually hidden live region styles
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `copyOrderLink` / `orderLinkCopied` i18n
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — 6 tests including live-region remount
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state stories + `InOrderDetailsTopNav`
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only interaction tokens
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only hover/focus/active wrapper
- `src/hooks/useClipboard.ts` — `clear()` before reschedule, `copyGeneration` increment, 2s timer
- `src/hooks/useClipboard.test.ts` — timer + generation tests (7 hook tests)
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth` props
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-219` — TopNav integration, no `url`/`disabled` props
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:91-108` — DOM order placement test
- `playwright/tests/orders.spec.ts:155-190` — `TC: SALEOR_218` E2E
- `playwright/pages/ordersPage.ts:62` — page object `copyOrderLinkButton`
- `docs/DEV-85/prd.md`, `docs/DEV-85/ui-design.md`, `docs/DEV-85/tech-plan.md` — AC and SR flow contract
- `docs/DEV-85/logs/042-step-7-coordinator-pass-3.md` — touchedFiles / iter-6 delta context

### Export call sites

- `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` only; no `url`/`disabled` in production; contract respected
- `OrderCopyLinkButtonContent` — stories/tests + `OrderCopyLinkButtonStoryPreview.tsx:32`; story props omit `copyGeneration` (defaults 0)
- `OrderCopyLinkButtonStoryPreview` — `OrderCopyLinkButton.stories.tsx` hover/focus/active stories only
- `messages` — consumed only in `OrderCopyLinkButtonContent.tsx`
- `useClipboard` — 6 production consumers; 2-tuple destructuring unchanged; only `OrderCopyLinkButton` uses 3rd element `copyGeneration`

### Parent / host components

- `OrderDetailsPage.tsx:210-232` — renders `<OrderCopyLinkButton />` before metadata `Button` and `TopNav.Menu`; does not pass `order` or `loading` to copy button (safe during loading)
- `OrderNormalDetails/index.tsx:201-203` — passes `loading` to page but copy button unaffected
- `TopNav/Root.tsx:75-82` — optional `AppChannelSelect` prepends children when channel picker active (documented tab-order gap vs `ui-design.md:57`)

### Integration dependencies

- `src/hooks/useClipboard.ts` — sync `copy()` entry, async `writeText`, `.catch` console.warn only
- `src/components/AppLayout/TopNav/Root.tsx` — flex `nowrap` layout for action cluster
- `src/components/Form/Form.tsx` — copy button inside `<form>` without explicit `type="button"` (matches adjacent metadata button pattern)

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — mocked hook; covers href/url copy, copied/default UI, live region, generation remount
- `useClipboard.test.ts` — real hook + fake timers; rapid re-copy timer + generation
- `OrderDetailsPage.test.tsx:91-108` — placement only
- `playwright/tests/orders.spec.ts:155-190` — placement, single-click success, clipboard === `page.url()`, 2.1s revert

### Chrome walkthrough (Storybook fallback)

- `http://local-deploy:11000/348e26e0-70be-420f-9890-0f733b21134b/iframe.html?id=orders-ordercopylinkbutton--in-order-details-top-nav` — `copyBeforeMeta: true`, labels correct
- `...--copied` — `aria-label` "Order link copied", `.lucide-check` present
- `...--default` — click/Enter do not flip state (`isSecureContext: false`, `navigator.clipboard` undefined)
- `http://localhost:9000/` — connection failed (production-walkthrough skip)
