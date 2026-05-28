---
agent: step-7-deep-performance-order-copy-link-button-pass-2
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: pass
---

## Summary

Pass-2 performance review of the order-copy-link-button area finds no blockers. Bundle impact remains localized to the orders lazy chunk (+1,265 B minified / +414 B gzip). Chrome interaction traces on Storybook `InOrderDetailsTopNav` show INP 47 ms, click-to-feedback 47 ms, and no heap growth after 10 rapid copy clicks. The iter-2 `clear()` fix in `useClipboard` removes timer-stacking overhead on rapid re-clicks. Three WARNINGs note ambient re-render coupling to the legacy `Form` render prop, intentional aria-live DOM lifecycle tradeoffs, and full remount cost from `key={order.id}` — all consistent with established TopNav patterns and deliberate a11y/correctness fixes from pass-1 remediation.

## Findings

### F-001 [WARNING] Form render-prop re-renders copy button on unrelated metadata edits

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-211`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:29-53`
- Description: `OrderCopyLinkButton` sits inside the deprecated `Form` render-prop child. Every form `data` mutation re-runs the child function and re-renders TopNav actions, including the copy button, even when `orderId` and clipboard state are unchanged.
- Trigger: Staff user edits any order metadata field on the order details page (e.g., changes a custom field value) while `order.id` stays constant. Each keystroke or blur that updates form state triggers a parent re-render.
- Impact: No visible lag or incorrect copy behavior; the button silently re-runs `intl.formatMessage`, `clsx`, and allocates a new `icon` element on each form-driven re-render. Ambient CPU work on a frequently edited page.
- Evidence: `Form` invokes `children(renderProps)` on every render (`src/components/Form/Form.tsx:61-64`); `useForm` returns a fresh object each invocation. The adjacent metadata `Button` at `OrderDetailsPage.tsx:212-218` shares the same placement with no memo boundary — grep shows zero `React.memo` under `src/orders/`.
- Suggested fix: Optional follow-up only — hoist TopNav action buttons outside the `Form` render prop or wrap `OrderCopyLinkButton` in `React.memo` if profiling shows measurable churn; not required for this small feature.

### F-002 [WARNING] Conditional aria-live region mount/unmount adds DOM churn each copy cycle

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:60-64`, `src/hooks/useClipboard.ts:17-21`
- Description: The pass-3 remediation mounts a `role="status" aria-live="polite"` span only while `isCopied` is true, then unmounts it after the 2 s timer. Each successful copy therefore performs two DOM insert/remove cycles in the TopNav flex row (plus duplicate `formatMessage` for label vs live region at lines 38-40 and 62).
- Trigger: User clicks copy-order-link once; after ~2000 ms the timer fires and `copied` returns to false.
- Impact: No visible layout shift (`.statusRegion` is visually hidden via clip at `OrderCopyLinkButton.module.css:41-50`). Screen readers receive the intended announcement; assistive-tech tree updates and two extra React renders per copy cycle are the cost.
- Evidence: Conditional `{isCopied ? <span role="status" …> : null}` at lines 60-64; timer reset at `useClipboard.ts:19-21`. Static test at `OrderCopyLinkButton.test.tsx:70-86` asserts presence when mocked copied but does not measure mount/unmount frequency.
- Suggested fix: If SR announcement fidelity allows, consider a persistent hidden live region with toggled text to avoid insert/remove; current approach is an acceptable a11y-first tradeoff.

### F-003 [WARNING] `key={order.id}` remounts entire button subtree on order navigation

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: Remediation chose `key={order.id}` to reset stale copied UI when navigating between orders. Each order switch destroys and recreates `OrderCopyLinkButton`, its `useClipboard` hook instance, timeout ref, and child icon subtree — even when the prior order's copy feedback had already expired.
- Trigger: Staff user navigates from order A to order B via in-app links within ~2 s of copying on order A, or at any time when switching orders.
- Impact: No incorrect UI after navigation (intended benefit). User may perceive a brief icon reset on the new order's TopNav; cost is one hook init + component mount per navigation, negligible compared to page data fetch.
- Evidence: `key={order.id}` on `OrderCopyLinkButton` at line 211; unmount cleanup clears timer (`useClipboard.ts:29-30`, tested at `useClipboard.test.ts:83-103`). Alternative `useEffect` reset on `orderId` change would avoid remount but was not chosen.
- Suggested fix: None required unless order-to-order navigation profiling shows TopNav mount cost matters; `useEffect` reset is a localized alternative.

## Files / sections inspected

### Touched files (coordinator scope)

- `src/hooks/useClipboard.ts:6-30` — iter-2 `clear()` before timer reschedule; unmount cleanup unchanged.
- `src/hooks/useClipboard.test.ts:105-141` — rapid re-copy timer extension test confirms stacking fix.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — click-scoped URL build, copied feedback path, aria-live region.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — sync URL builder on click only.
- `src/orders/components/OrderCopyLinkButton/messages.ts:3-14` — module-level i18n descriptors.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-51` — CSS-only active states; visually hidden status region.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:48-86` — click and aria-live tests (hook mocked).
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts:39-75` — URL shape tests.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:42-95` — Storybook compositions for chrome perf proxy.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-218` — Form render-prop integration with `key={order.id}` gate.

