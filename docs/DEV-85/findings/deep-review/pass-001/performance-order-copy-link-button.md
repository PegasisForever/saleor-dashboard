---
agent: step-7-deep-performance-order-copy-link-button-pass-1
input_branch: 199fc3d86ad7d9513373dd6521d28bd6da890d1d
verdict: pass
---

## Summary

Performance review of the order-copy-link-button feature finds negligible bundle impact (+983 bytes JS/CSS total; +0.78 KB minified on the primary index chunk), healthy Storybook-measured load and click feedback (LCP 381 ms, ~16 ms to copied state with clipboard mock), and stable memory under rapid clicks (+86 KB heap delta, timers reset correctly). No new dependencies or backend surface. Three WARNINGs note pre-existing `useClipboard` timer behavior and Form-render-prop re-render coupling amplified by an always-visible TopNav control — none rise to merge-blocking performance regressions.

## Findings

### F-001 [WARNING] Copy button re-renders on unrelated Form/order state churn

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-211`
- Description: `OrderCopyLinkButton` is mounted inside the `Form` render-prop callback with no `React.memo` boundary. Every form dirty-state, validation, or `initial` sync re-render reconciles the full TopNav subtree including the copy button, even though the button consumes no form props. On order details this page re-renders frequently (Apollo order updates, metadata mutation loading, pricing modal state, extensions).
- Evidence: Button wired at `OrderDetailsPage.tsx:211` inside `{({ submit }) => (...)}` at lines 206-207. `OrderCopyLinkButton` runs `useClipboard()` + `useIntl()` + Macaw `Button` reconciliation on each pass. Same structural coupling applies to the adjacent metadata button (lines 212-218), so this is not a unique regression — but the new always-visible control adds steady per-churn work where hover-reveal siblings (`CopyableText`, `TrackingNumberDisplay`) avoid interaction-driven renders.
- Suggested fix: If render churn becomes measurable, wrap `OrderCopyLinkButton` in `React.memo` or hoist TopNav actions outside the Form render prop. Low priority given trivial per-render cost (~2 hooks, 1 `formatMessage`, 1 icon element).

### F-002 [WARNING] Rapid copy clicks can orphan reset timers in shared `useClipboard` hook

- Location: `src/hooks/useClipboard.ts:16-21` (consumed by `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:15`)
- Description: On each successful clipboard write, `useClipboard` schedules a new 2 s reset timer without clearing a prior pending timer. The TopNav copy button is always visible and clickable (unlike hover-reveal clipboard controls elsewhere), making rapid successive clicks more likely. Orphaned timers can fire extra `setCopyStatus(false)` calls and redundant React commits.
- Evidence:
  ```typescript
  setCopyStatus(true);
  timeout.current = window.setTimeout(() => {
    clear();
    setCopyStatus(false);
  }, 2000);
  ```
  No `clear()` call precedes the new `setTimeout`. `useClipboard.test.ts:105-131` asserts multi-copy call counts but not timer deduplication. Chrome memory check showed no unbounded growth (+86 KB after 5 rapid clicks), but extra timer/setState work remains possible.
- Suggested fix: Call `clear()` before scheduling a new timeout in `useClipboard.copy()`. Pre-existing hook issue; fixing benefits all clipboard consumers, not just this button.

### F-003 [WARNING] Container `useCallback` does not stabilize `onCopy` across parent re-renders

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:17-19`, `src/hooks/useClipboard.ts:12-26`
- Description: `OrderCopyLinkButton` wraps the click handler in `useCallback`, but `useClipboard` returns a fresh `copy` function reference every render (not memoized). Because `copy` is in the dependency array, `handleCopy` is recreated on every parent-driven re-render, passing a new `onCopy` to `OrderCopyLinkButtonContent` and forcing Macaw `Button` to reconcile a changed prop.
- Evidence: Sibling consumers use inline handlers (`TrackingNumberDisplay.tsx:57`, `CopyableText.tsx:45`) with the same underlying instability; the new code adds `useCallback` without achieving referential stability. Cost is one function allocation per parent re-render — negligible in isolation but defeats the stated memoization intent.
- Suggested fix: Either memoize `copy` inside `useClipboard` with `useCallback`, or drop the container-level `useCallback` to match sibling patterns. Optional `React.memo` on `OrderCopyLinkButtonContent` would require stable `onCopy` first.

