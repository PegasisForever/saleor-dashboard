---
agent: step-7-deep-performance-order-copy-link-button-pass-3
input_branch: 6feae83ec628e0296d8e2a3652c5db5ed4b58877
verdict: pass
---

## Summary

Pass-3 performance review of the cumulative `order-copy-link-button` diff (~509 LOC across 10 `src/` files since anchor `45b5cef8`) finds no BLOCKER or SHOULD-FIX performance defects. Production bundle impact is localized to the existing orders lazy chunk (+1,265 B minified JS, +921 B CSS, ~+0.42 KiB gzip JS). Chrome interaction traces on Storybook `InOrderDetailsTopNav` show INP 69 ms and ~4 ms click-to-feedback with mocked clipboard; heap growth after 10 rapid clicks (~349 KB) shows no timer or aria-live DOM accumulation. Pass-3 adds only test assertions (remount guard, copied-state aria/title checks); no new production perf surface. Three WARNINGs note inherited Form render-prop coupling, aria-live mount/unmount churn, and intentional `key` remount tradeoffs — all below merge-blocking thresholds and consistent with established codebase patterns.

## Findings

### F-001 [WARNING] Copy button re-renders on unrelated Form state changes

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-211`, `src/components/Form/Form.tsx:61-64`
- Description: `OrderCopyLinkButton` is mounted inside the legacy `Form` render-prop child. Every form `data` mutation re-invokes `{children(renderProps)}`, re-rendering TopNav actions including the copy button even when `orderId` and `copied` are unchanged.
- Trigger: Staff user on order details edits any metadata field (keystroke or blur) while the copy button is visible (`order.id` present). Form state updates on each change; no copy interaction required.
- Impact: Extra React reconciliation on the copy button on every metadata keystroke — `intl.formatMessage`, `clsx`, and a new `ClipboardCopyIcon` element reference. No visible UI lag observed (Storybook INP 69 ms on direct click); cost is ambient CPU on a path shared by the adjacent metadata button.
- Evidence: `Form.tsx:63` passes fresh `renderProps` each render; `OrderDetailsPage.tsx:207-211` places copy button inside the render prop; grep shows zero `React.memo` under `src/orders/components/`.
- Suggested fix: Optional future hardening — extract TopNav actions into a `React.memo` child fed only `{ orderId }`, or hoist actions outside the Form render prop. Not required for this PR given sibling metadata button shares the same coupling.

### F-002 [WARNING] aria-live status region mounts and unmounts each copy cycle

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:60-64`, `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:41-50`
- Description: On successful copy, a `<span role="status" aria-live="polite">` is conditionally inserted as a sibling of the button inside TopNav's flex row; after the 2 s `useClipboard` timer it is removed. `intl.formatMessage(messages.orderLinkCopied)` runs twice per copied render (button label + live region).
- Trigger: User clicks copy-order-link once; clipboard write resolves successfully. After ~2000 ms the copied feedback timer fires and the span unmounts.
- Impact: Two DOM insert/remove operations and duplicate i18n formatting per copy cycle. Visually hidden via clip-path so no layout shift; assistive-tech tree still sees mount/unmount. Rapid re-clicks within one 2 s window keep a single mounted span (React bails on redundant `setCopyStatus(true)`).
- Evidence: Conditional render at `OrderCopyLinkButton.tsx:60-64`; visually hidden CSS at `OrderCopyLinkButton.module.css:41-50`; only `useClipboard` consumer in repo with `aria-live` + `role="status"` per repo grep.
- Suggested fix: Consider a persistent off-screen live region with text-only updates if copy frequency becomes high; current pattern matches PRD a11y requirement and pass-2 chrome heap test showed no accumulation after 10 rapid clicks.

### F-003 [WARNING] `key={order.id}` trades remount cost for stale-feedback reset

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: Parent passes `key={order.id}` forcing full `OrderCopyLinkButton` subtree destruction and recreation on order-to-order navigation, rather than resetting `copied` state via `orderId` effect.
- Trigger: Staff navigates from order A to order B within order details (route `id` changes, new `order.id` loads). Occurs even when copy feedback already expired on order A.
- Impact: One-time remount cost per navigation: new `useClipboard` instance, effect setup, and icon/button DOM. Prevents stale "Order link copied" label on the next order (tested at `OrderCopyLinkButton.test.tsx:91-125`). Cost is small relative to order query load; no measurable regression in bundle or interaction traces.
- Evidence: `OrderDetailsPage.tsx:211` — `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}`; remount test documents intent.
- Suggested fix: Accept as intentional correctness tradeoff; lighter alternative would be `useEffect(() => reset(), [orderId])` inside button if remount profiling ever shows measurable cost on fast order switching.