### Export call sites

- `OrderCopyLinkButton` — **`src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`** — `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}`; respects optional order contract; passes only `orderId` (no `disabled` when present). No other production callers per `git grep OrderCopyLinkButton`.
- `getShareableOrderUrl` — **`src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:33`** (click handler); tests at `getShareableOrderUrl.test.ts`. No other repo callers per `git grep getShareableOrderUrl`.
- `useClipboard` (modified export) — 8 production callers (`OrderCopyLinkButton`, `OrderCustomer` ×3, `TrackingNumberDisplay`, `PspReference`, `CopyableText`, `GiftCardCreateDialogCodeContent`, `ChannelForm`); all receive the shared `clear()` improvement; contract unchanged `[boolean, (text: string) => void]`.

### Parent / host components

- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-218` — hosts button inside `Form` render prop → `TopNav`; `order?.id` guard before render; `key={order.id}` for navigation reset.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201` — renders `OrderDetailsPage` with order query data; passes through to TopNav integration.
- `src/orders/views/OrderDetails/OrderUnconfirmedDetails/index.tsx:201` — same host pattern for unconfirmed orders.
- `src/components/AppLayout/TopNav/Root.tsx:68-75` — flex container for TopNav children including copy button sibling to metadata `Button`.

### Integration sites

- `src/hooks/useClipboard.ts:12-27` — async clipboard write + 2 s timer; assumptions: fire-and-forget Promise, no in-flight guard.
- `src/orders/urls.ts:234-235` — `orderUrl` with `encodeURIComponent`; called synchronously at click time.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect()` reads mount config synchronously.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — icon swap on `hasBeenClicked`; `sprinkles()` per render.

### Tests overlapping

- `src/hooks/useClipboard.test.ts` — timer overlap, unmount cleanup, rejection handling.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` — click delegates URL to mock copy; static copied-state aria-live snapshot.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — URL encoding and mount URI variants.
- No test covers Form-driven re-renders or order-navigation remount behavior (noted as gaps, not blockers).

### Mechanical verification

- Bundle build anchor vs HEAD: orders lazy chunk `index-DCpET7XF.js` → `index-qFPvBAtC.js` (+1,265 B / +414 B gzip); entry chunk unchanged; `useClipboard` chunk +4 B.
- Chrome Storybook `InOrderDetailsTopNav`: INP 47 ms; heap −2.9 MB after 10 rapid clicks; page LCP 5281 ms dominated by Storybook dev shell (not feature-attributable).