## Files / sections inspected

### Touched files

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — container; `useCallback` handler, click-time `window.location.href` read.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx` — presentational Macaw Button; per-render `formatMessage`, inline icon JSX.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — two static i18n messages; no runtime perf surface.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — unit tests mock clipboard; no render-count or integration coverage.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — Storybook only; excluded from production bundle.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonStoryPreview.tsx` — story-only wrapper; no production importers.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css` — story-only CSS; grep confirms zero matches in `build/dashboard`.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — optional `size`/`strokeWidth`; `sprinkles()` per render.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:38,206-233` — production host; Form render-prop TopNav wire-up.
- `locale/defaultMessages.json` — two new strings; +0.2 KB on `defaultMessages` chunk.

### Call sites of new/changed exports

- **`OrderCopyLinkButton`** — `OrderDetailsPage.tsx:211` (production, zero props; contract respected). `OrderCopyLinkButton.stories.tsx:28,47,67` (Storybook). `OrderCopyLinkButton.test.tsx:22,45,65,83` (tests). No other callers per `rg OrderCopyLinkButton`.
- **`OrderCopyLinkButtonContent`** — `OrderCopyLinkButton.tsx:21` (production container). `OrderCopyLinkButtonStoryPreview.tsx:32`, `OrderCopyLinkButton.stories.tsx:43,61` (Storybook only). Contract: presentational props only; production path always passes `onCopy`.
- **`OrderCopyLinkButtonStoryPreview`** — `OrderCopyLinkButton.stories.tsx:31,35,39` only; story-only, not in production bundle.
- **`OrderCopyLinkButtonStoryInteractionState`** (type export) — `OrderCopyLinkButtonStoryPreview.tsx:9,13` only; no external callers.
- **`messages`** (`messages.ts`) — `OrderCopyLinkButtonContent.tsx:6,22-23` only.
- **`ClipboardCopyIcon`** (modified) — `OrderCopyLinkButtonContent.tsx:30-34` (with explicit sizing). `TrackingNumberDisplay.tsx:56` (defaults unchanged; backward-compatible).

### Parent / host components read

- **`OrderDetailsPage.tsx:206-233`** — renders `<OrderCopyLinkButton />` with no props inside Form render prop; `order` optional elsewhere but button does not dereference it; `loading` prop does not gate button mount.
- **`TopNav/Root.tsx:57-83`** — flex nowrap action row; new button adds horizontal width beside ellipsized title.
- **`Form.tsx` + `useForm/index.ts`** — render-prop pattern drives TopNav re-renders on form state changes.

### Integration sites read

- **`src/hooks/useClipboard.ts`** — async clipboard write, 2 s timer, unmount cleanup; unstable `copy` ref; no in-flight guard.
- **`src/hooks/useClipboard.test.ts`** — timer unmount test passes; multi-copy test lacks timer assertions.
- **`src/components/CopyableText/CopyableText.tsx`** — sibling clipboard pattern (hover-reveal, inline handler).
- **`src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`** — sibling `ClipboardCopyIcon` consumer.
- **`src/orders/components/OrderCustomer/OrderCustomer.tsx:132-134,278-285`** — three `useClipboard` instances on same page; duplicate Lucide imports already present.
- **`vite.config.js:184-187`** — vendor chunking; no orders-specific split.

### Tests overlapping

- `OrderCopyLinkButton.test.tsx` — click wiring, label/icon states; clipboard mocked; no Form-parent or perf assertions.
- `useClipboard.test.ts` — hook timer cleanup, multi-copy; no rapid-click timer overlap test.
- No `OrderDetailsPage` TopNav integration test for copy button render behavior.

### Planning artifacts

- `docs/DEV-85/prd.md` — no backend; clipboard on click; 2 s feedback window.
- `docs/DEV-85/tech-plan.md` — reuse existing hook/icon; no new deps; no performance section.