## Files / sections inspected

- `docs/DEV-90/logs/040-step-7-coordinator-pass-3.md` — touchedFiles scope (10 src paths); pass-3 test-only delta note.
- `docs/DEV-90/prd.md:27-38` — acceptance criteria traced for click/render/navigation perf paths.
- `docs/DEV-90/tech-plan.md:17-40` — architecture confirms click-scoped URL, no backend deps.
- `git diff 45b5cef8..HEAD --stat -- src/` — 10 files, ~509 insertions; iter-5 test delta only in production terms.
- `src/hooks/useClipboard.ts:6-30` — `clear()` before reschedule fix; timer cleanup on unmount.
- `src/hooks/useClipboard.test.ts:105-141` — rapid-copy timer reset test (pass-3 scope includes iter-5 hook test).
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — full component; click handler, aria-live, force\* props.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — click-time URL builder.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1-51` — prod + Storybook force-state rules.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:70-125` — copied-state aria/title + remount guard (pass-3 iter-5 additions).
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.test.ts` — URL builder unit tests.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:85-123` — TopNav composition for chrome perf proxy.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-218` — Form render-prop integration + `key={order.id}` wire-up.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-203` — parent host; passes `loading` and `order`.
- `src/orders/views/OrderDetails/OrderUnconfirmedDetails/index.tsx:201` — parent host (alternate loading profile).
- `src/orders/views/OrderDetails/OrderDetails.tsx:17,72-88` — route host; metadata submit closure.
- `src/components/Form/Form.tsx:61-64` — render-prop re-render mechanism.
- `src/components/AppLayout/TopNav/Root.tsx:68-82` — flex children container for copy button + metadata.
- `src/orders/urls.ts:234-235` — sibling `orderUrl` with `encodeURIComponent`.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — shared icon swap on copy state.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` config reads in URL path.
- `src/index.tsx:74` — orders section lazy boundary (no finer split for OrderDetailsPage).

### Export call sites

- **`OrderCopyLinkButton`** — exported in `OrderCopyLinkButton.tsx:21`.
  - `OrderDetailsPage.tsx:211` — production: `{order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}`; respects optional `order` via guard; props contract satisfied.
  - `OrderCopyLinkButton.stories.tsx:95` — Storybook composition; passes `orderId` only.
  - `OrderCopyLinkButton.test.tsx:59,77,100,115` — unit tests with mocked hook.
- **`getShareableOrderUrl`** — exported in `getShareableOrderUrl.ts:5`.
  - `OrderCopyLinkButton.tsx:33` — called inside click handler only (not on render); contract respected.
  - `getShareableOrderUrl.test.ts:46,59,72` — unit tests.
  - `OrderCopyLinkButton.test.tsx:55` — test expected URL helper.
  - No other repo callers per `git grep getShareableOrderUrl`.

### Parent / host components

- `OrderDetailsPage.tsx:210-211` — renders copy button inside TopNav before metadata button; gates on `order?.id`; passes `key={order.id}` for remount on navigation.
- `OrderNormalDetails/index.tsx:201` — hosts `OrderDetailsPage` with `order`, `loading`, mutation callbacks.
- `OrderUnconfirmedDetails/index.tsx:201` — hosts `OrderDetailsPage` with discount providers adding extra re-render paths.
- `TopNav/Root.tsx:68-82` — renders `{children}` in flex row containing copy button fragment.

### Mechanical check evidence

- **bundle-size (pass):** HEAD vs anchor builds — orders lazy chunk +1,265 B JS / +921 B CSS (~+0.42 KiB gzip JS); entry and vendor unchanged. Source map tags `OrderCopyLinkButton` only in HEAD orders chunk.
- **lighthouse-perf (skip):** Storybook page LCP 344 ms measures manager/preview shell (99.6% render delay), not production order-details route.
- **user-flow-timing (pass):** INP 69 ms on copy click; ~4.2 ms avg aria-label feedback with mocked clipboard. Native clipboard unavailable in Storybook iframe (environmental).
- **memory-snapshot (pass):** +357 KB JS heap after 10 rapid clicks + 2.5 s reset wait; 0 `[role="status"]` nodes after reset; no timer accumulation.
- **sql-performance (skip):** Frontend-only area; no new/changed queries.
- **backend-latency (skip):** No new request handlers; client-only clipboard interaction.
