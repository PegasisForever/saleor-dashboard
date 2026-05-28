---
agent: step-7-deep-performance-order-copy-link-button-pass-4
input_branch: 09886983335621e9c0048186f6f51d0f16611441
verdict: pass
---

## Summary

Pass-4 performance review on the cumulative `order-copy-link-button` area (~614 LOC src delta since anchor `45b5cef8`; pass-4 delta is iter-7 integration test only — production surface unchanged). Bundle growth is localized (+1.24 KiB minified / +0.40 KiB gzip in the orders lazy chunk; entry flat). Storybook interaction INP is 52 ms; heap retained +79 KB after five copy cycles. No BLOCKER or SHOULD-FIX performance gaps. Three WARNINGs document ambient Form render-prop coupling, aria-live DOM lifecycle, and the intentional `key` remount tradeoff — all informational, not merge-blocking.

## Findings

### F-001 [WARNING] Form render-prop re-renders copy button on unrelated metadata edits

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-211`; `src/components/Form/Form.tsx:61-64`
- Description: `OrderCopyLinkButton` lives inside the deprecated `Form` render-prop child function. Any form `data` mutation (metadata edits, dirty tracking) re-invokes that function and reconciles the entire `DetailPageLayout` subtree, including TopNav and the copy button, even though the button does not consume form state.
- Trigger: Staff user opens order details, edits order metadata fields in the form body (e.g., changes a metadata value), while the copy button is visible in TopNav. Each keystroke or field blur that updates form state causes a parent re-render cycle.
- Impact: Copy button re-runs `intl.formatMessage`, `clsx`, and allocates a new `handleCopy`/`icon` reference on every form edit. No visible UI flicker or interaction delay was measured (INP 52 ms on isolated click), but ambient reconciliation cost scales with metadata editing frequency on the same page.
- Evidence:

```206:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
    <Form confirmLeave initial={initial} onSubmit={handleSubmit} mergeData={false}>
      {({ submit }) => {
        return (
          <DetailPageLayout>
            <TopNav href={backLinkUrl} title={<Title order={order} />}>
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
```

The adjacent metadata `Button` at `:212-219` shares identical coupling — this is a page-layout pattern, not a copy-button-specific regression.

- Suggested fix: Optional follow-up: hoist TopNav action buttons outside the Form render prop or wrap `OrderCopyLinkButton` in `React.memo` with stable props. Low ROI for this PR given sibling parity.

### F-002 [WARNING] aria-live status region mounts and unmounts each copy cycle

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:60-64`; `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:41-50`
- Description: On successful copy, a visually hidden `<span role="status" aria-live="polite">` is inserted; after the 2 s timer it is removed. The same i18n string is formatted twice per copied-state render (button label + status region).
- Trigger: Staff user clicks the copy button once; clipboard write resolves successfully. Two seconds later the feedback timer fires and resets state.
- Impact: Two DOM insert/remove operations and two assistive-tech announcement paths per copy (button `aria-label` update plus live region insert). Visually hidden CSS prevents layout reflow; no measurable INP regression (52 ms interaction trace). Duplicate `intl.formatMessage(messages.orderLinkCopied)` adds negligible main-thread work.
- Evidence:

```60:64:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
      {isCopied ? (
        <span role="status" aria-live="polite" className={styles.statusRegion}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
```

Clipboard siblings (`CopyableText`, `TrackingNumberDisplay`, `PspReference`) use icon/title feedback only — no aria-live companion node.

- Suggested fix: Consider a persistent off-screen live region with text updates only, and reuse a single formatted copied string for label + region. Acceptable as-is for v1 given bounded two-cycle-per-copy cost.

### F-003 [WARNING] `key={order.id}` remount trades reset correctness for full subtree teardown

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:211`
- Description: Parent renders `<OrderCopyLinkButton key={order.id} orderId={order.id} />`. Navigating from order A to order B within the 2 s copied-feedback window destroys the old component instance (timer cleanup via `useClipboard` unmount effect) and mounts a fresh instance with `copied: false`.
- Trigger: Staff user copies order A's link, then navigates to order B via sidebar or list within ~2000 ms (before copied feedback expires).
- Impact: Correct UX — order B shows default copy icon/label (verified in `OrderCopyLinkButton.test.tsx:100-134`). Performance cost is one full hook + DOM teardown and re-init per order navigation, including `ClipboardCopyIcon` remount and macaw `Button` reconciliation. Cheaper alternative (`useEffect` reset on `orderId` change) would preserve instance identity but is not required for correctness given infrequent cross-order navigation during feedback window.
- Evidence:

```211:211:src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
              {order?.id ? <OrderCopyLinkButton key={order.id} orderId={order.id} /> : null}
```

- Suggested fix: No change required for merge. If order-to-order navigation latency becomes measurable, replace `key` remount with an `orderId`-driven reset inside the button to avoid full subtree recreation.

## Files / sections inspected

- `docs/DEV-90/logs/052-step-7-coordinator-pass-4.md` — touchedFiles scope (10 src paths); pass-4 delta is iter-7 test-only.
- `docs/DEV-90/prd.md:27-38` — acceptance criteria traced for runtime perf paths.
- `docs/DEV-90/tech-plan.md:17-40` — click-scoped URL build, no backend.
- `git diff 45b5cef8..HEAD -- src/` — full cumulative diff (~614 LOC; iter-7 adds real-hook transition test in `OrderCopyLinkButton.test.tsx:137-231`).
- `src/hooks/useClipboard.ts:6-30` — timer clear-before-reschedule fix; unmount cleanup.
- `src/hooks/useClipboard.test.ts:105-141` — rapid copy timer extension test.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:21-67` — component render/copy path.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts:5-8` — click-scoped URL builder.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx:100-134,137-231` — remount + real-hook transition tests (pass-4 delta).
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:206-219` — parent host; `key` + Form coupling.
- `src/orders/views/OrderDetails/OrderNormalDetails/index.tsx:201-222` — route host passes `order` prop.
- `src/components/Form/Form.tsx:61-64` — render-prop re-render mechanism.
- `src/components/AppLayout/TopNav/Root.tsx:68-83` — flex action row hosting copy button.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx:8-15` — icon swap on copied state.
- `src/orders/urls.ts:234-235` — sibling `orderUrl` helper pattern.
- **Export call sites:**
  - `OrderCopyLinkButton` — `OrderDetailsPage.tsx:211` (production); `OrderCopyLinkButton.stories.tsx:95` (Storybook). Contract respected: `orderId` required; production gated on `order?.id`; `key={order.id}` ensures remount on navigation.
  - `getShareableOrderUrl` — `OrderCopyLinkButton.tsx:33` (click handler); tests only elsewhere. Click-scoped; no render-path cost.
  - `orderCopyLinkButtonMessages` — `OrderCopyLinkButton.tsx:9,38-40,62` only. Static i18n catalog.
- **Bundle build:** HEAD vs anchor at `/tmp/saleor-anchor` — orders chunk +1265 B minified (+413 B gzip); entry 0 B delta.
- **Storybook chrome:** `http://local-deploy:11000/e8853c41-6817-4bb0-9682-d9979f52ce1d` — INP 52 ms, heap +79 KB after 5 clicks; traces in `.perf-dev90/`.
